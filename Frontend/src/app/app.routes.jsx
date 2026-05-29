import {createBrowserRouter} from 'react-router-dom'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import CreateProduct from './features/products/pages/CreateProduct'
import Dashbord from './features/products/pages/Dashbord'
import Protected from './features/auth/components/Protected'
import Home from './features/products/pages/Home'


export  const router = createBrowserRouter([
     {
        path:'/',
        element:<Home/>
     },
     {
        path:'/login',
        element:<Login/>
     },
     {
        path:'/register',
        element:<Register/>
     },
     {
        path:'/createproduct/seller',
        element:<Protected role="seller">
         <CreateProduct/>
         </Protected>
     },{
      path:'/dashbord/seller',
      element:<Protected role='seller'>
         <Dashbord/>
         </Protected>
     }

])