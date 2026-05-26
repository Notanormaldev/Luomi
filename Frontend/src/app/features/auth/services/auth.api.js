import axios from "axios";

const authapi=axios.create({
    baseURL:"/api/auth",
    withCredentials:true
})
export async function register({email,contact,password,fullname,isseller}){

     try {
        const res=await authapi.post('/register',{email,contact,fullname,password,isseller})

        return res.data
     } catch (error) {
        throw error.response?.data || { msg: "Registration failed" }
     }

}
export async function login({email,contact,password}){
     try {
        const res=await authapi.post('/login',{email,contact,password})

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