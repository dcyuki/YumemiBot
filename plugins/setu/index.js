const fs = require('fs');
const axios = require('axios');
const { getConfig, getDir, scheduleJob } = require(`${__yumemi}/utils/util`);

class Setu {
  static url = null;
  static key = null;
  static max = 20;
  static lsp = new Map();
  static path = `${__yumemi}/data/images/setu`;

  constructor(ctx) {
    const { group_id, user_id, raw_message } = ctx;

    this.group_id = group_id;
    this.user_id = user_id;
    this.raw_message = raw_message;
  }

  static reload() {
    getDir('setu')
      .then(data => {
        const { r17: { length: r17_length }, r18: { length: r18_length } } = data;

        if (r17_length > Setu.max && r18_length > Setu.max) return bot.logger.info(`当前本地涩图 r17 有 ${r17_length} 张，r18 有 ${r18_length} 张，数量充足，无需补充`);

        for (let i = 0; i < 2; i++) {
          if (eval(`r${17 + i}_length`) > Setu.max) continue;

          axios.get(`${Setu.url}?apikey=${Setu.key}&r18=${i}&num=10&size1200=true`)
            .then(res => {
              const { data } = res.data;

              bot.logger.mark(`开始补充 r${17 + i} 涩图`);

              for (let j = 0; j < data.length; j++) {
                axios({
                  method: 'get',
                  url: data[j].url,
                  responseType: 'stream'
                })
                  .then(res => {
                    // pid 与 title 之间使用 @ 符分割，title 若出现 /\.[]? 则替换为 -
                    res.data.pipe(fs.createWriteStream(`${Setu.path}/r${17 + i}/${data[j].pid}@${data[j].title.replace(/(\/|\\|\.|\[|\]|\?)/g, '-')}${data[j].url.slice(-4)}`))

                    // 此处只是 http 请求发送完毕，并非全部下载完毕
                    if (i === 1 && j === data.length - 1) bot.logger.mark(`https 请求发送完毕`);
                  })
                  .catch(err => {
                    bot.logger.error(err.message);
                  })
              }
            })
            .catch(err => {
              bot.logger.error(err.message);
            });
        }

        bot.logger.info(`r17 :${r17_length} ，r18 ${r18_length} ， ${r17_length < Setu.max ? 'r17, ' : ''}${r18_length < Setu.max ? 'r18' : ''} 数量不足 ${Setu.max}，开始补充库存...`)
      })
  }

  random() {
    getConfig('groups')
      .then(data => {
        const { [this.group_id]: { plugins: { setu: { r18, flash } } } } = data;
        getDir('setu')
          .then(data => {
            const { [!r18 ? 'r17' : 'r18']: images } = data;

            if (images.length < 2) return bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}] 他喵的图都被你榨干了，一滴都没有了，请等待自动补充`);

            const file = images.pop();
            const [pid, title] = file.split('@');

            // 闪图不可与普通消息一起发出，所以此处分割放送
            bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}]\nid: ${pid}\ntitle: ${title}`);
            bot.sendGroupMsg(this.group_id, `[CQ:image,${flash ? 'type=flash,' : ''}file=${Setu.path}/r${17 + r18}/${file}]`)
              .then(() => {
                Setu.lsp.set(this.user_id, Setu.lsp.get(this.user_id) + 1);

                fs.unlink(`${Setu.path}/r${17 + r18}/${file}`, err => {
                  !err ?
                    bot.logger.mark(`图片发送成功，已删除 ${file}`) :
                    bot.logger.mark(`文件 ${file} 删除失败`)
                    ;
                })
              });

            Setu.reload();
          })
      })
  }

  search() {
    getConfig('groups')
      .then(data => {
        const { [this.group_id]: { plugins: { setu: { r18, flash } } } } = data;
        const keyword = this.raw_message.slice(2, this.raw_message.length - 2);

        axios.get(`${Setu.url}?apikey=${Setu.key}&r18=${Number(r18)}&keyword=${encodeURI(keyword)}&size1200=true`)
          .then(res => {
            const { code, msg, data } = res.data;

            switch (code) {
              case -1:
                bot.sendGroupMsg(this.group_id, `${msg} api 炸了`);
                break;

              case 0:
                const { url, pid, title } = data[0];

                bot.sendGroupMsg(this.group_id, `[CQ:at,qq=${this.user_id}]\npid: ${pid}\ntitle: ${title}\n----------------\n图片下载中，请耐心等待喵`);
                bot.sendGroupMsg(this.group_id, `[CQ:image,${flash ? 'type=flash,' : ''}file=${url},cache=1,timeout=10]`)
                  .then(() => {
                    // 有 bug ，若图片发送失败 lsp 还是会增加
                    // oicq 暂时没有图片发送失败的事件回调，以后在改
                    Setu.lsp.set(this.user_id, Setu.lsp.get(this.user_id) + 1);
                  })
                break;

              case 401:
                bot.sendGroupMsg(this.group_id, `${msg} apikey 不存在或被封禁`);
                break;

              case 403:
                bot.sendGroupMsg(this.group_id, `${msg} 由于不规范的操作而被拒绝调用`);
                break;

              case 404:
                bot.sendGroupMsg(this.group_id, `${msg} 请输入合法的 pixiv tag`);
                break;

              case 429:
                bot.sendGroupMsg(this.group_id, `${msg} api 达到调用额度限制`);
                break;

              default:
                bot.sendGroupMsg(this.group_id, `statusCode: ${code} ，发生意料之外的问题，请联系 yuki`);
                break;
            }
          })
          .catch(err => {
            console.log(err)
          })
      })
  }
}

getConfig('api')
  .then(data => {
    const { lolicon: { url, key } } = data;

    Setu.url = url;
    Setu.key = key;

    Setu.key ?
      Setu.reload() :
      bot.logger.warn(`你没有添加 apikey ，setu 服务将无法使用！`);
  })

// 每天 5 点重置 lsp
scheduleJob('0 0 5 * * ?', () => Setu.lsp.clear());

module.exports = Setu;