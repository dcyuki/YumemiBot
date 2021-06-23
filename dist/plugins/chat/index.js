"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const node_schedule_1 = require("node-schedule");
const util_1 = require("../../utils/util");
const word_repeat = [];
const word_interrupt = new Map();
const thesaurus = util_1.getProfileSync('chat');
// 12 小时清空一次词库
node_schedule_1.scheduleJob('0 0 0/12 * * ?', () => word_interrupt.clear());
// 复读
function repeat(data) {
    const { raw_message, reply } = data;
    if (!word_repeat.includes(raw_message)) {
        word_repeat.length = 0;
    }
    word_repeat.push(raw_message);
    const { length } = word_repeat;
    if (length > 1 && length <= 5) {
        const probabilit = Math.floor(Math.random() * 100) + 1;
        if (probabilit < length * 20) {
            reply(raw_message);
            word_repeat.length = 6;
        }
    }
}
// 聊天
function interrupt(data) {
    const { group_id, raw_message, reply } = data;
    // 不存在群信息则记录
    !word_interrupt.has(group_id) && word_interrupt.set(group_id, new Set());
    // 匹配正则调用模块
    for (const regular in thesaurus) {
        const reg = new RegExp(regular);
        if (!reg.test(raw_message))
            continue;
        // 获取随机 msg
        const msg = thesaurus[regular][Math.floor(Math.random() * thesaurus[regular].length)];
        if (word_interrupt.get(group_id)?.has(msg))
            return;
        reply(msg);
        word_interrupt.get(group_id)?.add(msg);
    }
}
function chat(bot, data) {
    const { groups } = bot;
    const { group_id } = data;
    if (!groups[group_id].plugins.includes('chat')) {
        return;
    }
    repeat(data);
    interrupt(data);
}
function activate(bot) {
    bot.on("message.group", (data) => chat(bot, data));
}
exports.activate = activate;
function deactivate(bot) {
    bot.off("message.group", chat);
}
exports.deactivate = deactivate;
