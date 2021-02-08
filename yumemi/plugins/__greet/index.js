module.exports = data => {
	switch (data.sub_type) {
		// 戳一戳
		case 'poke':
			if (data.user_id === tools.getProfile('botSettings').qq.account) {
				bot.sendGroupMsg(data.group_id, 'kora！别碰我(╬▔皿▔)');
			}
			break;
		// 群员增加
		case 'increase':
			let msg;
			data.user_id !== tools.getProfile('botSettings').qq.account ?
				msg = `欢迎新人 [CQ:at,qq=${data.user_id}] 的加入~\n新人麻烦爆照报三围，希望你不要不识抬举（\n[CQ:image,file=./yumemi/data/images/emoji/miyane.jpg]` :
				msg = `泥豪，这里是只人畜无害的人工智障~\n使用手册请访问：${tools.getProfile('botSettings').info.docs}`
				;
			bot.sendGroupMsg(data.group_id, msg);
			break;
		// 群员减少
		case 'decrease':
			// 判断是否人为操作
			data.operator_id !== data.user_id ?
				bot.sendGroupMsg(data.group_id, '感谢 ' + `[CQ:at,qq=${data.operator_id}] 赠送给 ${data.member.nickname}（${data.member.user_id}） 的一张飞机票~\n[CQ:image,file=./yumemi/data/images/emoji/mizu.jpg]`) :
				bot.sendGroupMsg(data.group_id, `成员 ${data.member.nickname}（${data.member.user_id}） 已退出群聊\n[CQ:image,file=./yumemi/data/images/emoji/chi.jpg]`)
				;
			break;
		// 头衔变更
		case 'title':
			bot.sendGroupMsg(data.group_id, '[CQ:at,qq=' + data.user_id + '] 头衔已变更');
			break;
		// 防撤回
		// case 'recall':

		// 	break;
		// 管理变更
		// case 'admin':

		// 	break;
		// 小黑屋
		// case 'ban':

		// 	break;
	}

}