const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');

let sql;
const port = 80;
const app = express();
const { webhook } = tools.getProfile('api');

app.set('views', __dirname + '/views');
app.engine('html', require('express-art-template'));
app.use('/public', express.static(__dirname + '/public'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

app.use(session({
	secret: 'keyboard cat',
	resave: false,
	saveUninitialized: true,
	cookie: {
		// 默认12小时后销毁
		maxAge: 60000 * 60 * 12
	}
}));

app.get('/', (req, res) => {
	req.session.userInfo ? res.redirect('/admin') : res.render('login.html');
});

// 退出登录
app.post('/', (req, res) => {
	req.session.destroy();
	res.redirect('/');
});

app.post('/login', async (req, res) => {
	const loginInfo = req.body;
	sql = 'SELECT * FROM user WHERE qq = "' + loginInfo.account + '"';
	let user = await tools.sqlite(sql);
	user = user[0];
	let status = '0';

	if (user != undefined && user.password != null) {
		if (user.password != loginInfo.password) {
			status = '-1';
		} else {
			status = '1';
			// 会战7天免登录
			if (loginInfo.remember) req.session.cookie.maxAge = 60000 * 60 * 24 * 7;
			req.session.userInfo = {};
			req.session.userInfo.qq = loginInfo.account;
			req.session.userInfo.nickname = user.nickname;
		}
	}

	res.send(status);
});

app.get('/404', (req, res) => {
	res.render('404.html');
});

app.get('/guild', async (req, res) => {
	if (req.session.userInfo) {
		let group_id = req.query.group_id;
		// let name = req.session.userInfo.nickname;

		let guildInfo = {
			group_id
		};

		sql = 'SELECT * FROM guild LEFT JOIN fight ON guild.group_id = fight.group_id WHERE guild.group_id = ' + group_id;
		const fightInfo = await tools.sqlite(sql);
		const userInfo = req.session.userInfo;

		res.render('guild.html', {
			guildInfo,
			fightInfo,
			userInfo
		});
	} else {
		res.redirect('/');
	}
});

// 获取数据
app.get('/admin', async (req, res) => {
	if (req.session.userInfo) {
		// 查在不在群
		sql = 'SELECT guild.group_id, guild.name, member.state FROM guild LEFT JOIN member ON member.group_id = guild.group_id WHERE qq = ' + req.session.userInfo.qq;
		const groupInfo = await tools.sqlite(sql);
		const hours = {
			05: '凌晨好',
			08: '早上好',
			11: '上午好',
			13: '中午好',
			16: '下午好',
			18: '傍晚好',
			21: '晚上好',
			23: '深夜好'
		};
		for (const item in hours) {
			if (new Date().getHours() <= item) {
				req.session.userInfo.greet = hours[item];
				break;
			}
		}

		const userInfo = req.session.userInfo;
		res.render('index.html', {
			groupInfo,
			userInfo
		});
	} else {
		res.redirect('/');
	}
});

app.get('/setting', (req, res) => {
	if (req.session.userInfo) {
		const userInfo = req.session.userInfo
		res.render('setting.html', {
			userInfo
		});
	} else {
		res.redirect('/');
	}
});

app.post('/password', async (req, res) => {
	const pwdInfo = req.body;
	sql = 'SELECT password FROM user WHERE qq = "' + req.session.userInfo.qq + '" AND password = "' + pwdInfo.oldPassword + '"';
	const user = await tools.sqlite(sql);
	let status = '0';
	if (user.length >= 1) {
		sql = 'UPDATE user SET password = "' + pwdInfo.newPassword + '"';
		if (await tools.sqlite(sql)) {
			status = '1'
		} else {
			status = '-1'
		}
	};
	res.send(status);
});

app.post(webhook.path, (req, res) => {
	// 若需自动更新在可在此处编写对应脚本
	const key = 'x-github-event';
	const event = req.headers[key];

	switch (event) {
		case 'push':
			res.sendStatus(200);
			const payload = req.body;
			const commit = payload.head_commit.message.split('\n\n');

			const pushInfo = `Received a push event for ${payload.repository.name} to ${payload.ref}
Summary: ${commit[0]}
Description: 
	${commit[1].replace(/\n/, '\n\t')}
Author: ${payload.head_commit.committer.name}
Updated: ${payload.head_commit.timestamp}
Link: ${payload.head_commit.url}`;

			const { groups } = tools.getProfile('botSettings');
			const { web: webhook } = tools.getProfile('pluginSettings');
			for (let group_id in groups) {
				if (groups[group_id]) {
					// webhook 是否开启
					if (webhook[group_id].enable) {
						bot.sendGroupMsg(group_id, pushInfo);
					}
				}
			}
			break;
	}
});

app.listen(port, () => {
	bot.logger.info('Web serve is running...');
});