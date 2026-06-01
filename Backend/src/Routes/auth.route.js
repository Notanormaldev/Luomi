import { Router } from "express";
import { validatonlogin, validatonregister } from "../validator/auth.validator.js";
import authController from "../controllers/auth.controller.js";
import { authtokenmiddleware } from "../Middleware/authtoken.middleware.js";
import passport from "passport";
import config from "../config/config.js";

const authrouter = Router()

authrouter.post('/register', validatonregister, authController.register)
authrouter.post('/login', validatonlogin, authController.login)
authrouter.post('/verify-otp', authController.verifyotp)
authrouter.get('/get-me', authtokenmiddleware, authController.getme)
authrouter.post('/become-seller', authtokenmiddleware, authController.becomeSeller)
authrouter.post('/forgot-password', authController.forgotPassword)
authrouter.post('/reset-password', authController.resetPassword)
authrouter.post('/logout', authController.logout)


authrouter.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
)

authrouter.get('/google/callback',
    passport.authenticate('google', { session: false ,failureRedirect:config.NODE_ENVIRONMENT == "development" ?'http://localhost:5173/login':'/login'}),
    authController.googlecallback
)




export default authrouter