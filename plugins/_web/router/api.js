const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const sqlite = require(`${__yumemi}/utils/sqlite`);

const battle = new Map([
  ['get_user', 'SELECT count(*) AS length FROM user WHERE id = ?'],
  ['run_user', 'INSERT INTO user (id, nickname) VALUES (?, ?)'],
  ['get_guild', 'SELECT count(*) AS length FROM guild WHERE id = ?'],
  ['run_guild', 'INSERT INTO guild (group_id, name) VALUES (?, ?)'],
  ['get_member', 'SELECT count(*) AS length FROM member WHERE group_id = ? AND user_id = ?'],
  ['run_member', 'INSERT INTO member (group_id, user_id, card) VALUES (?, ?, ?)'],
  ['get_battle', 'SELECT battle.title, battle.syuume, battle.one, battle.two, battle.three, battle.four, battle.five, battle.update_time, count(*) AS length FROM battle LEFT JOIN beat ON battle.id = beat.battle_id  WHERE battle.group_id = ? AND beat.fight_time BETWEEN ? AND ?'],
]);

const api = new Router();
api.use(bodyParser());

api.post('/test', async ctx => {
  ctx.body = 'this is a test...'
  ctx.status = 200;
})

api.post('/battle/:action', async ctx => {
  const { action } = ctx.params;
  const { params } = ctx.request.body;

  battle.has(action) && await sqlite[action.slice(0, 3)](battle.get(action), params)
    .then(data => {
      ctx.body = data;
      ctx.status = 200;
    })
    .catch(err => {
      console.log(err)
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