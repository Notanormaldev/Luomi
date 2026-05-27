import config from "../config/config.js"
import usermodel from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { OAuth2Client } from 'google-auth-library'





async function tokenresponse(user,res,msg){
   const token = jwt.sign({
    id:user._id,
    user:user
   },config.JWT,{expiresIn:'7d'})

   res.cookie('token',token)
   
   user.password=undefined
   return res.status(201).json({
    msg,
    success:true,
    user:user
   })

}
async function register(req,res){
  const {email,contact,fullname,password,isseller}=req.body


  try {
    const existuser = await usermodel.findOne({
        $or:[{email},{contact}]
    })

    if(existuser){
        return res.status(400).json({
            msg:'user with this email or contact already exist'
        })
    }


    const user =await usermodel.create({
        email,contact,fullname,password,role:isseller ? "seller" :"buyer"
    })

  await tokenresponse(user,res,"User register successfully");

  } catch (error) {
    console.log(error);
    return res.status(500).json({
        msg:"server error"
    })
    
  }
  

}
async function login(req,res){
  const {contact,email,password} = req.body

  try {
    
  const user = await usermodel.findOne({
    $or:[
        {email},{contact}
    ]
  }).select('+password')

  if(!user){
    return res.status(400).json({
        msg:"user not exist please register"
    })
  }

  const isvalid = await user.comparePassword(password);

  if(!isvalid){
    return res.status(401).json({
   msg:"Invalid password"
    })
  }
    await tokenresponse(user,res,"Login successfully")
    
  

  } catch (error) {
      console.log(error);
    return res.status(500).json({
        msg:"server error"
    })
  }
}
async function getme(req,res){
     const decoded = req.user

     try {
        const user = await usermodel.findById(decoded.id)

     if(!user){
        return res.status(404).json({
            success:false,
            msg:"user not exist"
        })
     }


     return res.status(200).json({
        success:true,
        user:user
     })
     } catch (error) {
         console.log(error);

        return res.status(500).json({
            success: false,
            msg: "Internal server error"
        });
     }
}
async function verifiedemail(req,res){
   
}
async function googlecallback(req,res){
  console.log(req.user);
  
  const {emails,id,displayName,photos} = req.user
  const email=emails[0].value
  const profilepic=photos[0].value
  const isverified=emails[0].verified

  const user = await usermodel.findOne({email})

  if(!user){
     user = await usermodel.create({
      email:email,
      fullname:displayName,
      profilepic:profilepic,
      isverified:isverified,
      googleid:id
    })
  }


  const token=jwt.sign({
    id:user._id,
    user:user
  },config.JWT,{expiresIn:"7d"})
  res.cookie('token',token)
  res.redirect('http://localhost:5173')
}



export default {
    register,
    login,
    getme,
    googlecallback,
    verifiedemail  
}