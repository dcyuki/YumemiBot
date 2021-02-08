const fs = require('fs');

let lsp = {};
let reloading = false;
const options = {};
const { setu: api } = tools.getProfile('api');
const setuPath = `${__yumemi}/data/images/setu/`;

if (api.version === 'acgmx') {
  options.timeout = 10000;
  options.headers = { token: api.acgmx.apikey, referer: 'https://www.acgmx.com' };
}

// 每天 5 点重置 lsp
tools.scheduleJob('0 0 5 * * ?', () => lsp = {});

module.exports = (messageData, option) => {
  // lsp 数据记录
  const lspAdd = () => {
    lsp[messageData.user_id] !== undefined ?
      lsp[messageData.user_id]++ :
      lsp[messageData.user_id] = 1
      ;
  }
  // 本地涩图数量
  let r18, CQImage;
  const r17Setus = fs.readdirSync(`${setuPath}r17`);
  const r18Setus = fs.readdirSync(`${setuPath}r18`);
  if (messageData) {
    const { setu: { [messageData.group_id]: { flash: flash, r18: r17 } } } = tools.getProfile('pluginSettings');
    r18 = r17
    flash ?
      CQImage = `CQ:image,type=flash,file=` :
      CQImage = `CQ:image,file=`
      ;
  }
  /*
    随机发送涩图，lolicon 可正常选择 r18
    acgmx r18 概率极大，暂没做 r18 文件分类
    acgmx 色图存储在 imagees/setu/ 根目录下
   */
  const random = () => {
    const setu = eval(`r${17 + r18}Setus[Math.floor(Math.random() * r${17 + 0}Setus.length)]`);
    if (setu) {
      bot.sendGroupMsg(messageData.group_id, `id: ${setu.split('-')[0]}\ntitle: ${setu.split('-')[1].split('.')[0]}`);
      bot.sendGroupMsg(messageData.group_id, `[${CQImage}${setuPath}r${17 + r18}/${setu}]`).then(() => {
        fs.unlink(`${setuPath}r${17 + r18}/${setu}`, err => {
          err ?
            bot.logger.error(err.message) :
            (
              bot.logger.debug(`图片发送成功，已删除 ${setu}`),
              lspAdd()
            )
            ;
        });
      });
    } else {
      bot.sendGroupMsg(messageData.group_id, `他喵的图都被你榨干了，一滴都没有了，请等待自动补充`);
    }
    reload()
  }

  // 搜索发送涩图
  const search = async () => {
    let search;
    const keyword = messageData.raw_message.slice(2, messageData.raw_message.length - 2);

    switch (api.version) {
      case 'acgmx':
        search = await tools.getRequest(`${api.acgmx.apiurl}search?q=${keyword}&offset=1`, options);
        const { image_urls: { large: url }, id: pid, title } = search.illusts[Math.floor(Math.random() * search.illusts.length)];
        // pixiv 国内被墙，若是国内服务器无法正常访问，lolicon 可正常发送
        bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}]\npid: ${pid}\ntitle: ${title}\n----------------\nurl: ${url}`);
        // bot.sendGroupMsg(messageData.group_id, `[CQ:image,type=flash,file=${url}]`);
        break;
      case 'lolicon':
        search = await tools.getRequest(`${api.lolicon.apiurl}?apikey=${api.lolicon.apikey}&r18=${r18}&keyword=${keyword}&size1200=true`);
        if (search) {
          if (search.code === 404) {
            bot.sendGroupMsg(messageData.group_id, `${search.msg} 请输入合法的 pixiv tag`);
          } else {
            const { url, pid, title } = search.data[0];
            bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}]\npid: ${pid}\ntitle: ${title}\n----------------\n图片下载中，请耐心等待喵`);
            bot.sendGroupMsg(messageData.group_id, `[${CQImage}${url},timeout=10]`);
            lspAdd();
          }
        } else {
          bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] http 请求发生意外错误，请联系 yuki`);
        }
        break;
    }
  }

  // 补充涩图
  const reload = async () => {
    // 防止重复调用
    if (!reloading) {
      const setuMax = 50;
      const setuNum = 20;

      if (r17Setus.length < setuMax || r18Setus.length < setuMax) {
        reloading = true;
        bot.logger.info(`当前本地涩图 r17 有 ${r17Setus.length} 张，r18 有 ${r18Setus.length} 张，数量不足 ${setuMax}，开始补充库存...`);
        switch (api.version) {
          case 'acgmx':
            // 库存不足 setuMax 张则一次补 setuNum 张
            for (let i = 0; i < setuNum; i++) {
              const rawData = await tools.getRequest(`${api.acgmx.apiurl}setu`, options);
              const img = await tools.getRequest(rawData.data.large, options);
              try {
                fs.writeFileSync(`${setuPath}${rawData.data.illust}-${rawData.data.title}${rawData.data.large.slice(-4)}`, img, 'binary');
                bot.logger.info('已补充一张涩图')
              } catch (e) {
                bot.logger.warn(e.message);
              }
            }
            bot.logger.info('涩图补充完毕...');
            break;
          case 'lolicon':
            // 库存不足 setuMax 张则一次补 setuNum 张
            const rawData = {};
            for (let i = 0; i <= 1; i++) {
              if (eval(`r${17 + i}Setus`).length < setuMax) {
                const setuData = await tools.getRequest(`${api.lolicon.apiurl}?apikey=${api.lolicon.apikey}&r18=${i}&num=${setuNum}&size1200=true`);
                if (setuData) eval(`rawData.r${17 + i} = setuData.data`);
              }
            }
            for (const key in rawData) {
              for (let i = 0; i < rawData[key].length; i++) {
                const img = await tools.getRequest(rawData[key][i].url);
                if (img !== null) {
                  try {
                    fs.writeFileSync(`${setuPath}${key}/${rawData[key][i].pid}-${rawData[key][i].title}${rawData[key][i].url.slice(-4)}`, img, 'binary');
                    bot.logger.info(`已补充一张 ${key} 涩图`);
                  } catch (e) {
                    bot.logger.warn(e.message);
                  }
                }
              }
              bot.logger.info(`${key} 涩图补充完毕...`);
            }
            break;
        }

        reloading = false;
      } else {
        bot.logger.info(`当前本地涩图 r17 有 ${r17Setus.length} 张，r18 有 ${r18Setus.length} 张，数量充足，无需补充`);
      }
    } else {
      bot.logger.info(`涩图正在补充库存...`);
    }
  }

  let exist = false;
  // 校验是否已添加 apikey
  for (const version in api) {
    if (api[version].apikey !== undefined && api[version].apikey.length >= 22) {
      exist = true;
      break;
    }
  }
  if (exist) {
    // 不传参默认 reload
    if (messageData === undefined) {
      reload();
    } else {
      // 判断 lsp 要了几张图
      if (lsp[messageData.user_id] === undefined || lsp[messageData.user_id] < 5) {
        eval(`${option}()`);
      } else {
        bot.setGroupBan(messageData.group_id, messageData.user_id, 60 * 5);
        bot.sendGroupMsg(messageData.group_id, `[CQ:at,qq=${messageData.user_id}] [CQ:image,file=${__yumemi}/data/images/emoji/lsp.jpg]`);
      }
    }
  } else {
    bot.logger.warn(`你没有添加 apikey ，setu 模块将无法使用！`);
  }
}