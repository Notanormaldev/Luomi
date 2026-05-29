import { useDispatch } from "react-redux";
import { createproduct,getsellerproduct } from "../services/product.api"
import { setSellerprodcuts } from "../prodcut.slice";




export const useproduct=()=>{
    const dispatch=useDispatch()
   async function handlecreateprodcut(){
     try {
       const data=await createproduct({formdata})
       return data.product
    } catch (error) {
        console.log('hook',error);
        
    }
   }
   async function handlegetsellerprodcut(){
     try {
       const data=await getsellerproduct()
       dispatch(setSellerprodcuts(data.products))
       return data.products
    } catch (error) {
        console.log('hook',error);
        
    }
   }
}