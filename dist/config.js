"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBotDir = void 0;
const fs_1 = require("fs");
const util_1 = require("./util");
function getBotDir() {
    const bot_bir = new Map();
    // 获取机器人目录
    for (let file_name of fs_1.readdirSync('./config/bots')) {
        const bot_name = file_name.split('.')[0];
        bot_bir.set(bot_name, util_1.getProfileSync(bot_name, './config/bots'));
    }
    return bot_bir;
}
exports.getBotDir = getBotDir;
