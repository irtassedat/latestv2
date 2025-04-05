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

// Kimlik doğrulama kontrolü için basit bir guard fonksiyonu
const PrivateRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem("token") !== null;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// QR Menü ve ilgili sayfalar için açık olan routes
const PublicMenuRoutes = () => (
  <Routes>
    <Route path="/menu" element={<QrMenu />} />
    <Route path="/product/:id" element={<ProductDetail />} />
    <Route path="/confirm" element={<ConfirmOrder />} />
    <Route path="*" element={<Navigate to="/menu" />} />
  </Routes>
);

// Admin paneli için özel routes
const AdminRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/"
      element={
        <PrivateRoute>
          <MainLayout />
        </PrivateRoute>
      }
    >
      <Route index element={<Dashboard />} />
      <Route path="products" element={<Products />} />
      <Route path="branch-products" element={<BranchProducts />} />
      <Route path="admin/orders" element={<AdminOrders />} />
      <Route path="admin/branches/:id/products" element={<BranchProducts />} />
      <Route path="menu" element={<QrMenu />} />
    </Route>
    <Route path="*" element={<Navigate to="/" />} />
  </Routes>
);

function App() {
  // URL'ye göre admin veya public routes'u göster
  const isQrMenuMode = window.location.pathname.startsWith("/menu") || 
                      window.location.pathname.startsWith("/product") || 
                      window.location.pathname.startsWith("/confirm");

  return (
    <BrowserRouter>
      <Toaster position="bottom-center" toastOptions={{ duration: 2000 }} />
      {isQrMenuMode ? <PublicMenuRoutes /> : <AdminRoutes />}
    </BrowserRouter>
  );
}

export default App