const router = require('express').Router();
const { getAll, create, update, remove, abonar } = require('../controllers/goalController');
const auth = require('../middleware/auth');

router.get('/',              auth, getAll);
router.post('/',             auth, create);
router.put('/:id',           auth, update);
router.delete('/:id',        auth, remove);
router.post('/:id/abonar',   auth, abonar);

module.exports = router;
