import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true
    },
    selectedVariant: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, 'Quantity must be at least 1']
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true
    },
    items: [cartItemSchema]
}, { timestamps: true });

const cartModel = mongoose.model('carts', cartSchema);

export default cartModel;
