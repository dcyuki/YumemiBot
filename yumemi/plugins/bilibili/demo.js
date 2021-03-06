const biliAPI = require('bili-api');
const pcr_bl = 353840826;
const Msg = new Map();
Msg.set('blNews', null);

tools.scheduleJob('0 0/1 * * * ?', async () => {
  const { groups } = tools.getProfile('botSettings');
  const { bilibili: setting } = tools.getProfile('pluginSettings');
  const { dynamics } = await biliAPI({ mid: pcr_bl }, ['dynamics']);
  let { item: { description, pictures }, dynamic_id } = dynamics[0];

  if (dynamic_id === Msg.get('blNews')) {
    bot.logger.info(`正在获取 bilibili 官方动态，未检测到新消息...`);
    return;
  }

  Msg.set('blNews', dynamic_id);
  
  if (pictures) {
    for (const { img_src } of pictures) description += `\n[CQ:image,file=${img_src}]`;
  }

  for (const group_id in groups) {
    if (!groups[group_id].enable) continue;
    if (setting[group_id].enable) bot.sendGroupMsg(group_id, `B服动态更新:\n${description}`);
  }
});