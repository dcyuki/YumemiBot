global.__yumemi = `${__dirname}/yumemi`;
global.tools = require(`${__yumemi}/tools`);

const logo = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 
                                                                                  
--------------------------------------------------------------------------------------------`;
console.log(logo);
const { createClient } = require('oicq');
const { qq, config, info } = tools.getProfile('botSettings');

global.bot = createClient(qq.account, config);

const linkStart = async () => {
  //处理滑动验证码事件
  bot.on("system.login.slider", () => {
    process.stdin.once("data", input => {
      bot.sliderLogin(input);
    });
  });

  //处理图片验证码事件
  bot.on("system.login.captcha", () => {
    process.stdin.once("data", input => {
      bot.captchaLogin(input);
    });
  });

  //处理设备锁验证事件
  bot.on("system.login.device", () => {
    bot.logger.info("手机扫码完成后按下 Enter 继续...");
    process.stdin.once("data", () => {
      bot.login();
    });
  });

  bot.login(qq.password);
}

linkStart().then(() => {
  const { version, released, changelogs } = info;
  bot.logger.info(`----------`);
  bot.logger.info(`Package Version: ${ version } (Released on ${ released })`);
  bot.logger.info(`View Changelogs：${ changelogs }`);
  bot.logger.info(`----------`);
  require(`${__yumemi}/serve`);
});