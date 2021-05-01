import { createClient } from 'oicq';
import { getConfigSync } from './utils/util';

class Bot {
  account: number;
  password: string;
  config: object;

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
  message_id: string;
  group_id: number;
  group_name: string;
  raw_message: string;
  user_id: number;
  nickname: string;
  card: string;
  level: number;

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

const bot = new Set();

const logo: string = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 

--------------------------------------------------------------------------------------------`;
console.log(logo);

const { qq: { admin, master, account: { user_id, password } } } = getConfigSync('bot');

if (user_id.length !== password.length) {
  throw new Error('检测到你配置的账号数量与密码数量不匹配，已终止运行...')
}

// 创建 bot 实例
for (let i = 0; i < user_id.length; i++) {
  bot.add(new Bot(user_id[i], password[i]).linkStart());
}

bot.forEach((bot: any) => {
  // 监听群消息
  bot.on('message.group', data => {
    // 创建 ctx 实例
    const { message_id, group_id, group_name, raw_message, sender: { user_id, nickname, card, level: lv, role } } = data;
    const level = admin.indexOf(user_id) === -1 ? (master.indexOf(user_id) === -1 ? (role === 'member' ? (lv < 5 ? (lv < 3 ? 0 : 1) : 2) : (role === 'admin' ? 3 : 4)) : 5) : 6;
    const ctx = new Context(message_id, group_id, group_name, raw_message, user_id, nickname, card, level)
    console.log(ctx)
    // 校验 group.yml
    // updateGroup(ctx.group_id, ctx.group_name);
  })
})