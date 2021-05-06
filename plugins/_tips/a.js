const { getConfig, getDir, scheduleJob } = require(`${__yumemi}/utils/util`);
const word = new Map();

// 12小时清空一次词库
scheduleJob('0 0 0/12 * * ?', () => word.forEach(values => values.clear()));

class Tips {
  constructor(ctx) {
    const { group_id, raw_message } = ctx;

    this.group_id = group_id;
    this.raw_message = raw_message;
  }

  // 聊天
  async chat() {
    // 获取词库
    const chat = await getConfig('chat');

    // 不存在群信息则记录
    if (!word.has(this.group_id)) word.set(this.group_id, new Set());

    // 匹配正则调用模块
    for (const regular in chat) {
      const reg = new RegExp(regular);

      if (!reg.test(this.raw_message)) continue;

      // 获取随机 msg
      const msg = chat[regular][Math.floor(Math.random() * chat[regular].length)];

      if (word.get(this.group_id).has(msg)) return;

      bot.sendGroupMsg(this.group_id, msg);
      word.get(this.group_id).add(msg);
    }
  }

  async ver() {
    const { info: { released, version } } = await getConfig('bot');

    bot.sendGroupMsg(this.group_id, `${version} ${released}`);
  }

  async help() {
    const { info: { docs } } = await getConfig('bot');

    bot.sendGroupMsg(this.group_id, `使用手册请访问：${docs} `);
  }

  async login() {
    const { web: { port, domain } } = await getConfig('bot');

    bot.sendGroupMsg(this.group_id, `登录请访问：http://${port}:${domain === 80 ? '' : domain} \n该模块刚时装，功能较少，bug较多，仅供测试`);
  }

  // 群服务
  async list() {
    const { [this.group_id]: { plugins } } = await getConfig('groups');
    const plugin_list = new Set(['当前群服务列表：']);

    for (const plugin in plugins) plugin_list.add(plugins[plugin].enable ? `|○| ${plugin} ` : ` |△| ${plugin} `);

    plugin_list.add('如要查看更多设置可输入 settings');
    bot.sendGroupMsg(this.group_id, [...plugin_list].join('\n'));
  }

  // 群设置
  async settings() {
    const { [this.group_id]: { plugins } } = await getConfig('groups');
    bot.sendGroupMsg(this.group_id, `当前群服务设置：\n${JSON.stringify(plugins, null, 2)} \n请不要随意修改参数，除非你知道自己在做什么`);
  }

  // rank 表
  rank() {
    let version = this.raw_message.slice(0, 1);
    switch (version) {
      case 'b':
      case '国':
        version = 'bl';
        break;
      case 't':
      case '省':
      case '台':
        version = 'tw';
        break;
      case 'j':
      case '日':
        version = 'jp';
        break;
    }

    getDir('rank').then(data => {
      const images = [];

      for (const img of data.filter(img => img.slice(0, 2) === version)) {
        images.push(`[CQ: image, file = ${__yumemi} /data/images / rank / ${img}]`);
      }

      bot.sendGroupMsg(this.group_id, `※ 表格仅供参考，升r有风险，强化需谨慎\n${images.join('\n')} `);
    });
  }
}

module.exports = Tips;