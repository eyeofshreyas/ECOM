# Stripe + Razorpay Payment Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock payment stubs with real Stripe (card via Elements) and Razorpay (UPI/cards via popup modal) integrations, confirmed server-side via webhooks, with auto-cancellation of unpaid orders after 30 minutes.

**Architecture:** Order is created first (status=pending, expiresAt=now+30m), then payment is initiated. Stripe PaymentIntent or Razorpay Order ID is stored on the order so webhooks can look it up and mark it paid. A node-cron job runs every 5 minutes to cancel expired unpaid orders.

**Tech Stack:** Node.js/Express backend (stripe, razorpay, node-cron), React/TypeScript frontend (@stripe/stripe-js, @stripe/react-stripe-js), MongoDB/Mongoose

---

## File Map

| File | Action | What changes |
|---|---|---|
| `backend/src/models/Order.js` | Modify | Add `status` enum + `expiresAt` Date fields |
| `backend/src/controllers/orderController.js` | Modify | Set `expiresAt`/`status` on create; sync `status` on pay/deliver |
| `backend/src/controllers/paymentController.js` | Modify | Replace all mocks with real Stripe + Razorpay SDK calls + webhook handlers |
| `backend/src/routes/paymentRoutes.js` | Modify | Add webhook routes |
| `backend/src/app.js` | Modify | Add `express.raw()` for both webhook paths before `express.json()` |
| `backend/src/server.js` | Modify | Import + start cron job after DB connects |
| `backend/src/jobs/cancelExpiredOrders.js` | Create | node-cron job that cancels expired unpaid orders |
| `backend/.env` | Modify | Add 5 new env vars |
| `frontend/src/components/payment/StripePayment.tsx` | Create | Stripe Elements card form component |
| `frontend/src/pages/Checkout.tsx` | Modify | Add 3 payment options, Razorpay script loader, conditional payment flows |
| `frontend/src/pages/Profile.tsx` | Modify | Add `status` to Order interface, show Cancelled badge + Reorder button |

---

## Task 1: Install Dependencies

**Files:**
- Modify: `backend/package.json` (via npm install)
- Modify: `frontend/package.json` (via npm install)

- [ ] **Step 1: Install backend payment packages**

```bash
cd backend
npm install stripe razorpay node-cron
```

Expected output: `added N packages` with no errors. Verify `stripe`, `razorpay`, `node-cron` appear in `backend/package.json` dependencies.

- [ ] **Step 2: Install frontend Stripe packages**

```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

Expected output: `added N packages` with no errors. Verify both packages appear in `frontend/package.json` dependencies.

- [ ] **Step 3: Commit**

```bash
git add backend/package.json backend/package-lock.json frontend/package.json frontend/package-lock.json
git commit -m "chore: install stripe, razorpay, node-cron, and stripe-js packages"
```

---

## Task 2: Configure Environment Variables

**Files:**
- Modify: `backend/.env`

- [ ] **Step 1: Add env vars to backend/.env**

Open `backend/.env` and append these lines (fill in your actual keys):

```
STRIPE_SECRET_KEY=sk_test_YOUR_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE
RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_RAZORPAY_SECRET_HERE
```

> Get Stripe test keys: https://dashboard.stripe.com → Developers → API keys
> Get Stripe webhook secret: after Task 11, run `stripe listen` to get the local `whsec_...` secret
> Razorpay keys: https://dashboard.razorpay.com → Settings → API Keys

- [ ] **Step 2: Verify env vars load**

```bash
cd backend
node -e "require('dotenv').config(); console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'set' : 'MISSING'); console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? 'set' : 'MISSING');"
```

Expected:
```
STRIPE_SECRET_KEY: set
RAZORPAY_KEY_ID: set
```

---

## Task 3: Update Order Model

**Files:**
- Modify: `backend/src/models/Order.js`

- [ ] **Step 1: Add `status` and `expiresAt` fields to the schema**

In `backend/src/models/Order.js`, add these two fields inside the schema object, after the `deliveredAt` field (before the closing `}`):

```js
        status: {
            type: String,
            enum: ['pending', 'paid', 'cancelled', 'delivered'],
            default: 'pending',
        },
        expiresAt: {
            type: Date,
        },
