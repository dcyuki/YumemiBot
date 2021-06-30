import { join } from "path"
import { createHash } from "crypto"
import { Client, createClient } from 'oicq';
import { writeFileSync, readFileSync } from "fs"

import { getBotDir } from './config';

const bots: Map<string, Client> = new Map();

function linkStart(): void {

  getBotDir().forEach((val, key) => {
    const { qq: { uin, masters }, config } = val;
    const bot = createClient(uin, config);

    bot.masters = masters;
    bots.set(key, bot);
    bot.logger.mark(`正在登录账号 ${key} (${uin})...`);

    bot.on("system.login.slider", function () {
      bot.logger.mark("取ticket教程：https://github.com/takayama-lily/oicq/wiki/01.滑动验证码和设备锁");

      process.stdout.write("ticket: ");
      process.stdin.once("data", this.sliderLogin.bind(this));
    });

    bot.on("system.login.device", function () {
      bot.logger.info("验证完成后敲击 Enter 继续...");

      process.stdin.once("data", () => this.login());
    });

    bot.on("system.login.error", function (data) {
      if (data.message.includes("密码错误")) {
        inputPassword();
      } else {
        this.terminate();
        console.log("当前账号无法登录，按 Enter 键退出程序...")
        process.stdin.once("data", process.exit)
      }
    });

    function inputPassword() {
      bot.logger.mark("首次登录请输入密码：");

      process.stdin.once("data", (data) => {
        const input = String(data).trim();

        if (!input.length) return inputPassword();

        const password = createHash("md5").update(input).digest();

        writeFileSync(join(bot.dir, "password"), password, { mode: 0o600 });
        bot.login(password);
      })
    }

    try {
      bot.login(readFileSync(join(bot.dir, "password")));
    } catch {
      inputPassword();
    }
  });
}

function getBots(): Map<string, Client> {
  return bots;
}

export {
  linkStart, getBots
}