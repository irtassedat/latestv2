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
import Heatmap from "./pages/HeatMap"
import ClarityAnalytics from "./components/ClarityAnalytics"
import Branches from "./pages/Branches"
import UserManagement from "./pages/UserManagement" // Kullanıcı yönetimi sayfası
import UserProfile from "./pages/UserProfile" // veya "./pages/UserProfile.jsx"
import PrivateRoute from "./components/PrivateRoute" // Özel rota bileşeni
import { AuthProvider } from "./contexts/AuthContext" // Auth Context Provider


function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClarityAnalytics />
        <Toaster position="bottom-center" toastOptions={{ duration: 2000 }} />
        <Routes>
          {/* Ana sayfa - doğrudan menüye yönlendir */}
          <Route path="/" element={<Navigate to="/menu" />} />
          
          {/* Kullanıcı Deneyimi Sayfaları - Yetki gerektirmez */}
          <Route path="/menu" element={<QrMenu />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/confirm" element={<ConfirmOrder />} />
          <Route path="/feedback" element={<FeedbackForm />} />
          
          {/* Giriş Sayfası */}
          <Route path="/login" element={<Login />} />
          
          {/* Admin Paneli - Yetkilendirme Gerektirir */}
          <Route path="/admin" element={<PrivateRoute />}>
            <Route element={<MainLayout />}>
              {/* Herkesin erişebileceği rotalar */}
              <Route index element={<Dashboard />} />
              <Route path="profile" element={<UserProfile />} />
              
              {/* Sadece Super Admin erişebilir */}
              <Route element={<PrivateRoute allowedRoles={["super_admin"]} />}>
                <Route path="branches" element={<Branches />} />
                <Route path="products" element={<Products />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="heatmap" element={<Heatmap />} />
              </Route>
              
              {/* Hem Super Admin hem de Branch Manager erişebilir */}
              <Route element={<PrivateRoute allowedRoles={["super_admin", "branch_manager"]} />}>
                <Route path="branch-products" element={<BranchProducts />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="branches/:id/products" element={<BranchProducts />} />
              </Route>
            </Route>
          </Route>
          
          {/* Bulunamayan sayfaları menüye yönlendir */}
          <Route path="*" element={<Navigate to="/menu" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App