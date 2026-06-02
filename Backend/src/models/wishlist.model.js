import mongoose from 'mongoose';

const wishlistSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true
    },
    products: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products'
    }]
}, { timestamps: true });

const wishlistModel = mongoose.model('wishlists', wishlistSchema);

export default wishlistModel;
