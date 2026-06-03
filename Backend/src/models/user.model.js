import mongoose from "mongoose";
import bcrypt from "bcryptjs";
const userSchema = mongoose.Schema({
    email:{
        type:String,
        require:true,
        unique:true
    },
    profilepic:{
        type:String,
        default:"https://ik.imagekit.io/r5nxypvid/image.png?updatedAt=1778947673109"
    },
    contact:{
        type:String,
        require:false,
    },
    password:{
        type:String,
        require:function(){
            return !this.googleid;
        },
        select:false
    },
    fullname:{
        type:String,
        require:true
    },
    isverified:{
        type:Boolean,
        require:true,
        default:false
    },
    googleid:{
        type:String,
        require:false
    },
    otp: { type: String },
    otpExpiry: { type: Date },
    role:{
        type:String,
        enum:["buyer","seller","delivery"],
        default:"buyer"
    },
    address:{
        type:String,
        default:""
    },
    city:{
        type:String,
        default:""
    },
    pincode:{
        type:String,
        default:""
    }
})


userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return 


  const hash =await bcrypt.hash(this.password,10)
    this.password=hash
})

userSchema.methods.comparePassword =async function(password){
    return await bcrypt.compare(password,this.password)
}

const usermodel =  mongoose.model('users',userSchema)

export default usermodel