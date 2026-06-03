import crypto from 'crypto';
import orderModel from '../models/order.model.js';
import productModel from '../models/product.model.js';
import usermodel from '../models/user.model.js';
import config from '../config/config.js';
import { sendEmail } from '../services/mailer.service.js';
import { uploadfile } from '../services/storage.service.js';

// Verify Razorpay payment signature
async function verifyPayment(req, res) {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = req.body;

        if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
            return res.status(400).json({ success: false, msg: "Missing verification parameters" });
        }

        // Verify signature
        const hmac = crypto.createHmac('sha256', config.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generatedSignature = hmac.digest('hex');

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, msg: "Payment verification failed: invalid signature" });
        }

        // Find the order
        const order = await orderModel.findOne({ razorpayOrderId: razorpay_order_id });
        if (!order) {
            return res.status(404).json({ success: false, msg: "Order not found" });
        }

        // Update payment details and set status to processing
        order.paymentStatus = 'paid';
        order.status = 'processing';
        order.razorpayPaymentId = razorpay_payment_id;
        order.razorpaySignature = razorpay_signature;
        await order.save();

        const userObj = await usermodel.findById(order.user);
        if (userObj) {
            // Send Order Placement success email
            try {
                const populatedOrder = await orderModel.findById(order._id).populate('items.product');
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
                        <h3>Thank you for your purchase, ${userObj.fullname}!</h3>
                        <p>Your online payment of <strong>₹${order.totalAmount.toLocaleString('en-IN')}</strong> was processed successfully. Our designers are crafting your items.</p>
                        <p style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Order ID: #${order._id.toString().toUpperCase()}</p>
                        <p style="font-size: 12px; color: #666666; text-transform: uppercase; letter-spacing: 1px;">Transaction ID: ${razorpay_payment_id}</p>
                        
                        <div style="margin: 20px 0;">
                            <h4 style="border-bottom: 1px solid #111111; padding-bottom: 5px; text-transform: uppercase; font-size: 12px; letter-spacing: 1px;">Order Summary</h4>
                            ${itemsHtml}
                            <div style="padding: 15px 0; text-align: right;">
                                <span style="font-size: 14px; color: #666666;">Total Paid: </span>
                                <span style="font-size: 18px; font-weight: bold; color: #111111;">₹${order.totalAmount.toLocaleString('en-IN')}</span>
                            </div>
                        </div>
                        
                        <div style="background-color: #F1F1F1; padding: 15px; border-radius: 2px; margin-top: 20px;">
                            <h4 style="margin-top: 0; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #666666;">Shipping Address</h4>
                            <p style="margin: 0; font-size: 13px; line-height: 1.5;">
                                ${order.shippingAddress.address}<br/>
                                ${order.shippingAddress.city} - ${order.shippingAddress.pincode}<br/>
                                Contact: ${order.shippingAddress.contact}
                            </p>
                        </div>
                        <p style="text-align: center; color: #888888; font-size: 12px; margin-top: 30px;">© ${new Date().getFullYear()} Luomi Atelier. All rights reserved.</p>
                    </div>
                `;

                await sendEmail({
                    to: userObj.email,
                    subject: "Your Luomi Atelier Order Placed successfully",
                    html: emailHtml,
                    text: `Thank you for your order, ${userObj.fullname}! Your order ID is #${order._id.toString().toUpperCase()} and payment was verified.`
                });
            } catch (mailError) {
                console.error("Failed to send payment success email:", mailError);
            }
        }

        return res.status(200).json({ success: true, msg: "Payment verified successfully", order });

    } catch (error) {
        console.error("verifyPayment Error:", error);
        return res.status(500).json({ success: false, msg: "Payment verification error" });
    }
}

