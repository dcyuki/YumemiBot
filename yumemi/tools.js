const fs = require('fs');
const https = require('https');
const yaml = require('js-yaml');
const schedule = require('node-schedule');
const sqlite3 = require('sqlite3').verbose();

// sql 执行
const sqlite = sql => {
  const db = new sqlite3.Database('./yumemi/data/db/yumemi.db');
  // 拆分 sql 语句
  switch (sql.slice(0, 6)) {
    case 'SELECT':
      return new Promise(resolve => {
        db.serialize(() => {
          db.all(sql, (err, rows) => {
            !err ?
              (
                db.close(), resolve(rows)
              ) :
              bot.logger.error(err)
              ;
          });
        });
      });
    case 'UPDATE':
    case 'INSERT':
      return new Promise(resolve => {
        db.serialize(() => {
          db.run(sql, err => {
            !err ?
              (
                db.close(), resolve(true)
              ) :
              bot.logger.error(err)
              ;
          });
        });
      });
  }
}

// 获取配置文件信息，解析 path 目录下的 file ，若不传 filePath 默认 config 目录
const getProfile = (fileName, filePath = `${__dirname}/config`) => {
  const url = `${filePath}/${fileName}.yml`;
  try {
    return yaml.load(fs.readFileSync(url, 'utf8'));
  } catch (err) {
    bot.logger.error(err.message);
    return undefined;
  }
}

// 返回 https get 请求结果
// 不会吧不会吧？都1202年了，不会还有 api 是 http 协议吧？
const getRequest = async (url, options = { timeout: 10000 }) => {
  return new Promise(resolve => {
    https.get(url, options, res => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      let error;
      // 任何 2xx 状态码都表示成功的响应
      if (Math.floor(statusCode / 100) !== 2) {
        error = new Error('请求失败\n' + `状态码: ${statusCode}`);
      }

      // bot.logger.debug(`接收到的数据类型是 ${contentType}`)
      switch (contentType) {
        case 'image/jpeg':
        case 'image/png':
        case 'image/jpg':
          res.setEncoding('binary');
          break;
        default:
          res.setEncoding('utf8');
          //   error = new Error('无效的 content-type.\n' + `接收到的是 ${contentType}`);
          break;
      }

      if (error) {
        bot.logger.error(`${error.message} ，已断开后续请求...`);
        // 释放内存
        res.resume();
        resolve(null);
      }

      let rawData = '';
      res.on('data', chunk => { rawData += chunk; });
      res.on('end', () => {
        if (/^application\/json/.test(contentType)) {
          rawData = JSON.parse(rawData);
        }

        resolve(rawData);
      });
    }).on('error', (e) => {
      bot.logger.error(`出现错误: ${e.message}`);
      resolve(null);
    }).on('timeout', () => {
      bot.logger.error('当前请求超时，已断开');
      resolve(null);
    });
  });
}

// 创建定时任务
const scheduleJob = schedule.scheduleJob;

// 获取 message 的命令头
const getOption = message => {
  const option = [];
  const command = getProfile('command');
  for (const plugin in command) {
    if (command[plugin].length !== undefined) {
      const reg = new RegExp(command[plugin]);
      if (reg.test(message)) {
        option.push(plugin);
        return option;
      }
    } else {
      for (const module in command[plugin]) {
        const reg = new RegExp(command[plugin][module]);
        if (reg.test(message)) {
          option.push(plugin);
          option.push(module);
          return option;
        }
      }
    }
  }
}

// 加载插件
const loadPlugins = async () => {
  return new Promise(resolve => {
    const plugins = {};
    const pluginsPath = fs.readdirSync(__yumemi + '/plugins/');
    for (const plugin of pluginsPath) {
      fs.existsSync(`${__yumemi}/plugins/${plugin}/index.js`) ?
        (
          plugins[plugin] = require(`./plugins/${plugin}/index.js`)
          // console.log(`成功加载 ${plugin} 模块`)
        ) :
        bot.logger.warn(`${plugin} 模块未加载`)
        ;
    }

    resolve(plugins);
  });
}

