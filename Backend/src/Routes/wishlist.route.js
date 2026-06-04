import { Router } from "express";
import wishlistController from "../controllers/wishlist.controller.js";
import { authbuyermiddleware } from "../Middleware/authbuyer.middleware.js";

const wishlistRoute = Router();

// Apply auth middleware to all wishlist actions
wishlistRoute.use(authbuyermiddleware);

wishlistRoute.get('/', wishlistController.getWishlist);
wishlistRoute.post('/toggle', wishlistController.toggleWishlist);

export default wishlistRoute;
