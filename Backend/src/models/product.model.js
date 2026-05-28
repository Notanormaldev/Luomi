import mongoose from "mongoose";



const productSchema = mongoose.Schema({
    title:{
        type:String,
        require:true
    },
    description:{
       type:String
    },
    images:{
       url:{
        type:String,
        require:true
       }
    },
    price:{
       amount:{
        type:Number,
        require:true
       },
       currency:{
        type:String,
        enum:['USD','INR','JPY','GBP','EUR'],
        default:"INR"
       }
    },
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true
    }
},{timestamps:true})



const productmodel = mongoose.model('products',productSchema)


export default productmodel