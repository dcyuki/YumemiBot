import { Client } from 'oicq';
import { resolve } from 'path';
import { getLogger } from 'log4js';
import { accessSync, readdirSync } from 'fs';

import { getProfileSync } from './utils/util';
import { Bot, checkGroup } from './utils/bot';
import { IInfo, IBot, IPlugins } from './types/bot';

// 插件列表与服务列表
// const all_serve: string[] = [];
const all_plugin: string[] = [];

console.log('※ develop 分支保持着周更甚至日更，不熟悉源码甚至项目都跑步起来，除非有特殊需求，否则不建议 clone 本分支!\n');
(() => {
  const wellcome: string = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 

--------------------------------------------------------------------------------------------`;
  console.log('\x1B[36m%s\x1B[0m', wellcome);

  global.__yumeminame = resolve(__dirname, '..');
  global.bots = new Map();
  global.path = {
    config: `${__yumeminame}/config`,
    groups: `${__yumeminame}/config/groups`,
    plugins: `${__dirname}/plugins`,
    services: `${__dirname}/services`,
    setu: `${__yumeminame}/data/images/setu`
  }
  global.yumemi = {
    api: getProfileSync('api'),
    cmd: getProfileSync('cmd'),
    info: <IInfo>getProfileSync('info'),
    logger: getLogger('[yumemi bot log]'),
  }

  yumemi.logger.level = 'all';
  yumemi.logger.mark('----------');
  yumemi.logger.mark(`Package Version: ${yumemi.info.version} (Released on ${yumemi.info.released})`);
  yumemi.logger.mark(`View Changelogs：${yumemi.info.changelogs}`);
  yumemi.logger.mark('----------');

  try {
    const plugins: string[] = readdirSync(path.plugins);
    const services: string[] = readdirSync(path.services);

    // 启用服务
    for (const service of services) {
      require(`./services/${service}`);
    };

    for (const plugin of plugins) {
      // 目录是否存在 index 文件
      try {
        accessSync(`${path.plugins}/${plugin}/index.js`);
        // /^(?!_).+/.test(plugin) ? all_plugin.push(plugin) : all_serve.push(plugin);
        // /^(?!_).+/.test(plugin) && all_plugin.push(plugin);
        all_plugin.push(plugin);
      } catch (err) {
        yumemi.logger.warn(`${plugin} 目录下不存在 index 文件`);
      }
    }
  } catch (err) {
    throw err;
  }
})();

const bot_dir: string[] = readdirSync('./config/bots');

for (let bot_url of bot_dir) {
  const [bot_name,] = bot_url.split('.');
  const { qq, plugins, config } = <IBot>getProfileSync(bot_name, './config/bots');
  const { master, uin, password } = qq;

  const bot: Client = new Bot(master, uin, password, config).linkStart();

  bot.master = master;
  bots.set(bot_name, bot);

  bot.on("system.online", () => {
    bot.logger.mark(`正在校验配置文件...`);
    // 校验群文件
    checkGroup(bot, all_plugin);

    // 加载插件
    for (const plugin_name of plugins.length ? plugins : all_plugin) {
      const plugin: IPlugins = require(`${path.plugins}/${plugin_name}`);

      plugin.activate(bot);
      bot.plugins.set(plugin_name, plugin);
    }
  });
}