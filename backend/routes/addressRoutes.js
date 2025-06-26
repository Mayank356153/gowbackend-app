// routes/addressRoutes.js
const router      = require('express').Router();
const commonAuth  = require('../middleware/commonAuth');
const ctrl        = require('../controllers/addressController');

router.post   ('/',        commonAuth, ctrl.createAddress);
router.get    ('/',        commonAuth, ctrl.getAddresses);
router.get    ('/:id',     commonAuth, ctrl.getAddressById);
router.put    ('/:id',     commonAuth, ctrl.updateAddress);
router.delete ('/:id',     commonAuth, ctrl.deleteAddress);

module.exports = router;
