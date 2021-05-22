const querystring = require('querystring');
const { httpRequest } = require('../../utils/util');
const battle_url = `http://localhost/api/word`;

const answer = ctx => {
  const { group_id, raw_message, reply } = ctx;
  const params = querystring.stringify({
    params: [group_id]
  });

  httpRequest(`${battle_url}/get_word`, 'POST', params)
    .then(res => {
      for (const word of res) {
        const reg = new RegExp(word.question);

        if (!reg.test(raw_message)) continue;

        reply(word.answer);
      }
    })
    .catch(err => {
      bot.logger.error(err);
      reply(err);
    })
}

const question = ctx => {
  const { group_id, raw_message, reply } = ctx;
  const [question, answer] = raw_message.match(/(?<=有人(问|问你|(对|跟)你说)).+(?=你就?(回?答|说|告诉他|告诉她))|(?<=你就?(回?答|说|告诉他|告诉她)).+/g);
  const regular = /(\^|\$)/.test(question) ? question : `^${question}$`;
  const params = querystring.stringify({
    params: [group_id, regular, answer]
  });

  httpRequest(`${battle_url}/set_word`, 'POST', params)
    .then(() => {
      reply('好的，我记住了');
    })
    .catch(err => {
      bot.logger.error(err);
      reply(err);
    })
}

module.exports = { answer, question }