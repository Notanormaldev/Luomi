import { useDispatch, useSelector } from "react-redux";
import { createproduct, getallproducts, getoneproduct, getsellerproduct } from "../services/product.api"
import { setproducts, setSellerproducts } from "../prodcut.slice";


export const useproduct = () => {
    const dispatch = useDispatch()
    const { sellerproducts } = useSelector((state) => state.product)

    async function handlecreateproduct(formData) {
        try {
            const data = await createproduct(formData)
            return { success: true, product: data.product, msg: data.msg }
        } catch (error) {
            console.log('hook create error', error)
            return { success: false, error: error.msg || "Failed to create product" }
        }
    }

    async function handlegetsellerprodcut() {
        try {
            const data = await getsellerproduct()
            dispatch(setSellerproducts(data.products))
            return { success: true, products: data.products }
        } catch (error) {
            console.log('hook get error', error)
            return { success: false, error: error.msg || "Failed to fetch products" }
        }
    }

    async function handlegetallprodcuts() {
        try {
            const data = await getallproducts()
           
            
            dispatch(setproducts(data.products))
            return { success: true, products: data.products }
        } catch (error) {
            console.log('hook get error', error)
            return { success: false, error: error.msg || "Failed to fetch products" }
        }
    }


    async function handlegetoneprodcut({productid}) {
        try {
            const data = await getoneproduct({productid})
            return { success: true, products: data.product }
        } catch (error) {
            console.log('hook get error', error)
            return { success: false, error: error.msg || "Failed to fetch products" }
        }
    }

    return {
        sellerproducts,
        handlecreateproduct,
        handlegetsellerprodcut,handlegetallprodcuts,handlegetoneprodcut
    }
}