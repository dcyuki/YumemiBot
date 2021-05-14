const querystring = require('querystring');
const { getConfig, httpRequest } = require(`../../utils/util`);

const int_char = ['零', '一', '二', '三', '四', '五'];
const battle_url = `http://localhost/api/battle`;
// 以后会将 sql 全部整合到 api ，开发初期先手写
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
  const tomorrow = `${year}/${month}/${Number(day) + 1} 05`;
  const tomonth = `${year}/${month}`;
  const date = {
    year, month, day, hour, minute, time, today, tomorrow, tomonth,
  }

  return date;
}

// 获取当前 boss 的 max 血量
const getMaxBlood = async (version, syuume) => {
  const boss = await getConfig('boss');
  const stage = syuume <= 3 ? 1 : (syuume <= 10 ? 2 : syuume <= 34 ? 3 : 4);

  // 国服没有 4 阶段，数组下标 -1
  return boss[version][version === 'bl' && stage > 3 ? stage - 2 : stage - 1];
}

// 获取当月会战数据
const getBattle = ctx => {
  return new Promise((resolve, reject) => {
    const { group_id } = ctx;
    const { today, tomorrow, tomonth } = getDate();

    const sql = `SELECT battle_id, title, battle.syuume, info, update_time, count(*) AS length FROM battle LEFT JOIN fight_view ON battle.group_id = fight_view.group_id AND fight_time BETWEEN ? AND ? WHERE battle.group_id = ? AND update_time like ?`;
    const params = [today, tomorrow, group_id, `${tomonth}%`]
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
const checkBattle = async ctx => {
  const { group_id } = ctx;
  // 是否设置公会
  const { [group_id]: { plugins: { battle: { version } } } } = await getConfig('groups');
  // 当月是否开启会战
  const battle = await getBattle(ctx);

  return { version, battle }
}

// 开启会战
const insertBattle = async ctx => {
  await insertUser(ctx);
  await insertGuild(ctx);
  await insertMember(ctx);

  const { reply } = ctx;
  const { version, battle } = await checkBattle(ctx);
  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (battle.battle_id) return reply('当月已开启会战，请勿重提提交');

  const { raw_message, group_id } = ctx;
  const { time } = getDate();
  // 当期星座
  const title = raw_message.slice(2, 5);
  // 获取 boss 血量
  const max_blood = await getMaxBlood(version, 1);
  // 节省性能，5个固定 boss 没必要循环遍历
  const info = `{
    "boss": [
      "${max_blood[0]} / ${max_blood[0]}",
      "${max_blood[1]} / ${max_blood[1]}",
      "${max_blood[2]} / ${max_blood[2]}",
      "${max_blood[3]} / ${max_blood[3]}",
      "${max_blood[4]} / ${max_blood[4]}"
    ],
    "crusade": [
      "",
      "",
      "",
      "",
      ""
    ]
  }`;

  const sql = "INSERT INTO battle (group_id, title, info, update_time) VALUES (?, ?, ?, ?)";
  const params = [group_id, title, info, time];

  const post_data = querystring.stringify({ sql, params });

  httpRequest(`${battle_url}/run`, 'POST', post_data)
    .then(() => {
      const info_json = JSON.parse(info)
      let msg = `******  ${version === 'tw' ? '台' : (version === 'jp' ? '日' : '国')}服 ${title} 会战  ******\n`;

      for (let i = 0; i < 5; i++) {
        msg += `\n\t${int_char[i + 1]}王：${info_json.boss[i]}\n\t讨伐：暂无\n`;
      }

      msg += `\n*******************************\n会战信息：1 周目 1 阶段\n当前出刀：0 / 90\n更新时间：${time}`;

      reply(msg)
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 中止会战
const deleteBattle = async ctx => {
  const { version, battle } = await checkBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.battle_id) return reply('当月未发起会战，请先初始化数据');

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
  const { reply } = ctx;
  const { version, battle } = await checkBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.battle_id) return reply('当月未发起会战，请先初始化数据');

  const { title, syuume, info, update_time, length } = battle;
  const info_json = JSON.parse(info)

  let msg = `******  ${version === 'tw' ? '台' : (version === 'jp' ? '日' : '国')}服 ${title} 会战  ******\n`;

  for (let i = 0; i < 5; i++) {
    const title = [];

    info_json.boss[i].slice(0, 1) !== '0' ?
      (
        title[0] = `${int_char[i + 1]}王：`,
        title[1] = `讨伐：`
      ) :
      (
        title[0] = `扑街：`,
        title[1] = `预约：`)
      ;
    msg += `\n\t${title[0]}${info_json.boss[i]}\n\t${title[1]} ${info_json.crusade[i] ? info_json.crusade[i].match(/\D+/g).join(', ') : '暂无'}\n`;
  }

  msg += `\n*******************************\n会战信息：${syuume} 周目 ${syuume <= 3 ? 1 : (syuume <= 10 ? 2 : syuume <= 34 ? 3 : 4)} 阶段\n当前出刀：${length} / 90\n更新时间：${update_time}`;

  reply(msg);
}

// 查刀
const selectFight = async ctx => {
  const { reply } = ctx;
  const { version, battle } = await checkBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.battle_id) return reply('当月未发起会战，请先初始化数据');

  const { today, tomorrow } = getDate();
  const { group_id, user_id, nickname, card } = ctx;
  const sql = "SELECT number, note, fight_time fight_time FROM fight_view WHERE group_id = ? AND user_id = ? AND fight_time BETWEEN ? AND ?";
  const params = [group_id, user_id, today, tomorrow];
  const post_data = querystring.stringify({ sql, params });

  httpRequest(`${battle_url}/all`, 'POST', post_data)
    .then(res => {
      const { length } = res;
      let msg = `**********  出刀信息  **********\n`;

      for (let i = 0; i < length; i++) {
        msg += `\n\t${res[i].fight_time}：\n\t\t${res[i].note}\n`;
      }
      msg += `${length < 1 ? `\n\t暂无数据\n` : ``}`;
      msg += `\n*******************************`;
      msg += `\n成员 ${card ? card : nickname} ${length ? (`${res[length - 1].number < 3 ? `还有 ${3 - res[length - 1].number} 刀未出` : `已出完三刀`}`) : `今日未出刀`}`;
      reply(msg);
    })
    .catch(err => {
      reply(err.message);
      bot.logger.error(err);
    })
}

// 撤销
const undo = ctx => {

}

// 代报
const replace = async ctx => {
  await insertUser(ctx);
  await insertGuild(ctx);
  await insertMember(ctx);

  const { reply } = ctx;
  const { version, battle } = await checkBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.battle_id) return reply('当月未发起会战，请先初始化数据');

  const { user_id, raw_message } = ctx;
  const [replace_id, replace_name, replace_message] = raw_message.match(/(?<=qq=)\d+|(?<=text=@).+(?=\])|(?<=\]).*/g);

  if (replace_id === user_id) {
    reply(`[CQ:at,qq=${user_id}] 不能自己跟自己代报 (╯▔皿▔)╯`);
    return;
  }

  const boss = Number(replace_message.match(/\d(?=\s?\u4EE3\u62A5)/g));
  const damage = Number(replace_message.match(/(?<=\u4EE3\u62A5\s?)\d+/g));
  // const damage_info = replace_message.match(/\d(?=\s?\u4EE3\u62A5)|(?<=\u4EE3\u62A5\s?)\d+/g);
  ctx.card = replace_name;
  ctx.user_id = replace_id;
  ctx.raw_message = `${boss ? boss : ``} ${damage ? `报刀 ${damage}` : `尾刀`}`;

  insertFight(ctx);
}

