import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Products from "./pages/Products"
import Login from "./pages/Login"
import MainLayout from "./layout/MainLayout"
import BranchProducts from "./pages/BranchProducts"
import QrMenu from "./pages/QrMenu"
import ConfirmOrder from "./pages/ConfirmOrder"
import AdminOrders from "./pages/AdminOrders"
import ProductDetail from "./pages/ProductDetail"
import { Toaster } from "react-hot-toast"

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{ duration: 2000 }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="/branch-products" element={<BranchProducts />} />
          <Route path="/menu" element={<QrMenu />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Route>
        <Route path="/confirm" element={<ConfirmOrder />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin/branches/:id/products" element={<BranchProducts />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
