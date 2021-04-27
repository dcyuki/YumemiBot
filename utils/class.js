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

class Message {
  // static plugins = {};
  // static cmd = tools.getYAML('cmd');
  // static param = tools.getYAML('param');
  // static plugin_dir = tools.getDir('plugins');

  constructor(message_id, group_id, group_name, raw_message, user_id, nickname, card, level) {
    this.message_id = message_id;
    this.group_id = group_id.toString();
    this.group_name = group_name;
    this.raw_message = raw_message;
    this.user_id = user_id.toString();
    this.nickname = nickname;
    this.card = card;
    this.level = level;
  }
}

module.exports = {
  Bot,
  Message
}