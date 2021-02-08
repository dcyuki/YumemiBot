module.exports = (messageData, option) => {
	const update = () => {
		// 拆分 update 语句字段
		let exist = false;
		const { master } = tools.getProfile('botSettings');
		const pluginSettings = tools.getProfile('pluginSettings');
		let [, , plugin, setting, param] = messageData.raw_message.split(' ');
		
		if (param === 'true' || param === 'false') param = param === 'true';
		for (let item in pluginSettings) {
			if (item === plugin) {
				exist = true;
				break;
			}
		}

		if (exist) {
			if (messageData.sender.role != 'member' || messageData.user_id === master) {
				// 写入参数
				let oldData = JSON.stringify(pluginSettings[plugin][messageData.group_id]);
				pluginSettings[plugin][messageData.group_id][setting] = param;
				tools.setProfile('pluginSettings', pluginSettings) ?
					bot.sendGroupMsg(messageData.group_id, '修改前：\n' + plugin + ':' + oldData + '\n修改后：\n' + plugin + ':' + JSON.stringify(pluginSettings[plugin][messageData.group_id])) :
					bot.sendGroupMsg(messageData.group_id, '修改失败')
					;
			} else {
				bot.setGroupBan(messageData.group_id, messageData.user_id, 60 * 5);
				bot.sendGroupMsg(messageData.group_id, '你的权限不足，请不要乱碰奇怪的开关');
			}
		} else {
			bot.sendGroupMsg(messageData.group_id, '不存在“' + plugin + '”模块');
		}
	}

	const state = () => {
		const fs = require('fs');
		const { uptime, totalmem, freemem, version, release } = require('os')
		const systemInfo = `系统环境: ${version()} ${release()}
运行时长: ${(uptime / 60 / 60).toFixed(1)} H
使用空间: ${((totalmem - freemem) / 1024 / 1024 / 1024).toFixed(2)} GB / ${(totalmem / 1024 / 1024 / 1024).toFixed(2)} GB
色图库存: r17 / ${fs.readdirSync(__yumemi + '/data/images/setu/r17').length} & r18 / ${fs.readdirSync(__yumemi + '/data/images/setu/r18').length}`;
		bot.sendGroupMsg(messageData.group_id, systemInfo);
	}

	// 退出当前群聊
	const quit = () => {
		messageData.sender.role != 'member' || messageData.user_id == master ?
			bot.setGroupLeave(messageData.group_id) :
			(
				bot.sendGroupMsg(messageData.group_id, '这是一个很危险的开关，你知道么'),
				bot.setGroupBan(messageData.group_id, messageData.user_id)
			)
			;
	}
	// 语法糖
	const sugar = () => {
		let option = messageData.raw_message.slice(0, 2);
		const param = messageData.raw_message.slice(2).trim();
		switch (option) {
			case '开启':
			case '启用':
			case '打开':
				option = true;
				break;
			case '关闭':
			case '禁用':
				option = false;
				break;
		}
		switch (param) {
			case 'flash':
				messageData.raw_message = `> update setu flash ${option}`;
				break;
			default:
				messageData.raw_message = `> update ${param} enable ${option}`;
				break;
		}
		update();
	}
	eval(`${option}()`);
}