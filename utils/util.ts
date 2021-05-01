import * as fs from 'fs';
import * as yaml from 'js-yaml';

const config_path: string = `./config/`;

/**
 * async 获取配置文件信息
 * 
 * @param {string} file_name 文件名（不包括后缀）
 * @param {string} [file_folder=config_path] 文件夹路径
 */

const getConfig = (file_name: string, file_folder = config_path) => {
  return new Promise((resolve, reject) => {
    const file_path = `${file_folder}${file_name}.yml`;

    fs.readFile(file_path, (err, data) => {
      err ? reject(err) : resolve(yaml.load(data));
    });
  });
}

/**
 * await 获取配置文件信息
 * 
 * @param {string} file_name 文件名（不包括后缀）
 * @param {string} [file_folder=config_path] 文件夹路径
 */
const getConfigSync = (file_name: string, file_folder = config_path) => {
  const file_path = `${file_folder}${file_name}.yml`;

  try {
    return yaml.load(fs.readFileSync(file_path));
  } catch (err) {
    throw err;
  }
}

/**
 * async 写入配置文件
 * 
 * @param {string} file_name - 文件名（不包括后缀）
 * @param {object} data - 文件数据
 * @param {string} [file_folder=config_path] - 文件夹路径
 */
const setConfig = (file_name, data, file_folder = config_path) => {
  fs.writeFile(`${file_folder}${file_name}.yml`, yaml.dump(data), err => {
    if (err) throw err;

    // bot.logger.info(`已更新 ${file_name}.yml 配置文件 ♪`);
  })
}

export { getConfig, getConfigSync }