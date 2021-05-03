const fs = require('fs');
const { getConfigSync } = require(`${__yumemi}/utils/util`);
const Koa = require('koa');
const router = require('koa-router')();
const bodyParser = require('koa-bodyparser');

const app = new Koa();

app.use(async (ctx, next) => {
  console.log(`Process ${ctx.method} ${ctx.url}`);

  await next();
});

router.get('/', async (ctx, next) => {
  ctx.body = '<h1>Index</h1>';
});

router.post('/api/:api', async (ctx, next) => {
  const api = ctx.params.api;
  ctx.body = `${api}`;
});

app.use(router.routes());
app.use(bodyParser());

const { web: { port, domain } } = getConfigSync('bot');

// 在端口监听
app.listen(port);

bot.logger.mark(`web serve started at ${domain ? domain : 'localhost'}:${port}`);