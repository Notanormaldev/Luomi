import config from "../config/config.js"
import usermodel from "../models/user.model.js"
import jwt from "jsonwebtoken"
import { OAuth2Client } from 'google-auth-library'
import { sendEmail } from "../services/mailer.service.js"
import { sendOtpEmail,generateOtp } from "../utils/sendotp.js"
import redis from "../config/cache.js"




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
   const { email,fullname, password, isseller } = req.body;

  try {
    const existuser = await usermodel.findOne({
      $or: [{ email }]
    });

   
    if (existuser && !existuser.isverified) {
      const otp = generateOtp();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

      await usermodel.findByIdAndUpdate(existuser._id, { otp, otpExpiry });
      await sendOtpEmail(existuser.email, otp);

      return res.status(200).json({
        msg: "OTP resent to your email, please verify",
        success: true,
        requiresOtp: true,
        email,
      });
    }

    if (existuser && existuser.isverified) {
      return res.status(400).json({
        msg: "User with this email or contact already exists"
      });
    }


    const otp = generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await usermodel.create({
      email, fullname, password,
      role: isseller ? "seller" : "buyer",
      otp,
      otpExpiry,
      isverified: false,
    });

    await sendOtpEmail(email, otp);

    return res.status(200).json({
      msg: "OTP sent to your email, please verify",
      success: true,
      requiresOtp: true,
      email,
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Server error" });
  }
}
async function verifyotp(req, res) {
  const { email, otp } = req.body;

  try {
    const user = await usermodel.findOne({ email });

    if (!user) {
      return res.status(400).json({ msg: "User not found, please register again" });
    }

    if (user.isverified) {
      return res.status(400).json({ msg: "Already verified, please login" });
    }

    if (user.otp !== otp) {
      return res.status(401).json({ msg: "Invalid OTP" });
    }

    if (user.otpExpiry < new Date()) {
      return res.status(401).json({ msg: "OTP expired, please register again" });
    }

    await usermodel.findByIdAndUpdate(user._id, {
      isverified: true,
      otp: null,
      otpExpiry: null,
    });

    const verifiedUser = await usermodel.findById(user._id);
    await tokenresponse(verifiedUser, res, "Registration successful");

  } catch (error) {
    console.log(error);
    return res.status(500).json({ msg: "Server error" });
  }
}
async function login(req,res){
  const {email,password} = req.body

  try {
    
  const user = await usermodel.findOne({
    $or:[
        {email}
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
async function logout(req,res){
  const token = req.cookies.token;
  res.clearCookie('token');
  await redis.set(token,Date.now().toString(),'EX',3600)

   res.clearCookie('token', {
    httpOnly: true,
    secure: true,        
    sameSite: 'none',    
    path: '/'            
  });
  return res.status(200).json({
    msg:"logout sucessfully"
  })
}
async function deleteaccount(req,res){
    const id = req.user.id

     
    const finduser = await usermodel.findById(id)

    if(!finduser){
        return res.status(401).json({
            msg:"user not exist"
        })
    }
    
    await usermodel.findByIdAndDelete(id)
    res.clearCookie('token')

    return res.status(200).json({
        msg:"user deleted sucessfully"
    })
}



export default {
    register,
    login,
    getme,
    googlecallback,
    verifyotp,
    logout,
    deleteaccount
}