import { body,validationResult } from "express-validator";


function validatereq(req,res,next){
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors:errors.array()});
    }
    next()

}

export const validatonregister=[
    body("email").isEmail().withMessage("INVALID EMAIL"),

    body('password').isLength({min:8}).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).withMessage("password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"),

    body('fullname').notEmpty().withMessage("fullname required")
    .isLength({min:3}).withMessage("fullname must be 3 chars long"),


    validatereq
]

export const validatonlogin=[
    body("email").isEmail().withMessage("INVALID EMAIL"),

    body('password').isLength({min:8}).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/).withMessage("password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character"),


    validatereq
]