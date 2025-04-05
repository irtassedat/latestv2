import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
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
import FeedbackForm from "./pages/FeedbackForm"

// Kimlik doğrulama kontrolü için basit bir guard fonksiyonu
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("token") !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{ duration: 2000 }} />
      <Routes>
        {/* Ana sayfa - doğrudan menüye yönlendir */}
        <Route path="/" element={<Navigate to="/menu" />} />
        
        {/* Kullanıcı Deneyimi Sayfaları */}
        <Route path="/menu" element={<QrMenu />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/confirm" element={<ConfirmOrder />} />
        <Route path="/feedback" element={<FeedbackForm />} />
        
        {/* Admin Giriş ve Admin Paneli Sayfaları */}
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="branch-products" element={<BranchProducts />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="branches/:id/products" element={<BranchProducts />} />
        </Route>
        
        {/* Bulunamayan sayfaları menüye yönlendir */}
        <Route path="*" element={<Navigate to="/menu" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App