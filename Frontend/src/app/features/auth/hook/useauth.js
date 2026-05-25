import { useDispatch } from "react-redux"
import { getme, login, register } from "../services/auth.api"
import { seterror, setloading, setuser } from "../auth.slice"


const dispatch=useDispatch()
 
export const useauth=()=>{
    async function handleregister({email,contact,fullname,password,isseller=false})
     { 
      dispatch(setloading(true))
      try {
       const data =await register({email,password,contact,fullname,isseller})
       dispatch(setuser(data.user))
      } catch (error) {
        console.log(error)
        dispatch(seterror(error))
      }   
      dispatch(setloading(false))
     }


      async function handlelogin({email,contact,password})
     {
      dispatch(setloading(true))
      try {
          const data =await login({email,password,contact})
          dispatch(setuser(data.user))
      } catch (error) {
        console.log(error)
        dispatch(seterror(error))
      }
      dispatch(setloading(false))
      
     }

       async function handlegetmne()
     {
      dispatch(setloading(true))
      try {
          const data =await getme()
          dispatch(setuser(data.user))
      } catch (error) {
        console.log(error)
        dispatch(seterror(error))
      }
      dispatch(setloading(false))
      
     }
}



