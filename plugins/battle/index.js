const { resolve } = require('path');
const querystring = require('querystring');
const { getConfig, httpRequest } = require(`../../utils/util`);

const battle_url = `http://localhost/api/battle`;
const addZero = number => number < 10 ? '0' + number : number;

// 获取当前时间
const getDate = () => {
  const now_date = new Date();
  const year = now_date.getFullYear();
  const month = addZero(now_date.getMonth() + 1);
  const day = addZero(now_date.getDate());
  const hour = addZero(now_date.getHours());
  const minute = addZero(now_date.getMinutes());

  const time = `${year}/${month}/${day} ${hour}:${minute}`;
  const today = `${year}/${month}/${day} 05`;
  const tomorrow = `${year}/${month}/0${Number(day) + 1} 05`;
  const tomonth = `${year}/${month}`;
  const date = {
    year, month, day, hour, minute, time, today, tomorrow, tomonth,
  }

  return date;
}

// 获取当前 boss 的 max 血量
const getAllBlood = async (version, syuume) => {
  return new Promise((resolve, reject) => {
    getConfig('boss')
      .then(data => {
        const stage = syuume <= 3 ? 1 : (syuume <= 10 ? 2 : syuume <= 34 ? 3 : 4);

        // 国服没有 4 阶段，数组下标 -1
        resolve(data[version][version === 'bl' && stage > 3 ? stage - 2 : stage - 1]);
      })
      .catch(err => {
        reject(err);
      })
  })
}

// 获取当月会战数据
const getBattle = ctx => {
  return new Promise((resolve, reject) => {
    const { group_id } = ctx;
    const { tomonth } = getDate();

    const sql = `SELECT title, syuume, boss_info, update_time FROM battle WHERE group_id = ? AND update_time like ?`;
    const params = [group_id, `${tomonth}%`]
    const post_data = querystring.stringify({ sql, params });

    httpRequest(`${battle_url}/get`, 'POST', post_data)
      .then(res => {
        resolve(res);
      })
      .catch(err => {
        reject(err);
      })
  })
}

// 初始化公会信息
const initGuild = ctx => {
  const { raw_message } = ctx;
  const terminal = require('../_terminal/index');
  const guild = raw_message.slice(2, 4);
  ctx.raw_message = `> update battle version ${guild === '国服' ? 'bl' : (guild === '台服' ? 'tw' : 'jp')}`;
  terminal.update(ctx);
}

// 校验数据
const checkBattle = ctx => {
  return new Promise(async resolve => {
    const { group_id } = ctx;
    // 是否设置公会
    const { [group_id]: { plugins: { battle: { version } } } } = await getConfig('groups');
    // 当月是否开启会战
    const battle = await getBattle(ctx);

    resolve({ version, battle })
  })
}

// 开启会战
const insertBattle = async ctx => {
  const { reply } = ctx;
  const { version, battle } = await checkBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (battle) return reply('当月已开启会战，请勿重提提交');

  const { raw_message, group_id } = ctx;
  const { time } = getDate();
  // 当期星座
  const title = raw_message.slice(2, 5);
  // 获取 boss 血量
  const all_blood = await getAllBlood(version, 1);
  // 节省性能，5个固定 boss 没必要循环遍历
  const boss_info = `
  一王：${all_blood[0]} \\ ${all_blood[0]}
  讨伐：暂无

  二王：${all_blood[1]} \\ ${all_blood[1]}
  讨伐：暂无

  三王：${all_blood[2]} \\ ${all_blood[2]}
  讨伐：暂无

  四王：${all_blood[3]} \\ ${all_blood[3]}
  讨伐：暂无

  五王：${all_blood[4]} \\ ${all_blood[4]}
  讨伐：暂无

*******************************`;

  const sql = "INSERT INTO battle (group_id, title, boss_info, update_time) VALUES (?, ?, ?, ?)";
  const params = [group_id, title, boss_info, time];

  const post_data = querystring.stringify({ sql, params });

  httpRequest(`${battle_url}/run`, 'POST', post_data)
    .then(() => {
      reply(`******  ${version === 'tw' ? '台' : (version === 'jp' ? '日' : '国')}服 ${title} 会战  ******
${boss_info}
会战信息：1 周目 1 阶段
当前出刀：0 / 90
更新时间：${time}`)
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 中止会战
const deleteBattle = async ctx => {
  const { version, battle } = await checkBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle) return reply('当月未发起会战，请先初始化数据');

  const { group_id, reply } = ctx;
  const { tomonth } = getDate();

  const sql = `DELETE FROM battle WHERE group_id = ? AND update_time like ?`;
  const params = [group_id, `${tomonth}%`];
  const post_data = querystring.stringify({ sql, params });

  httpRequest(`${battle_url}/run`, 'POST', post_data)
    .then(() => {
      reply('当月会战已中止，所有数据清空完毕');
    })
    .catch(err => {
      reply(err.message);
      bot.logger.error(err);
    })
}

// 当前状态
const selectBattle = async ctx => {
  const { version, battle } = await checkBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle) return reply('当月未发起会战，请先初始化数据');

  const { reply } = ctx;
  // const member = [];
  // const reservation = this.getReservation();
  const { title, syuume, boss_info, update_time } = battle;
  reply(`******  ${version === 'tw' ? '台' : (version === 'jp' ? '日' : '国')}服 ${title} 会战  ******
${boss_info}
会战信息：${syuume} 周目 ${syuume <= 3 ? 1 : (syuume <= 10 ? 2 : syuume <= 34 ? 3 : 4)} 阶段
当前出刀：0 / 90
更新时间：${update_time}`)
  // for (let i = 0; i < reservation[this.group_id][boss].length; i++) {
  //   member.push(`${reservation[this.group_id][boss][i].split('@')[1]}`)
  // }
  // const maxBlood = this.getBlood(syuume, boss);
  // bot.sendGroupMsg(this.group_id, `${title} 会战:\n\t${syuume} 周目 ${boss} 王  ${blood} \\ ${maxBlood}\n当前讨伐成员: \n\t${member.length ? member : '暂无'}\n数据更新时间:\n\t${start_time}`);
}

module.exports = { initGuild, insertBattle, deleteBattle, selectBattle };