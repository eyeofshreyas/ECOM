const express = require('express');
const router = express.Router();
const {
    getStripeConfig,
    getRazorpayConfig,
    createStripeIntent,
    createRazorpayOrder,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/config/stripe', protect, getStripeConfig);
router.get('/config/razorpay', protect, getRazorpayConfig);
router.post('/stripe', protect, createStripeIntent);
router.post('/razorpay', protect, createRazorpayOrder);

module.exports = router;
