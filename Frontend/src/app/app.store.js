import { configureStore } from "@reduxjs/toolkit";
import Authreducer from './features/auth/auth.slice.js'

export const store = configureStore({
    reducer:{
        auth:Authreducer
    }
})