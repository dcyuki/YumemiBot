class Master {
  constructor(ctx) {
    const { group_id, user_id, raw_message, level } = ctx;

    this.group_id = group_id;
    this.user_id = user_id;
    this.raw_message = raw_message;
    this.level = level;
  }

  // 申请头衔
  title() {
    let msg = null;

    switch (true) {
      case bot.gl.get(this.group_id).owner_id !== bot.uin:
        msg = `该服务需要 bot 拥有群主权限才能正常使用`;
        break;
      case this.level < 2:
        msg = `你当前 Level 为${this.level}，申请头衔需要达到 Level 2`;
        break;
    }

    if (msg) {
      bot.sendGroupMsg(this.group_id, msg);

      return;
    }

    const title = this.raw_message.substr(4).trim();

    bot.setGroupSpecialTitle(this.group_id, this.user_id, title);
  }
}

module.exports = Master;