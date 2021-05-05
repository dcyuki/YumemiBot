const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const api = new Router();
api.use(bodyParser());

api.post('/battle/:action', async ctx => {
  const { action } = ctx.params;

  
})

api.get('/send/:target', async ctx => {
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
          bot.sendPrivateMsg(user_id, msg),
          ctx.status = 200
        ) :
        ctx.status = 403
      break;
    case 'group':
      gl.has(group_id) ?
        (
          bot.sendGroupMsg(group_id, msg),
          ctx.status = 200
        ) :
        ctx.status = 403
      break;
  }
})

module.exports = api;