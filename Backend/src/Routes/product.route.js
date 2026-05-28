import { Router } from "express";
import { authtokenmiddleware } from "../Middleware/authtoken.middleware.js";
import productController from "../controllers/product.controller.js";
import multer from 'multer'
import { validatecreateproduct } from "../validator/product.validator.js";
const upload=multer(
    {storage:multer.memoryStorage(),
       limits:{
        fieldSize:5*1024*1024
       }
    }
)

const productroute=Router()
productroute.post('/createproduct',upload.array("images",7),authtokenmiddleware,validatecreateproduct,productController.createproduct)

export default productroute