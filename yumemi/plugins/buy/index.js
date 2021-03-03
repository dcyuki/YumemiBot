const fs = require('fs');

tools.scheduleJob('0 0 0/6 * * ?', () => {
	const { groups } = tools.getProfile('botSettings');
	const buyPath = `${__yumemi}/data/images/buy/`;
	const imgs = fs.readdirSync(buyPath);
	// 重新获取时钟配置
	const img = imgs[Math.floor(Math.random() * imgs.length)]
	const { buy } = tools.getProfile('pluginSettings');
	// 判断开启服务的群
	for (const group_id in groups) {
		if (!groups[group_id].enable) continue;
		if (buy[group_id].enable) bot.sendGroupMsg(group_id, `[CQ:image,file=${buyPath}${img}]`);
	}
});