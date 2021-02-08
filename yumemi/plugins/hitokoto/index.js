tools.scheduleJob('0 0 0 * * ?', async () => {
	const { groups } = tools.getProfile('botSettings');
	const { hitokoto: setting } = tools.getProfile('pluginSettings');
	const { hitokoto: { apiurl: apiurl } } = tools.getProfile('api');
	const rawData = await tools.getRequest(apiurl);
	// 判断开启服务的群
	for (const group_id in groups) {
		if (groups[group_id].enable) {
			if (setting[group_id].enable) {
				bot.sendGroupMsg(group_id, `${rawData.hitokoto}\n\t\t\t—— ${rawData.from}`);
			}
		}
	}
});