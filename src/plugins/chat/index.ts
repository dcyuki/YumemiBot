import { Client, GroupMessageEventData } from "oicq";
import { scheduleJob } from "node-schedule";
import { getProfileSync } from "../../utils/util";

const word_repeat: string[] = [];
const word_interrupt: Map<number, Set<string>> = new Map();
const thesaurus: { [word: string]: string[] } = getProfileSync('chat');

// 12 小时清空一次词库
scheduleJob('0 0 0/12 * * ?', () => word_interrupt.clear());

// 复读
function repeat(data: GroupMessageEventData) {
  const { raw_message, reply } = data;

  if (!word_repeat.includes(raw_message)) {
    word_repeat.length = 0;
  }
  word_repeat.push(raw_message);

  const { length } = word_repeat;

  if (length > 1 && length <= 5) {
    const probabilit: number = Math.floor(Math.random() * 100) + 1;

    if (probabilit < length * 20) {
      reply(raw_message);
      word_repeat.length = 6;
    }
  }
}

// 聊天
function interrupt(data: GroupMessageEventData) {
  const { group_id, raw_message, reply } = data;

  // 不存在群信息则记录
  !word_interrupt.has(group_id) && word_interrupt.set(group_id, new Set());

  // 匹配正则调用模块
  for (const regular in thesaurus) {
    const reg = new RegExp(regular);

    if (!reg.test(raw_message)) continue;

    // 获取随机 msg
    const msg = thesaurus[regular][Math.floor(Math.random() * thesaurus[regular].length)];

    if (word_interrupt.get(group_id)?.has(msg)) return;

    reply(msg);
    word_interrupt.get(group_id)?.add(msg);
  }
}

function chat(bot: Client, data: GroupMessageEventData): void {
  const { groups } = bot;
  const { group_id } = data;

  if (!groups[group_id].plugins.includes('chat')) {
    return
  }

  repeat(data);
  interrupt(data);
}

function activate(bot: Client): void {
  bot.on("message.group", (data: GroupMessageEventData) => chat(bot, data));
}

function deactivate(bot: Client): void {
  bot.off("message.group", chat);
}

export {
  activate, deactivate
}