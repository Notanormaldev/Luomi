import { Router } from "express";
import cartController from "../controllers/cart.controller.js";
import { authtokenmiddleware } from "../Middleware/authtoken.middleware.js";

const cartRoute = Router();

// Apply auth middleware to all cart actions
cartRoute.use(authtokenmiddleware);

cartRoute.get('/', cartController.getCart);
cartRoute.get('/pricing', cartController.getCartWithPricing);
cartRoute.post('/add', cartController.addToCart);
cartRoute.put('/update', cartController.updateCartItem);
cartRoute.post('/remove', cartController.removeFromCart);
cartRoute.post('/checkout', cartController.checkout);

export default cartRoute;
