let plugins = {};

//登录成功
bot.on("system.online", async () => {
  // 加载插件
  plugins = await tools.loadPlugins();
  // 校验配置文件
  bot.logger.info('项目启动成功，开始校验配置文件...');
  tools.checkProfile('pluginSettings');
  // 补充色图
  plugins.setu();
});

//监听私聊
bot.on("message.private", data => {
  console.log(data);
});

//监听群聊
bot.on("message.group", data => {
  if (tools.checkGroup(data)) {
    const option = tools.getOption(data.raw_message);
    const pluginSettings = tools.getProfile('pluginSettings');
    if (option !== undefined) {
      if (/^__/.test(option[0])) {
        plugins[option[0]](data, option[1]);
      } else {
        pluginSettings[option[0]][data.group_id].enable ?
          (
            option.length === 1 ?
              plugins[option[0]](data) :
              plugins[option[0]](data, option[1])
          ) :
          bot.sendGroupMsg(data.group_id, `当前群聊 ${option[0]} 模块未启用...`)
          ;
      }
    }
  }
});

//自动同意群邀请
bot.on("request.group.invite", (data) => {
  console.log(data)
  bot.setGroupAddRequest(data.flag);
  bot.sendPrivateMsg(tools.getProfile('botSettings').master, JSON.stringify(data))
});

//自动同意好友申请
bot.on("request.friend.add", (data) => {
  console.log(data)
  bot.setFriendAddRequest(data.flag);
});

// 监听群事件
bot.on('notice.group', data => {
  // 群事件处理全写在 greet
  plugins.__greet(data);
});