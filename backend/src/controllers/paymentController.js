const Stripe = require('stripe');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const Order = require('../models/Order');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// @desc    Get Stripe Publishable Key
// @route   GET /api/config/stripe
// @access  Private
const getStripeConfig = (req, res) => {
    res.send(process.env.STRIPE_PUBLISHABLE_KEY);
};

// @desc    Get Razorpay Key ID
// @route   GET /api/config/razorpay
// @access  Private
const getRazorpayConfig = (req, res) => {
    res.send(process.env.RAZORPAY_KEY_ID);
};

// @desc    Create Stripe Payment Intent
// @route   POST /api/payment/stripe
// @access  Private
const createStripeIntent = async (req, res, next) => {
    try {
        const { amount, orderId } = req.body;

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount * 100), // INR to paise
            currency: 'inr',
            metadata: { orderId },
        });

        // Store intent ID on the order so webhook can find it
        await Order.findByIdAndUpdate(orderId, {
            'paymentResult.id': paymentIntent.id,
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error) {
        next(error);
    }
};

// @desc    Create Razorpay Order
// @route   POST /api/payment/razorpay
// @access  Private
const createRazorpayOrder = async (req, res, next) => {
    try {
        const { amount, orderId } = req.body;

        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(amount * 100), // INR to paise
            currency: 'INR',
            receipt: orderId,
        });

        // Store Razorpay order ID on the order so webhook can find it
        await Order.findByIdAndUpdate(orderId, {
            'paymentResult.id': razorpayOrder.id,
        });

        res.json({
            id: razorpayOrder.id,
            currency: razorpayOrder.currency,
            amount: razorpayOrder.amount,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Stripe Webhook — mark order paid
// @route   POST /api/payment/stripe/webhook
// @access  Public (raw body)
const stripeWebhook = async (req, res, next) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('[stripe webhook] signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;

        const order = await Order.findOne({ 'paymentResult.id': paymentIntent.id });
        if (!order) {
            console.error('[stripe webhook] order not found for intent:', paymentIntent.id);
            return res.status(200).json({ received: true });
        }

        if (order.isPaid) {
            return res.status(200).json({ received: true }); // duplicate webhook
        }

        order.isPaid = true;
        order.status = 'paid';
        order.paidAt = new Date();
        order.paymentResult = {
            id: paymentIntent.id,
            status: paymentIntent.status,
            update_time: new Date().toISOString(),
            email_address: paymentIntent.receipt_email || '',
        };
        await order.save();
        console.log('[stripe webhook] order marked paid:', order._id);
    }

    res.status(200).json({ received: true });
};

// @desc    Razorpay Webhook — mark order paid
// @route   POST /api/payment/razorpay/webhook
// @access  Public
const razorpayWebhook = async (req, res, next) => {
    const signature = req.headers['x-razorpay-signature'];
    const rawBody = req.body; // Buffer (express.raw applied in app.js)

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(rawBody)
        .digest('hex');

    if (expectedSignature !== signature) {
        console.error('[razorpay webhook] signature mismatch');
        return res.status(400).json({ error: 'Invalid signature' });
    }

    const payload = JSON.parse(rawBody.toString());

    if (payload.event === 'payment.captured') {
        const payment = payload.payload.payment.entity;
        const razorpayOrderId = payment.order_id;

        const order = await Order.findOne({ 'paymentResult.id': razorpayOrderId });
        if (!order) {
            console.error('[razorpay webhook] order not found for razorpay order:', razorpayOrderId);
            return res.status(200).json({ received: true });
        }

        if (order.isPaid) {
            return res.status(200).json({ received: true }); // duplicate webhook
        }

        order.isPaid = true;
        order.status = 'paid';
        order.paidAt = new Date();
        order.paymentResult = {
            id: payment.id,
            status: payment.status,
            update_time: new Date().toISOString(),
            email_address: payment.email || '',
        };
        await order.save();
        console.log('[razorpay webhook] order marked paid:', order._id);
    }

    res.status(200).json({ received: true });
};

module.exports = {
    getStripeConfig,
    getRazorpayConfig,
    createStripeIntent,
    createRazorpayOrder,
    stripeWebhook,
    razorpayWebhook,
};
