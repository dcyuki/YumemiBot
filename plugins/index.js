/**
 * 获取所有插件
 */
const plugins = {}

utils.getDir('plugins')
  .then(data => {
    bot.logger.mark(`----------`);
    bot.logger.mark('Login success ! 初始化模块...');

    for (const plugin of data) {
      // 插件是否存在 index.js 文件
      utils.exists(`${__yumemi}/plugins/${plugin}/index.js`)
        .then(() => {
          plugins[plugin] = require(`${__yumemi}/plugins/${plugin}/index`);
          // bot.logger.mark(`plugin loaded: ${plugin}`);
        })
        .catch(() => {
          bot.logger.warn(`${plugin} 模块未加载`);
        })
        .finally(() => {
          bot.logger.mark(`加载了${Object.keys(plugins).length}个插件`);
        })
    }

    bot.logger.mark(`初始化完毕，开始监听群聊。`);
    bot.logger.mark(`----------`);
  })
  .catch(err => {
    bot.logger.error(err);
  })

module.plugins = plugins