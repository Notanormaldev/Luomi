import React from 'react'
import { useSelector } from 'react-redux'
import { Navigate } from 'react-router'

function Protected({children,role="buyer"}) {

    const user = useSelector(state=>state.auth.user)
    const loading =useSelector(state=>state.auth.loading)

    if(loading){
        return <h1>loading...</h1>
    }

    if(!user){
        return <Navigate to='/login'/>
    }

   if(user.role !== role){
    return <Navigate to='/'/>
   }

  return children
}

export default Protected
