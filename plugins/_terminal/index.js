const { checkCommand } = require('../../dist/util');
const { getBots } = require('../../dist/bot');

function shutdown(data) {
  data.reply('正在结束程序...');

  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

function bot(data) {
  const { raw_message, reply } = data;
  const [, action, uin] = raw_message.split(' ');

  switch (action) {
    case 'login':

      break;
    case 'off':

      break;
    case 'on':

      break;
    case 'del':

      break;
    case 'help':
      reply(`机器人相关指令：
--------------------
>bot  ## 查看所有机器人状态
>bot login <uin>  ## 登录新机器人
>bot off <uin>  ## 机器人离线
>bot on <uin>  ## 重新上线
>bot del <uin>  ## 删除机器人
>bot help  ## 查看帮助

※ <uin> 代表 QQ 账号`);
      break;

    default:
      const msg = [];
      const bots = getBots();

      bots.forEach((val, key) => {
        const { nickname, uin, gl, fl } = val;

        msg.push(`${nickname} (${uin})\n  状　态：${val.isOnline() ? '在线' : '离线'}\n  群　聊：${gl.size} 个\n  好　友：${fl.size} 个\n  消息量：${val.getStatus().data?.msg_cnt_per_min} / 分`);
      })

      reply(msg.join('\n'));
      break;
  }
}

function help(data) {
  data.reply('项目重构中，目前仅有以下指令可用：\n>bot\n>bot help')
}

function listener(data) {
  const { cmd } = global.yumemi;
  const { raw_message } = data;

  const action = checkCommand(cmd._terminal, raw_message);

  action && eval(`${action}(data)`);
}

function activate(bot) {
  bot.on("message", listener);
}

module.exports = {
  activate
}