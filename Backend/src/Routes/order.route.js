import { Router } from "express";
import orderController from "../controllers/order.controller.js";
import { authtokenmiddleware } from "../Middleware/authtoken.middleware.js";
import { authsellermiddleware } from "../Middleware/authseller.middleware.js";
import { authdeliverymiddleware } from "../Middleware/authdelivery.middleware.js";
import multer from 'multer';

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

const orderRoute = Router();

// Payment verification (buyer)
orderRoute.post('/verify-payment', authtokenmiddleware, orderController.verifyPayment);

// Out for delivery mark (seller)
orderRoute.post('/seller/out-for-delivery/:orderId', authsellermiddleware, orderController.markOutForDelivery);

// Get pending deliveries matching partner's city (delivery)
orderRoute.get('/delivery/pending', authdeliverymiddleware, orderController.getDeliveryPendingOrders);

// Confirm delivery with photo upload and validations (delivery)
orderRoute.post('/delivery/confirm/:orderId', authdeliverymiddleware, upload.single('deliveryPhoto'), orderController.confirmDelivery);

export default orderRoute;