const setProfile = (fileName, newData, filePath = `${__dirname}/config`) => {
  const url = `${filePath}/${fileName}.yml`;
  try {
    fs.writeFileSync(url, yaml.dump(newData));
    bot.logger.info(`已更新 ${fileName}.yml 配置文件 ♪`);
    return true;
  } catch (error) {
    bot.logger.error(error.message);
    return false;
  }
};

// 校验 pluginSettings.yml 文件
const checkProfile = (fileName, filePath = `${__dirname}/config/`) => {
  const url = `${filePath}${fileName}.yml`;
  const allPlugins = fs.readdirSync(__yumemi + '/plugins');
  const publicPlugins = [];
  for (const plugin of allPlugins) {
    if (/^[a-z]+$/.test(plugin)) publicPlugins.push(plugin);
  }

  // 检测 pluginSettings.yml 是否存在
  fs.stat(url, error => {
    // 不存在则创建
    if (error) {
      bot.logger.info(`检测到配置文件不存在，正在初始化 ${fileName}.yml 文件...`);
      updatePluginSettings(publicPlugins, true);
    } else {
      bot.logger.info(`检测到 ${fileName}.yml 文件已存在，正在校验文件完整性...`);
      const pluginSettings = getProfile('pluginSettings');
      // 若添加新插件则重新写入
      if (Object.keys(pluginSettings).length < publicPlugins.length) {
        bot.logger.info(`你可能添加了新的插件，正在更新 ${fileName}.yml 配置文件 ♪`);
        // 有一个小 bug ，如果添加新的插件则所有配置全部初始化
        updatePluginSettings(publicPlugins)
      } else if (Object.keys(pluginSettings).length === publicPlugins.length) {
        bot.logger.info(`文件 ${fileName}.yml 校验完成 ♪`);
      } else {
        bot.logger.error('你不对劲');
      }
    }
  });
}

// 生成 pluginSettings.yml
const updatePluginSettings = (publicPlugins, create = false) => {
  const pluginSettings = create ? {} : getProfile('pluginSettings');
  const { groups } = getProfile('botSettings');
  const pluginParams = getProfile('pluginParams');

  // 遍历插件
  for (const plugin of publicPlugins) {
    // 插件不存在则创建对象
    if (!pluginSettings[plugin]) pluginSettings[plugin] = {};
    // 遍历群号
    for (const group_id in groups) {
      // 群聊信息存在则跳过循环
      if (pluginSettings[plugin][group_id]) continue;
      const groupSettings = {};
      // 判断插件是否存在多参
      if (pluginParams[plugin]) {
        // 遍历配置文件初始化数据
        for (const param in pluginParams[plugin]) {
          // 默认数字 0 下标为默认值
          groupSettings[param] = pluginParams[plugin][param][0];
        }
      }

      // 未指定 enable 默认 true
      if (groupSettings.enable === undefined) groupSettings.enable = true;
      pluginSettings[plugin][group_id] = groupSettings;
    }
  }

  setProfile(`pluginSettings`, pluginSettings);
}

const checkGroup = messageData => {
  const { groups } = getProfile('botSettings');
  // 判断该群是否监听
  if (groups === null || groups[messageData.group_id] === undefined) {
    // 若不存在则录入该群信息，默认 false
    const botSettings = getProfile('botSettings');
    if (groups === null) botSettings.groups = {};
    bot.logger.info(`检测到群聊 「${messageData.group_name} (${messageData.group_id})」 未初始化信息，正在写入数据...`)
    botSettings.groups[messageData.group_id] = {};
    botSettings.groups[messageData.group_id].name = messageData.group_name;
    botSettings.groups[messageData.group_id].enable = false;
    // 录入成功后更新 pluginSettings.yml 配置文件
    if (setProfile('botSettings', botSettings)) {
      // 有一个小 bug ，如果添加新的群则所有配置全部初始化
      const allPlugins = fs.readdirSync(__yumemi + '/plugins');
      const publicPlugins = [];
      for (const plugin of allPlugins) {
        if (/^[a-z]+$/.test(plugin)) publicPlugins.push(plugin);
      }
      updatePluginSettings(publicPlugins);
    }
  } else if (groups[messageData.group_id].enable) {
    return true;
  }
}
module.exports = {
  getProfile,
  getOption,
  checkProfile,
  checkGroup,
  loadPlugins,
  setProfile,
  scheduleJob,
  getRequest,
  sqlite,
}