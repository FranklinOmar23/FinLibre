const router = require('express').Router();
const { getAll, create, update, remove, pagarCuota, abonar } = require('../controllers/debtController');
const auth = require('../middleware/auth');

router.get('/', auth, getAll);
router.post('/', auth, create);
router.put('/:id', auth, update);
router.delete('/:id', auth, remove);
router.post('/:id/pagar', auth, pagarCuota);
router.post('/:id/abonar', auth, abonar);

module.exports = router;
