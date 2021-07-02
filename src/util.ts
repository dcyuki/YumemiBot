import { load, dump } from 'js-yaml';
import { readFile, readFileSync, unlink, writeFile, promises, rmdir } from 'fs';
import { Profile } from './types/yumemi';

/**
 * 更新配置文件
 * @param file_name 文件名（不包括后缀）
 * @param data 文件 yaml 对象
 * @param file_folder 文件夹路径
 * @returns Promise 对象
 */
function setProfile(file_name: string, data: Profile, file_folder: string = './config'): Promise<void | Error> {
  return new Promise((resolve, reject) => {
    const file_path: string = `${file_folder}/${file_name}.yml`;

    writeFile(file_path, dump(data), err => {
      !err ? resolve() : reject(err);
    });
  });
}

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

/**
 * 删除文件
 * @param file_url 文件路径
 * @returns Promise 对象
 */
function deleteFile(file_url: string) {
  return new Promise((resolve, reject) => {
    unlink(file_url, (err) => {
      !err ? resolve(null) : reject(err);
    })
  })
}

/**
 * 删除文件夹
 * @param folder_url 文件夹路径
 * @returns Promise 对象
 */
function deleteFolder(folder_url: string) {
  return new Promise(async (resolve, reject) => {
    const files = await promises.readdir(folder_url);

    for (const file of files) {
      await promises.unlink(`${folder_url}/${file}`);
    }

    // 删除文件夹
    rmdir(folder_url, (err) => {
      !err ? resolve(null) : reject(err);
    })
  })
}

export {
  setProfile, getProfile, getProfileSync,
  deleteFile, deleteFolder,
  checkCommand
}