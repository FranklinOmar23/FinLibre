const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/pushController');

router.get('/vapid-key', ctrl.getVapidKey);
router.post('/subscribe', auth, ctrl.subscribe);
router.post('/unsubscribe', auth, ctrl.unsubscribe);
router.post('/test', auth, ctrl.testPush);

module.exports = router;