```

Full updated file `backend/src/models/Order.js`:

```js
const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        orderItems: [
            {
                name: { type: String, required: true },
                qty: { type: Number, required: true },
                image: { type: String, required: true },
                price: { type: Number, required: true },
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    required: true,
                    ref: 'Product',
                },
            },
        ],
        shippingAddress: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            postalCode: { type: String, required: true },
            country: { type: String, required: true },
        },
        paymentMethod: {
            type: String,
            required: true,
        },
        paymentResult: {
            id: { type: String },
            status: { type: String },
            update_time: { type: String },
            email_address: { type: String },
        },
        itemsPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        taxPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        shippingPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        totalPrice: {
            type: Number,
            required: true,
            default: 0.0,
        },
        isPaid: {
            type: Boolean,
            required: true,
            default: false,
        },
        paidAt: {
            type: Date,
        },
        isDelivered: {
            type: Boolean,
            required: true,
            default: false,
        },
        deliveredAt: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['pending', 'paid', 'cancelled', 'delivered'],
            default: 'pending',
        },
        expiresAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
```

- [ ] **Step 2: Verify the model loads without errors**

```bash
cd backend
node -e "require('dotenv').config(); const Order = require('./src/models/Order'); console.log('Order schema fields:', Object.keys(Order.schema.paths).join(', '));"
```

Expected output includes: `status, expiresAt`

- [ ] **Step 3: Commit**

```bash
git add backend/src/models/Order.js
git commit -m "feat: add status and expiresAt fields to Order model"
```

---

## Task 4: Update Order Controller

**Files:**
- Modify: `backend/src/controllers/orderController.js`

- [ ] **Step 1: Update `addOrderItems` to set `expiresAt` and `status`**

In `backend/src/controllers/orderController.js`, find the `addOrderItems` function. Change the `new Order({...})` call to include `expiresAt` and `status`:

```js
const order = new Order({
    orderItems,
    user: req.user._id,
    shippingAddress,
    paymentMethod,
    itemsPrice,
    taxPrice,
    shippingPrice,
    totalPrice,
    status: 'pending',
    expiresAt: new Date(Date.now() + 30 * 60 * 1000),
});
```

- [ ] **Step 2: Update `updateOrderToPaid` to also set `status = 'paid'`**

Find the `updateOrderToPaid` function. After setting `order.isPaid = true`, add:

```js
order.status = 'paid';
```

The full updated block should look like:

```js
if (order) {
    order.isPaid = true;
    order.status = 'paid';
    order.paidAt = Date.now();
    order.paymentResult = {
        id: req.body.id,
        status: req.body.status,
        update_time: req.body.update_time,
        email_address: req.body.email_address,
    };
    const updatedOrder = await order.save();
    res.json(updatedOrder);
}
```

- [ ] **Step 3: Update `updateOrderToDelivered` to also set `status = 'delivered'`**

Find the `updateOrderToDelivered` function. After setting `order.isDelivered = true`, add:

```js
order.status = 'delivered';
```

The full updated block:

```js
if (order) {
    order.isDelivered = true;
    order.status = 'delivered';
    order.deliveredAt = Date.now();
    const updatedOrder = await order.save();
    res.json(updatedOrder);
}
```

- [ ] **Step 4: Verify the file parses correctly**

```bash
cd backend
node -e "const c = require('./src/controllers/orderController'); console.log('exports:', Object.keys(c).join(', '));"
```

Expected: `exports: addOrderItems, getOrderById, updateOrderToPaid, updateOrderToDelivered, getMyOrders, getOrders`

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/orderController.js
git commit -m "feat: set status and expiresAt on order creation; sync status on pay/deliver"
```

---

## Task 5: Create Auto-Cancel Cron Job

**Files:**
- Create: `backend/src/jobs/cancelExpiredOrders.js`

- [ ] **Step 1: Create the jobs directory and cron file**

Create `backend/src/jobs/cancelExpiredOrders.js` with this content:

