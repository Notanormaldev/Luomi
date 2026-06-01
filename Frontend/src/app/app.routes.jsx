import {createBrowserRouter} from 'react-router-dom'
import Login from './features/auth/pages/Login'
import Register from './features/auth/pages/Register'
import CreateProduct from './features/products/pages/CreateProduct'
import Dashbord from './features/products/pages/Dashbord'
import Protected from './features/auth/components/Protected'
import Home from './features/products/pages/Home'
import Productdetails from './features/products/pages/Productdetails'
import Sellerproductdetails from './features/products/pages/Sellerproductdetails'
import Settings from './features/auth/pages/Settings'


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
       path:'/product/:id',
       element:<Productdetails/>
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
     },{
      path:'/product/:id/seller',
      element:<Protected role='seller'>
         <Sellerproductdetails/>
         </Protected>
     },{
       path:'/settings',
       element:<Settings/>
     }

])