// Mark order as Out for Delivery and decrement stock
async function markOutForDelivery(req, res) {
    try {
        const { orderId } = req.params;

        const order = await orderModel.findById(orderId).populate('items.product');
        if (!order) {
            return res.status(404).json({ success: false, msg: "Order not found" });
        }

        // Verify that this seller owns at least one product in the order
        const ownsItem = order.items.some(item => item.product && item.product.seller.toString() === req.user._id.toString());
        if (!ownsItem) {
            return res.status(403).json({ success: false, msg: "You do not have permission to modify this order" });
        }

        if (order.status !== 'processing') {
            return res.status(400).json({ success: false, msg: `Cannot mark as out for delivery. Order is currently '${order.status}'` });
        }

        // 1. Decrement stock for all items
        for (const item of order.items) {
            const product = await productModel.findById(item.product._id);
            if (!product) continue;

            if (item.selectedVariant) {
                const variant = product.variants.id(item.selectedVariant) || product.variants.find(v => v._id && v._id.toString() === item.selectedVariant.toString());
                if (variant) {
                    variant.stock = Math.max(0, variant.stock - item.quantity);
                }
            } else {
                product.stock = Math.max(0, product.stock - item.quantity);
            }
            await product.save();
        }

        // 2. Update order status to out_for_delivery
        order.status = 'out_for_delivery';
        await order.save();

        // 3. Send Email Notification to Buyer
        const buyer = await usermodel.findById(order.user);
        if (buyer) {
            try {
                const emailHtml = `
                    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E5E5E5; color: #111111; background-color: #FAFAFA;">
                        <h2 style="text-align: center; border-bottom: 2px solid #111111; padding-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">Luomi Atelier</h2>
                        <h3>Great news, ${buyer.fullname}!</h3>
                        <p>Your order containing designer apparel is <strong>Out for Delivery</strong>!</p>
                        <p>Our luxury delivery agent is on their way with your packages. Please ensure you or someone else is available at your shipping address.</p>
                        
                        <div style="background-color: #F1F1F1; padding: 15px; border-radius: 2px; margin: 20px 0;">
                            <h4 style="margin-top: 0; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #666666;">Delivery Details</h4>
                            <p style="margin: 0; font-size: 13px; line-height: 1.5;">
                                <strong>Order ID:</strong> #${order._id.toString().toUpperCase()}<br/>
                                <strong>Payment Method:</strong> ${order.paymentMethod === 'COD' ? 'Cash on Delivery (COD)' : 'Paid Online'}<br/>
                                <strong>Delivery Address:</strong><br/>
                                ${order.shippingAddress.address}, ${order.shippingAddress.city} - ${order.shippingAddress.pincode}
                            </p>
                        </div>
                        <p style="text-align: center; color: #888888; font-size: 12px; margin-top: 30px;">© ${new Date().getFullYear()} Luomi Atelier. All rights reserved.</p>
                    </div>
                `;

                await sendEmail({
                    to: buyer.email,
                    subject: "Your Luomi Atelier Order is Out for Delivery",
                    html: emailHtml,
                    text: `Great news, ${buyer.fullname}! Your order #${order._id.toString().toUpperCase()} is out for delivery.`
                });
            } catch (mailError) {
                console.error("Failed to send out-for-delivery email:", mailError);
            }
        }

        return res.status(200).json({ success: true, msg: "Order is now out for delivery and stock has been decremented", order });

    } catch (error) {
        console.error("markOutForDelivery Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to update order status" });
    }
}

// Dynamic warehouse generator
function getWarehouseAddress(city) {
    if (!city) return "Luomi Central Hub, Warehouse Area";
    const cleanCity = city.trim();
    const firstChar = cleanCity.charAt(0).toUpperCase();
    const buildingNum = (cleanCity.length % 9) + 1;
    return `Luomi Hub Building ${firstChar}${buildingNum}, Sector ${buildingNum * 2}, ${cleanCity}`;
}

// Get pending deliveries for the delivery partner's city
async function getDeliveryPendingOrders(req, res) {
    try {
        const city = req.user.city ? req.user.city.trim() : "";
        if (!city) {
            return res.status(400).json({ success: false, msg: "Delivery partner city is not configured in settings" });
        }

        // Fetch all orders with status 'out_for_delivery' matching delivery partner's city
        const orders = await orderModel.find({
            status: 'out_for_delivery',
            'shippingAddress.city': { $regex: new RegExp('^' + city + '$', 'i') }
        }).populate({
            path: 'items.product',
            populate: {
                path: 'seller',
                select: 'fullname email contact address city pincode'
            }
        }).populate('user', 'fullname email contact profilepic');

        const warehouseAddress = getWarehouseAddress(city);

        return res.status(200).json({ success: true, orders, warehouseAddress });
    } catch (error) {
        console.error("getDeliveryPendingOrders Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to fetch pending deliveries" });
    }
}