```js
const cron = require('node-cron');
const Order = require('../models/Order');

const startCancelExpiredOrdersJob = () => {
    cron.schedule('*/5 * * * *', async () => {
        try {
            const result = await Order.updateMany(
                {
                    isPaid: false,
                    status: 'pending',
                    expiresAt: { $lt: new Date() },
                },
                { $set: { status: 'cancelled' } }
            );
            if (result.modifiedCount > 0) {
                console.log(`[cron] Cancelled ${result.modifiedCount} expired order(s)`);
            }
        } catch (err) {
            console.error('[cron] Error cancelling expired orders:', err.message);
        }
    });
    console.log('[cron] cancelExpiredOrders job started (every 5 minutes)');
};

module.exports = startCancelExpiredOrdersJob;
```

- [ ] **Step 2: Verify the file loads**

```bash
cd backend
node -e "const job = require('./src/jobs/cancelExpiredOrders'); console.log('type:', typeof job);"
```

Expected: `type: function`

---

## Task 6: Register Cron Job in Server

**Files:**
- Modify: `backend/src/server.js`

- [ ] **Step 1: Import and start the cron job inside the mongoose `.then()` callback**

Replace `backend/src/server.js` with:

```js
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const startCancelExpiredOrdersJob = require('./jobs/cancelExpiredOrders');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('MongoDB connected');
        startCancelExpiredOrdersJob();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Database connection error:', err);
    });
```

- [ ] **Step 2: Verify server starts and logs cron message**

```bash
cd backend
npm run dev
```

Expected output includes:
```
MongoDB connected
[cron] cancelExpiredOrders job started (every 5 minutes)
Server running on port 5000
```

Stop the server with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
git add backend/src/jobs/cancelExpiredOrders.js backend/src/server.js
git commit -m "feat: add cron job to auto-cancel expired unpaid orders every 5 minutes"
```

---

## Task 7: Update Payment Controller — Stripe PaymentIntent

**Files:**
- Modify: `backend/src/controllers/paymentController.js`

- [ ] **Step 1: Replace the Stripe mock with real SDK**

Replace the entire contents of `backend/src/controllers/paymentController.js` with the following (leave Razorpay as-is for now — we update it in Task 8):

```js
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
```

- [ ] **Step 2: Verify the file loads**

```bash
cd backend
node -e "const c = require('./src/controllers/paymentController'); console.log('exports:', Object.keys(c).join(', '));"
```

Expected: `exports: getStripeConfig, getRazorpayConfig, createStripeIntent, createRazorpayOrder, stripeWebhook, razorpayWebhook`

---

## Task 8: Update Payment Routes + app.js Raw Body Middleware

**Files:**
- Modify: `backend/src/routes/paymentRoutes.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Update paymentRoutes.js to add webhook routes**

Replace `backend/src/routes/paymentRoutes.js` with:

```js
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
```

- [ ] **Step 2: Add `express.raw()` middleware to app.js BEFORE `express.json()`**

In `backend/src/app.js`, replace:

```js
app.use(express.json());
```

with:

```js
// Raw body for webhook signature verification — MUST be before express.json()
app.use('/api/payment/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payment/razorpay/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());
```

- [ ] **Step 3: Start server and verify routes load**

```bash
cd backend
npm run dev
```

In another terminal:

```bash
curl http://localhost:5000/api/payment/stripe/webhook -X POST -H "Content-Type: application/json" -d '{}'
```

