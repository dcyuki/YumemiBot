module.exports = messageData => {
	const title = messageData.raw_message.substr(4).trim();
	bot.setGroupSpecialTitle(messageData.group_id, messageData.user_id, title);
}