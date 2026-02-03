const express = require('express');
const router = express.Router();
const {
    getDashboardStats,
    getLowStockProducts,
    getRecentOrders,
} = require('../controllers/statsController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/dashboard').get(protect, admin, getDashboardStats);
router.route('/low-stock').get(protect, admin, getLowStockProducts);
router.route('/recent-orders').get(protect, admin, getRecentOrders);

module.exports = router;
