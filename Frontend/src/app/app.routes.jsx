import {createBrowserRouter} from 'react-router-dom'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'


export  const router = createBrowserRouter([
     {
        path:'/',
        element:<h1 className='bg-black w-full h-screen text-white text-4xl '>Home</h1>
     },
     {
        path:'/login',
        element:<Login/>
     },
     {
        path:'/register',
        element:<Register/>
     }

])