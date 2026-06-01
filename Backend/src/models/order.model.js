import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
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
        required: true
    },
    price: {
        amount: Number,
        currency: String
    }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    items: [orderItemSchema],
    totalAmount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR'
      },
      status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
      }
}, { timestamps: true });

const orderModel = mongoose.model('orders', orderSchema);

export default orderModel;
