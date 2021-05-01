export default (): void => {
  globalThis.bot.forEach(bot => {
    console.log(bot)
    bot.on('message.group', data => {
      console.log(data)
    })
  })
}