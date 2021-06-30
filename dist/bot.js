"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBots = exports.linkStart = void 0;
const path_1 = require("path");
const crypto_1 = require("crypto");
const oicq_1 = require("oicq");
const fs_1 = require("fs");
const config_1 = require("./config");
const bots = new Map();
function linkStart() {
    config_1.getBotDir().forEach((val, key) => {
        const { qq: { uin, masters }, config } = val;
        const bot = oicq_1.createClient(uin, config);
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
            }
            else {
                this.terminate();
                console.log("当前账号无法登录，按 Enter 键退出程序...");
                process.stdin.once("data", process.exit);
            }
        });
        function inputPassword() {
            bot.logger.mark("首次登录请输入密码：");
            process.stdin.once("data", (data) => {
                const input = String(data).trim();
                if (!input.length)
                    return inputPassword();
                const password = crypto_1.createHash("md5").update(input).digest();
                fs_1.writeFileSync(path_1.join(bot.dir, "password"), password, { mode: 0o600 });
                bot.login(password);
            });
        }
        try {
            bot.login(fs_1.readFileSync(path_1.join(bot.dir, "password")));
        }
        catch {
            inputPassword();
        }
    });
}
exports.linkStart = linkStart;
function getBots() {
    return bots;
}
exports.getBots = getBots;
