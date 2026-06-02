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

// Helper to retrieve and calculate populated/priced cart data
async function getCartWithPricingData(userId) {
    const cart = await getPopulatedCart(userId);

    // Remove items whose product no longer exists
    const validItems = cart.items.filter(item => item.product);

    let subtotal = 0;
    const pricedItems = validItems.map(item => {
        const product = item.product;
        let unitPrice = 0;
        let currency = 'INR';
        let variantData = null;

        if (item.selectedVariant && product.variants) {
            const variant = product.variants.find(
                v => v._id.toString() === item.selectedVariant.toString()
            );
            if (variant) {
                unitPrice = variant.price?.amount || product.price?.amount || 0;
                currency = variant.price?.currency || product.price?.currency || 'INR';
                variantData = {
                    _id: variant._id,
                    attributes: variant.attributes,
                    images: variant.images,
                    stock: variant.stock
                };
            } else {
                unitPrice = product.price?.amount || 0;
                currency = product.price?.currency || 'INR';
            }
        } else {
            unitPrice = product.price?.amount || 0;
            currency = product.price?.currency || 'INR';
        }

        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        return {
            product: {
                _id: product._id,
                title: product.title,
                images: product.images,
                stock: product.stock,
                price: product.price,
                variants: product.variants
            },
            selectedVariant: item.selectedVariant,
            variantData,
            quantity: item.quantity,
            unitPrice,
            currency,
            itemTotal
        };
    });

    return {
        _id: cart._id,
        user: cart.user,
        items: pricedItems,
        subtotal,
        currency: pricedItems[0]?.currency || 'INR',
        total: subtotal
    };
}

async function getCart(req, res) {
    try {
        const userId = req.user.id;
        const pricedCart = await getCartWithPricingData(userId);
        return res.status(200).json({
            success: true,
            msg: "Cart fetched successfully",
            cart: pricedCart
        });
    } catch (error) {
        console.error("getCart Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to retrieve cart" });
    }
}

async function getCartWithPricing(req, res) {
    try {
        const userId = req.user.id;
        const pricedCart = await getCartWithPricingData(userId);
        return res.status(200).json({
            success: true,
            msg: "Cart with pricing fetched successfully",
            cart: pricedCart
        });
    } catch (error) {
        console.error("getCartWithPricing Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to retrieve cart pricing" });
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
        const pricedCart = await getCartWithPricingData(userId);

        return res.status(200).json({
            success: true,
            msg: "Product added to cart",
            cart: pricedCart
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

        const pricedCart = await getCartWithPricingData(userId);
        return res.status(200).json({
            success: true,
            msg: "Cart updated successfully",
            cart: pricedCart
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
        const pricedCart = await getCartWithPricingData(userId);

        return res.status(200).json({
            success: true,
            msg: "Item removed from cart",
            cart: pricedCart
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
    getCartWithPricing,
    addToCart,
    updateCartItem,
    removeFromCart,
    checkout
};
