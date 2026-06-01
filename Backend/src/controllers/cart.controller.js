import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import orderModel from "../models/order.model.js";

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

async function checkout(req, res) {

    try {
        const userId = req.user.id;
        const cart = await cartModel.findOne({ user: userId }).populate('items.product');
        
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, msg: "Atelier bag is empty" });
        }

        // 1. Verify stock for all items
        for (const item of cart.items) {
            const product = item.product;
            if (!product) {
                return res.status(404).json({ success: false, msg: "One of the products in your bag is no longer available" });
            }

            let availableStock = product.stock || 0;
            if (item.selectedVariant) {
                const variant = product.variants.id(item.selectedVariant);
                if (!variant) {
                    return res.status(404).json({ success: false, msg: `Variant not found for product ${product.title}` });
                }
                availableStock = variant.stock || 0;
            }

            if (item.quantity > availableStock) {
                return res.status(400).json({ 
                    success: false, 
                    msg: `Insufficient stock for "${product.title}". Only ${availableStock} items left.` 
                });
            }
        }

        // 2. Decrement stock for all items
        for (const item of cart.items) {
            const product = await productModel.findById(item.product._id);
            if (item.selectedVariant) {
                const variant = product.variants.id(item.selectedVariant);
                variant.stock = Math.max(0, variant.stock - item.quantity);
            } else {
                product.stock = Math.max(0, product.stock - item.quantity);
            }
            await product.save();
        }

        // 3. Calculate total price and build order item list
        let totalAmount = 0;
        const orderItems = cart.items.map(item => {
            const variantObj = item.selectedVariant && item.product.variants
                ? item.product.variants.find(v => v._id.toString() === item.selectedVariant.toString())
                : null;
            const priceObj = variantObj?.price || item.product.price;
            const itemPrice = priceObj?.amount || 0;
            totalAmount += itemPrice * item.quantity;

            return {
                product: item.product._id,
                selectedVariant: item.selectedVariant || null,
                quantity: item.quantity,
                price: {
                    amount: itemPrice,
                    currency: priceObj?.currency || 'INR'
                }
            };
        });

        // 4. Create the order document
        const order = await orderModel.create({
            user: userId,
            items: orderItems,
            totalAmount,
            currency: cart.items[0]?.product.price?.currency || 'INR',
            status: 'pending'
        });

        // 5. Clear user cart
        cart.items = [];
        await cart.save();

        return res.status(201).json({
            success: true,
            msg: "Order placed successfully",
            order,
            cart
        });
    } catch (error) {
        console.error("checkout Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to place order" });
    }
}

export default {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    checkout
};
