const express = require('express');
const router = express.Router();
const {
    getStripeConfig,
    getRazorpayConfig,
    createStripeIntent,
    createRazorpayOrder,
    stripeWebhook,
    razorpayWebhook,
} = require('../controllers/paymentController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/config/stripe', protect, getStripeConfig);
router.get('/config/razorpay', protect, getRazorpayConfig);
router.post('/stripe', protect, createStripeIntent);
router.post('/razorpay', protect, createRazorpayOrder);
router.post('/stripe/webhook', stripeWebhook);
router.post('/razorpay/webhook', razorpayWebhook);

module.exports = router;
