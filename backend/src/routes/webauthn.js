const router = require('express').Router();
const auth = require('../middleware/auth');
const ctrl = require('../controllers/webauthnController');

// Registro de dispositivo biométrico (requiere estar autenticado con JWT)
router.post('/register/options', auth, ctrl.registrationOptions);
router.post('/register/verify', auth, ctrl.registrationVerify);

// Login biométrico (sin JWT previo)
router.post('/auth/options', ctrl.authOptions);
router.post('/auth/verify', ctrl.authVerify);

// Gestión de credenciales
router.get('/credentials', auth, ctrl.listCredentials);
router.delete('/credentials/:id', auth, ctrl.deleteCredential);

module.exports = router;
