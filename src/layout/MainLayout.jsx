// src/layout/MainLayout.jsx
import { useState, useEffect } from "react"
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import { FiLogOut, FiUser, FiSettings, FiUsers, FiHome, FiPackage, FiShoppingBag, FiFileText, FiSmartphone, FiTrendingUp, FiMap } from "react-icons/fi"

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout, isSuperAdmin, isBranchManager } = useAuth()

  // Açık menüler localStorage'a kaydedilir
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      setSidebarOpen(JSON.parse(savedState));
    }
  }, []);

  // Sidebar durumunu kaydet
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  }

  // Çıkış işlemi
  const handleLogout = () => {
    logout()
  }

  // Rol bazlı menü öğeleri
  const getMenuItems = () => {
    // Tüm kullanıcıların erişebileceği temel menü öğeleri
    const baseMenuItems = [
      { path: "/admin", label: "Dashboard", icon: <FiHome size={20} /> },
      { path: "/admin/profile", label: "Profil", icon: <FiUser size={20} /> },
    ];
    
    // Sadece super admin'in görebileceği menü öğeleri
    const superAdminItems = [
      { path: "/admin/branches", label: "Şubeler", icon: <FiMap size={20} /> },
      { path: "/admin/products", label: "Ürünler", icon: <FiPackage size={20} /> },
      { path: "/admin/users", label: "Kullanıcılar", icon: <FiUsers size={20} /> },
      { path: "/admin/heatmap", label: "Isı Haritası", icon: <FiTrendingUp size={20} /> },
    ];
    
    // Hem super admin hem de branch manager'ın görebileceği menü öğeleri
    const sharedItems = [
      { path: "/admin/branch-products", label: "Şube Ürünleri", icon: <FiShoppingBag size={20} /> },
      { path: "/admin/orders", label: "Siparişler", icon: <FiFileText size={20} /> },
      { path: "/menu", label: "QR Menü", icon: <FiSmartphone size={20} /> },
    ];
    
    // Rol bazlı menü öğelerini birleştir
    if (isSuperAdmin) {
      return [...baseMenuItems, ...superAdminItems, ...sharedItems];
    } else {
      return [...baseMenuItems, ...sharedItems];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <div 
        className={`bg-[#022B45] text-white fixed h-full z-40 transition-all duration-300 shadow-lg
          ${sidebarOpen ? "w-64" : "w-20"}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo ve Toggle */}
          <div className="p-4 border-b border-[#022B45]/60 flex items-center justify-between">
            {sidebarOpen ? (
              <div className="font-bold text-lg">Çeşme Kahve</div>
            ) : (
              <div className="mx-auto font-bold text-xl">☕</div>
            )}
            
            <button
              onClick={toggleSidebar}
              className="text-white/80 hover:text-white"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>

          {/* Kullanıcı Bilgisi */}
          <div className={`mt-2 px-4 py-3 ${sidebarOpen ? 'flex items-center' : 'flex flex-col items-center'}`}>
            <div className="h-10 w-10 rounded-full bg-[#D98A3D] text-white flex items-center justify-center font-medium text-lg">
              {currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
            </div>
            
            {sidebarOpen && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">{currentUser?.username}</p>
                <p className="text-xs text-white/70 truncate">
                  {isSuperAdmin ? 'Süper Admin' : 'Şube Yöneticisi'}
                </p>
              </div>
            )}
          </div>

          {/* Menu Links */}
          <nav className="mt-4 flex-1 overflow-y-auto">
            <div className="px-4 mb-2 text-xs text-white/50 uppercase">
              {sidebarOpen ? "Menü" : ""}
            </div>
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center py-3 px-4 transition-colors ${
                  location.pathname === item.path
                    ? "bg-[#D98A3D] text-white"
                    : "text-white/80 hover:bg-[#D98A3D]/30"
                } ${!sidebarOpen ? "justify-center" : ""}`}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && <span className="ml-3 text-sm">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-blue-800">
            <button
              onClick={handleLogout}
              className={`flex items-center text-white/80 hover:text-white ${!sidebarOpen ? "justify-center" : ""}`}
            >
              <FiLogOut size={20} />
              {sidebarOpen && <span className="ml-3 text-sm">Çıkış Yap</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div 
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="text-xl font-semibold text-gray-800">
              {/* Aktif sayfanın başlığını göster */}
              {menuItems.find((item) => item.path === location.pathname)?.label || "Yönetim Paneli"}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-full">
                <div className="w-8 h-8 bg-[#1a3c61] text-white rounded-full flex items-center justify-center font-medium">
                  {currentUser?.username?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <Link to="/admin/profile" className="text-sm font-medium hover:underline">
                  {currentUser?.username || "Kullanıcı"}
                </Link>
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
        
        {/* Footer */}
        <footer className="bg-white p-4 text-center text-sm text-gray-500 border-t">
          <p>&copy; {new Date().getFullYear()} Çeşme Kahve - Tüm Hakları Saklıdır</p>
        </footer>
      </div>
    </div>
  )
}

export default MainLayout