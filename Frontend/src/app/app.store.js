import { configureStore } from "@reduxjs/toolkit";
import Authreducer from './features/auth/auth.slice.js'
import Productreduce from './features/products/prodcut.slice.js'
export const store = configureStore({
    reducer:{
        auth:Authreducer,
        product:Productreduce
    }
})