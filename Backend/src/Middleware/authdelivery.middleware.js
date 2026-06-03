import jwt from 'jsonwebtoken'
import config from '../config/config.js';
import usermodel from '../models/user.model.js';

export async function authdeliverymiddleware(req, res, next) {
    const token = req.cookies.token

    if (!token) {
        return res.status(401).json({
            msg: "empty token"
        })
    }
    
    try {
        const decoded = jwt.verify(token, config.JWT)
        
        // Fetch up-to-date user from database to check actual role
        const user = await usermodel.findById(decoded.id || decoded.user?._id)
        if (!user || user.role !== "delivery") {
            return res.status(403).json({
                msg: "only delivery partners can see this action"
            })
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
