const { getConfig, getDir, scheduleJob } = require(`${__yumemi}/utils/util`);

class Buy {
  static images = null;
  static path = `${__yumemi}/data/images/buy`;

  static sendMsg(group_all) {
    const img = Buy.images[Math.floor(Math.random() * Buy.images.length)];

    for (const group_id of group_all) {
      bot.sendGroupMsg(group_id, `[CQ:image,file=${Buy.path}/${img}]`);
    }
  }
}

getDir('buy').then(data => Buy.images = data);

// 东八时区
scheduleJob('0 0 0/6 * * ?', async () => {
  const group_all = [];
  const groups = await getConfig('groups');

  // 判断开启服务的群
  for (const group_id in groups) {
    if (!groups[group_id].enable) continue;

    groups[group_id].plugins.buy.enable && groups[group_id].plugins.buy.version === 'cn' && group_all.push(group_id);
  }

  Buy.send(group_all)
});

// 东九时区
scheduleJob('0 0 1,7,13,19 * * ? ', async () => {
  const group_all = [];
  const groups = await getConfig('groups');

  for (const group_id in groups) {
    if (!groups[group_id].enable) continue;

    groups[group_id].plugins.buy.enable && groups[group_id].plugins.buy.version === 'jp' && group_all.push(group_id);
  }

  Buy.send(group_all)
});

module.exports = Buy;