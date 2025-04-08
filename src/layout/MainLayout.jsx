import { useState } from "react"
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const location = useLocation()
  const navigate = useNavigate()

  const menuItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/products", label: "Ürünler", icon: "📦" },
    { path: "/branch-products", label: "Şube Ürünleri", icon: "🏪" },
    { path: "/admin/orders", label: "Siparişler", icon: "🧾" },
    { path: "/menu", label: "QR Menü", icon: "📱" },
  ]

  const handleLogout = () => {
    localStorage.removeItem("token")
    navigate("/login")
  }

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
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white/80 hover:text-white"
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>

          {/* Menu Links */}
          <nav className="mt-6 flex-1">
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
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                {sidebarOpen && <span className="ml-3">{item.label}</span>}
              </Link>
            ))}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-blue-800">
            <button
              onClick={handleLogout}
              className="flex items-center text-white/80 hover:text-white"
            >
              <span className="text-xl">🚪</span>
              {sidebarOpen && <span className="ml-3">Çıkış Yap</span>}
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
                  A
                </div>
                {sidebarOpen && <span className="text-sm font-medium">Admin</span>}
              </div>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout