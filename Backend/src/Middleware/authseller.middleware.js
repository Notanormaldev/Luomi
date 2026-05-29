
import jwt from 'jsonwebtoken'
import config from '../config/config.js';

export async function authsellermiddleware(req,res,next){
    const token = req.cookies.token

    if(!token){
        return res.status(401).json({
            msg:"empty token"
        })
    }
    
    
    try {
        const decoded=jwt.verify(token,config.JWT)
         if(decoded.user.role!=="seller"){
       return res.status(403).json({
        msg:"only seller can create product"
       })
      } 
        req.user=decoded.user

        next()
    } catch (error) {
        console.log(error);
        return res.status(401).json({
            success: false,
            msg: "Invalid or expired token"
        });
    }
}