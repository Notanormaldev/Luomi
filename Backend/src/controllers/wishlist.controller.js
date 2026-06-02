import wishlistModel from '../models/wishlist.model.js';
import productModel from '../models/product.model.js';

// Helper to get populated wishlist
async function getPopulatedWishlist(userId) {
    let wishlist = await wishlistModel.findOne({ user: userId }).populate('products');
    if (!wishlist) {
        wishlist = await wishlistModel.create({ user: userId, products: [] });
    }
    return wishlist;
}

async function getWishlist(req, res) {
    try {
        const userId = req.user.id;
        const wishlist = await getPopulatedWishlist(userId);
        return res.status(200).json({
            success: true,
            msg: "Wishlist fetched successfully",
            wishlist
        });
    } catch (error) {
        console.error("getWishlist Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to retrieve wishlist" });
    }
}

async function toggleWishlist(req, res) {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, msg: "Product ID is required" });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, msg: "Product not found" });
        }

        let wishlist = await wishlistModel.findOne({ user: userId });
        if (!wishlist) {
            wishlist = await wishlistModel.create({ user: userId, products: [] });
        }

        const index = wishlist.products.indexOf(productId);
        let added = false;
        let msg = "";

        if (index > -1) {
            wishlist.products.splice(index, 1);
            msg = "Removed from wishlist";
        } else {
            wishlist.products.push(productId);
            added = true;
            msg = "Added to wishlist";
        }

        await wishlist.save();
        const populatedWishlist = await getPopulatedWishlist(userId);

        return res.status(200).json({
            success: true,
            msg,
            added,
            wishlist: populatedWishlist
        });
    } catch (error) {
        console.error("toggleWishlist Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to update wishlist" });
    }
}

export default {
    getWishlist,
    toggleWishlist
};