Expected response (invalid signature, not 404): `{"message":"Webhook Error: No signatures found matching the expected signature for payload..."}`

Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/paymentController.js backend/src/routes/paymentRoutes.js backend/src/app.js
git commit -m "feat: implement real Stripe and Razorpay payment intents and webhook handlers"
```

---

## Task 9: Create StripePayment Frontend Component

**Files:**
- Create: `frontend/src/components/payment/StripePayment.tsx`

- [ ] **Step 1: Create the payment directory and component**

Create `frontend/src/components/payment/StripePayment.tsx`:

```tsx
import { useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentProps {
    clientSecret: string;
    onSuccess: () => void;
}

const CARD_ELEMENT_OPTIONS = {
    style: {
        base: {
            fontSize: '16px',
            color: '#1a1a1a',
            fontFamily: 'inherit',
            '::placeholder': { color: '#9ca3af' },
        },
        invalid: { color: '#ef4444' },
    },
};

export default function StripePayment({ clientSecret, onSuccess }: StripePaymentProps) {
    const stripe = useStripe();
    const elements = useElements();
    const { toast } = useToast();
    const [processing, setProcessing] = useState(false);

    const handlePay = async () => {
        if (!stripe || !elements) return;

        setProcessing(true);
        const cardElement = elements.getElement(CardElement);

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
            payment_method: { card: cardElement! },
        });

        if (error) {
            toast({
                title: 'Payment Failed',
                description: error.message,
                variant: 'destructive',
            });
            setProcessing(false);
            return;
        }

        if (paymentIntent?.status === 'succeeded') {
            onSuccess();
        }
    };

    // Uses a div, not a form — this component is rendered inside Checkout's <form>
    // and nested forms are invalid HTML.
    return (
        <div className="space-y-4 mt-4">
            <div className="border border-border rounded-lg p-4 bg-background">
                <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>
            <p className="text-xs text-muted-foreground">
                Test card: 4242 4242 4242 4242 — any future date — any 3-digit CVC
            </p>
            <Button type="button" onClick={handlePay} className="w-full" disabled={!stripe || processing}>
                {processing ? 'Processing...' : 'Pay with Card'}
            </Button>
        </div>
    );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors related to `StripePayment.tsx`

---

## Task 10: Update Checkout.tsx

**Files:**
- Modify: `frontend/src/pages/Checkout.tsx`

- [ ] **Step 1: Replace Checkout.tsx with the updated version**

