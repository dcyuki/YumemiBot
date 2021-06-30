import { Client } from 'oicq';
import { promises, accessSync } from 'fs';

const plugins: Map<string, IPlugin> = new Map();

interface IPlugin {
  readonly bot: Client;
  readonly cmd?: any;
  readonly activate: (bot: Client) => void;
  readonly deactivate: (bot: Client) => void;
}

(async () => {
  for (const plugin of await promises.readdir('./plugins')) {
    // 目录是否存在 index 文件
    try {
      accessSync(`./plugins/${plugin}/index.js`);
      
      plugins.set(plugin, require(`../plugins/${plugin}`));
    } catch (err) {
      yumemi.logger.warn(`${plugin} 目录下不存在 index 文件`);
    }
  }
})()

function getPlugins(): Map<string, IPlugin> {
  return plugins;
}

export {
  getPlugins
}