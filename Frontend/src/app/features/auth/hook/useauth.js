import { useDispatch, useSelector } from "react-redux"
import { getme, login, register, verifyOtp } from "../services/auth.api"
import { seterror, setloading, setuser } from "../auth.slice"

export const useauth = () => {
    const dispatch = useDispatch()
    const { user, loading, error } = useSelector((state) => state.auth)
 
    async function handleregister({email,fullname,password,isseller=false})
    { 
      dispatch(setloading(true))
      dispatch(seterror(null))
      try {
        const data = await register({email,password,fullname,isseller})
        dispatch(setloading(false))
        return { success: true, requiresOtp: data.requiresOtp, data }
      } catch (err) {
        console.log("Registration error:", err)
        dispatch(seterror(err))
        dispatch(setloading(false))
        throw err
      }   
    }

    async function handleverifyotp({email,otp})
    {
      dispatch(setloading(true))
      dispatch(seterror(null))
      try {
        const data = await verifyOtp({email,otp})
        dispatch(setuser(data.user))
        dispatch(setloading(false))
        return { success: true, data }
      } catch (err) {
        console.log("OTP verification error:", err)
        dispatch(seterror(err))
        dispatch(setloading(false))
        throw err
      }
    }

    async function handlelogin({email,password})
    {
      dispatch(setloading(true))
      dispatch(seterror(null))
      try {
        const data = await login({email,password})
        dispatch(setuser(data.user))
        dispatch(setloading(false))
        return { success: true, data }
      } catch (err) {
        console.log("Login error:", err)
        dispatch(seterror(err))
        dispatch(setloading(false))
        throw err
      }
    }

    async function handlegetme()
    {
      dispatch(setloading(true))
      dispatch(seterror(null))
      try {
        const data = await getme()
        dispatch(setuser(data.user))
        dispatch(setloading(false))
        return { success: true, data }
      } catch (err) {
        console.log("GetMe error:", err)
        dispatch(seterror(err))
        dispatch(setloading(false))
        throw err
      }
    }

    async function handlegoogleauth(token)
    {
      dispatch(setloading(true))
      dispatch(seterror(null))
      try {
        // This function needs to be implemented based on your backend Google auth endpoint
        console.log("Google auth token:", token)
        // const data = await googleLogin({token})
        // dispatch(setuser(data.user))
        dispatch(setloading(false))
        return { success: true }
      } catch (err) {
        console.log("Google auth error:", err)
        dispatch(seterror(err))
        dispatch(setloading(false))
        throw err
      }
    }



    return {
        user,
        loading,
        error,
        handleregister,
        handlelogin,
        handlegetme,
        handlegoogleauth,
        handleverifyotp
    }
}
