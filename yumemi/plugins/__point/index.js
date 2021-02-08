module.exports = (messageData, option) => {
	const login = () => {
		const { info: { index: index } } = tools.getProfile('botSettings');
		bot.sendGroupMsg(messageData.group_id, `登录请访问：${index}\n该模块刚时装，功能较少，bug较多，仅供测试`);
	}

	const help = () => {
		const { info: { docs: docs } } = tools.getProfile('botSettings');
		bot.sendGroupMsg(messageData.group_id, '使用手册请访问：' + docs);
	}

	const lists = () => {
		const setting = tools.getProfile('pluginSettings')
		let pluginLists = '当前群服务列表：\n';

		for (plugin in setting) {
			setting[plugin][messageData.group_id].enable ? pluginLists += (`|○| ${plugin}\n`) : pluginLists += (`|△| ${plugin}\n`);
		}

		pluginLists += '如要查看详细参数可输入 params';
		bot.sendGroupMsg(messageData.group_id, pluginLists);
	}

	const params = () => {
		let pluginInfos = '当前群服务设置：\n';
		const setting = tools.getProfile('pluginSettings')

		for (plugin in setting) {
			pluginInfos += `${plugin}: { `;
			for (param in setting[plugin][messageData.group_id]) {
				pluginInfos += `${param}: ${setting[plugin][messageData.group_id][param]}, `;
			}

			pluginInfos += ` }\n`;
		}

		pluginInfos += `请不要随意修改参数，除非你知道自己在做什么`;
		bot.sendGroupMsg(messageData.group_id, pluginInfos);
	}

	const rank = () => {
		const rankPath = `${__yumemi}/data/images/rank/`;
		let version = messageData.raw_message.slice(0, 1);
		switch (version) {
			case 'b':
			case '国':
				version = 'bl';
				break;
			case '台':
				version = 'tw';
				break;
			case '日':
				version = 'jp';
				break;
		}
		let img = ``;
		for (let i = 1; i <= 3; i++) {
			img +=`\n[CQ:image,file=${rankPath}${version}rank_${i}.png]`;
		}
		bot.sendGroupMsg(messageData.group_id, `※ 表格仅供参考，升r有风险，强化需谨慎${img}`);
	}

	const version = () => {
		const { info: { version: version } } = tools.getProfile('botSettings');
		bot.sendGroupMsg(messageData.group_id, version);
	}

	eval(`${option}()`);
}