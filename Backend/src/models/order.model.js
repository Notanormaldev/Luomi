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
        enum: ['pending', 'processing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'pending'
      },
      shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        contact: { type: String, required: true },
        pincode: { type: String, required: true }
      },
      paymentMethod: {
        type: String,
        enum: ['COD', 'Razorpay'],
        default: 'COD'
      },
      paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
      },
      razorpayOrderId: {
        type: String,
        default: null
      },
      razorpayPaymentId: {
        type: String,
        default: null
      },
      razorpaySignature: {
        type: String,
        default: null
      },
      deliveryPhoto: {
        type: String,
        default: null
      },
      deliveryConfirmedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        default: null
      },
      deliveryConfirmedAt: {
        type: Date,
        default: null
      }
}, { timestamps: true });

const orderModel = mongoose.model('orders', orderSchema);

export default orderModel;
