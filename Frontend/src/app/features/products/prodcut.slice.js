import { createSlice } from "@reduxjs/toolkit";


const productSlice =createSlice({
    name:"product",
    initialState:{
        sellerproducts:[]
    },
    reducers:{
        setSellerprodcuts:(state,action)=>{
            state.sellerproducts=action.payload
        }
    }
})

export const {setSellerprodcuts}=productSlice.actions
export default productSlice.reducer