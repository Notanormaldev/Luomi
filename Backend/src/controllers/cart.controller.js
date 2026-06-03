import cartModel from "../models/cart.model.js";
import productModel from "../models/product.model.js";
import orderModel from "../models/order.model.js";
import cartDao from "../dao/cart.dao.js";
import Razorpay from 'razorpay';
import config from '../config/config.js';
import usermodel from "../models/user.model.js";
import { sendEmail } from "../services/mailer.service.js";



async function getCart(req, res) {
    try {
        const userId = req.user.id;
        const pricedCart = await cartDao.getCartWithPricing(userId);
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
        const pricedCart = await cartDao.getCartWithPricing(userId);
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
            console.log("addToCart: Product not found in database for ID:", productId);
            return res.status(404).json({ success: false, msg: "Product not found" });
        }

        // Restrict seller self-purchasing
        if (product.seller && product.seller.toString() === userId) {
            return res.status(400).json({ success: false, msg: "You cannot add your own product to the bag." });
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
        const pricedCart = await cartDao.getCartWithPricing(userId);

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

        const pricedCart = await cartDao.getCartWithPricing(userId);
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
        const pricedCart = await cartDao.getCartWithPricing(userId);

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
        const { shippingAddress, paymentMethod } = req.body;

        if (!shippingAddress || !shippingAddress.address || !shippingAddress.city || !shippingAddress.contact || !shippingAddress.pincode) {
            return res.status(400).json({ success: false, msg: "Complete shipping address (address, city, contact, pincode) is required" });
        }

        if (!paymentMethod || !['COD', 'Razorpay'].includes(paymentMethod)) {
            return res.status(400).json({ success: false, msg: "Invalid or missing payment method" });
        }

        const userObj = await usermodel.findById(userId);
        if (!userObj) {
            return res.status(404).json({ success: false, msg: "User not found" });
        }

        const cart = await cartModel.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, msg: "Atelier bag is empty" });
        }

        // 1. Verify stock and self-purchase for all items (but do NOT decrement yet)
        for (const item of cart.items) {
            const product = item.product;
            if (!product) {
                return res.status(404).json({ success: false, msg: "One of the products in your bag is no longer available" });
            }

            // Restrict seller self-purchasing
            if (product.seller && product.seller.toString() === userId) {
                return res.status(400).json({ success: false, msg: `Purchase blocked: You cannot buy your own product (${product.title}).` });
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

        // 2. Calculate total price and build order item list
        let totalAmount = 0;
        const orderItems = [];
        
        for (const item of cart.items) {
            const variantObj = item.selectedVariant && item.product.variants
                ? item.product.variants.find(v => v._id.toString() === item.selectedVariant.toString())
                : null;
            const priceObj = variantObj?.price || item.product.price;
            const itemPrice = priceObj?.amount || 0;
            totalAmount += itemPrice * item.quantity;

            orderItems.push({
                product: item.product._id,
                selectedVariant: item.selectedVariant || null,
                quantity: item.quantity,
                price: {
                    amount: itemPrice,
                    currency: priceObj?.currency || 'INR'
                }
            });
        }

        // 3. Create initial order document
        const orderData = {
            user: userId,
            items: orderItems,
            totalAmount,
            currency: 'INR',
            shippingAddress,
            paymentMethod,
            paymentStatus: 'pending'
        };

        if (paymentMethod === 'COD') {
            orderData.status = 'processing';
            const order = await orderModel.create(orderData);

            // Clear user cart
            cart.items = [];
            await cart.save();

            // Populate order items product details for email template
            const populatedOrder = await orderModel.findById(order._id).populate('items.product');

            // Send Confirmation Email
            try {
                const itemsHtml = populatedOrder.items.map(item => `
                    <div style="border-bottom: 1px solid #E5E5E5; padding: 10px 0; display: flex; justify-content: space-between;">
                        <div>
                            <p style="margin: 0; font-weight: bold; color: #111111;">${item.product.title}</p>
                            <p style="margin: 2px 0 0 0; font-size: 12px; color: #666666;">Quantity: ${item.quantity}</p>
                        </div>
                        <span style="font-weight: bold; color: #111111;">₹${(item.price.amount * item.quantity).toLocaleString('en-IN')}</span>
                    </div>
                `).join('');

                const emailHtml = `
                    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E5E5E5; color: #111111; background-color: #FAFAFA;">
                        <h2 style="text-align: center; border-bottom: 2px solid #111111; padding-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">Luomi Atelier</h2>
                        <h3>Thank you for your order, ${userObj.fullname}!</h3>
                        <p>Your Cash on Delivery order has been successfully placed and is being prepared by our designers.</p>
                        <p style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Order ID: #${order._id.toString().toUpperCase()}</p>
                        
                        <div style="margin: 20px 0;">
                            <h4 style="border-bottom: 1px solid #111111; padding-bottom: 5px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Order Summary</h4>
                            ${itemsHtml}
                            <div style="padding: 15px 0; text-align: right;">
                                <span style="font-size: 14px; color: #666666;">Total Amount (COD): </span>
                                <span style="font-size: 18px; font-weight: bold; color: #111111;">₹${totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        
                        <div style="background-color: #F1F1F1; padding: 15px; border-radius: 2px; margin-top: 20px;">
                            <h4 style="margin-top: 0; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #666666;">Shipping Address</h4>
                            <p style="margin: 0; font-size: 13px; line-height: 1.5;">
                                ${shippingAddress.address}<br/>
                                ${shippingAddress.city} - ${shippingAddress.pincode}<br/>
                                Contact: ${shippingAddress.contact}
                            </p>
                        </div>
                        <p style="text-align: center; color: #888888; font-size: 12px; margin-top: 30px;">© ${new Date().getFullYear()} Luomi Atelier. All rights reserved.</p>
                    </div>
                `;

                await sendEmail({
                    to: userObj.email,
                    subject: "Your Luomi Atelier Order Confirmed - COD",
                    html: emailHtml,
                    text: `Thank you for your order, ${userObj.fullname}! Your order ID is #${order._id.toString().toUpperCase()} for a total of ₹${totalAmount.toLocaleString('en-IN')}.`
                });
            } catch (mailError) {
                console.error("Failed to send COD success email:", mailError);
            }

            return res.status(201).json({
                success: true,
                msg: "Cash on Delivery order placed successfully",
                order
            });

        } else if (paymentMethod === 'Razorpay') {
            orderData.status = 'pending';
            const order = await orderModel.create(orderData);

            // Initialize Razorpay SDK
            const razorpayInstance = new Razorpay({
                key_id: config.RAZORPAY_KEY_ID,
                key_secret: config.RAZORPAY_KEY_SECRET
            });

            // Create Razorpay Order
            const rzpOrder = await razorpayInstance.orders.create({
                amount: Math.round(totalAmount * 100), // in paise
                currency: 'INR',
                receipt: order._id.toString()
            });

            // Save Razorpay order ID to document
            order.razorpayOrderId = rzpOrder.id;
            await order.save();

            // Clear user cart
            cart.items = [];
            await cart.save();

            return res.status(201).json({
                success: true,
                msg: "Razorpay checkout order created",
                order,
                razorpayOrder: rzpOrder,
                key: config.RAZORPAY_KEY_ID
            });
        }

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
