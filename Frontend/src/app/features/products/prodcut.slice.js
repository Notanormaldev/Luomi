import { createSlice } from "@reduxjs/toolkit";


const productSlice =createSlice({
    name:"product",
    initialState:{
        sellerproducts:[],
        products:[]
    },
    reducers:{
        setSellerproducts:(state,action)=>{
            state.sellerproducts=action.payload
        },
        setproducts:(state,action)=>{
            
            
            state.products=action.payload
        }
    }
})

export const {setSellerproducts,setproducts}=productSlice.actions
export default productSlice.reducer