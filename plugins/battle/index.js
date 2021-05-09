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

// 获取当月会战数据
const getBattle = ctx => {
  return new Promise((resolve, reject) => {
    const { group_id } = ctx;
    const sql = `SELECT * FROM battle WHERE group_id = $group_id AND start_time like $date`;
    const date = getDate();
    const params = {
      $group_id: group_id,
      $date: `${date.tomonth}%`,
    };
    const post_data = querystring.stringify({
      sql,
      params
    });

    httpRequest(`${battle_url}/get`, 'POST', post_data)
      .then(res => {
        console.log(res)
        resolve(res);
      })
      .catch(err => {
        reject(err)
      })
  })
}

// class Battle {
//   constructor(ctx) {
//     const { group_id, group_name, user_id, raw_message, nickname, card, level } = ctx;

//     this.group_id = group_id;
//     this.group_name = group_name;
//     this.user_id = user_id;
//     this.raw_message = raw_message;
//     this.nickname = nickname;
//     this.card = card;
//     this.level = level;
//   }





//   init() {
//     const Terminal = require('../_terminal/index');
//     const guild = this.raw_message.slice(2, 4);
//     const raw_message = `> update gvg version ${guild === '国服' ? 'bl' : (guild === '台服' ? 'tw' : 'jp')}`;
//     const ctx = {
//       group_id: this.group_id,
//       user_id: this.user_id,
//       raw_message,
//       level: this.level,
//     }
//     const terminal = new Terminal()
//     const guild = this.raw_message.slice(2, 4);
//     const raw_message = `> update gvg version ${guild === '国服' ? 'bl' : (guild === '台服' ? 'tw' : 'jp')}`;
//     const ctx = {
//       group_id: this.group_id,
//       user_id: this.user_id,
//       raw_message,
//       level: this.level,
//       serve: `update`,
//     }

//     terminal(ctx, 'update');
//   }
// async test() {
//   const version = await getConfig('groups').then(data => data[this.group_id].plugins.battle.version);
//   console.log(version)
// }
// }

module.exports = { getBattle };