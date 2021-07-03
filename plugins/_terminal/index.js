const { spawn } = require('child_process');
const { getBots } = require('../../dist/bot');
const { checkCommand } = require('../../dist/util');
const bot = require('./bot');

function restart(data) {
  data.reply('正在重启程序...');

  setTimeout(() => {
    process.on('exit', () => {
      spawn(process.argv.shift(), process.argv, {
        cwd: process.cwd(),
        detached: true,
        stdio: 'inherit'
      });
    });

    process.exit(0);
  }, 1000);
}

function shutdown(data) {
  data.reply('正在结束程序...');

  getBots().forEach((bot) => {
    bot.logout();
  });
  
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

function help(data) {
  data.reply('项目重构中，目前仅有最基础的账号登录管理可用，发送 >bot help 查看')
}

function listener(data) {
  const { raw_message } = data;
  const action = checkCommand('_terminal', raw_message);

  action && eval(`${action}(data, this)`);
}

function activate(bot) {
  bot.on("message", listener);
}

module.exports = {
  activate
}