// 报刀
const insertFight = async ctx => {
  await insertUser(ctx);
  await insertGuild(ctx);
  await insertMember(ctx);

  const { reply } = ctx;
  const { version, battle } = await checkBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.battle_id) return reply('当月未发起会战，请先初始化数据');

  const { group_id, user_id } = ctx;
  const { today, tomorrow } = getDate();

  // 当天是否已出刀
  /**
   * node-sqlite3 目前不支持正则，这样性能应该会更高一些
   * SELECT * FROM fight_view WHERE group_id = ? AND user_id = ? AND fight_time REGEXP '${year}/${month}/(${day}\s[0-2]\d|${day+1}\s0[0-4])' ORDER BY fight_time DESC
   */
  const sql = "SELECT * FROM fight_view WHERE group_id = ? AND user_id = ? AND fight_time BETWEEN ? AND ? ORDER BY number DESC, fight_time DESC";
  const params = [group_id, user_id, today, tomorrow];
  const post_data = querystring.stringify({ sql, params });

  httpRequest(`${battle_url}/get`, 'POST', post_data)
    .then(res => {
      const { user_id, nickname, card, raw_message, reply } = ctx;
      let { number = 0 } = res;

      if (number === 3) {
        reply(`${card ? card : nickname} 今天已经出完3刀了，请不要重复提交数据`);
        return;
      }

      let boss = Number(raw_message.match(/\d\s?(?=(报刀|尾刀))/g));
      const { info } = battle;
      const damage = Number(raw_message.match(/(?<=报刀).*/g));
      const all_blood = info.match(/\d+(?=\s)/g).map(Number);

      // 未指定 boss 则选取存活的第一个 boss
      if (!boss) {
        const { length } = all_blood;

        for (let i = 0; i < length; i++) {
          if (all_blood[i] > 0) {
            boss = i + 1;
            break;
          }
        }
      }

      // boss 血量为空
      if (!all_blood[boss - 1]) {
        reply(`[CQ:at,qq=${user_id}] ${int_char[boss]}王 都没了，你报啥呢？`);
        return;
      }

      // 伤害溢出
      if (damage && damage >= all_blood[boss - 1]) {
        reply(`伤害值超出 boss 剩余血量，若以斩杀 boss 请使用「尾刀」指令`);
        return;
      }

      number = damage ? parseInt(number) + 1 : number + 0.5;

      const { time } = getDate();
      const { battle_id, syuume } = battle;
      const note = `${card ? card : nickname} 对 ${int_char[boss]}王 造成了 ${damage ? `${damage} 点伤害` : `${all_blood[boss - 1]} 点伤害并击破`}`;

      const sql = "INSERT INTO fight (battle_id, group_id, user_id, number, syuume, boss, damage, note, fight_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
      const params = [battle_id, group_id, user_id, number, syuume, boss, damage ? damage : all_blood[boss - 1], note, time];
      const post_data = querystring.stringify({ sql, params });

      httpRequest(`${battle_url}/run`, 'POST', post_data)
        .then(async () => {
          let next = 0;

          const info_json = JSON.parse(info)

          // 更新周目
          for (let i = 0; i < 5; i++) all_blood[i] === 0 && next++;

          // 如果数组出现4次0而且是尾刀则进入下一周目
          if (next === 4 && !damage) {
            // 获取 max 血量
            const max_blood = await getMaxBlood(version, syuume + 1);

            info_json.boss = [
              `${max_blood[0]} / ${max_blood[0]}`,
              `${max_blood[1]} / ${max_blood[1]}`,
              `${max_blood[2]} / ${max_blood[2]}`,
              `${max_blood[3]} / ${max_blood[3]}`,
              `${max_blood[4]} / ${max_blood[4]}`
            ];
            next++;
          } else {
            // 更新 boss 血量
            info_json.boss[boss - 1] = info_json.boss[boss - 1].replace(
              /\d+(?=\s\/)/,
              `${damage ? `${all_blood[boss - 1] - damage}` : `0`}`
            );
          }

          reply(`${note}${next < 5 ? '' : `\n所有 boss 已被斩杀，现在开始 ${syuume + 1} 周目`}`);

          // 清空讨伐数据
          info_json.crusade[boss - 1] = damage ? info_json.crusade[boss - 1].replace(`${card ? card : nickname}${user_id}`, '') : '';

          // 更新 battle
          updateBattle(ctx, next < 5 ? syuume : syuume + 1, JSON.stringify(info_json));
        })
        .catch(err => {
          bot.logger.error(err);
        })
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 预约
const reservation = async ctx => {
  const { reply } = ctx;
  const { version, battle } = await checkBattle(ctx);

  if (version === 'none') return reply('检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数');
  if (!battle.battle_id) return reply('当月未发起会战，请先初始化数据');

  const { info } = battle;
  const { group_id, raw_message, user_id, nickname, card } = ctx;

  const info_json = JSON.parse(info);
  const boss = raw_message.slice(2).trim();

  // boss 传入实参则插入预约信息
  if (boss) {
    if (info_json.crusade[boss - 1].indexOf(`${card ? card : nickname}`) !== -1) {
      reply(`[CQ:at,qq=${user_id}] 你已预约 ${int_char[boss]}王，请勿重复预约`);
      return;
    }

    const { time, tomonth } = getDate();
    info_json.crusade[boss - 1] += `${card ? card : nickname}${user_id}`;

    const sql = "UPDATE battle SET info = ?, update_time = ? WHERE group_id = ? AND update_time like ?";
    const params = [JSON.stringify(info_json), time, group_id, `${tomonth}%`]
    const post_data = querystring.stringify({ sql, params });

    httpRequest(`${battle_url}/run`, 'POST', post_data)
      .then(() => {
        reply(`[CQ:at,qq=${user_id}] 预约 ${int_char[boss]}王 成功`);
      })
      .catch(err => {
        reply(err.message);
        bot.logger.error(err);
      })
  }

  // 不传入 boss 实参则发送预约信息
  let msg = '**********  预约信息  **********\n';

  for (let i = 0; i < 5; i++) {
    msg += `\n\t${int_char[i + 1]}王：${info_json.crusade[i] ? info_json.crusade[i].match(/\D+/g).join(', ') : '暂无'}\n`;
  }

  msg += `\n*******************************`;
  reply(msg);
}

// 更新 battle
const updateBattle = (ctx, syuume, info) => {
  const { group_id } = ctx;
  const { time, tomonth } = getDate();

  const sql = "UPDATE battle SET syuume = ?, info = ?, update_time = ? WHERE group_id = ? AND update_time like ?";
  const params = [syuume, info, time, group_id, `${tomonth}%`]
  const post_data = querystring.stringify({ sql, params });

  httpRequest(`${battle_url}/run`, 'POST', post_data)
    .then(() => {
      selectBattle(ctx);
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 创建账号
const insertUser = ctx => {
  const { user_id } = ctx;
  // 查询账号是否存在
  const sql = "SELECT user_id FROM user WHERE user_id = ?";
  const params = [user_id];
  const post_data = querystring.stringify({ sql, params });

  httpRequest(`${battle_url}/get`, 'POST', post_data)
    .then(res => {
      if (res) return

      // 账号不存在则写入数据
      let password = '';
      const { nickname, card } = ctx;
      const { time } = getDate();

      // 生成随机密码，小写字母 'a' 的 ASCII 是 97 , a-z 的 ASCII 码就是 97 + 0 ~ 25;
      for (let i = 0; i <= 5; i++) password += (String.fromCharCode(97 + Math.floor(Math.random() * 26)));

      const sql = `INSERT INTO user (user_id, nickname, password, record_time) VALUES (?, ?, ?, ?)`;
      const params = [user_id, card ? card : nickname, password, time];
      const post_data = querystring.stringify({ sql, params });

      httpRequest(`${battle_url}/run`, 'POST', post_data)
        .then(() => {
          bot.logger.info(`INSERT user success: ${user_id}`);
          bot.sendPrivateMsg(user_id, `你的账号已自动创建，初始密码为：${password}\n可登录后台自行修改，若遗忘发送「初始化密码」重置`);
        })
        .catch(err => {
          bot.logger.error(err);
        })
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 录入群聊信息
const insertGuild = ctx => {
  const { group_id } = ctx;

  // 查询是否已存在
  const sql = `SELECT * FROM guild WHERE group_id = ?`;
  const params = [group_id];
  const post_data = querystring.stringify({ sql, params });

  httpRequest(`${battle_url}/get`, 'POST', post_data)
    .then(res => {
      if (res) return

      // 成员不存在则写入数据
      const { group_name, user_id } = ctx;
      const { time } = getDate();

      const sql = `INSERT INTO guild (group_id, name, create_time) VALUES (?, ?, ?)`;
      const params = [group_id, group_name, time];
      const post_data = querystring.stringify({ sql, params });

      httpRequest(`${battle_url}/run`, 'POST', post_data)
        .then(() => {
          bot.logger.info(`INSERT guild success: ${user_id}`)
        })
        .catch(err => {
          bot.logger.error(err);
        })
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

// 录入成员信息
const insertMember = ctx => {
  const { group_id, user_id } = ctx;
  // 查询成员是否已存在
  const sql = `SELECT * FROM member WHERE group_id = ? AND user_id = ?`;
  const params = [group_id, user_id];
  const post_data = querystring.stringify({ sql, params });

  httpRequest(`${battle_url}/get`, 'POST', post_data)
    .then(res => {
      if (res) return

      // 成员不存在则写入数据
      const sql = `INSERT INTO member (group_id, user_id) VALUES (?, ?)`;
      const params = [group_id, user_id];
      const post_data = querystring.stringify({ sql, params });

      httpRequest(`${battle_url}/run`, 'POST', post_data)
        .then(() => {
          bot.logger.info(`INSERT member success: ${user_id}`)
        })
        .catch(err => {
          bot.logger.error(err);
        })
    })
    .catch(err => {
      bot.logger.error(err);
    })
}

module.exports = { initGuild, insertBattle, deleteBattle, selectBattle, insertFight, replace, selectFight, reservation };