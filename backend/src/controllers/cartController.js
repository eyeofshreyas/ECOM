const Cart = require('../models/Cart');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
const getCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id }).populate(
            'cartItems.product',
            'name image price countInStock'
        );

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, cartItems: [] });
        }

        res.json(cart);
    } catch (error) {
        next(error);
    }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
const addToCart = async (req, res, next) => {
    try {
        const { productId, qty } = req.body;

        let cart = await Cart.findOne({ user: req.user._id });

        if (!cart) {
            cart = await Cart.create({ user: req.user._id, cartItems: [] });
        }

        const itemExists = cart.cartItems.find(
            (x) => x.product.toString() === productId
        );

        if (itemExists) {
            itemExists.qty = qty;
        } else {
            cart.cartItems.push({ product: productId, qty });
        }

        await cart.save();
        res.json(cart);
    } catch (error) {
        next(error);
    }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:id
// @access  Private
const removeFromCart = async (req, res, next) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id });

        if (cart) {
            cart.cartItems = cart.cartItems.filter(
                (x) => x.product.toString() !== req.params.id
            );
            await cart.save();
            res.json(cart);
        } else {
            res.status(404);
            throw new Error('Cart not found');
        }
    } catch (error) {
        next(error);
    }
};

module.exports = { getCart, addToCart, removeFromCart };
