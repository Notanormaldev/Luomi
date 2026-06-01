import express from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import authrouter from './Routes/auth.route.js'
import cors from 'cors'
import passport from 'passport'
import {Strategy as GoogleStrategy} from 'passport-google-oauth20'
import config from './config/config.js'
import productroute from './Routes/product.route.js'
import cartroute from './Routes/cart.route.js'
import airoute from './Routes/ai.route.js'





const app=express()
app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev"))
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    Methods:["GET","POST","PUT","DELETE"],
}))


app.use(passport.initialize())

passport.use(new GoogleStrategy({
    clientID:config.GOOGLE_CLIENT_ID,
    clientSecret:config.GOOGLE_CLIENT_SECRET,
    callbackURL:"/api/auth/google/callback"
},(accessToken,refreshToken,profile,done)=>{
   return  done(null,profile);
})
)






app.use('/api/auth',authrouter)
app.use('/api/product',productroute)
app.use('/api/cart',cartroute)
app.use('/api/ai',airoute)
export default app