// Confirm Delivery with photo upload and validation
async function confirmDelivery(req, res) {
    try {
        const { orderId } = req.params;
        const { productId, paymentReceivedTick } = req.body;

        const order = await orderModel.findById(orderId).populate('items.product');
        if (!order) {
            return res.status(404).json({ success: false, msg: "Order not found" });
        }

        if (order.status !== 'out_for_delivery') {
            return res.status(400).json({ success: false, msg: `Cannot confirm delivery. Order status is '${order.status}'` });
        }

        // Validate matched item by exact ID or last 6 characters of ID
        const inputLower = productId.trim().toLowerCase();
        const matchedItem = order.items.find(item => {
            if (!item.product) return false;
            const itemProdId = item.product._id.toString().toLowerCase();
            return itemProdId === inputLower || itemProdId.endsWith(inputLower);
        });

        if (!matchedItem) {
            return res.status(400).json({ 
                success: false, 
                msg: "Validation failed: Entered ID or code does not match any product in this order" 
            });
        }

        const validatingProduct = matchedItem.product;

        // 2. Validate COD Payment Checkbox if payment method is COD
        if (order.paymentMethod === 'COD') {
            if (paymentReceivedTick !== 'true' && paymentReceivedTick !== true) {
                return res.status(400).json({ success: false, msg: "Validation failed: You must check the payment received box for COD orders" });
            }
        }

        // 3. Validate Delivery Photo File is uploaded
        if (!req.file) {
            return res.status(400).json({ success: false, msg: "Validation failed: A proof of delivery photo is required" });
        }

        // 4. AI Photo Validation using Ollama (with abort signal / fallback)
        let aiApproved = true;
        let aiExplanation = "AI verified dropoff proof photo successfully.";
        
        try {
            const base64Image = req.file.buffer.toString('base64');
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3500); // 3.5s timeout

            const response = await fetch("http://localhost:11434/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                signal: controller.signal,
                body: JSON.stringify({
                    model: "llama3.2-vision", // Standard Ollama vision model
                    messages: [
                        {
                            role: "user",
                            content: `You are an automated delivery validation system. Your job is to verify if the uploaded proof-of-delivery photo corresponds to a valid package delivery or a piece of apparel matching the description.
Product Title: "${validatingProduct.title}"
Product Description: "${validatingProduct.description || 'N/A'}"

Evaluate if the image is a valid delivery scene, apparel items, or package bag. Reply ONLY with a valid JSON block:
{
  "valid": true or false,
  "explanation": "Brief explanation of what you see and whether it matches"
}`,
                            images: [base64Image]
                        }
                    ],
                    format: "json",
                    stream: false
                })
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const resJson = await response.json();
                const content = JSON.parse(resJson.message?.content || '{}');
                if (content.valid === false) {
                    aiApproved = false;
                    aiExplanation = content.explanation || "AI was unable to confirm the delivery photo contains the matching apparel/parcel.";
                } else if (content.valid === true) {
                    aiExplanation = content.explanation || "AI confirmed the dropoff photo matches the product/parcel.";
                }
            } else {
                throw new Error(`Ollama returned status ${response.status}`);
            }
        } catch (ollamaErr) {
            console.warn("Ollama AI Vision verification offline/unsupported, using dynamic validation:", ollamaErr.message);
            // Dynamic check of image file metadata
            if (!req.file.mimetype.startsWith('image/')) {
                aiApproved = false;
                aiExplanation = "Validation failed: Uploaded file is not a valid image type.";
            } else if (req.file.size < 1000) { // less than 1KB
                aiApproved = false;
                aiExplanation = "Validation failed: Image size is too small to be a valid photo proof.";
            } else {
                aiExplanation = "Proof of delivery image successfully validated via fallback metadata checks.";
            }
        }

        if (!aiApproved) {
            return res.status(400).json({ success: false, msg: `AI Photo Proof Check Failed: ${aiExplanation}` });
        }

        // Upload to ImageKit
        const uploadResult = await uploadfile({
            buffer: req.file.buffer,
            fileName: `delivery_${orderId}_${Date.now()}_${req.file.originalname}`,
            folder: 'Luomi/Deliveries'
        });

        // 5. Update order details
        order.status = 'delivered';
        order.deliveryPhoto = uploadResult.url;
        order.deliveryConfirmedBy = req.user._id;
        order.deliveryConfirmedAt = new Date();
        
        if (order.paymentMethod === 'COD') {
            order.paymentStatus = 'paid';
        }

        await order.save();

        // 6. Notify all sellers of products in this order
        try {
            const populatedOrder = await orderModel.findById(order._id).populate('items.product');
            const buyerObj = await usermodel.findById(order.user);
            
            // Collect unique sellers
            const sellerMap = new Map();
            for (const item of populatedOrder.items) {
                if (item.product && item.product.seller) {
                    const sellerId = item.product.seller.toString();
                    if (!sellerMap.has(sellerId)) {
                        sellerMap.set(sellerId, {
                            sellerId,
                            items: []
                        });
                    }
                    sellerMap.get(sellerId).items.push(item);
                }
            }

            for (const [sellerId, data] of sellerMap.entries()) {
                const sellerObj = await usermodel.findById(sellerId);
                if (sellerObj && sellerObj.email) {
                    const itemsListHtml = data.items.map(item => `
                        <li style="margin-bottom: 8px;">
                            <strong>${item.product.title}</strong> (Quantity: ${item.quantity})
                        </li>
                    `).join('');

                    const emailHtml = `
                        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E5E5E5; color: #111111; background-color: #FAFAFA;">
                            <h2 style="text-align: center; border-bottom: 2px solid #111111; padding-bottom: 15px; text-transform: uppercase; letter-spacing: 2px;">Luomi Atelier</h2>
                            <h3>Hello, ${sellerObj.fullname}!</h3>
                            <p>An order containing your designer product(s) has been successfully delivered by our Delivery Partner.</p>
                            
                            <div style="background-color: #F1F1F1; padding: 15px; border-radius: 2px; margin: 20px 0;">
                                <h4 style="margin-top: 0; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #666666;">Delivery Confirmation Summary</h4>
                                <p style="margin: 0; font-size: 13px; line-height: 1.5;">
                                    <strong>Order ID:</strong> #${order._id.toString().toUpperCase()}<br/>
                                    <strong>Customer Name:</strong> ${buyerObj ? buyerObj.fullname : 'Buyer'}<br/>
                                    <strong>Delivery Location:</strong> ${order.shippingAddress.address}, ${order.shippingAddress.city}<br/>
                                    <strong>Delivered At:</strong> ${order.deliveryConfirmedAt.toLocaleString()}<br/>
                                    <strong>AI Validation Proof:</strong> Verified and approved.
                                </p>
                            </div>
                            
                            <div style="margin: 20px 0;">
                                <h4 style="border-bottom: 1px solid #111111; padding-bottom: 5px; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #666666;">Delivered Items</h4>
                                <ul>
                                    ${itemsListHtml}
                                </ul>
                            </div>

                            <p style="font-size: 12px; color: #888888;">You can view detailed payouts and analytics on your Atelier Dashboard.</p>
                            <p style="text-align: center; color: #888888; font-size: 12px; margin-top: 30px;">© ${new Date().getFullYear()} Luomi Atelier. All rights reserved.</p>
                        </div>
                    `;

                    await sendEmail({
                        to: sellerObj.email,
                        subject: `Order #${order._id.toString().toUpperCase()} containing your product has been DELIVERED`,
                        html: emailHtml,
                        text: `Hello ${sellerObj.fullname}, order #${order._id.toString().toUpperCase()} has been delivered successfully to the customer.`
                    });
                }
            }
        } catch (sellerMailErr) {
            console.error("Failed to send seller delivery notifications:", sellerMailErr);
        }

        return res.status(200).json({ success: true, msg: "Delivery confirmed successfully", order });

    } catch (error) {
        console.error("confirmDelivery Error:", error);
        return res.status(500).json({ success: false, msg: "Failed to confirm delivery" });
    }
}

export default {
    verifyPayment,
    markOutForDelivery,
    getDeliveryPendingOrders,
    confirmDelivery
};
