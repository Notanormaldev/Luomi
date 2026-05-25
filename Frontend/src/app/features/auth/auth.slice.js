import { createSlice } from "@reduxjs/toolkit";
const authslice=createSlice({
    name:"auth",
    initialState:{
        user:null,
        loading:false,
        error:null
    },
    reducers:{
        setuser:(state,action)=>{
            state.user=action.playload
        },
        setloading:(state,action)=>{
            state.loading=action.payload
        },
        seterror:(state,action)=>{
            state.error=action.payload
        }
    }
})

export const {setuser,setloading,seterror}=authslice.actions
export default authslice.reducer