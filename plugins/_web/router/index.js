const Router = require('koa-router');
const router = new Router();
const api = require('./api');
const error = require('./error');

router.use('/api', api.routes());
router.use('/error', error.routes());

module.exports = router;