const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');

const api = new Router();
api.use(bodyParser());

api.post('/battle/:action', async ctx => {
  const { action } = ctx.params;

})

api.post('/send/:target', async ctx => {
  const { target } = ctx.params;
  const { user_id, group_id, msg } = ctx.request.body;
  if (!user_id && !group_id || !msg) {
    ctx.status = 400;
  }
  
  const { fl, gl } = bot;

  

  // 1分钟同一 ip 调用100次直接 ban 掉
  //...

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

    default:
      ctx.redirect('/error');
      break;
  }
})

module.exports = api;