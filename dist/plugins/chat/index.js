"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const node_schedule_1 = require("node-schedule");
const util_1 = require("../../utils/util");
const word_repeat = new Map();
const word_interrupt = new Map();
const thesaurus = util_1.getProfileSync('chat');
// 12 小时清空一次词库
node_schedule_1.scheduleJob('0 0 0/12 * * ?', () => {
    // word_repeat.clear();
    word_interrupt.clear();
});
// 复读
function repeat(data) {
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
    interrupt(data);
    repeat(data);
}
function activate(bot) {
    bot.on("message.group", (data) => chat(bot, data));
}
exports.activate = activate;
function deactivate(bot) {
    bot.off("message.group", chat);
}
exports.deactivate = deactivate;
