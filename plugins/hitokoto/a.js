const axios = require('axios');
const { getConfig, scheduleJob } = require('../../utils/util');

class Hitokoto {
  static url = null;
  static params = null;

  constructor(ctx) {
    const { group_id } = ctx;

    this.group_id = group_id;
  }

  send(groups) {
    axios.get(`${Hitokoto.url}${Hitokoto.params}`)
      .then(res => {
        const { data: { hitokoto, from } } = res;
        const msg = `${hitokoto}\n\t\t\t\t———— 「${from}」`;

        if (!groups) {
          bot.sendGroupMsg(this.group_id, msg);
        } else {
          // 判断开启服务的群
          for (const group_id in groups) {
            if (!groups[group_id].enable) continue;

            groups[group_id].plugins.hitokoto.enable && bot.sendGroupMsg(group_id, `${hitokoto}\n\t\t\t\t———— 「${from}」`);
          }
        }
      })
      .catch(function (err) {
        bot.sendGroupMsg(this.group_id, err);
      });
  }
}

getConfig('api')
  .then(data => {
    const { hitokoto: { url, params } } = data;

    Hitokoto.url = url;
    Hitokoto.params = params;
  })

// 每天24点定时发送
scheduleJob('0 0 0 * * ?', async () => {
  const ctx = {};
  const groups = await getConfig('groups');

  new Hitokoto(ctx).send(groups);
});

module.exports = Hitokoto;