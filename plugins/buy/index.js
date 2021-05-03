const { getConfig, getDir, scheduleJob } = require(`${__yumemi}/utils/util`);

class Buy {
  static images = null;
  static path = `${__yumemi}/data/images/buy`;

  static send(groups) {
    const img = Buy.images[Math.floor(Math.random() * Buy.images.length)];

    for (const group_id of groups) {
      bot.sendGroupMsg(group_id, `[CQ:image,file=${Buy.path}/${img}]`);
    }
  }
}

getDir('buy')
  .then(data => Buy.images = data)

// 东八时区
scheduleJob('0 0 0/6 * * ?', () => {
  getConfig('groups')
    .then(data => {
      const groups = [];

      // 判断开启服务的群
      for (const group_id in data) {
        if (!data[group_id].enable) continue;

        data[group_id].plugins.buy.enable &&
          data[group_id].plugins.buy.version === 'cn' && groups.push(group_id);
      }

      Buy.send(groups)
    })
});

// 东九时区
scheduleJob('0 0 1,7,13,19 * * ? ', () => {
  getConfig('groups')
    .then(data => {
      const groups = [];

      for (const group_id in data) {
        if (!data[group_id].enable) continue;

        data[group_id].plugins.buy.enable &&
          data[group_id].plugins.buy.version === 'jp' && groups.push(group_id);
      }

      Buy.send(groups)
    })
});

module.exports = Buy;