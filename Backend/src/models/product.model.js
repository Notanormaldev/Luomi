import mongoose from "mongoose";



const productSchema = mongoose.Schema({
    title:{
        type:String,
        require:true
    },
    description:{
       type:String
    },
    images:[{
       url:{
        type:String,
        require:true
       }
    }],
    price:{
       amount:{
        type:Number,
        require:true
       },
       currency:{
        type:String,
        enum:['INR'],
        default:"INR"
       }
    },
    stock:{
        type:Number
    },
    variants:[
        {
            images:[
            {
                url:{
                    type:String,
                    require:false
                }
            }
        ],
        stock:{
            type:Number,
            default:0
        },
        attributes:{
            type:Map,
            of:String
        },
          price:{
       amount:{
        type:Number,
        require:true
       },
       currency:{
        type:String,
        enum:['INR'],
        default:"INR"
       }
    }
        }
    ],
    genderCategory:{
        type:String,
        enum:['men','women','kids','unisex'],
        default:'men'
    },
    subCategory:{
        type:String,
        enum:['shirt','t-shirt','pants','cargos','polos','plus size','trouser','jeans'],
        default:'shirt'
    },
    seller:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true
    }
},{timestamps:true})



const productmodel = mongoose.model('products',productSchema)


export default productmodel