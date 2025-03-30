import { BrowserRouter, Routes, Route } from "react-router-dom"
import Dashboard from "./pages/Dashboard"
import Products from "./pages/Products"
import Login from "./pages/Login"
import MainLayout from "./layout/MainLayout"
import BranchProducts from "./pages/BranchProducts"
import QrMenu from "./pages/QrMenu"
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="/branch-products" element={<BranchProducts />} />
          <Route path="/menu" element={<QrMenu />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
