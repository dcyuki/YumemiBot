"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const log4js_1 = require("log4js");
const fs_1 = require("fs");
const util_1 = require("./utils/util");
const bot_1 = require("./utils/bot");
// 插件列表与服务列表
// const all_serve: string[] = [];
const all_plugin = [];
console.log('※ develop 分支保持着周更甚至日更，不熟悉源码甚至项目都跑步起来，除非有特殊需求，否则不建议 clone 本分支!\n');
(() => {
    const wellcome = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 

--------------------------------------------------------------------------------------------`;
    console.log('\x1B[36m%s\x1B[0m', wellcome);
    global.__yumeminame = path_1.resolve(__dirname, '..');
    global.bots = new Map();
    global.path = {
        config: `${__yumeminame}/config`,
        groups: `${__yumeminame}/config/groups`,
        plugins: `${__dirname}/plugins`,
        services: `${__dirname}/services`,
        setu: `${__yumeminame}/data/images/setu`
    };
    global.yumemi = {
        api: util_1.getProfileSync('api'),
        cmd: util_1.getProfileSync('cmd'),
        info: util_1.getProfileSync('info'),
        logger: log4js_1.getLogger('[yumemi bot log]'),
    };
    yumemi.logger.level = 'all';
    yumemi.logger.mark('----------');
    yumemi.logger.mark(`Package Version: ${yumemi.info.version} (Released on ${yumemi.info.released})`);
    yumemi.logger.mark(`View Changelogs：${yumemi.info.changelogs}`);
    yumemi.logger.mark('----------');
    try {
        const plugins = fs_1.readdirSync(path.plugins);
        const services = fs_1.readdirSync(path.services);
        // 启用服务
        for (const service of services) {
            require(`./services/${service}`);
        }
        ;
        for (const plugin of plugins) {
            // 目录是否存在 index 文件
            try {
                fs_1.accessSync(`${path.plugins}/${plugin}/index.js`);
                // /^(?!_).+/.test(plugin) ? all_plugin.push(plugin) : all_serve.push(plugin);
                // /^(?!_).+/.test(plugin) && all_plugin.push(plugin);
                all_plugin.push(plugin);
            }
            catch (err) {
                yumemi.logger.warn(`${plugin} 目录下不存在 index 文件`);
            }
        }
    }
    catch (err) {
        throw err;
    }
})();
const bot_dir = fs_1.readdirSync('./config/bots');
for (let bot_url of bot_dir) {
    const [bot_name,] = bot_url.split('.');
    const { qq, plugins, config } = util_1.getProfileSync(bot_name, './config/bots');
    const { master, uin, password } = qq;
    const bot = new bot_1.Bot(master, uin, password, config).linkStart();
    bot.master = master;
    bots.set(bot_name, bot);
    bot.on("system.online", () => {
        bot.logger.mark(`正在校验配置文件...`);
        // 校验群文件
        bot_1.checkGroup(bot, all_plugin);
        // 加载插件
        for (const plugin_name of plugins.length ? plugins : all_plugin) {
            const plugin = require(`${path.plugins}/${plugin_name}`);
            plugin.activate(bot);
            bot.plugins.set(plugin_name, plugin);
        }
    });
}
