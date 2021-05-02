import { createClient } from 'oicq';
import { getConfig, getConfigSync, getDir, exists, updateGroup } from './utils/util';

class Bot {
  private account: number;
  private password: string;
  private config: object;

  constructor(account: number, password: string, config?: object) {
    this.account = account;
    this.password = password;
    this.config = config;
  }

  // 账号登录
  linkStart(): any {
    const bot: any = createClient(this.account, this.config);

    // 监听并输入滑动验证码 ticket
    bot.on("system.login.slider", (): void => {
      process.stdin.once("data", (input: string): void => {
        bot.sliderLogin(input);
      });
    });

    // 监听设备锁验证
    bot.on("system.login.device", (): void => {
      bot.logger.info("验证完成后敲击Enter继续..");
      process.stdin.once("data", (): void => {
        bot.login();
      });
    });

    bot.login(this.password);

    return bot;
  }
}

class Context {
  readonly message_id: string;
  readonly group_id: number;
  readonly group_name: string;
  readonly raw_message: string;
  readonly user_id: number;
  readonly nickname: string;
  readonly card: string;
  readonly level: number;

  constructor(message_id: string, group_id: number, group_name: string, raw_message: string, user_id: number, nickname: string, card: string, level: number) {
    this.message_id = message_id;
    this.group_id = group_id;
    this.group_name = group_name;
    this.raw_message = raw_message;
    this.user_id = user_id;
    this.nickname = nickname;
    this.card = card;
    this.level = level;
  }
}

const logo: string = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 

--------------------------------------------------------------------------------------------`;
console.log(logo);

const { qq: { admin, master, account, password }, info: { version, released, changelogs }, config } = getConfigSync('bot');

// 创建 bot 实例
(globalThis as any).bot = new Bot(account, password, config).linkStart();

const { bot } = <any>globalThis;

// 打印 bot 信息
bot.logger.mark(`----------`);
bot.logger.mark(`Package Version: ${version} (Released on ${released})`);
bot.logger.mark(`View Changelogs：${changelogs}`);
bot.logger.mark(`----------`);

bot.on('message.group', (data: any): void => {
  console.log(data)
});