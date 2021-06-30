import { load, dump } from 'js-yaml';
import { readFile, readFileSync } from 'fs';

/**
 * async 获取配置文件
 * @param file_name 文件名（不包括后缀）
 * @param file_folder 文件夹路径
 * @returns 返回 Promise 对象
 */
function getProfile(file_name: string, file_folder: string = './config') {
  return new Promise((resolve, reject) => {
    const file_path: string = `${file_folder}/${file_name}.yml`;

    readFile(file_path, 'utf-8', (err, data) => {
      !err ? resolve(load(data) || {}) : reject(err);
    });
  });
}

/**
 * await 获取配置文件
 * @param file_name 文件名（不包括后缀）
 * @param file_folder 文件夹路径
 * @returns 返回 JSON 对象
 */
function getProfileSync(file_name: string, file_folder: string = './config') {
  const file_path: string = `${file_folder}/${file_name}.yml`;

  try {
    return load(readFileSync(file_path, 'utf-8')) || {};
  } catch (err) {
    throw err;
  }
}

function checkCommand(cmd: { [fnc: string]: string }, msg: string): string {
  let action = '';

  for (const fnc in cmd) {
    if (new RegExp(cmd[fnc]).test(msg)) {
      action = fnc;
      break;
    }
  }

  return action;
}

export {
  getProfile, getProfileSync, checkCommand
}