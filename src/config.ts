import { readdirSync } from 'fs';

import { getProfileSync } from './util';
import { IBot } from './types/yumemi';

function getBotDir(): Map<string, IBot> {
  const bot_bir: Map<string, IBot> = new Map();

  // 获取机器人目录
  for (let file_name of readdirSync('./config/bots')) {
    const bot_name: string = file_name.split('.')[0];

    bot_bir.set(bot_name, getProfileSync(bot_name, './config/bots') as IBot);
  }

  return bot_bir
}

export {
  getBotDir
}