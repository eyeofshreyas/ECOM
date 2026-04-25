const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./docs/swagger');
const logger = require('./utils/logger');

const app = express();

// Security Middleware: Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Apply rate limiter to all requests (can also be scoped to /api)
app.use('/api', limiter);

// Middleware
// Raw body for webhook signature verification — MUST be before express.json()
app.use('/api/payment/stripe/webhook', express.raw({ type: 'application/json' }));
app.use('/api/payment/razorpay/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '10kb' })); // Body limit is 10kb
app.use(cors());
app.use(helmet());

// Data sanitization against NoSQL query injection
// Note: express-mongo-sanitize is currently incompatible with Express 5 req.query getter.
// app.use(mongoSanitize());

// Request Logging with Morgan & Winston
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Keep dev logging in console if needed, though winston already logs to console.
}

// Swagger API Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Routes Placeholder
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const { notFound, errorHandler } = require('./middlewares/errorMiddleware');

app.get('/', (req, res) => {
    res.send('API is running...');
});

const path = require('path');

app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/stats', statsRoutes);

const uploadsDir = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));
app.use('/images', express.static(uploadsDir));

app.use(notFound);

// Custom error handler integrating with winston
app.use((err, req, res, next) => {
    logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    errorHandler(err, req, res, next);
});

module.exports = app;
