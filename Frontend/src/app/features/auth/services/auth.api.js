import axios from "axios";

const authapi=axios.create({
    baseURL:"/api/auth",
    withCredentials:true
})
export async function register({email,password,fullname,isseller}){

     try {
        const res=await authapi.post('/register',{email,fullname,password,isseller})

        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Registration failed" }
     }

}
export async function verifyOtp({email,otp}){

     try {
        const res=await authapi.post('/verify-otp',{email,otp})

        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "OTP verification failed" }
     }

}
export async function login({email,password}){
     try {
        const res=await authapi.post('/login',{email,password})

        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Login failed" }
     }
}
export async function getme(){
     try {
        const res=await authapi.get('/get-me')
        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Failed to fetch user session" }
     }
}

export async function becomeSellerApi(){
     try {
        const res=await authapi.post('/become-seller')
        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Failed to become seller" }
     }
}

export async function forgotPasswordApi({email}){
     try {
        const res=await authapi.post('/forgot-password',{email})
        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Failed to send reset OTP" }
     }
}

export async function resetPasswordApi({email,otp,newPassword}){
     try {
        const res=await authapi.post('/reset-password',{email,otp,newPassword})
        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Password reset failed" }
     }
}

export async function logoutApi(){
     try {
        const res=await authapi.post('/logout')
        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Logout failed" }
     }
}

export async function becomeDeliveryApi({ city, pincode }){
     try {
        const res=await authapi.post('/become-delivery', { city, pincode })
        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Failed to become delivery partner" }
     }
}

export async function updateSettingsApi(settings){
     try {
        const res=await authapi.put('/update-settings', settings)
        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Failed to update settings" }
     }
}



