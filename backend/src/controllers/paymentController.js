// @desc    Get Stripe Publishable Key
// @route   GET /api/config/stripe
// @access  Private
const getStripeConfig = (req, res) => {
    res.send(process.env.STRIPE_PUBLISHABLE_KEY || 'stripe_key_missing');
};

// @desc    Get Razorpay Key ID
// @route   GET /api/config/razorpay
// @access  Private
const getRazorpayConfig = (req, res) => {
    res.send(process.env.RAZORPAY_KEY_ID || 'razorpay_key_missing');
};

// @desc    Create Stripe Payment Intent (Mock or Real)
// @route   POST /api/payment/stripe
// @access  Private
const createStripeIntent = async (req, res) => {
    // In a real app, use stripe.paymentIntents.create here with amount
    // For now, returning a mock success since we don't have a real Stripe key setup
    const { amount } = req.body;
    res.json({
        clientSecret: 'mock_client_secret_' + Date.now(),
        amount,
    });
};

// @desc    Create Razorpay Order (Mock or Real)
// @route   POST /api/payment/razorpay
// @access  Private
const createRazorpayOrder = async (req, res) => {
    // Use razorpay instance to create order
    const { amount } = req.body;
    res.json({
        id: 'order_mock_' + Date.now(),
        currency: 'INR',
        amount: amount,
    });
};

module.exports = {
    getStripeConfig,
    getRazorpayConfig,
    createStripeIntent,
    createRazorpayOrder,
};
