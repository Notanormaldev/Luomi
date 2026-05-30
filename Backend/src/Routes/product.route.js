import { Router } from "express";
import productController from "../controllers/product.controller.js";
import multer from 'multer'
import { validatecreateproduct } from "../validator/product.validator.js";
import { authsellermiddleware } from "../Middleware/authseller.middleware.js";
const upload=multer(
    {storage:multer.memoryStorage(),
       limits:{
        fileSize:5*1024*1024
       }
    }
)
const MAX_VARIANTS = 10

const variantImageFields = Array.from({length: MAX_VARIANTS}, (_, i) => ({
    name: `variant_images_${i}`,
    maxCount: 5
}))

const uploadFields = upload.fields([
    { name: "images", maxCount: 7 },  
    ...variantImageFields              
])








const productroute=Router()
productroute.post('/createproduct',uploadFields,authsellermiddleware,validatecreateproduct,productController.createproduct)
productroute.get('/getproduct/seller',authsellermiddleware,productController.sellergetproducts)
productroute.get('/',productController.getallproducts)
productroute.get('/:id',productController.getoneproduct)
export default productroute