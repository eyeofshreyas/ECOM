require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const startCancelExpiredOrdersJob = require('./jobs/cancelExpiredOrders');

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not defined in the environment variables.');
    process.exit(1);
}

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
        process.exit(1);
    });
