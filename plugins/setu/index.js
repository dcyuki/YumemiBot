const fs = require('fs');
const axios = require('axios');
const { getConfig, getConfigSync, getDir, scheduleJob, netRequest } = require('../../utils/util');

const setu_max = 20;
const lsp = new Map();
const lsp_max = 5;
const setu_path = `${__yumemi}/data/images/setu`;
const { lolicon: { url, key } } = getConfigSync('api');

// 每天 5 点重置 lsp
scheduleJob('0 0 5 * * ?', () => lsp.clear());

// 小黑屋
const smallBlackRoom = ctx => {
  const { group_id, user_id, reply } = ctx;

  if (!key) return reply(`你没有添加 apikey ，setu 服务将无法使用！`);

  // 判断 lsp 要了几张图，超过 lsp_max 张关小黑屋
  !lsp.has(user_id) && lsp.set(user_id, 0);

  if (lsp.get(user_id) >= lsp_max) {
    bot.setGroupBan(group_id, user_id, 60 * 5);
    reply(`[CQ:at,qq=${user_id}] [CQ:image,file=${__yumemi}/data/images/emoji/lsp.jpg]`);
    return true;
  }
}

// 补充涩图
const reload = async () => {
  const setu = await getDir('setu');
  const { r17: { length: r17_length }, r18: { length: r18_length } } = setu;

  if (r17_length > setu_max && r18_length > setu_max) return bot.logger.info(`当前本地涩图 r17 有 ${r17_length} 张，r18 有 ${r18_length} 张，数量充足，无需补充`);

  for (let i = 0; i < 2; i++) {
    if (eval(`r${17 + i}_length`) > setu_max) continue;

    axios.get(`${url}?apikey=${key}&r18=${i}&num=10&size1200=true`)
      .then(res => {
        const { data } = res.data;

        bot.logger.mark(`开始补充 r${17 + i} 涩图`);

        for (let j = 0; j < data.length; j++) {
          const { url, pid, title } = data[j];

          netRequest.get(url)
            .then(res => {
              // pid 与 title 之间使用 @ 符分割，title 若出现 /\.[]? 则替换为 -
              const setu = `${setu_path}/r${17 + i}/${pid}@${title.replace(/(\/|\\|\.|\[|\]|\?)/g, '-')}${url.slice(-4)}`;

              fs.writeFile(setu, res, 'binary', err => {
                err && console.log(err);
              })
            })
            .catch(err => {
              reply(`图片流获取失败，但已为你获取图片地址：\n${url}`);
              bot.logger.error(`${err ? err.message : 'timeout'} ${pid}${title}`);
            })

          // axios({
          //   method: 'get',
          //   url: url,
          //   responseType: 'stream'
          // })
          //   .then(res => {
          //     // pid 与 title 之间使用 @ 符分割，title 若出现 /\.[]? 则替换为 -
          //     const setu = `${setu_path}/r${17 + i}/${pid}@${title.replace(/(\/|\\|\.|\[|\]|\?)/g, '-')}${url.slice(-4)}`;

          //     res.data.pipe(fs.createWriteStream(setu));
          //   })
          //   .catch(err => {
          //     bot.logger.error(`${err.message} ${pid}${title}`);
          //     return;
          //   })
        }
      })
      .catch(err => {
        bot.logger.error(`获取 r${17 + i} 涩图失败`);
        bot.logger.error(err.message);
      });

    // 此处只是 http 请求发送完毕，并非全部下载完毕
    bot.logger.mark(`r${i + 1} https 请求发送完毕`);
  }

  bot.logger.info(`r17 :${r17_length} ，r18 ${r18_length} ， ${r17_length < setu_max ? 'r17, ' : ''}${r18_length < setu_max ? 'r18' : ''} 数量不足 ${setu_max}，开始补充库存...`)
}

const random = async ctx => {
  if (smallBlackRoom(ctx)) return;

  const { group_id, user_id, reply } = ctx;
  // 获取群插件设置
  const { [group_id]: { plugins: { setu: { r18, flash } } } } = await getConfig('groups');
  const { [!r18 ? 'r17' : 'r18']: images } = await getDir('setu');

  if (images.length < 2) return reply(`[CQ:at,qq=${user_id}] 他喵的图都被你榨干了，一滴都没有了，请等待自动补充`);

  const setu = images.pop();
  const [pid, title] = setu.split('@');

  // 闪图不可与普通消息一起发出，所以此处分割放送
  reply(`[CQ:at,qq=${user_id}]\nid: ${pid}\ntitle: ${title}`);
  reply(`[CQ:image,${flash ? 'type=flash,' : ''}file=${setu_path}/r${17 + r18}/${setu}]`)
    .then(() => {
      lsp.set(user_id, lsp.get(user_id) + 1);

      fs.unlink(`${setu_path}/r${17 + r18}/${setu}`, err => {
        !err ?
          bot.logger.mark(`图片发送成功，已删除 ${setu}`) :
          bot.logger.mark(`文件 ${setu} 删除失败`)
          ;
      })
    });

  reload();
}

