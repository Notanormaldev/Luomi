import axios from 'axios'


const productapi=axios.create({
    baseURL:"/api/product",
    withCredentials:true
})


export async function createproduct(formdata){
    try {
        const res = await productapi.post('/createproduct', formdata, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        return res.data
    } catch (error) {
        console.log("Api error:", error)
        throw error.response?.data || { msg: "Product creation failed" }
    }
}

export async function getsellerproduct(){
    try {
        const res = await productapi.get('/getproduct/seller')
        return res.data
    } catch (error) {
        console.log("Api error:", error)
        throw error.response?.data || { msg: "Failed to fetch products" }
    }
}

export async function getallproducts(){
    try {
         const res = await productapi.get('/')
         
         
        return res.data
    } catch (error) {
         console.log("Api error:", error)
        throw error.response?.data || { msg: "Failed to fetch products" }
    }
}