import { Router } from "express";
import productController from "../controllers/product.controller.js";
import multer from 'multer'
import { validatecreateproduct } from "../validator/product.validator.js";
import { authsellermiddleware } from "../Middleware/authseller.middleware.js";
const upload=multer(
    {storage:multer.memoryStorage(),
       limits:{
        fieldSize:5*1024*1024
       }
    }
)

const productroute=Router()
productroute.post('/createproduct',upload.array("images",7),authsellermiddleware,validatecreateproduct,productController.createproduct)
productroute.get('getproduct/seller',authsellermiddleware,productController.sellergetproducts)
export default productroute