// src/components/PrivateRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

// Temel yetkilendirme kontrolü yapan bileşen
const PrivateRoute = ({ allowedRoles = [] }) => {
  const { currentUser, loading } = useAuth();
  
  // Yükleme durumunda bir gösterge göster
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#022B45]"></div>
      </div>
    );
  }
  
  // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  
  // Rol kontrolü varsa ve kullanıcının rolü izin verilen roller arasında değilse
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    // İzni olmayan kullanıcılar için iznin olduğu sayfaya yönlendir
    // Şube yöneticileri için şube ürünlerine, diğerleri için dashboard'a
    if (currentUser.role === 'branch_manager') {
      return <Navigate to="/admin/branch-products" replace />;
    }
    
    return <Navigate to="/admin" replace />;
  }
  
  // Tüm kontroller başarılıysa Outlet ile iç içeriği render et
  return <Outlet />;
};

export default PrivateRoute;