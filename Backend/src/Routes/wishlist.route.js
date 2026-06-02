import { Router } from "express";
import wishlistController from "../controllers/wishlist.controller.js";
import { authtokenmiddleware } from "../Middleware/authtoken.middleware.js";

const wishlistRoute = Router();

// Apply auth middleware to all wishlist actions
wishlistRoute.use(authtokenmiddleware);

wishlistRoute.get('/', wishlistController.getWishlist);
wishlistRoute.post('/toggle', wishlistController.toggleWishlist);

export default wishlistRoute;
