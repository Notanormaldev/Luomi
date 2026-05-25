import { Router } from "express";
import { validatonlogin, validatonregister } from "../validator/auth.validator.js";
import authController from "../controllers/auth.controller.js";
import { authtokenmiddleware } from "../Middleware/authtoken.middleware.js";




const authrouter =Router()
authrouter.post('/register',validatonregister,authController.register)
authrouter.post('/login',validatonlogin,authController.login)
authrouter.get('/get-me',authtokenmiddleware,authController.getme)
export default authrouter