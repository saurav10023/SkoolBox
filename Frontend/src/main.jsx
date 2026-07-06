import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import Layout from './Layout.jsx'
import Home from './Home/Home.jsx'
import UniformDetail from './Home/UniformDetails.jsx'
import BagDetail from './Home/BagDetails.jsx'
import Login from './pages/Login.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import Register from './pages/Register.jsx'
import Profile from './pages/Profile.jsx'
import Cart from './pages/Cart.jsx'
import { CartProvider } from './context/CartContext.jsx'
import AdminDashboard from './pages/Admin.jsx'
import ProductView from './Home/ProductView.jsx'
import ForgotPassword from './pages/ForgetPassword.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderDetail from './pages/OrderDetails.jsx'
import Products from './pages/Products.jsx'


const router = createBrowserRouter([
    {
      path:"/",
      element:<Layout/>,
      children: [
        {index:true , element:<Home/>},
        {path:"/login" , element:<Login/>},
        {path:"/register",element:<Register/>},
        {path:"/profile", element:<Profile/>},
        {path:"cart" , element:<Cart/>},
        {path:"/admin",element:<AdminDashboard/>},
        {path:"/products/:id"  ,element:<ProductView/>},
        {path:"/forgotpassword",element:<ForgotPassword/>},
        {path:"/checkout" , element:<Checkout/>},
        {path:"/orders/:id",element:<OrderDetail/>},
        {path:"/products",element:<Products/>}

      ]
    }
  ])

createRoot(document.getElementById('root')).render(

  <StrictMode>
    <AuthProvider>
      <CartProvider>
        <RouterProvider router ={router}/>
      </CartProvider>
      
    </AuthProvider>
  </StrictMode>,
)
