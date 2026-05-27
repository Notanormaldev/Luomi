import { configDotenv } from "dotenv";
configDotenv()


if(!process.env.MONGO_URI){
    throw new Error("MONGO_URI is not defined in .env file");
}
if(!process.env.JWT){   
    throw new Error("JWT is not defined in .env file");
}


 const config={
    MONGOURI:process.env.MONGO_URI ,
    JWT:process.env.JWT,
    GOOGLE_CLIENT_ID:process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET:process.env.GOOGLE_CLIENT_SECRET,
    NODE_ENVIRONMENT:process.env.NODE_ENVIRONMENT
}


export default config