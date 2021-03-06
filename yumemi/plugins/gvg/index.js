// const fs = require('fs');
const terminal = require('../__terminal/index');

module.exports = (messageData, option) => {
  let sql = null;
  // const [year, month, day] = `${year}/${month}/${day}`.split('/');
  const date = new Date();
  const addZero = number => number < 10 ? '0' + number : number;
  const [year, month, day, hour, minute] = [
    date.getFullYear(),
    addZero(date.getMonth() + 1),
    addZero(date.getDate()),
    addZero(date.getHours()),
    addZero(date.getMinutes())
  ]
  const nowTime = `${year}/${month}/${day} ${hour}:${minute}`;
  const { gvg: { [messageData.group_id]: { version: version } } } = tools.getProfile('pluginSettings');
  let { user_id: qq, group_id: group_id, group_name: name, sender: { nickname: nickname, card: card } } = messageData;
  if (!card) card = nickname;
  const select = () => {
    // 拆分字段
    const guild = messageData.raw_message.slice(2, 4);
    switch (guild) {
      case '国服':
        messageData.raw_message = '> update gvg version bl';
        break;
      case '台服':
        messageData.raw_message = '> update gvg version tw';
        break;
      case '日服':
        messageData.raw_message = '> update gvg version jp';
        break;
    }
    // messageData.raw_message = guild === '国服' ? '国服' : (guild === '台服' ? '台服' : (guild === '日服' ? '日服' : void (0)))
    terminal(messageData, 'update');
  }

  // 开启会战请求
  const start = async () => {
    // 查询 **当月** 是否已开启会战
    sql = `SELECT group_id FROM situation WHERE group_id = "${group_id}" AND time LIKE "%${year}/${month}%"`;
    let situation = await tools.sqlite(sql);
    situation = situation[0]

    if (situation) {
      bot.sendGroupMsg(group_id, '你当月已发起一次会战请求，请不要重复提交');
    } else {
      sql = `SELECT group_id FROM guild WHERE group_id = "${group_id}"`;
      let guild = await tools.sqlite(sql);
      guild = guild[0]

      // 未找到群消息则插入
      if (!guild) {
        sql = `INSERT INTO guild (group_id, name) VALUES ("${group_id}", "${name}")`;
        if (await tools.sqlite(sql)) bot.logger.info('INSERT guild success...');
      }

      // 写入当期会战数据
      const constellation = messageData.raw_message.slice(2, 5);
      sql = `INSERT INTO situation (group_id, constellation, time) VALUES ("${group_id}", "${constellation}", "${nowTime}")`;
      if (await tools.sqlite(sql)) {
        bot.logger.mark('INSERT situation success...');
        bot.sendGroupMsg(messageData.group_id, `${constellation} 会战开启成功...`);
        // 不存在则创建 reservation.yml 文件（这段代码重复了，待简化）~~又不是不能用，最喜欢堆屎山了~~
        let reservation = tools.getProfile('reservation', __dirname);
        if (reservation === undefined || reservation[group_id] === undefined) {
          reservation === undefined ?
            createReservation(undefined) :
            createReservation(null)
            ;
          reservation = tools.getProfile('reservation', __dirname);
        }
        // 存在则清空上期会战的预约残留数据
        for (const item in reservation[group_id]) {
          if (reservation[group_id][item].length > 0) reservation[group_id][item].length = 0;
        }
        tools.setProfile('reservation', reservation, __dirname) ?
          bot.logger.info('已清空上期预约数据') :
          bot.logger.error('初始化数据发生未知错误...')
          ;
      }
    }
  }
  // 获取当前 boss 的 max 血量
  const getBlood = (week, boss) => {
    let stage;
    let bossInfo = tools.getProfile('boss');

    if (week <= 3) stage = 1;
    else if (week <= 10) stage = 2;
    else if (week <= 35) stage = 3;
    else version != 'bl' ? stage = 4 : stage = 3;

    return bossInfo[version][stage - 1][boss - 1];
  }

  // 查询状态
  const state = async () => {
    sql = `SELECT * FROM situation WHERE group_id = "${group_id}" AND time LIKE "%${year}/${month}%"`;
    let situation = await tools.sqlite(sql);
    situation = situation[0]

    if (situation) {
      const maxBlood = getBlood(situation.week, situation.boss);
      // 获取预约成员
      let reservation = tools.getProfile('reservation', __dirname);
      // 不存在则创建 reservation.yml 文件（这段代码重复了，待简化）~~又不是不能用，最喜欢堆屎山了~~
      if (reservation === undefined || reservation[group_id] === undefined) {
        reservation === undefined ?
          createReservation(undefined) :
          createReservation(null)
          ;
        reservation = tools.getProfile('reservation', __dirname);
      }
      const member = []
      for (let i = 0; i < reservation[group_id][situation.boss].length; i++) {
        member.push(`${reservation[group_id][situation.boss][i].split(' ')[1]}, `)
      }
      const situationMsg = `当前信息:\n\t${situation.week} 周目  ${situation.boss} 王  ${situation.blood} \\ ${maxBlood}\n讨伐成员: \n\t${member}\n更新时间:\n\t${situation.time}`;
      bot.sendGroupMsg(group_id, situationMsg);
    } else {
      bot.sendGroupMsg(group_id, '当期未开启会战...');
    }
  }

  // 录入伤害
  const insertFight = async damage => {
    // 获取当天出刀信息
    sql = `SELECT user.nickname, situation.week, situation.boss, situation.blood, fight.number, fight.time AS time FROM user LEFT JOIN (situation LEFT JOIN fight ON fight.group_id = situation.group_id AND fight.group_id = "${group_id}" AND fight.qq = "${qq}") WHERE user.qq = "${qq}" ORDER BY fight.time DESC, fight.number DESC`;
    let fight = await tools.sqlite(sql);
    fight = fight[0]
    // 当天是否出过刀
    const time = fight.time !== null ? fight.time.split(' ')[0] : null;
    let number, note = null;
    if (damage) {
      fight.time !== null && `${year}/${month}/${day}` === time ?
        number = Math.floor(fight.number + 1) :
        number = 1;
    } else {
      fight.time !== null && `${year}/${month}/${day}` === time ?
        number = fight.number + 0.5 :
        number = 0.5
    }

    if (number > 3) {
      bot.sendGroupMsg(group_id, `你今天已经出完 3 刀了，请不要重复提交数据`);
    } else {
      let { week, boss } = fight;
      // 是否斩杀 boss
      if (damage) {
        note = `${card} 对 ${boss} 王造成了 ${damage} 点伤害`;
        if (damage > fight.blood) {
          bot.sendGroupMsg(group_id, `伤害值超出 boss 剩余血量，若以斩杀 boss 请使用「尾刀」指令`);
        } else {
          sql = `INSERT INTO fight (group_id, qq, nickname, number, week, boss, damage, note, time) VALUES ("${group_id}", "${qq}", "${nickname}", "${number}", "${week}", "${boss}", "${damage}", "${note}", "${nowTime}")`;
          if (await tools.sqlite(sql)) bot.sendGroupMsg(group_id, note);

          sql = `UPDATE situation SET blood = blood - ${damage}, time = "${nowTime}" WHERE group_id = "${group_id}" AND time LIKE "%${year}/${month}%"`;
          if (await tools.sqlite(sql)) state();
        }
      } else {
        // 查询斩杀 boss 的血量
        damage = fight.blood
        note = `${card} 对 ${boss} 王造成了 ${damage} 点伤害并击破`;
        sql = `INSERT INTO fight (group_id, qq, nickname, number, week, boss, damage, note, time) VALUES ("${group_id}", "${qq}", "${nickname}", "${number}", "${week}", "${boss}", "${damage}", "${note}", "${nowTime}")`;
        if (await tools.sqlite(sql)) bot.sendGroupMsg(group_id, note);
        // 获取下一个 boss 的血量
        boss != 5 ?
          boss++ :
          (
            boss = 1,
            week++
          )
          ;
        const blood = getBlood(week, boss);
        // let blood = boss[setting.version][stage - 1][data.boss - 1];
        sql = `UPDATE situation SET week = ${week}, boss = ${boss}, blood = ${blood}, time = "${nowTime}" WHERE group_id = "${group_id}" AND time LIKE "%${year}/${month}%"`;
        if (await tools.sqlite(sql)) {
          state();
          // At 预约 boss
          let at = '';
          const reservation = tools.getProfile('reservation', __dirname);
          if (reservation === undefined || reservation[group_id] === undefined) {
            reservation === undefined ?
              createReservation(undefined) :
              createReservation(null)
              ;
          } else {
            for (const user_id of reservation[group_id][boss]) {
              if (/^[0-9]/.test(user_id)) {
                at += `[CQ:at,qq=${user_id}]\n`;
              }
            }
            if (at !== '') {
              bot.sendGroupMsg(group_id, `${at} 到 ${boss}王 啦~'`);
            }
            // boss 被斩杀后清空预约数据
            if (reservation[group_id][boss === 1 ? 5 : boss - 1].length > 0) {
              reservation[group_id][boss === 1 ? 5 : boss - 1].length = 0;
              tools.setProfile('reservation', reservation, __dirname) ?
                bot.logger.info('已清空预约数据') :
                bot.logger.error('发生未知错误...')
                ;
            }
          }
        }
      }
    }
  }
  // 创建 reservation.yml 配置文件
  const createReservation = exist => {
    let reservation;

    switch (exist) {
      case undefined:
        reservation = {};
        bot.logger.info('检测到 reservation.yml 文件不存在，正在为你创建...');
        break;
      case null:
        bot.logger.info('检测到当前群聊未初始化会战预约配置文件，正在添加配置信息');
        reservation = tools.getProfile('reservation', __dirname);
        break;
    }

    reservation[group_id] = {};
    for (let i = 1; i <= 5; i++) {
      reservation[group_id][i] = [];
    }

    tools.setProfile('reservation', reservation, __dirname) ?
      bot.logger.info('初始化成功，已创建 reservation.yml 文件...') :
      bot.logger.error('发生未知错误，创建 reservation.yml 失败...')
      ;
  }

  // 预约 boss
  const reservation = () => {
    let reservation = tools.getProfile('reservation', __dirname);

    // 不存在则创建 reservation.yml 文件
    if (reservation === undefined || reservation[group_id] === undefined) {
      reservation === undefined ?
        createReservation(undefined) :
        createReservation(null)
        ;
      reservation = tools.getProfile('reservation', __dirname);
    }
    const boss = messageData.raw_message.slice(2).trim();
    // boss 传入实参则插入预约信息
    if (boss) {
      let exist = false;
      for (let i = 0; i < reservation[group_id][boss].length; i++) {
        if (qq == reservation[group_id][boss][i].split(' ')[0]) {
          exist = true
          break;
        }
      }

      exist ?
        bot.sendGroupMsg(group_id, `[CQ:at,qq=${qq}] 你已预约 ${boss}王 ，请勿重复预约`) :
        (
          reservation[group_id][boss].push(`${qq} ${card}`),
          tools.setProfile('reservation', reservation, __dirname) ?
            bot.sendGroupMsg(group_id, `[CQ:at,qq=${qq}] 预约 ${boss}王 成功`) :
            bot.sendGroupMsg(group_id, `[CQ:at,qq=${qq}] 发生未知错误，预约 ${boss}王 失败`)
        )
      // 不传入 boss 实参则发送预约信息
    } else {
      let msg = '当前预约信息:';
      let member = '';
      for (let i = 1; i <= 5; i++) {
        for (let j = 0; j < reservation[group_id][i].length; j++) {
          if (reservation[group_id][i][j] !== undefined) {
            member += ` ${reservation[group_id][i][j].split(' ')[1]},`
          }
          console.log(i, j)
        }
        msg += `\n\t${i}王: ${member}`;
        member = '';
      }

      bot.sendGroupMsg(group_id, msg);
    }
  }


  // 创建用户
  const insertUser = async (qq, nickname) => {
    // 生成初始密码
    const length = 6;
    let password = [];
    for (let i = 0; i < length; i++) {
      // 大写字母 'A' 的 ASCII 是 65 , A~Z 的 ASCII 码就是 65 + 0 ~ 25;
      password.push(String.fromCharCode(65 + Math.floor(Math.random() * 26)));
    }

    password = password.join('')
    sql = `INSERT INTO user (qq, nickname, password) VALUES ("${qq}", "${nickname}", "${password}")`;
    if (await tools.sqlite(sql)) {
      bot.logger.info('INSERT user success...');
      bot.sendPrivateMsg(qq, `你的账号已自动创建，初始密码为：${password}\n可登录后台自行修改，若遗忘发送「初始化密码」重置`);
      sql = `INSERT INTO gacha (qq) VALUES ("${qq}")`;
      if (await tools.sqlite(sql)) bot.logger.info('INSERT gacha success...');
    }
  }

  // 加入公会
  const join = async () => {
    sql = `SELECT qq FROM member WHERE qq = "${qq}" AND group_id = "${group_id}"`;
    const member = await tools.sqlite(sql);
    if (member.length >= 1) {
      bot.sendGroupMsg(group_id, `[CQ:at,qq=${qq}] 你已加入当前公会，请勿重复提交申请`);
    } else {
      sql = `INSERT INTO member (qq, group_id) VALUES ("${qq}", "${group_id}")`;
      if (await tools.sqlite(sql)) {
        bot.sendGroupMsg(group_id, `[CQ:at,qq=${qq}] 你成功加入公会`);
        return true;
      } else {
        bot.sendGroupMsg(group_id, `[CQ:at,qq=${qq}] 加入公会失败`);
        return false;
      }
    }
  }

  // 查询出刀信息
  const info = async () => {
    sql = `SELECT nickname, number, damage, boss FROM fight WHERE qq = "${qq}" AND time LIKE "%${year}/${month}/${day}%"`;
    const fight = await tools.sqlite(sql);
    if (fight != undefined) {
      let fightMsg = `[CQ:at,qq=${qq}]\n`;

      for (let i = 0; i < fight.length; i++) {
        fightMsg += '第 ' + fight[i].number + ' 刀: [" Boss: ' + fight[i].boss + ' 王, 伤害: ' + fight[i].damage + ' "]\n';
      }

      bot.sendGroupMsg(group_id, fightMsg);
    } else {
      bot.sendGroupMsg(group_id, '你今天还没有出刀呢，暂无数据...');
    }
  }

  // 报刀
  const rout = async damage => {
    // 校验会战信息是否初始化
    sql = `SELECT group_id FROM situation WHERE group_id = "${group_id}" AND time LIKE "%${year}/${month}%"`;
    let situation = await tools.sqlite(sql);
    situation = situation[0]

    if (situation) {
      // 查询该成员信息是否在数据库
      sql = `SELECT * FROM user WHERE qq = ${qq}`;
      let user = await tools.sqlite(sql);
      user = user[0]
      // 不存在则插入
      if (user === undefined) await insertUser(qq, nickname);

      // 查询该成员是否在公会列表
      sql = `SELECT state FROM member WHERE qq = "${qq}" AND group_id = "${group_id}"`;
      let member = await tools.sqlite(sql);

      if (member.length < 1) {
        member[0] = {};
        if (await join(group_id, qq)) bot.logger.info('INSERT member success...'), member[0].state = 1
      };

      // 账号是否禁用
      if (member[0].state !== 1) {
        bot.sendGroupMsg(group_id, '你的账号在当前公会已被禁用，如有疑问请联系会长');
      } else {
        if (damage === 0) {
          bot.sendGroupMsg(group_id, `伤害0？这么说，你很勇咯？\n[CQ:image,file=${__yumemi}/data/images/emoji/fight.jpg]`);
          return;
        }
        damage ?
          insertFight(damage) :
          insertFight()
          ;
      }
    } else {
      bot.sendGroupMsg(group_id, '你当月未发起会战');
    }
  }

  // 报刀
  const harm = () => {
    const damage = parseInt(messageData.raw_message.slice(2).trim());
    rout(damage);
  }

  // 代报
  const acting = () => {
    const info = messageData.raw_message.match(/(?<=\[CQ:at,qq=|\u4EE3\u62A5\s*)\d+/g);
    bot.getGroupMemberInfo(group_id, info[0]).then(data => {
      const { data: rawData } = data;
      console.log(rawData)
      qq = rawData.user_id;
      nickname = rawData.nickname;
      if (!rawData.card) card = rawData.nickname;
      rout(!info[1] ? null : info[1]);
    });
  }

  // 修改出刀信息
  const updateFight = async () => {
    const [, number, damage] = messageData.raw_message.split(' ');

    sql = `UPDATE fight SET damage = ${damage} WHERE qq = "${qq}" AND number = ${number} AND time LIKE "%${year}/${month}/${day}%"`;
    console.log(sql);
    if (await tools.sqlite(sql)) {
      bot.logger.info('UPDATE fight success...');
      bot.sendGroupMsg(group_id, '修改成功...');
      info();
    } else {
      bot.sendGroupMsg(group_id, 'Error');
    }
  }

  // 修改 boss 血量
  const updateBlood = async () => {
    const blood = messageData.raw_message.slice(2).trim();
    sql = `UPDATE situation SET blood = ${blood} WHERE group_id = "${group_id}" AND time LIKE "%${year}/${month}/${day}%"`;
    if (await tools.sqlite(sql)) {
      bot.sendGroupMsg(messageData.group_id, '修改成功...');
      state();
    } else {
      bot.sendGroupMsg(group_id, 'Error');
    }
  }

  // 分数线
  const score = async () => {
    const rawData = JSON.parse(await tools.getRequest('https://tools-wiki.biligame.com/pcr/getTableInfo?type=subsection'));
    let msg = '';
    for (const item of rawData) {
      msg += `排名：${item.rank}\n公会：${item.clan_name}\n分数：${item.damage}\n---------------\n`;
    }
    msg ?
      bot.sendGroupMsg(group_id, msg) :
      bot.sendGroupMsg(group_id, '会战未开启，无法获取数据')
      ;
  }
  // 排名
  const rank = async () => {
    const [, name, leader] = messageData.raw_message.split(' ');
    const rawData = JSON.parse(await tools.getRequest(`https://tools-wiki.biligame.com/pcr/getTableInfo?type=search&search=${name}&page=0`));

    let msg = '';
    if (leader) {
      for (const item of rawData) {
        if (item.leader_name === leader) {
          msg += `排名：${item.rank}\n公会：${item.clan_name}\n会长：${item.leader_name}\n分数：${item.damage}`;
          break;
        }
      }
    } else {
      for (const item of rawData) {
        msg += `排名：${item.rank}\n公会：${item.clan_name}\n会长：${item.leader_name}\n分数：${item.damage}\n---------------\n你未指定会长，以上为所有同名公会数据，最多显示前 30 条数据`;
      }
    }

    msg ?
      bot.sendGroupMsg(group_id, msg) :
      bot.sendGroupMsg(group_id, '会战已结束，无法获取数据')
      ;
  }
  // 判断是否设置游戏服务器
  if (version === 'none' && option !== 'select') {
    bot.sendGroupMsg(group_id, '检测到当前群聊未定义游戏服务器，在使用会战功能前请务必初始化参数...');
  } else {
    eval(`${option}()`);
  }
}