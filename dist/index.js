"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log4js_1 = require("log4js");
const bot_1 = require("./bot");
const util_1 = require("./util");
const plugin_1 = require("./plugin");
function sendMasterMsg(bot, message) {
    const { masters } = bot;
    for (let master of masters)
        bot.sendPrivateMsg(master, "通知：\n　　" + message);
}
function onOnline() {
    sendMasterMsg(this, `${this.nickname} (${this.uin})已重新登录`);
}
function onOffline(data) {
    sendMasterMsg(this, `${this.nickname} (${this.uin})已离线，原因为：${data.message}`);
}
async function bindMasterEvents(bot) {
    bot.removeAllListeners("system.login.slider");
    bot.removeAllListeners("system.login.device");
    bot.removeAllListeners("system.login.error");
    bot.on("system.online", onOnline);
    bot.on("system.offline", onOffline);
    const plugins = await plugin_1.getPlugins();
    let n = 0;
    plugins.forEach((val, key) => {
        val.activate(bot);
        ++n;
    });
    setTimeout(() => {
        sendMasterMsg(bot, `启动成功，启用了 ${n} 个插件，发送 >help 可以查询相关指令`);
    }, 3000);
}
(() => {
    // Acsii Font Name: Mini: http://patorjk.com/software/taag/
    const wellcome = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 

--------------------------------------------------------------------------------------------`;
    console.log('\x1B[36m%s\x1B[0m', wellcome);
    global.yumemi = {
        bots: new Map(),
        api: util_1.getProfileSync('api'),
        cmd: util_1.getProfileSync('cmd'),
        info: util_1.getProfileSync('info'),
        logger: log4js_1.getLogger('[yumemi bot log]'),
    };
    const { version, released, changelogs } = yumemi.info;
    yumemi.logger.level = 'all';
    yumemi.logger.mark('----------');
    yumemi.logger.mark(`Package Version: ${version} (Released on ${released})`);
    yumemi.logger.mark(`View Changelogs：${changelogs}`);
    yumemi.logger.mark('----------');
    process.title = 'yumemi';
    bot_1.linkStart();
    bot_1.getBots().forEach((bot, bot_name) => {
        bot.on("system.online", () => {
            bindMasterEvents(bot);
        });
    });
})();
