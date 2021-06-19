import { readdirSync } from "fs";
import { Client, GroupMessageEventData } from "oicq";
import { uptime, totalmem, freemem, version, release } from "os";

import { getSetuDir } from "../setu";
import { setProfile } from "../../utils/util";
import { getLevel, checkCommand } from "../../utils/bot";

// 插件控制
async function control(bot: Client, data: GroupMessageEventData) {
  const { uin, groups } = bot;
  const { group_id, user_id, raw_message, reply } = data;
  const [action, plugin] = raw_message.split(' ');
  const plugins: string[] = groups[group_id].plugins;

  let msg: string | null = null;
  switch (true) {
    // 有bug，待优化
    case action === '>enable' && !bot.plugins.has(plugin):
      msg = `不存在 ${plugin} 服务，请输入合法参数`;
      break

    case action === '>enable' && plugins.includes(plugin):
      msg = `已启用 ${plugin} 服务，不要重复启用`;
      break

    case action === '>disable' && !plugins.includes(plugin):
      msg = `没有启用 ${plugin} 服务，不要重复禁用`;
      break
  }

  if (msg) {
    reply(msg);
    return;
  }

  const level = await getLevel(bot, data);

  if (level > 2) {
    action === '>enable' ?
      plugins.push(plugin) :
      plugins.splice(plugins.findIndex(item => item === plugin), 1);

    setProfile(uin.toString(), groups, path.groups)
      .then(() => {
        action === '>enable' ?
          reply(`plugin: {\n  "${plugin}": "deactivate  >>>  activate"\n}`) :
          reply(`plugin: {\n  "${plugin}": "activate  >>>  deactivate"\n}`);
      })
      .catch((err) => {
        reply(err);
      })
  } else {
    bot.setGroupBan(group_id, user_id, 60 * 5);
    reply(`你当前为 level ${level} ，修改配置文件要达到 level 3 ，权限不足，请不要乱碰奇怪的开关`);
  }
}

// 更新配置文件
async function update(bot: Client, data: GroupMessageEventData): Promise<void> {
  const level = await getLevel(bot, data);
  const { uin, groups } = bot;
  const { group_id, user_id, raw_message, reply } = data;
  const [, plugin, setting, param] = raw_message.split(' ');

  const plugins: string[] = readdirSync(path.plugins);

  if (!plugins.includes(plugin)) {
    reply(`不存在 ${plugin} 服务模块`);
    return
  }

  if (level > 2) {
    const settings = groups[group_id].settings[plugin];
    const old_settings = JSON.parse(JSON.stringify(settings));

    // 'false' 与 'true' 转换为 boolean false true
    settings[setting] = param === 'true' || param === 'false' ? param === 'true' : param;

    setProfile(uin.toString(), groups, path.groups)
      .then(() => {
        old_settings[setting] += `  >>>  ${param}`;

        reply(`${plugin}: ${JSON.stringify(old_settings, null, 2)}`);
      })
      .catch(err => {
        bot.logger.error(err);
        reply(`${err.message}`);
      })
  } else {
    bot.setGroupBan(group_id, user_id, 60 * 5);
    reply(`你当前为 level ${level} ，修改配置文件要达到 level 3 ，权限不足，请不要乱碰奇怪的开关`);
  }
}

// 打印运行信息
function state(data: GroupMessageEventData) {
  const { r17: { length: r17_length }, r18: { length: r18_length } } = getSetuDir();

  const msg = `系统环境：${version()} ${release()}
运行时长：${(uptime() / 60 / 60).toFixed(1)} H
使用空间：${((totalmem() - freemem()) / 1024 / 1024 / 1024).toFixed(2)} GB / ${(totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB
色图库存：r17：${r17_length} / r18：${r18_length}
版本信息：${yumemi.info.version}`;

  data.reply(msg);
}

// 语法糖
function sugar(bot: Client, data: GroupMessageEventData): void {
  let { raw_message } = data;

  const param = /(关闭|禁用)/.test(raw_message.slice(0, 2)) ? false : true;;
  const setting = raw_message.slice(2).trim();

  switch (setting) {
    case 'r18':
      data.raw_message = `>update setu r18 ${param}`;
      update(bot, data);
      break;

    case 'flash':
      data.raw_message = `>update setu flash ${param}`;
      update(bot, data);
      break;

    case 'bl':
    // case 'tw':
    case 'jp':
      data.raw_message = `>update bilibili ${setting} ${param}`;
      update(bot, data);
      break;

    default:
      data.raw_message = `>${param ? 'enable' : 'disable'} ${setting}`;
      control(bot, data);
      break;
  }
}

// 退出当前群聊
async function quit(bot: Client, data: GroupMessageEventData): Promise<void> {
  const { group_id, user_id, reply } = data;
  const level = await getLevel(bot, data);

  level > 4 ?
    bot.setGroupLeave(group_id) :
    (
      reply(`你当前为 level ${level} ，退出群聊要达到 level 4 ，这是一个很危险的开关，你知道么`),
      bot.setGroupBan(group_id, user_id)
    )
    ;
}

function list(bot: Client, data: GroupMessageEventData): void {
  const { plugins, groups } = bot;
  const { group_id, reply } = data;

  const msg: string[] = ['当前群服务列表：'];

  plugins.forEach((val, key) => {
    if (/^(_).+/.test(key)) return false;
    msg.push(groups[group_id].plugins.includes(key) ? `|○| ${key} ` : `|△| ${key} `)
  })

  msg.push('如要查看更多设置可输入 >setting');
  reply(msg.join('\n'));
}

function setting(bot: Client, data: GroupMessageEventData): void {
  const { groups } = bot;
  const { group_id, reply } = data;

  reply(JSON.stringify(groups[group_id].settings, null, 2));
}

function terminal(bot: Client, data: GroupMessageEventData): void {
  const { _terminal } = yumemi.cmd;
  const { raw_message } = data;

  checkCommand(raw_message, _terminal.update) && update(bot, data);
  checkCommand(raw_message, _terminal.state) && state(data);
  checkCommand(raw_message, _terminal.sugar) && sugar(bot, data);
  checkCommand(raw_message, _terminal.control) && control(bot, data);
  checkCommand(raw_message, _terminal.list) && list(bot, data);
  checkCommand(raw_message, _terminal.setting) && setting(bot, data);
}

function activate(bot: Client): void {
  bot.on("message.group", (data: GroupMessageEventData) => terminal(bot, data));
}

export {
  activate
}