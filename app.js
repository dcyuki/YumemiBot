const { createClient } = require('oicq');

class Bot {
  constructor(account, password, config) {
    this.account = account;
    this.password = password;
    this.config = config;
  }

  linkStart() {
    const bot = createClient(this.account, this.config);

    // 监听并输入滑动验证码 ticket
    bot.on("system.login.slider", () => {
      process.stdin.once("data", input => {
        bot.sliderLogin(input);
      });
    });

    // 监听设备锁验证
    bot.on("system.login.device", () => {
      bot.logger.info("验证完成后敲击Enter继续..");
      process.stdin.once("data", () => {
        bot.login();
      });
    });

    bot.login(this.password);
    return bot;
  }
}

class Context {
  constructor(message_id, group_id, group_name, raw_message, user_id, nickname, card, level) {
    this.message_id = message_id;
    this.group_id = group_id;
    this.group_name = group_name;
    this.raw_message = raw_message;
    this.user_id = user_id;
    this.nickname = nickname;
    this.card = card;
    this.level = level;
  }
}

const logo = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 
                                                                                  
--------------------------------------------------------------------------------------------`;
console.log(logo);

global.__yumemi = `${__dirname}`;
global.utils = require('./utils/utils');

// await 实例化 Bot 对象
const { qq: { admin, master, account, password }, info: { version, released, changelogs }, config } = utils.getConfigSync('bot');

global.bot = new Bot(account, password, config).linkStart();

// 打印 bot 信息
bot.logger.mark(`----------`);
bot.logger.mark(`Package Version: ${version} (Released on ${released})`);
bot.logger.mark(`View Changelogs：${changelogs}`);
bot.logger.mark(`----------`);

let plugins = {};

// 登录成功后加载插件
bot.on('system.online', () => {
  // async 加载插件
  utils.getDir('plugins')
    .then(data => {
      bot.logger.mark(`----------`);
      bot.logger.mark('Login success ! 初始化模块...');

      for (const plugin of data) {
        // 插件是否存在 index.js 文件
        utils.exists(`./plugins/${plugin}/index.js`)
          .then(() => {
            plugins[plugin] = require(`./plugins/${plugin}/index`);
            // bot.logger.mark(`plugin loaded: ${plugin}`);
          })
          .catch(() => {
            bot.logger.warn(`${plugin} 模块未加载`);
          })
          .finally(() => {
            // bot.logger.mark(`加载了${Object.keys(plugins).length}个插件`);
          })
      }

      bot.logger.mark(`初始化完毕，开始监听群聊。`);
      bot.logger.mark(`----------`);
    })
    .catch(err => {
      bot.logger.error(err);
    })
})

// 监听群消息
bot.on('message.group', data => {
  // 实例化 Context 对象
  const { message_id, group_id, group_name, raw_message, sender: { user_id, nickname, card, level: lv, role } } = data;
  const level = user_id !== admin ? (user_id !== master ? (role === 'member' ? (lv < 5 ? (lv < 3 ? 0 : 1) : 2) : (role === 'admin' ? 3 : 4)) : 5) : 6;
  const ctx = new Context(message_id, group_id, group_name, raw_message, user_id, nickname, card, level)

  // 校验 group.yml
  utils.updateGroup(ctx.group_id, ctx.group_name);

  // 获取群聊信息
  utils.getConfig('groups')
    .then(data => {
      const group = data[group_id];

      // 正则匹配
      group.enable && utils.getConfig('cmd').then(data => {
        const cmd = data;

        out:
        for (const plugin in cmd) {
          for (const serve in cmd[plugin]) {
            const reg = new RegExp(cmd[plugin][serve]);

            if (!reg.test(ctx.raw_message)) continue;

            // 模块是否启用
            if (/^[a-z]/.test(plugin)) {
              console.log(plugins)
              const { plugins: { [plugin]: { enable } } } = group;

              if (!enable) return bot.sendGroupMsg(ctx.group_id, `当前群聊 ${plugin} 模块未启用...`);
            }

            new plugins[plugin](ctx)[serve]();

            break out;
          }
        }
      });
    })
    .catch(err => {
      bot.logger.error(err);
    })
});