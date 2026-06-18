import { configDotenv } from "dotenv";
configDotenv()


const requireenvs=[
    "MONGO_URI",
    "JWT",
   "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
    "BREVO_API_KEY",
    "GOOGLE_EMAIL",
    "REDIS_HOST",
    "REDIS_PORT",
    "REDIS_PASSWORD",
    "IMAGEKIT_PRIVATE_KEY",
    "RAZORPAY_KEY_ID",
    "RAZORPAY_KEY_SECRET",
    "NODE_ENVIRONMENT",
    "GEMINI_API_KEY",
    "FRONTEND_URL"
]
requireenvs.forEach((key)=>{
    if(!process.env[key]){
        throw new Error(`${key} is not defined in .env file`)
    }
})





 const config={
    MONGOURI:process.env.MONGO_URI ,
    JWT:process.env.JWT,
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    BREVO_API_KEY:process.env.BREVO_API_KEY,
    GOOGLE_EMAIL:process.env.GOOGLE_EMAIL,
    REDIS_HOST:process.env.REDIS_HOST,
    REDIS_PORT:process.env.REDIS_PORT,
    REDIS_PASSWORD:process.env.REDIS_PASSWORD,
    IMAGEKIT_PRIVATE_KEY:process.env.IMAGEKIT_PRIVATE_KEY,
    RAZORPAY_KEY_ID:process.env.RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET:process.env.RAZORPAY_KEY_SECRET,
    NODE_ENVIRONMENT:process.env.NODE_ENVIRONMENT,
    GEMINI_API_KEY:process.env.GEMINI_API_KEY,
    FRONTEND_URL:process.env.FRONTEND_URL
}


export default config