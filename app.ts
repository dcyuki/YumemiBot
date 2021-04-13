import { createClient } from "oicq";

class Yumemi {
    public admin:number;
    public master:number;
    public uin: number;
    private pwd: string;

    constructor(admin:number, master:number, uin: number, pwd: string) {
        this.admin = admin;
        this.master = master;
        this.uin = uin;
        this.pwd = pwd;
    }

    public login():any{
        const bot = createClient(this.uin, {
              log_level: "debug", //日志级别设置为debug
              platform: 4, //登录设备选择为ipad
        });

        //监听并输入滑动验证码ticket(同一地点只需验证一次)
        bot.on("system.login.slider", () => {
            process.stdin.once("data", (input:any) => {
              bot.sliderLogin(input);
           });
        });
   
        //监听设备锁验证(同一设备只需验证一次)
        bot.on("system.login.device", () => {
            bot.logger.info("验证完成后敲击Enter继续..");
            process.stdin.once("data", () => {
            bot.login();
            });
       });
        
        bot.login(this.pwd)
        return bot;
    }
}

const logo = `--------------------------------------------------------------------------------------------
                                                                             _         
      \\    / _  | |  _  _  ._ _   _    _|_  _    \\_/    ._ _   _  ._ _  o   |_)  _ _|_ 
       \\/\\/ (/_ | | (_ (_) | | | (/_    |_ (_)    | |_| | | | (/_ | | | |   |_) (_) |_ 
                                                                                  
--------------------------------------------------------------------------------------------`;
console.log(logo);

const yumemi = new Yumemi();
const bot = yumemi.login();

bot.on("message", (data) => console.log(data));
// const uin = 437402067;
// const bot = createClient(uin);

// bot.logger.mark(`Package Version: ${version} (Released on ${released})`);
// bot.logger.mark(`View Changelogs：${changelogs}`);
// bot.logger.mark(`----------`);


// 监听并输入滑动验证码 ticket
// bot.on("system.login.slider", () => {
//        process.stdin.once("data", (input: any): void => {
//               bot.sliderLogin(input);
//        });
// });

// // 监听设备锁验证
// bot.on("system.login.device", () => {
//        bot.logger.info("手机扫码完成后按下 Enter 继续...");
//        process.stdin.once("data", () => {
//               bot.login();
//        });
// });