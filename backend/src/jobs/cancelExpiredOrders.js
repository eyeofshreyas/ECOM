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
