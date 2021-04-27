const say = data=>{
  console.log(data);
  // (data) => data.reply("hello world")
}

const bind = bot => {
  bot.plugins.add(module);
  bot.on('message', data=>{
    say(data)
  });
}

module.exports = {
  bind
}