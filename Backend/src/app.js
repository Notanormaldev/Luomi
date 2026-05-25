import express from 'express'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import authrouter from './Routes/auth.route.js'
import cors from 'cors'
const app=express()
app.use(express.json())
app.use(cookieParser())
app.use(morgan("dev"))
app.use(cors({
    origin:"http://localhost:5173",
    credentials:true,
    Methods:["GET","POST","PUT","DELETE"],
}))
app.use('/api/auth',authrouter)
export default app