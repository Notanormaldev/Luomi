import jwt from 'jsonwebtoken'
import config from '../config/config.js';
import usermodel from '../models/user.model.js';

export async function authbuyermiddleware(req, res, next) {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            success: false,
            msg: "empty token"
        })
    }
    
    try {
        const decoded = jwt.verify(token, config.JWT)
        
        // Fetch up-to-date user from database to check actual role
        const user = await usermodel.findById(decoded.id || decoded.user?._id)
        if (!user || user.role !== "buyer") {
            return res.status(403).json({
                success: false,
                msg: "Access denied. Only registered Buyers can perform this action."
            });
        }
        
        req.user = user
        next()
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            success: false,
            msg: "Invalid or expired token"
        });
    }
}
