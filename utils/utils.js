const fs = require('fs');
const yaml = require('js-yaml');
const { resolve } = require('path');

const config_path = `${__yumemi}/config/`;

/**
 * 获取配置文件信息（异步）
 * 
 * @param {string} file_name - 文件名（不包括后缀）
 * @param {string} [file_folder=config_path] - 文件夹路径
 */
const getConfig = (file_name, file_folder = config_path) => {
  return new Promise((resolve, reject) => {
    const file_path = `${file_folder}${file_name}.yml`;

    fs.readFile(file_path, (err, data) => {
      err ? reject(err) : resolve(yaml.load(data));
    });
  });
}

/**
 * 获取配置文件信息（同步）
 * 
 * @param {string} file_name - 文件名（不包括后缀）
 * @param {string} [file_folder=config_path] - 文件夹路径
 */
const getConfigSync = (file_name, file_folder = config_path) => {
  const file_path = `${file_folder}${file_name}.yml`;

  try {
    return yaml.load(fs.readFileSync(file_path));
  } catch (err) {
    throw err;
  }
}

const setConfig = (file_name, data, file_folder = config_path) => {
  fs.writeFile(`${file_folder}${file_name}.yml`, yaml.dump(data), err => {
    if (err) throw err;

    bot.logger.info(`已更新 ${file_name}.yml 配置文件 ♪`);
  })
}

/**
 * 获取文件目录
 * 
 * @param {string} folder - 文件夹名
 */
const getDir = (folder) => {
  return new Promise((resolve, reject) => {
    let dir = null;

    // 这里必须是 Sync ，因为返回的数据类型不固定，待优化
    switch (folder) {
      case 'plugins':
        // 移除 plugins/index.js
        dir = fs.readdirSync(`${__yumemi}/plugins`).filter(plugin => /^[a-z]+$/.test(plugin));
        break;

      case 'buy':
        dir = fs.readdirSync(`${__yumemi}/data/images/buy`);
        break;

      case 'setu':
        dir = {
          r17: fs.readdirSync(`${__yumemi}/data/images/setu/r17`),
          r18: fs.readdirSync(`${__yumemi}/data/images/setu/r18`),
        };
        break;

      default:
        reject(new Error(`${folder} is not a parameter`))
        break;
    }

    resolve(dir);
  })
}

/**
 * 获取文件目录
 * 
 * @param {string} folder - 文件夹名
 */
const getDirSync = (folder) => {
  let dir = null;

  switch (folder) {
    case 'plugins':
      // 移除 plugins/index.js
      dir = fs.readdirSync(`${__yumemi}/plugins`).filter(plugin => /^[a-z]+$/.test(plugin));
      break;

    case 'buy':
      dir = fs.readdirSync(`${__yumemi}/data/images/buy`);
      break;

    case 'setu':
      dir = {
        r17: fs.readdirSync(`${__yumemi}/data/images/setu/r17`),
        r18: fs.readdirSync(`${__yumemi}/data/images/setu/r18`),
      };
      break;

    default:
      reject(new Error(`${folder} is not a parameter`))
      break;
  }

  return dir;
}

/**
 * 检测文件是否存在
 * 
 * @param {string} path - 文件路径
 */
const exists = path => {
  return new Promise((resolve, reject) => {
    fs.access(path, err => {
      !err ? resolve() : reject(err);
    });
  });
}


const updateGroup = (group_id, group_name) => {
  const plugins = getDirSync('plugins');
  const params = getConfigSync('params');
  const groups = getConfigSync('groups') || {};

  if (!groups[group_id] || Object.keys(groups[group_id].plugins).length < plugins.length) {
    if (groups[group_id]) {
      bot.logger.info(`你可能添加了新的插件，正在更新群聊「${group_name} (${group_id})」配置文件...`);
    } else {
      bot.logger.info(`检测到群聊 「${group_name} (${group_id})」 未初始化信息，正在写入数据...`);

      groups[group_id] = {};
      groups[group_id].name = group_name;
      groups[group_id].enable = false;
      groups[group_id].plugins = {};
    }

    for (const plugin of plugins) {
      // 插件若是存在将 continue 处理
      if (groups[group_id].plugins[plugin]) continue;

      groups[group_id].plugins[plugin] = {};
      // 插件 enable 默认为 true
      groups[group_id].plugins[plugin].enable = true;

      // 插件存在多参则写入
      if (params[plugin]) {
        for (const param in params[plugin]) groups[group_id].plugins[plugin][param] = params[plugin][param];
      }
    }

    setConfig('groups', groups);
  }
}

module.exports = {
  getConfig,
  getConfigSync,
  getDir,
  exists,
  updateGroup,
}