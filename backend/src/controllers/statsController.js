const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res, next) => {
    try {
        // Get total counts
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments();

        // Calculate total revenue from paid orders
        const revenueData = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, total: { $sum: '$totalPrice' } } },
        ]);
        const totalRevenue = revenueData.length > 0 ? revenueData[0].total : 0;

        // Get low stock count (products with countInStock < 10)
        const lowStockCount = await Product.countDocuments({ countInStock: { $lt: 10 } });

        // Get pending orders count
        const pendingOrdersCount = await Order.countDocuments({ isDelivered: false });

        res.json({
            totalProducts,
            totalOrders,
            totalUsers,
            totalRevenue,
            lowStockCount,
            pendingOrdersCount,
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get low stock products
// @route   GET /api/stats/low-stock
// @access  Private/Admin
const getLowStockProducts = async (req, res, next) => {
    try {
        const threshold = req.query.threshold || 10;
        const products = await Product.find({ countInStock: { $lt: Number(threshold) } })
            .select('name brand category countInStock price')
            .sort({ countInStock: 1 })
            .limit(20);

        res.json(products);
    } catch (error) {
        next(error);
    }
};

// @desc    Get recent orders
// @route   GET /api/stats/recent-orders
// @access  Private/Admin
const getRecentOrders = async (req, res, next) => {
    try {
        const limit = req.query.limit || 10;
        const orders = await Order.find({})
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.json(orders);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboardStats,
    getLowStockProducts,
    getRecentOrders,
};