const search = async ctx => {
  if (smallBlackRoom(ctx)) return;

  const { group_id, user_id, reply, raw_message } = ctx;
  const keyword = raw_message.slice(2, raw_message.length - 2);
  const { [group_id]: { plugins: { setu: { r18, flash } } } } = await getConfig('groups');

  netRequest.get(`${url}?apikey=${key}&r18=${Number(r18)}&keyword=${encodeURI(keyword)}&size1200=true`)
    .then(res => {
      const { code, msg, data } = res;

      switch (code) {
        case -1:
          reply(`${msg} api 炸了`);
          break;

        case 0:
          const { url, pid, title } = data[0];
          // pid 与 title 之间使用 @ 符分割，title 若出现 /\.[]? 则替换为 -
          const setu = `${pid}@${title.replace(/(\/|\\|\.|\[|\]|\?)/g, '-')}${url.slice(-4)}`;

          reply(`[CQ:at,qq=${user_id}]\npid: ${pid}\ntitle: ${title}\n----------------\n图片下载中，请耐心等待喵`);

          // 开始下载图片
          netRequest.get(url)
            .then(res => {
              const img = `${setu_path}/r${17 + r18}/${setu}`

              fs.writeFile(img, res, 'binary', err => {
                err && console.log(err);

                reply(`[CQ:image,${flash ? 'type=flash,' : ''}file=${img}]`);
              })
            })
            .catch(err => {
              reply(`图片流获取失败，但已为你获取图片地址：\n${url}`);
              bot.logger.error(`${err ? err.message : 'timeout'} ${pid}${title}`);
            })

          lsp.set(user_id, lsp.get(user_id) + 1);
          break;

        case 401:
          reply(`${msg} apikey 不存在或被封禁`);
          break;

        case 403:
          reply(`${msg} 由于不规范的操作而被拒绝调用`);
          break;

        case 404:
          reply(`${msg} 请输入合法的 pixiv tag`);
          break;

        case 429:
          reply(`${msg} api 达到调用额度限制`);
          break;

        default:
          reply(`statusCode: ${code} ，发生意料之外的问题，请联系 yuki`);
          break;
      }
    })

  // axios.get(`${url}?apikey=${key}&r18=${Number(r18)}&keyword=${encodeURI(keyword)}&size1200=true`)
  //   .then(async res => {
  //     const { code, msg, data } = res.data;

  //     switch (code) {
  //       case -1:
  //         reply(`${msg} api 炸了`);
  //         break;

  //       case 0:
  //         const { url, pid, title } = data[0];
  //         // pid 与 title 之间使用 @ 符分割，title 若出现 /\.[]? 则替换为 -
  //         const setu = `${pid}@${title.replace(/(\/|\\|\.|\[|\]|\?)/g, '-')}${url.slice(-4)}`;

  //         reply(`[CQ:at,qq=${user_id}]\npid: ${pid}\ntitle: ${title}\n----------------\n图片下载中，请耐心等待喵`);

  //         // 开始下载图片
  //         reply(`[CQ:image,${flash ? 'type=flash,' : ''}file=${url},timeout=10]`);
  //         // const img = `${setu_path}/r${17 + r18}/${setu}`;

  //         // await axios({
  //         //   method: 'get',
  //         //   url: url,
  //         //   responseType: 'stream'
  //         // })
  //         //   .then(res => {
  //         //     res.data.pipe(fs.createWriteStream(img));
  //         //   })
  //         //   .catch(err => {
  //         //     reply(`图片下载失败，已为你获取图片地址：\n${url}`);
  //         //     bot.logger.error(`${err.message} ${pid}${title}`);
  //         //   })

  //         // reply(`[CQ:image,${flash ? 'type=flash,' : ''}file=${img}]`);
  //         lsp.set(user_id, lsp.get(user_id) + 1);
  //         break;

  //       case 401:
  //         reply(`${msg} apikey 不存在或被封禁`);
  //         break;

  //       case 403:
  //         reply(`${msg} 由于不规范的操作而被拒绝调用`);
  //         break;

  //       case 404:
  //         reply(`${msg} 请输入合法的 pixiv tag`);
  //         break;

  //       case 429:
  //         reply(`${msg} api 达到调用额度限制`);
  //         break;

  //       default:
  //         reply(`statusCode: ${code} ，发生意料之外的问题，请联系 yuki`);
  //         break;
  //     }
  //   })
  //   .catch(err => {
  //     reply(err.message);
  //     bot.logger.error(err);
  //   })
}

key ?
  reload() :
  bot.logger.warn(`你没有添加 apikey ，setu 服务将无法使用！`);

module.exports = {
  random, search
}