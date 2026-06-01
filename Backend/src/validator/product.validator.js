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
    body("pricecurrency").optional().isIn(['INR']).withMessage("currency must be INR"),
    body("genderCategory").optional().isIn(['men','women','kids','unisex']).withMessage("genderCategory must be men, women, kids or unisex"),
    body("subCategory").optional().isIn(['shirt','t-shirt','pants','cargos','polos','plus size','trouser','jeans']).withMessage("subCategory must be shirt, t-shirt, pants, cargos, polos, plus size, trouser or jeans"),
    validatereq
]