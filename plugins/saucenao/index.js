const { checkCommand,httpsRequest } = require('../../dist/util');

// 获取搜图相关参数
const { url, key } = global.yumemi.api.saucenao;
const db = 999;
/**
 * output_type
 * 0 normal html
 * 1 xml api (not implemented)
 * 2 json api
 */
const output_type = 2;
const testmode = 1;
const numres = 3;

// 最低精准度
// const minSimilarity = 40;
const group_info = new Map();

function search(data) {
  const { user_id, group_id, raw_message, reply } = data;

  !group_info.has(group_id) && group_info.set(group_id, new Set());

  const user_info = group_info.get(group_id);

  switch (true) {
    case raw_message === '搜图' && !key:
      reply(`你没有添加 apikey ，saucenao 服务将无法使用`);
      break;

    case raw_message === '搜图' && !user_info.has(user_id):
      user_info.add(user_id);
      reply(`请发送你要搜索的图片 (●'◡'●)`);
      break;
      case raw_message === '搜图' && user_info.has(user_id):
        reply('图呢？你他喵的倒是发呀 (╯°□°）╯︵ ┻━┻');
        break;

    case raw_message !== '搜图' && user_info.has(user_id):
      user_info.delete(user_id);
      // 获取图片地址
      const image_url = raw_message.match(/(?<=url=).*(?=\])/g);
      // 官方示例
      // https://saucenao.com/search.php?db=999&output_type=2&testmode=1&numres=16&url=http%3A%2F%2Fcom%2Fimages%2Fstatic%2Fbanner.gif
      const params = `?db=${db}&output_type=${output_type}&testmode=${testmode}&numres=${numres}&api_key=${key}&url=${image_url}`;

      httpsRequest.get(url, params)
        .then(data => {
          const search = data.results.map(results => {
            const { header: { similarity, thumbnail, index_name }, data } = results;

            return `平台：${index_name.match(/(?<=: ).*(?=\ -)/g)}
封面：[CQ:image,file=${thumbnail}]
相似：${similarity}%
${data.ext_urls ? `地址：${data.ext_urls.join('\n')}` : `日文：${data.jp_name}\n英语：${data.eng_name}`}\n`;
          });

          reply(search.join('\n'));
        })
        .catch(err => {
          reply(err ? err : `Timeout`);
        })
      break;
  }
}

function listener(data) {
  const { raw_message } = data;
  const action = checkCommand('saucenao', raw_message);

  action && eval(`${action}(data, this)`);
}

function activate(bot) {
  bot.on("message.group", listener);
}

function deactivate(bot) {
  bot.off("message.group", listener);
}

module.exports = {
  activate, deactivate
}