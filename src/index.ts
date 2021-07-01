import { Client, ConfBot, OfflineEventData, PrivateMessageEventData } from 'oicq';
import { getLogger } from 'log4js';

import { getBots, linkStart } from './bot';
import { getProfileSync } from './util';
import { IApi, ICmd, IInfo } from './types/yumemi';
import { getPlugins } from './plugin';

function sendMasterMsg(bot: Client, message: string) {
  const { masters } = bot;

  for (let master of masters) bot.sendPrivateMsg(master, "通知：\n　　" + message);
}

function onOnline(this: Client) {
  sendMasterMsg(this, `${this.nickname} (${this.uin})已重新登录`);
}

function onOffline(this: Client, data: OfflineEventData) {
  sendMasterMsg(this, `${this.nickname} (${this.uin})已离线，原因为：${data.message}`);
}

async function bindMasterEvents(bot: Client) {
  bot.removeAllListeners("system.login.slider");
  bot.removeAllListeners("system.login.device");
  bot.removeAllListeners("system.login.error");
  bot.on("system.online", onOnline);
  bot.on("system.offline", onOffline);

  const plugins = await getPlugins();
  let n = 0
  plugins.forEach((val, key) => {
    val.activate(bot);
    ++n
  })
  setTimeout(() => {
    sendMasterMsg(bot, `启动成功，启用了 ${n} 个插件，发送 >help 可以查询相关指令`);
  }, 3000);
}

(() => {
  // Acsii Font Name: Mini: http://patorjk.com/software/taag/
  const wellcome: string = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 

--------------------------------------------------------------------------------------------`;
  console.log('\x1B[36m%s\x1B[0m', wellcome);

  global.yumemi = {
    bots: new Map(),
    api: getProfileSync('api') as IApi,
    cmd: getProfileSync('cmd') as ICmd,
    info: getProfileSync('info') as IInfo,
    logger: getLogger('[yumemi bot log]'),
  }

  const { version, released, changelogs } = yumemi.info;

  yumemi.logger.level = 'all';
  yumemi.logger.mark('----------');
  yumemi.logger.mark(`Package Version: ${version} (Released on ${released})`);
  yumemi.logger.mark(`View Changelogs：${changelogs}`);
  yumemi.logger.mark('----------');
  process.title = 'yumemi';

  linkStart();

  getBots().forEach((bot, bot_name) => {
    bot.on("system.online", () => {
      bindMasterEvents(bot);
    });
  });
})();