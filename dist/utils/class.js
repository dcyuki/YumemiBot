"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPluginList = exports.getLevel = exports.checkGroup = exports.checkCommand = exports.Bot = exports.Battle = exports.Aircon = void 0;
const fs_1 = require("fs");
const oicq_1 = require("oicq");
const util_1 = require("./util");
class Aircon {
    constructor(m2, member) {
        this._enable = false;
        this._temperature = 20;
        this._m2 = m2;
        this._member = member;
    }
    get enable() {
        return this._enable;
    }
    set enable(val) {
        this._enable = val;
    }
    get temperature() {
        return this._temperature;
    }
    set temperature(val) {
        this._temperature = val;
    }
    get m2() {
        return this._m2;
    }
    set m2(val) {
        this._m2 = val;
    }
    get member() {
        return this._member;
    }
    set member(val) {
        this._member = val;
    }
}
exports.Aircon = Aircon;
class Battle {
    constructor(user_id, board, timeout) {
        this.black = user_id;
        this.white = null;
        this._board = board;
        this.offensive = true;
        this.history = [];
        this.timeout = timeout;
    }
    get board() {
        return this._board;
    }
    set board(val) {
        // 换手
        this.offensive = !this.offensive;
        this._board = val;
    }
}
exports.Battle = Battle;
class Bot {
    constructor(master, uin, password, config) {
        this.master = master;
        this.uin = uin;
        this.password = password;
        this.config = config;
    }
    linkStart() {
        const uin = this.uin;
        const bot = oicq_1.createClient(uin, this.config);
        // 监听并输入滑动验证码 ticket
        bot.on("system.login.slider", () => {
            process.stdin.once("data", (input) => {
                bot.sliderLogin(input);
            });
        });
        // 监听设备锁验证
        bot.on("system.login.device", () => {
            bot.logger.info("验证完成后敲击 Enter 继续...");
            process.stdin.once("data", () => {
                bot.login();
            });
        });
        bot.groups = {};
        bot.plugins = new Map();
        bot.login(this.password);
        return bot;
    }
}
exports.Bot = Bot;
/**
 * 校验 cmd
 * @param msg 消息字符串
 * @param reg 正则字符串
 * @returns 返回 Boolean 类型
 */
function checkCommand(msg, reg) {
    return new RegExp(reg).test(msg);
}
exports.checkCommand = checkCommand;
/**
 * level 0 群成员
 * level 1 群成员
 * level 2 群成员
 * level 3 管  理
 * level 4 群  主
 * level 5 主  人
 * level 6 维护组
 */
function getLevel(bot, data) {
    return new Promise((resolve, reject) => {
        const { admin } = yumemi.info;
        const { master } = bot;
        const { user_id, sender: { level, role } } = data;
        resolve(!admin.includes(user_id) ? (!master.includes(user_id) ? (role === 'member' ? (level <= 4 ? (level <= 2 ? 0 : 1) : 2) : (role === 'admin' ? 3 : 4)) : 5) : 6);
    });
}
exports.getLevel = getLevel;
/**
 * 校验 groups
 * @param bot 机器人实例
 * @param all_plugin 机器人已加载的插件
 */
async function checkGroup(bot, all_plugin) {
    let update = false;
    const { uin, logger } = bot;
    const plugins = all_plugin.filter(plugin => /^(?!_).+/.test(plugin));
    const exists = util_1.checkFileSync(`${__yumeminame}/config/groups/${uin}.yml`);
    const params = await util_1.getProfile('params');
    const groups = exists ? await util_1.getProfile(uin.toString(), `${__yumeminame}/config/groups`) : {};
    !exists && fs_1.writeFile(`${__yumeminame}/config/groups/${uin}.yml`, '', err => err && logger.error(err));
    // 获取群信息
    bot.groups = groups;
    bot.gl.forEach((val) => {
        const { group_id, group_name } = val;
        const { [group_id]: group } = groups;
        // 群信息存在并且插件设置键值对相同则 continue
        if (group && Object.keys(group.settings).length === plugins.length)
            return true;
        // 防止重复赋值
        if (!update)
            update = true;
        // 文件存在，校验数据是否更新
        if (group) {
            logger.info(`你可能添加了新的插件，正在更新群聊「${group_name} (${group_id})」配置文件...`);
        }
        else {
            logger.info(`检测到群聊 「${group_name} (${group_id})」 未初始化信息，正在写入数据...`);
            groups[group_id] = {
                name: group_name,
                plugins: [],
                settings: {},
            };
        }
        // 写入插件配置
        const settings = groups[group_id].settings;
        for (const plugin of plugins) {
            // 插件信息若存在将 continue 处理
            if (settings[plugin])
                continue;
            // 插件 lock 默认为 false
            settings[plugin] = {
                lock: false
            };
            // 插件存在多参则写入
            if (params[plugin]) {
                for (const param in params[plugin])
                    settings[plugin][param] = params[plugin][param];
            }
        }
    });
    if (update) {
        await util_1.setProfile(uin.toString(), groups, './config/groups')
            .then(() => {
            logger.mark(`已更新 ${uin}.yml 配置文件 ♪`);
        })
            .catch(err => {
            logger.error(err);
        });
    }
    else {
        logger.mark(`校验完毕，${uin}.yml 无需更新 ♪`);
    }
}
exports.checkGroup = checkGroup;
function getPluginList(bot) {
    const plugins = [];
    for (const plugin of Object.keys(bot.plugins)) {
        /^(?!_).+/.test(plugin) && plugins.push(plugin);
    }
    return plugins;
}
exports.getPluginList = getPluginList;
