import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";

// Helper to populate cart items with product details
async function getPopulatedCart(userId) {
    let cart = await cartModel.findOne({ user: userId }).populate('items.product');
    if (!cart) {
        cart = await cartModel.create({ user: userId, items: [] });
    }
    return cart;
}

async function getCart(req, res) {
    try {
        const userId = req.user.id;
        const cart = await getPopulatedCart(userId);
        return res.status(200).json({
            success: true,
            msg: "Cart fetched successfully",
            cart
        });
    } catch (error) {
        console.error("getCart Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to retrieve cart" });
    }
}

async function addToCart(req, res) {
    try {
        const userId = req.user.id;
        const { productId, quantity, variantId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, msg: "Product ID is required" });
        }

        const qty = parseInt(quantity) || 1;
        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, msg: "Product not found" });
        }

        // Live Stock Management Validation
        let availableStock = product.stock || 0;
        if (variantId) {
            const variant = product.variants.id(variantId);
            if (!variant) {
                return res.status(404).json({ success: false, msg: "Variant not found" });
            }
            availableStock = variant.stock || 0;
        }

        let cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            cart = await cartModel.create({ user: userId, items: [] });
        }

        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => {
            const matchesProduct = item.product.toString() === productId;
            const matchesVariant = variantId 
                ? (item.selectedVariant && item.selectedVariant.toString() === variantId)
                : (!item.selectedVariant);
            return matchesProduct && matchesVariant;
        });

        let targetQty = qty;
        if (existingItemIndex > -1) {
            targetQty = cart.items[existingItemIndex].quantity + qty;
        }

        if (targetQty > availableStock) {
            return res.status(400).json({ 
                success: false, 
                msg: `Cannot add more. Only ${availableStock} items left in stock.` 
            });
        }

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity = targetQty;
        } else {
            cart.items.push({
                product: productId,
                selectedVariant: variantId || null,
                quantity: qty
            });
        }

        await cart.save();
        const populatedCart = await getPopulatedCart(userId);

        return res.status(200).json({
            success: true,
            msg: "Product added to cart",
            cart: populatedCart
        });
    } catch (error) {
        console.error("addToCart Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to add product to cart" });
    }
}

async function updateCartItem(req, res) {
    try {
        const userId = req.user.id;
        const { productId, quantity, variantId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, msg: "Product ID is required" });
        }

        const qty = parseInt(quantity);
        if (isNaN(qty) || qty < 1) {
            return res.status(400).json({ success: false, msg: "Quantity must be at least 1" });
        }

        const product = await productModel.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, msg: "Product not found" });
        }

        // Live Stock Management Validation
        let availableStock = product.stock || 0;
        if (variantId) {
            const variant = product.variants.id(variantId);
            if (!variant) {
                return res.status(404).json({ success: false, msg: "Variant not found" });
            }
            availableStock = variant.stock || 0;
        }

        if (qty > availableStock) {
            return res.status(400).json({ 
                success: false, 
                msg: `Cannot set quantity to ${qty}. Only ${availableStock} items left in stock.` 
            });
        }

        let cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, msg: "Cart not found" });
        }

        const itemIndex = cart.items.findIndex(item => {
            const matchesProduct = item.product.toString() === productId;
            const matchesVariant = variantId 
                ? (item.selectedVariant && item.selectedVariant.toString() === variantId)
                : (!item.selectedVariant);
            return matchesProduct && matchesVariant;
        });

        if (itemIndex === -1) {
            return res.status(404).json({ success: false, msg: "Item not found in cart" });
        }

        cart.items[itemIndex].quantity = qty;
        await cart.save();

        const populatedCart = await getPopulatedCart(userId);
        return res.status(200).json({
            success: true,
            msg: "Cart updated successfully",
            cart: populatedCart
        });
    } catch (error) {
        console.error("updateCartItem Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to update cart item" });
    }
}

async function removeFromCart(req, res) {
    try {
        const userId = req.user.id;
        const { productId, variantId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, msg: "Product ID is required" });
        }

        let cart = await cartModel.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ success: false, msg: "Cart not found" });
        }

        cart.items = cart.items.filter(item => {
            const matchesProduct = item.product.toString() === productId;
            const matchesVariant = variantId 
                ? (item.selectedVariant && item.selectedVariant.toString() === variantId)
                : (!item.selectedVariant);
            return !(matchesProduct && matchesVariant);
        });

        await cart.save();
        const populatedCart = await getPopulatedCart(userId);

        return res.status(200).json({
            success: true,
            msg: "Item removed from cart",
            cart: populatedCart
        });
    } catch (error) {
        console.error("removeFromCart Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to remove item from cart" });
    }
}

export default {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart
};
