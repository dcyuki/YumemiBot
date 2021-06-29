"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const node_schedule_1 = require("node-schedule");
const setu_1 = require("../../services/setu");
const class_1 = require("../../utils/class");
const network_1 = require("../../utils/network");
class Setu {
    constructor(bot) {
        const { setu } = yumemi.cmd;
        const { url, key } = yumemi.api.lolicon;
        this.bot = bot;
        this.url = url;
        this.key = key;
        this.cmd = setu;
        this.lsp = new Map();
        this.max_lsp = 5;
        // 每天 5 点重置 lsp
        node_schedule_1.scheduleJob('0 0 5 * * ?', () => this.lsp.clear());
    }
    // 获取色图目录
    getSetuDir() {
        const r17 = [];
        const r18 = [];
        try {
            Object.assign(r17, fs_1.readdirSync(`${__setuname}/r17`));
            Object.assign(r18, fs_1.readdirSync(`${__setuname}/r18`));
        }
        catch (err) {
            yumemi.logger.error(err);
        }
        return { r17, r18 };
    }
    // 关小黑屋
    smallBlackRoom(data) {
        const { bot, key, lsp, max_lsp } = this;
        const { group_id, user_id, reply } = data;
        if (!key) {
            reply(`你没有添加 apikey ，setu 服务将无法使用！`);
            return true;
        }
        // 判断 lsp 要了几张图，超过 max_lsp 张关小黑屋
        !lsp.has(user_id) && lsp.set(user_id, 0);
        if (lsp.get(user_id) >= max_lsp) {
            bot.setGroupBan(group_id, user_id, 60 * 5);
            reply(`[CQ:at,qq=${user_id}] [CQ:image,file=${__emojiname}/lsp.jpg]`);
            return true;
        }
        else {
            return false;
        }
    }
    // 发送随机涩图
    random(data) {
        const { cmd, smallBlackRoom } = this;
        const { raw_message } = data;
        if (!class_1.checkCommand(raw_message, cmd.random) || smallBlackRoom(data))
            return;
        const { bot, lsp, getSetuDir } = this;
        const { logger, groups } = bot;
        const { group_id, user_id, reply } = data;
        const { setu: { r18, flash } } = groups[group_id].settings;
        const { [!r18 ? 'r17' : 'r18']: images } = getSetuDir();
        if (images.length < 2) {
            reply(`[CQ:at,qq=${user_id}] 他喵的图都被你榨干了，一滴都没有了，请等待自动补充`);
            return;
        }
        const setu_file = images.pop();
        const [pid, title] = setu_file.split('&');
        // 闪图不可与普通消息一起发出，所以此处分割放送
        reply(`[CQ:at,qq=${user_id}]\nid: ${pid}\ntitle: ${title}`);
        reply(`[CQ:image,${flash ? 'type=flash,' : ''}file=${__setuname}/r${17 + r18}/${setu_file}]`)
            .then(() => {
            lsp.set(user_id, lsp.get(user_id) + 1);
            fs_1.unlink(`${__setuname}/r${17 + r18}/${setu_file}`, err => {
                logger.mark(!err ? `图片发送成功，已删除 ${setu_file}` : `文件 ${setu_file} 删除失败`);
            });
        });
        setu_1.reload();
    }
    // 发送在线涩图
    search(data) {
        const { cmd, smallBlackRoom } = this;
        const { raw_message } = data;
        if (!class_1.checkCommand(raw_message, cmd.search) || smallBlackRoom(data))
            return;
        const { bot, url, key, lsp, random } = this;
        const { logger, groups } = bot;
        const { group_id, user_id, reply } = data;
        const { setu: { r18, flash } } = groups[group_id].settings;
        const keyword = raw_message.slice(2, raw_message.length - 2);
        const params = `?apikey=${key}&r18=${Number(r18)}&keyword=${encodeURI(keyword)}&size1200=true`;
        network_1.httpsRequest.get(url, params)
            .then((res) => {
            const { code, msg, data } = res;
            switch (code) {
                case -1:
                    reply(`${msg} api 炸了`);
                    break;
                case 0:
                    const { url, pid, title } = data[0];
                    reply(`[CQ:at,qq=${user_id}]\npid: ${pid}\ntitle: ${title}\n----------------\n图片下载中，请耐心等待喵`);
                    // 开始下载图片
                    network_1.httpsRequest.get(url)
                        .then(res => {
                        reply(`[CQ:image,${flash ? 'type=flash,' : ''}file=base64://${res}]`);
                    })
                        .catch(err => {
                        reply(`图片流写入失败，但已为你获取到图片地址：\n${url}`);
                        err && logger.error(err.message);
                    });
                    lsp.set(user_id, lsp.get(user_id) + 1);
                    break;
                case 401:
                    reply(`${msg} apikey 不存在或被封禁`);
                    break;
                case 403:
                    reply(`${msg} 由于不规范的操作而被拒绝调用`);
                    break;
                case 404:
                    reply(`${msg}，将随机发送本地涩图`);
                    random(data);
                    break;
                case 429:
                    reply(`${msg} api 达到调用额度限制`);
                    break;
                default:
                    reply(`statusCode: ${code} ，发生意料之外的问题，请联系 yuki`);
                    break;
            }
        })
            .catch(err => {
            reply(err.message);
            err && logger.error(err.message);
        });
    }
    activate() {
        this.bot.on("message.group", this.random);
        this.bot.on("message.group", this.search);
    }
    deactivate() {
        this.bot.off("message.group", this.random);
        this.bot.off("message.group", this.search);
    }
}
exports.default = Setu;
