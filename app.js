const { Bot, Message } = require('./utils/class');

const logo = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 
                                                                                  
--------------------------------------------------------------------------------------------`;
console.log(logo);

global.__yumemi = `${__dirname}`;
global.utils = require('./utils/utils');

// 实例化 Bot 对象
const { qq: { admin, master, account, password }, info: { version, released, changelogs }, config } = utils.getConfigSync('bot');
const bot = new Bot(account, password, config).linkStart();

global.bot = bot;

// 打印 bot 信息
bot.logger.mark(`----------`);
bot.logger.mark(`Package Version: ${version} (Released on ${released})`);
bot.logger.mark(`View Changelogs：${changelogs}`);
bot.logger.mark(`----------`);

// 加载插件
let plugins = {};

bot.on('system.online', () => {
  plugins = require('./plugins/index');
})

// 监听群消息
bot.on('message.group', data => {
  // 实例化 Message 对象
  const { message_id, group_id, group_name, raw_message, sender: { user_id, nickname, card, level: lv, role } } = data;
  const level = user_id !== admin ? (user_id !== master ? (role === 'member' ? (lv < 5 ? (lv < 3 ? 0 : 1) : 2) : (role === 'admin' ? 3 : 4)) : 5) : 6;
  const ctx = new Message(message_id, group_id, group_name, raw_message, user_id, nickname, card, level)

  // 校验 group.yml
  utils.updateGroup(group_id, group_name);

  // 正则匹配
  utils.getConfig('cmd').then(data => {
    const cmd = data;

    out:
    for (const plugin in cmd) {
      for (const serve in cmd[plugin]) {
        const reg = new RegExp(cmd[plugin][serve]);

        if (reg.test(raw_message)) {
          // 将 serve 传入 ctx
          ctx.serve = serve;

          // 全局模块直接调用
          if (/^__/.test(plugin)) {
            plugins[plugin](ctx);
          } else {
            // 获取群聊信息
            // const { [group_id]: { plugins: { [plugin]: { enable } } } } = group;

            // enable ?
            //   plugins[plugin](ctx) :
            //   bot.sendGroupMsg(group_id, `当前群聊 ${plugin} 模块未启用...`)
            //   ;
          }

          break out;
        }
      }
    }
  });
});