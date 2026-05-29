import productmodel from "../models/product.model.js"
import { uploadfile } from "../services/storage.service.js"



async function createproduct(req,res){
   const {title,description,priceamount,pricecurrency}=req.body
  
    
   const user=req.user
   
  const images= await Promise.all(req.files.map(async (file)=>{
    return await uploadfile(
       { buffer:file.buffer,
        fileName:file.originalname
    }
    )
  }))


  const product = await productmodel.create({
    title,
    description,
    price:{
        amount:priceamount,
        currency:pricecurrency
    },
    images:images,
    seller:user._id

  })
   

  res.status(200).json({
    msg:"Product created successfully",
    product,
    success:true
  })
}
async function sellergetproducts(req,res){
     const user=req.user
      
     const products = await productmodel.find({seller:user._id})


     if(!products){
      return res.status(404).json({
        msg:"404 Empty prodcuts"
      })
     }

     return res.status(200).json({
      msg:"products fetch successfully",
      success:true,
      products
     })
}
async function getallproducts(req,res){
     const products= await productmodel.find()

     return res.status(200).json({
      msg:"All products fetched",
      success:true,
      products
     })
}
export default {
    createproduct,sellergetproducts,getallproducts
}