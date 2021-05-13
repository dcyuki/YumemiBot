const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const sqlite = require(`${__yumemi}/utils/sqlite`);

const api = new Router();
api.use(bodyParser());

api.post('/test', async ctx => {
  ctx.body = 'this is a test...'
  ctx.status = 200;
})

api.post('/battle/:action', async ctx => {
  const action = new Set(['get', 'all', 'run']);
  const { sql, params } = ctx.request.body;

  action.has(ctx.params.action) &&
    await sqlite[ctx.params.action](sql, params)
      .then(data => {
        ctx.body = data;
        ctx.status = 200;
      })
      .catch(err => {
        ctx.body = err;
        ctx.status = 500;
      })
})

api.post('/send/:target', async ctx => {
  const { target } = ctx.params;

  if (target !== 'private' && target !== 'group') {
    ctx.status = 404;
    return;
  }

  const { user_id, group_id, msg } = ctx.request.body;

  if (user_id && group_id || !user_id && !group_id || !msg) {
    ctx.status = 400;
    return;
  }

  // 1分钟同一 ip 调用100次直接 ban 掉
  //...

  const { fl, gl } = bot;

  switch (target) {
    case 'private':
      fl.has(user_id) ?
        (
          ctx.status = 200,
          bot.sendPrivateMsg(user_id, msg)
        ) :
        ctx.status = 403
      break;
    case 'group':
      gl.has(group_id) ?
        (
          ctx.status = 200,
          bot.sendGroupMsg(group_id, msg)
        ) :
        ctx.status = 403
      break;
  }
})

module.exports = api;