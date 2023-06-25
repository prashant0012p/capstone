const mongoose = require('mongoose');

const EmptyCartSchema = new mongoose.Schema({
    email: {
        type: String,
    },
    items: {
        type: Array,
        default: []
    }
});

const EmptyCart = mongoose.model('cart', EmptyCartSchema);

module.exports = EmptyCart;