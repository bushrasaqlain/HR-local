const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const checkRole = require("../middleware/checkRole");
const cartController = require("../controller/cartController");


router.post('/cart/:userId', cartController.addCart)

router.get('/notifications/:userId', cartController.getCart)
////////////////////////////get the cart values as a number///////////
router.get('/count/:userId', cartController.getCartCount);

router.get('/notificationCount/:userId', cartController.getCartCountbyStatus)

router.get('/cart_package/:userId', cartController.getPackagefromCart);
router.get('/cart/:userId', cartController.getCartDetails);
router.get('/inactive-cart', cartController.inactiveCartItems);
router.get('/active-cart', cartController.activeCartItems);
router.get('/expired', cartController.expiredCartItems);
router.delete('/cart/:userId/:cartId', cartController.deleteCart);
router.put('/activate-package/:packageId', authMiddleware, checkRole("db_admin"), cartController.updateCart)
module.exports = router;