Replace the entire contents of `frontend/src/pages/Checkout.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ShoppingBag, Truck, CreditCard, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Product } from '@/types/product';
import api from '@/lib/api';
import StripePayment from '@/components/payment/StripePayment';

declare global {
    interface Window { Razorpay: any; }
}

export default function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState('');
    const [stripeClientSecret, setStripeClientSecret] = useState('');
    const [stripePromise, setStripePromise] = useState<ReturnType<typeof loadStripe> | null>(null);
    const [awaitingPayment, setAwaitingPayment] = useState(false);

    const product = location.state?.product as Product | undefined;
    const quantity = location.state?.quantity || 1;

    const [shippingInfo, setShippingInfo] = useState({
        address: '',
        city: '',
        postalCode: '',
        country: 'India',
    });

    const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery');

    // Load Razorpay script once
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        return () => { document.body.removeChild(script); };
    }, []);

    // Fetch Stripe publishable key once
    useEffect(() => {
        api.get('/payment/config/stripe').then(({ data }) => {
            setStripePromise(loadStripe(data));
        });
    }, []);

    useEffect(() => {
        if (!product) navigate('/products');
    }, [product, navigate]);

    if (!product) return null;

    const itemsPrice = product.price * quantity;
    const shippingPrice = itemsPrice > 2500 ? 0 : 50;
    const taxPrice = Math.round(itemsPrice * 0.18);
    const totalPrice = itemsPrice + shippingPrice + taxPrice;

    const handlePlaceOrder = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!shippingInfo.address || !shippingInfo.city || !shippingInfo.postalCode) {
            toast({
                title: 'Missing Information',
                description: 'Please fill in all shipping details',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);

        try {
            const orderData = {
                orderItems: [{
                    name: product.name,
                    qty: quantity,
                    image: product.image,
                    price: product.price,
                    product: product.id,
                }],
                shippingAddress: shippingInfo,
                paymentMethod,
                itemsPrice,
                taxPrice,
                shippingPrice,
                totalPrice,
            };

            const { data: order } = await api.post('/orders', orderData);
            setOrderId(order._id);

            if (paymentMethod === 'Stripe') {
                const { data } = await api.post('/payment/stripe', {
                    amount: totalPrice,
                    orderId: order._id,
                });
                setStripeClientSecret(data.clientSecret);
                setAwaitingPayment(true);
                setLoading(false);
            } else if (paymentMethod === 'Razorpay') {
                const { data: rzpOrder } = await api.post('/payment/razorpay', {
                    amount: totalPrice,
                    orderId: order._id,
                });
                openRazorpayModal(rzpOrder, order._id);
            } else {
                // Cash on Delivery
                setOrderPlaced(true);
                toast({
                    title: 'Order Placed Successfully!',
                    description: `Your order #${order._id.slice(-8).toUpperCase()} has been placed.`,
                });
            }
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to place order',
                variant: 'destructive',
            });
            setLoading(false);
        }
    };

    const openRazorpayModal = (rzpOrder: any, mongoOrderId: string) => {
        const storedUser = localStorage.getItem('userInfo');
        const user = storedUser ? JSON.parse(storedUser) : {};

        const options = {
            key: '',  // populated via prefetch below — Razorpay loads key from config
            amount: rzpOrder.amount,
            currency: rzpOrder.currency,
            order_id: rzpOrder.id,
            name: 'ECOM Store',
            description: 'Order Payment',
            prefill: {
                name: user.name || '',
                email: user.email || '',
            },
            handler: () => {
                setOrderPlaced(true);
                toast({
                    title: 'Payment Successful!',
                    description: `Order #${mongoOrderId.slice(-8).toUpperCase()} confirmed.`,
                });
            },
            modal: {
                ondismiss: () => {
                    toast({
                        title: 'Payment Cancelled',
                        description: 'Your order will expire in 30 minutes if unpaid.',
                        variant: 'destructive',
                    });
                    setLoading(false);
                },
            },
        };

        // Populate Razorpay key from env config
        api.get('/payment/config/razorpay').then(({ data: keyId }) => {
            const rzp = new window.Razorpay({ ...options, key: keyId });
            rzp.open();
            setLoading(false);
        });
    };

    const handleStripeSuccess = () => {
        setOrderPlaced(true);
        toast({
            title: 'Payment Successful!',
            description: `Order #${orderId.slice(-8).toUpperCase()} confirmed.`,
        });
    };

    if (orderPlaced) {
        return (
            <div className="min-h-screen flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center bg-secondary/20">
                    <Card className="max-w-md mx-4">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-500 flex items-center justify-center">
                                <CheckCircle className="h-8 w-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl">Order Placed Successfully!</CardTitle>
                            <CardDescription>Your order has been confirmed</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-secondary rounded-lg p-4 text-center">
                                <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                                <p className="font-mono font-semibold text-lg">#{orderId.slice(-8).toUpperCase()}</p>
                            </div>
                            <div className="space-y-2 text-sm">
                                <p className="text-muted-foreground">
                                    Thank you for your order! We'll send you a confirmation email shortly.
                                </p>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Button asChild className="w-full">
                                    <Link to="/profile">View Order in Profile</Link>
                                </Button>
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/products">Continue Shopping</Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 bg-secondary/20">
                <div className="container mx-auto py-8 px-4">
                    <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Product
                    </Button>

                    <h1 className="font-display text-3xl lg:text-4xl font-semibold mb-8">Checkout</h1>

                    <form onSubmit={handlePlaceOrder}>
                        <div className="grid lg:grid-cols-3 gap-8">
                            <div className="lg:col-span-2 space-y-6">
                                {/* Shipping Information */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Truck className="h-5 w-5" />
                                            Shipping Information
                                        </CardTitle>
                                        <CardDescription>Enter your delivery address</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Street Address *</Label>
                                            <Input
                                                id="address"
                                                placeholder="123 Main Street, Apartment 4B"
                                                value={shippingInfo.address}
                                                onChange={(e) => setShippingInfo({ ...shippingInfo, address: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid sm:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="city">City *</Label>
                                                <Input
                                                    id="city"
                                                    placeholder="Mumbai"
                                                    value={shippingInfo.city}
                                                    onChange={(e) => setShippingInfo({ ...shippingInfo, city: e.target.value })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="postalCode">Postal Code *</Label>
                                                <Input
                                                    id="postalCode"
                                                    placeholder="400001"
                                                    value={shippingInfo.postalCode}
                                                    onChange={(e) => setShippingInfo({ ...shippingInfo, postalCode: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="country">Country</Label>
                                            <Input id="country" value={shippingInfo.country} disabled />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Payment Method */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <CreditCard className="h-5 w-5" />
                                            Payment Method
                                        </CardTitle>
                                        <CardDescription>Select your payment option</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                                            <div className="flex items-center space-x-3 border border-border rounded-lg p-4">
                                                <RadioGroupItem value="Stripe" id="stripe" />
                                                <Label htmlFor="stripe" className="flex-1 cursor-pointer">
                                                    <p className="font-medium">Credit / Debit Card</p>
                                                    <p className="text-sm text-muted-foreground">Powered by Stripe — Visa, Mastercard, Amex</p>
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-3 border border-border rounded-lg p-4">
                                                <RadioGroupItem value="Razorpay" id="razorpay" />
                                                <Label htmlFor="razorpay" className="flex-1 cursor-pointer">
                                                    <p className="font-medium">UPI / Cards / Netbanking</p>
                                                    <p className="text-sm text-muted-foreground">Powered by Razorpay</p>
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-3 border border-border rounded-lg p-4">
                                                <RadioGroupItem value="Cash on Delivery" id="cod" />
                                                <Label htmlFor="cod" className="flex-1 cursor-pointer">
                                                    <p className="font-medium">Cash on Delivery</p>
                                                    <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                                                </Label>
                                            </div>
                                        </RadioGroup>

                                        {/* Stripe card form — shown after order is created */}
                                        {awaitingPayment && paymentMethod === 'Stripe' && stripeClientSecret && stripePromise && (
                                            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                                                <StripePayment
                                                    clientSecret={stripeClientSecret}
                                                    onSuccess={handleStripeSuccess}
                                                />
                                            </Elements>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Order Summary */}
                            <div className="lg:col-span-1">
                                <Card className="sticky top-24">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ShoppingBag className="h-5 w-5" />
                                            Order Summary
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="flex gap-4">
                                            <img
                                                src={product.image}
                                                alt={product.name}
                                                className="h-20 w-20 rounded-lg object-cover bg-secondary"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium truncate">{product.name}</p>
                                                <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                                                <p className="font-semibold mt-1">₹{product.price.toLocaleString('en-IN')}</p>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Subtotal</span>
                                                <span>₹{itemsPrice.toLocaleString('en-IN')}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Shipping</span>
                                                <span className={shippingPrice === 0 ? 'text-green-600' : ''}>
                                                    {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice}`}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Tax (GST 18%)</span>
                                                <span>₹{taxPrice.toLocaleString('en-IN')}</span>
                                            </div>
                                        </div>
                                        <Separator />
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span>Total</span>
                                            <span>₹{totalPrice.toLocaleString('en-IN')}</span>
                                        </div>

                                        {!awaitingPayment && (
                                            <Button type="submit" className="w-full" size="lg" disabled={loading}>
                                                {loading ? 'Processing...' : 'Place Order'}
                                            </Button>
                                        )}

                                        <p className="text-xs text-center text-muted-foreground">
                                            By placing this order, you agree to our terms and conditions
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no new type errors.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Checkout.tsx frontend/src/components/payment/StripePayment.tsx
git commit -m "feat: add Stripe Elements and Razorpay modal payment options to checkout"
```

---

## Task 11: Update Profile.tsx — Cancelled Order Status

**Files:**
- Modify: `frontend/src/pages/Profile.tsx`

- [ ] **Step 1: Add `status` and `paymentMethod` to the Order interface**

In `frontend/src/pages/Profile.tsx`, find the `Order` interface (around line 15) and add two fields:

```ts
interface Order {
    _id: string;
    orderItems: Array<{
        name: string;
        qty: number;
        price: number;
        image: string;
        product?: string;
    }>;
    totalPrice: number;
    isPaid: boolean;
    isDelivered: boolean;
    createdAt: string;
    paidAt?: string;
    deliveredAt?: string;
    status?: string;
    paymentMethod?: string;
}
```

- [ ] **Step 2: Update `getOrderStatus` to handle cancelled orders**

Find the `getOrderStatus` function (around line 108) and replace it:

```ts
const getOrderStatus = (order: Order) => {
    if (order.status === 'cancelled') return { text: 'Cancelled', icon: X, color: 'bg-red-500' };
    if (order.isDelivered) return { text: 'Delivered', icon: CheckCircle, color: 'bg-green-500' };
    if (order.isPaid) return { text: 'In Transit', icon: Truck, color: 'bg-blue-500' };
    return { text: 'Processing', icon: Clock, color: 'bg-yellow-500' };
};
```

Note: `X` is already imported from `lucide-react` in the existing file.

- [ ] **Step 3: Add Reorder button for cancelled orders**

Find the order card's bottom section (around line 284, the `View Details` button block):

```tsx
<div className="mt-4 pt-4 border-t border-border flex gap-2 flex-wrap">
    <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
        <Link to={`/order/${order._id}`}>View Details</Link>
    </Button>
    {order.status === 'cancelled' && order.orderItems[0] && (
        <Button
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => navigate('/products')}
        >
            Reorder
        </Button>
    )}
</div>
```

Also add `import { useNavigate } from 'react-router-dom';` at the top if not already present (it already has `Link` from react-router-dom — add `useNavigate` to the same import), and add `const navigate = useNavigate();` at the top of the `Profile` component.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/Profile.tsx
git commit -m "feat: show Cancelled status and Reorder button for expired orders in profile"
```

---

## Task 12: End-to-End Manual Testing

- [ ] **Step 1: Start the backend and frontend**

Terminal 1:
```bash
cd backend && npm run dev
```

Terminal 2:
```bash
cd frontend && npm run dev
```

- [ ] **Step 2: Test Stripe payment**

1. Log in, go to a product → Buy Now
2. Fill shipping, select "Credit / Debit Card", click Place Order
3. Stripe card form appears — enter `4242 4242 4242 4242`, any future date, any CVC
4. Click "Pay with Card"
5. Expected: success screen shows with order ID

- [ ] **Step 3: Test Razorpay payment**

1. Log in, go to a product → Buy Now
2. Fill shipping, select "UPI / Cards / Netbanking", click Place Order
3. Razorpay modal opens — use test credentials from Razorpay test mode
4. Complete payment
5. Expected: success screen shows

- [ ] **Step 4: Test Cash on Delivery**

1. Log in, go to a product → Buy Now
2. Fill shipping, select "Cash on Delivery", click Place Order
3. Expected: success screen immediately (no payment step)

- [ ] **Step 5: Test Stripe webhook locally**

Install Stripe CLI: https://stripe.com/docs/stripe-cli

```bash
stripe listen --forward-to localhost:5000/api/payment/stripe/webhook
```

Copy the `whsec_...` secret printed and update `STRIPE_WEBHOOK_SECRET` in `.env`.

Trigger a test event:
```bash
stripe trigger payment_intent.succeeded
```

Expected in backend logs: `[stripe webhook] order marked paid: <orderId>`

- [ ] **Step 6: Test auto-cancel cron job**

In MongoDB (via Mongo Compass or mongosh), find an unpaid pending order and set its `expiresAt` to the past:

```js
db.orders.updateOne(
  { isPaid: false, status: 'pending' },
  { $set: { expiresAt: new Date('2020-01-01') } }
)
```

Wait up to 5 minutes. Expected in backend logs: `[cron] Cancelled 1 expired order(s)`

Check Profile page — order shows "Cancelled" badge with Reorder button.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: complete Stripe and Razorpay integration with webhooks and auto-cancel"
```

---

## Summary

| Task | Files Changed |
|---|---|
| 1. Install deps | `package.json` × 2 |
| 2. Env vars | `backend/.env` |
| 3. Order model | `Order.js` |
| 4. Order controller | `orderController.js` |
| 5–6. Cron job | `cancelExpiredOrders.js`, `server.js` |
| 7–8. Payment controller + routes | `paymentController.js`, `paymentRoutes.js`, `app.js` |
| 9. StripePayment component | `StripePayment.tsx` |
| 10. Checkout page | `Checkout.tsx` |
| 11. Profile page | `Profile.tsx` |
| 12. E2E testing | — |
