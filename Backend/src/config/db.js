import mongoose from "mongoose";
import config from "./config.js";


export default function connecttodb(){
  mongoose.connect(config.MONGOURI)
    .then(()=>{
        console.log("MONGODB Connected successfully");
    })
    .catch((err) => {
        console.error("MONGODB Connection FAILED:", err.message);
        process.exit(1);
    });
}