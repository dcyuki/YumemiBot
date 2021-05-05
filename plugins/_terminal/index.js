const { getConfig, setConfig, getDir } = require(`${__yumemi}/utils/util`);

class Terminal {
  constructor(ctx) {
    const { group_id, user_id, raw_message, level } = ctx;

    this.group_id = group_id;
    this.user_id = user_id;
    this.raw_message = raw_message;
    this.level = level;
  }

  // 更新配置文件
  async update() {
    const [, , plugin, setting, param] = this.raw_message.split(' ');
    const groups = await getConfig('groups');
    const plugins = new Set([...await getDir('plugins')]);

    if (!plugins.has(plugin)) return bot.sendGroupMsg(this.group_id, `不存在 ${plugin} 服务模块`);

    if (this.level > 2) {
      const plugin_data = groups[this.group_id].plugins[plugin];
      const old_data = JSON.stringify(plugin_data, null, 2);

      // 'false' 与 'true' 转换为 boolean false true
      plugin_data[setting] = param === 'true' || param === 'false' ? param === 'true' : param;

      const new_data = JSON.stringify(plugin_data, null, 2);

      setConfig('groups', groups)
        .then(() => {
          bot.sendGroupMsg(this.group_id, `${plugin}: ${old_data}\n--------  after  --------\n ${plugin}: ${new_data}`);
        })
        .catch(err => {
          bot.logger.error(err);
          bot.sendGroupMsg(this.group_id, `${err.message}`);
        })
    } else {
      bot.setGroupBan(this.group_id, this.user_id, 60 * 5);
      bot.sendGroupMsg(this.group_id, `你当前为 level ${this.level} ，修改配置文件要达到 level 3 ，权限不足，请不要乱碰奇怪的开关`);
    }
  }

  // 打印运行信息
  async state() {
    const { r17: { length: r17_length }, r18: { length: r18_length } } = await getDir('setu');
    const { uptime, totalmem, freemem, version, release } = require('os');
    const systemInfo = `系统环境: ${version()} ${release()}
运行时长: ${(uptime / 60 / 60).toFixed(1)} H
使用空间: ${((totalmem - freemem) / 1024 / 1024 / 1024).toFixed(2)} GB / ${(totalmem / 1024 / 1024 / 1024).toFixed(2)} GB
色图库存: r17: ${r17_length} & r18: ${r18_length}`;
    bot.sendGroupMsg(this.group_id, systemInfo);
  }

  // 退出当前群聊
  quit() {
    this.level < 4 ?
      bot.setGroupLeave(this.group_id) :
      (
        bot.sendGroupMsg(this.group_id, `你当前为 level ${this.level} ，退出群聊要达到 level 4 ，这是一个很危险的开关，你知道么`),
        bot.setGroupBan(this.group_id, this.user_id)
      )
      ;
  }

  // 语法糖
  sugar() {
    const param = /(关闭|禁用)/.test(this.raw_message.slice(0, 2)) ? false : true;;
    const setting = this.raw_message.slice(2).trim();

    switch (setting) {
      case 'r18':
        this.raw_message = `> update setu r18 ${param}`;
        break;

      case 'flash':
        this.raw_message = `> update setu flash ${param}`;
        break;
      case 'bl':
      case 'tw':
      case 'jp':
        this.raw_message = `> update bilibili ${setting} ${param}`;
        break;

      default:
        this.raw_message = `> update ${setting} enable ${param}`;
        break;
    }

    this.update();
  }
}

module.exports = Terminal;