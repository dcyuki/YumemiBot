"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const log4js_1 = require("log4js");
const fs_1 = require("fs");
const class_1 = require("./utils/class");
const util_1 = require("./utils/util");
const plugin_list = [];
const bot_list = fs_1.readdirSync('./config/bots');
console.log('※ develop 分支保持着周更甚至日更，不熟悉源码甚至项目都跑步起来，除非有特殊需求，否则不建议 clone 本分支!\n');
(() => {
    // Acsii Font Name: Mini: http://patorjk.com/software/taag/
    const wellcome = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 

--------------------------------------------------------------------------------------------`;
    console.log('\x1B[36m%s\x1B[0m', wellcome);
    global.__yumeminame = path_1.resolve(__dirname, '..');
    global.__configname = `${__yumeminame}/config`;
    global.__groupsname = `${__configname}/groups`;
    global.__imagesname = `${__yumeminame}/data/images`;
    global.__setuname = `${__imagesname}/setu`;
    global.__rankname = `${__imagesname}/rank`;
    global.__emojiname = `${__imagesname}/emoji`;
    global.__pluginsname = `${__dirname}/plugins`;
    global.__servicesname = `${__dirname}/services`;
    global.__dynamicname = `${__yumeminame}/data/dynamic`;
    global.__dbname = `${__yumeminame}/data/db`;
    global.yumemi = {
        bots: new Map(),
        api: util_1.getProfileSync('api'),
        cmd: util_1.getProfileSync('cmd'),
        info: util_1.getProfileSync('info'),
        logger: log4js_1.getLogger('[yumemi bot log]'),
    };
    const { logger, info } = yumemi;
    const { version, released, changelogs } = info;
    logger.level = 'all';
    logger.mark('----------');
    logger.mark(`Package Version: ${version} (Released on ${released})`);
    logger.mark(`View Changelogs：${changelogs}`);
    logger.mark('----------');
    try {
        const plugins = fs_1.readdirSync(__pluginsname);
        const services = fs_1.readdirSync(__servicesname);
        // 启用服务
        for (const service of services) {
            require(`${__servicesname}/${service}`);
        }
        ;
        for (const plugin of plugins) {
            // 目录是否存在 index 文件
            const plugin_url = `${plugin}/index.js`;
            try {
                fs_1.accessSync(`${__pluginsname}/${plugin_url}`);
                plugin_list.push(plugin);
            }
            catch (err) {
                logger.warn(`${plugin} 目录下不存在 index 文件`);
            }
        }
    }
    catch (err) {
        throw err;
    }
})();
for (let file_name of bot_list) {
    const [bot_name,] = file_name.split('.');
    const { bots } = yumemi;
    const { qq, plugins, config } = util_1.getProfileSync(bot_name, './config/bots');
    const { master, uin, password } = qq;
    const bot = new class_1.Bot(master, uin, password, config).linkStart();
    bots.set(bot_name, bot);
    bot.master = master;
    bot.on("system.online", () => {
        bot.setMaxListeners(0);
        bot.logger.mark(`正在校验配置文件...`);
        // 校验群文件
        class_1.checkGroup(bot, plugin_list);
        // 加载插件
        for (const plugin_name of plugins.length ? plugins : plugin_list) {
            const plugin = require(`${__pluginsname}/${plugin_name}`);
            plugin.activate(bot);
            bot.plugins.set(plugin_name, plugin);
        }
    });
}
