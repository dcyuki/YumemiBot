class Master {
  constructor(ctx) {
    const { group_id, user_id, raw_message, level } = ctx;

    this.group_id = group_id;
    this.user_id = user_id;
    this.raw_message = raw_message;
    this.level = level;
  }

  title() {
    if (bot.gl.get(this.group_id).owner_id !== bot.uin) return bot.sendGroupMsg(group_id, `该服务需要 bot 拥有群主权限`);

    const title = this.raw_message.substr(4).trim();

    bot.setGroupSpecialTitle(this.group_id, this.user_id, title);
  }
}

module.exports = Master