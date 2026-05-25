import axios from "axios";

const authapi=axios.create({
    baseURL:"http://localhost:3000/api/auth",
    withCredentials:true
})
export async function register({email,contact,password,fullname,isseller}){

     try {
        const res=await authapi.post('/register',{email,contact,fullname,password,isseller})

        return res.data
     } catch (error) {
        console.log(error)
     }

}
export async function login({email,contact,password}){
     try {
        const res=await authapi.post('/login',{email,contact,password})

        return res.data
     } catch (error) {
        console.log(error)
     }
}
export async function getme(){
     try {
        const res=await authapi.get('/get-me')
        return res.data
     } catch (error) {
        console.log(error)
     }
}