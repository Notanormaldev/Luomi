import { body,validationResult } from "express-validator";


function validatereq(req,res,next){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    next()

}


export const validatecreateproduct=[
    body("title").notEmpty().withMessage("title is required")
    .isLength({min:3}).withMessage("title must be 3 chars long"),
    body("description").optional().isLength({max:500}).withMessage("description must be less than 500 chars"),
    body("priceamount").notEmpty().withMessage("price is required")
    .isNumeric().withMessage("price must be a number"),
    body("pricecurrency").optional().isIn(['USD','INR','JPY','GBP','EUR']).withMessage("currency must be one of USD, INR, JPY, GBP, EUR"),
    validatereq
]