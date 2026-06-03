import productmodel from "../models/product.model.js"
import { uploadfile } from "../services/storage.service.js"
import orderModel from "../models/order.model.js"
import orderDao from "../dao/order.dao.js"
import usermodel from "../models/user.model.js"



async function createproduct(req, res) {
  try {
    const { title, description, priceamount, pricecurrency, stock, genderCategory, subCategory } = req.body;
    const user = req.user;

    // Load full user details to check for address/contact info
    const fullUser = await usermodel.findById(user._id || user.id);
    if (!fullUser) {
        return res.status(404).json({ success: false, msg: "Seller user record not found" });
    }
    if (!fullUser.address || !fullUser.city || !fullUser.contact || !fullUser.pincode) {
        return res.status(400).json({
            success: false,
            msg: "Product creation blocked. You must provide complete contact details and address information (address, city, contact, pincode) in Settings before listing products."
        });
    }


   
    let variants = [];
    if (req.body.variants) {
      try {
        variants = JSON.parse(req.body.variants);
      } catch {
        return res.status(400).json({ msg: "Variants JSON invalid ", success: false });
      }
    }

    
    const productFiles = req.files["images"] || [];
    if (productFiles.length === 0) {
      return res.status(400).json({ msg: "need atleast one img", success: false });
    }

    const images = await Promise.all(
      productFiles.map(file =>
        uploadfile({ buffer: file.buffer, fileName: file.originalname })
      )
    );

 
    const builtVariants = await Promise.all(
      variants.map(async (variant, i) => {
        const variantFiles = req.files[`variant_images_${i}`] || [];

        const variantImages = await Promise.all(
          variantFiles.map(file =>
            uploadfile({ buffer: file.buffer, fileName: file.originalname })
          )
        );

        return {
          images: variantImages,
          stock: variant.stock ?? 0,
          attributes: variant.attributes ?? {},
          price: {
            amount: variant.priceamount,
            currency: variant.pricecurrency ?? pricecurrency ?? "INR",
          },
        };
      })
    );


    const product = await productmodel.create({
      title,
      description,
      stock,
      price: {
        amount: priceamount,
        currency: pricecurrency ?? "INR",
      },
      images,
      variants: builtVariants,
      genderCategory: genderCategory || "men",
      subCategory: subCategory || "shirt",
      seller: user._id,
    });

    res.status(201).json({
      msg: "Product created successfully",
      product,
      success: true,
    });

  } catch (error) {
    res.status(500).json({ msg: error.message, success: false });
  }
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
async function getoneproduct(req,res){
  const {id}=req.params

  const product = await productmodel.findById(id).populate('seller')

  
  if(!product){
    return res.status(404).json({
      msg:"No Product by this id"
    })
  }

  return res.status(200).json({
    msg:"Product fetched",
    success:true,
    product
  })
}

async function sellerGetOrders(req, res) {
  try {
    const user = req.user;
    
    const sellerOrders = await orderDao.getOrdersForSeller(user._id);

    return res.status(200).json({
      success: true,
      msg: "Seller orders fetched successfully",
      orders: sellerOrders
    });
  } catch (error) {
    console.error("sellerGetOrders Error:", error);
    return res.status(500).json({ success: false, msg: "Failed to fetch orders" });
  }
}

export default {
    createproduct,sellergetproducts,getallproducts,getoneproduct,sellerGetOrders
}