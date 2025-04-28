// src/layout/MainLayout.jsx
import { useState, useEffect, createContext } from "react"
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom"
import { FiGift, FiStar, FiActivity } from "react-icons/fi"
import { MdPalette } from "react-icons/md"
import { useAuth } from "../contexts/AuthContext"
import { FiLogOut, FiUser, FiBriefcase, FiLayers, FiBarChart2, FiUsers, FiHome, FiPackage, FiShoppingBag, FiFileText, FiSmartphone, FiTrendingUp, FiMap, FiSettings, FiMenu, FiX } from "react-icons/fi"
import api from "../lib/axios"

// Şube context'i oluştur
export const SelectedBranchContext = createContext(null);

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [userBranches, setUserBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState(null)
  const [expandedGroup, setExpandedGroup] = useState(null);
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout, isSuperAdmin, isBranchManager } = useAuth()

  // Açık menüler localStorage'a kaydedilir
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarOpen');
    if (savedState !== null) {
      setSidebarOpen(JSON.parse(savedState));
    }
    
    // URL yoluna göre hangi menü grubunun açık olacağını belirle
    if (location.pathname.includes('/brands')) {
      setExpandedGroup('brands');
    } else if (location.pathname.includes('/branches')) {
      setExpandedGroup('branches');
    } else if (location.pathname.includes('/loyalty')) {
      setExpandedGroup('loyalty');
    } else if (location.pathname.includes('/theme')) {
      setExpandedGroup('theme');
    } else if (location.pathname.includes('/templates')) {
      setExpandedGroup('templates');
    } else if (location.pathname.includes('/data')) {
      setExpandedGroup('data');
    }
  }, [location.pathname]);

  // Kullanıcının erişebileceği şubeleri getir
  useEffect(() => {
    const fetchUserBranches = async () => {
      try {
        let response;
        if (isSuperAdmin) {
          // Super admin tüm şubelere erişebilir
          response = await api.get('/api/branches');
        } else if (isBranchManager && currentUser?.branch_id) {
          // Şube yöneticisi sadece kendi şubesine erişebilir
          response = await api.get(`/api/branches/${currentUser.branch_id}`);
          response.data = [response.data]; // Tek şubeyi dizi formatına çevir
        } else {
          response = { data: [] };
        }

        setUserBranches(response.data);

        // Eğer şube seçilmemişse, kullanıcının ilk şubesini seç
        if (response.data.length > 0 && !selectedBranchId) {
          setSelectedBranchId(response.data[0].id);
          // Şube bilgisini session storage'a kaydet
          sessionStorage.setItem('selectedBranchId', response.data[0].id);
        }
      } catch (err) {
        console.error("Kullanıcı şubeleri alınırken hata:", err);
      }
    };

    if (currentUser) {
      fetchUserBranches();
    }
  }, [currentUser, isSuperAdmin, isBranchManager, selectedBranchId]);

  // Session storage'dan seçili şubeyi yükle
  useEffect(() => {
    const storedBranchId = sessionStorage.getItem('selectedBranchId');
    if (storedBranchId) {
      setSelectedBranchId(storedBranchId);
    }
  }, []);

  // Sidebar durumunu kaydet
  const toggleSidebar = () => {
    const newState = !sidebarOpen;
    setSidebarOpen(newState);
    localStorage.setItem('sidebarOpen', JSON.stringify(newState));
  }
  
  // Menü grubunu aç/kapat
  const toggleGroup = (group) => {
    if (expandedGroup === group) {
      setExpandedGroup(null);
    } else {
      setExpandedGroup(group);
    }
  };

  // Şube değişince session storage'a kaydet
  const handleBranchChange = (e) => {
    const branchId = e.target.value;
    setSelectedBranchId(branchId);
    sessionStorage.setItem('selectedBranchId', branchId);
  };

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

    // Ana menü grupları
    const menuGroups = [];
    
    // Sadece super admin'in görebileceği menü grupları
    if (isSuperAdmin) {
      // Marka Yönetimi Grubu
      menuGroups.push({
        id: "brands",
        label: "Marka Yönetimi",
        icon: <FiBriefcase size={20} />,
        items: [
          { path: "/admin/brands", label: "Tüm Markalar", icon: <FiBriefcase size={18} /> },
        ]
      });
      
      // Şablon Yönetimi
      menuGroups.push({
        id: "templates",
        label: "Şablonlar",
        icon: <FiLayers size={20} />,
        items: [
          { path: "/admin/templates", label: "Tüm Şablonlar", icon: <FiLayers size={18} /> },
        ]
      });
      
      // Şube Yönetimi Grubu
      menuGroups.push({
        id: "branches",
        label: "Şube Yönetimi",
        icon: <FiMap size={20} />,
        items: [
          { path: "/admin/branches", label: "Tüm Şubeler", icon: <FiMap size={18} /> },
        ]
      });
      
      // Tema Yönetimi Grubu - Super Admin için
      menuGroups.push({
        id: "theme",
        label: "Tema Yönetimi",
        icon: <MdPalette size={20} />,
        items: [
          { path: "/admin/theme/brands", label: "Marka Temaları", icon: <MdPalette size={18} /> },
          { path: "/admin/theme/branches", label: "Şube Temaları", icon: <MdPalette size={18} /> },
        ]
      });
      
      // Kullanıcı Yönetimi
      menuGroups.push({
        id: "users",
        label: "Kullanıcılar",
        icon: <FiUsers size={20} />,
        items: [
          { path: "/admin/users", label: "Kullanıcı Yönetimi", icon: <FiUsers size={18} /> },
        ]
      });
    }
    
    // Branch Manager için özelleştirilmiş menüler
    if (isBranchManager && !isSuperAdmin && currentUser?.branch_id) {
      // Tema Yönetimi
      menuGroups.push({
        id: "theme",
        label: "Tema Yönetimi",
        icon: <MdPalette size={20} />,
        items: [
          { path: `/admin/theme/branch/${currentUser.branch_id}`, label: "Şube Teması", icon: <MdPalette size={18} /> },
        ]
      });
      
      // Şablon Yönetimi - Branch Manager için
      menuGroups.push({
        id: "templates",
        label: "Şablonlar",
        icon: <FiLayers size={20} />,
        items: [
          { path: `/admin/branches/${currentUser.branch_id}/templates/menu`, label: "Menü Şablonu", icon: <FiLayers size={18} /> },
          { path: `/admin/branches/${currentUser.branch_id}/templates/price`, label: "Fiyat Şablonu", icon: <FiLayers size={18} /> },
        ]
      });
      
      // Veri Yönetimi - Branch Manager için
      menuGroups.push({
        id: "data",
        label: "Veri Yönetimi",
        icon: <FiFileText size={20} />,
        items: [
          { path: `/admin/branches/${currentUser.branch_id}/export`, label: "Veri Dışa Aktar", icon: <FiFileText size={18} /> },
          { path: `/admin/branches/${currentUser.branch_id}/import`, label: "Veri İçe Aktar", icon: <FiFileText size={18} /> },
        ]
      });
    }
    
    // Sadakat Programı Grubu - Sadece Super Admin için
    if (isSuperAdmin) {
      menuGroups.push({
        id: "loyalty",
        label: "Sadakat Programı",
        icon: <FiStar size={20} />,
        items: [
          { path: "/admin/loyalty", label: "Dashboard", icon: <FiStar size={18} /> },
          { path: "/admin/loyalty/campaigns", label: "Kampanyalar", icon: <FiGift size={18} /> },
          { path: "/admin/loyalty/customers", label: "Müşteriler", icon: <FiUsers size={18} /> },
          { path: "/admin/loyalty/rewards", label: "Ödül Yönetimi", icon: <FiPackage size={18} /> },
          { path: "/admin/loyalty/points/manual", label: "Manuel İşlem", icon: <FiActivity size={18} /> },
          { path: "/admin/loyalty/reports", label: "Raporlar", icon: <FiBarChart2 size={18} /> },
          { path: "/admin/loyalty/settings", label: "Ayarlar", icon: <FiSettings size={18} /> },
        ]
      });
    }
    
    // Diğer Menü Öğeleri - Hem Super Admin hem de Branch Manager için
    // Şube Ürünleri link'ini branch manager için güncelleyelim
    const branchProductsPath = isBranchManager && currentUser?.branch_id
      ? `/admin/branches/${currentUser.branch_id}/products`
      : "/admin/branch-products";

    const sharedItems = [
      { path: branchProductsPath, label: "Şube Ürünleri", icon: <FiShoppingBag size={20} /> },
      { path: "/admin/orders", label: "Siparişler", icon: <FiFileText size={20} /> },
      { path: "/admin/analytics", label: "Analitikler", icon: <FiBarChart2 size={20} /> },
      { path: "/menu", label: "QR Menü", icon: <FiSmartphone size={20} /> },
    ];
    
    // Sadece Super Admin için Isı Haritası
    if (isSuperAdmin) {
      sharedItems.push({ path: "/admin/heatmap", label: "Isı Haritası", icon: <FiTrendingUp size={20} /> });
    }

    return { baseMenuItems, menuGroups, sharedItems };
  };

  const { baseMenuItems, menuGroups, sharedItems } = getMenuItems();

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
              {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
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
            
            {/* Ana Menü Öğeleri */}
            {baseMenuItems.map((item) => (
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
            
            {/* Menü Grupları - Sadece sidebarOpen ise göster */}
            {sidebarOpen && menuGroups.length > 0 && (
              <div className="mt-4">
                <div className="px-4 mb-2 text-xs text-white/50 uppercase">
                  Yönetim
                </div>
                
                {menuGroups.map(group => (
                  <div key={group.id} className="mb-1">
                    {/* Grup Başlığı */}
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`w-full flex items-center justify-between py-3 px-4 transition-colors
                        ${expandedGroup === group.id ? "bg-[#034368]" : "hover:bg-[#034368]/50"}
                        text-white/90`}
                    >
                      <div className="flex items-center">
                        <span className="text-lg">{group.icon}</span>
                        <span className="ml-3 text-sm">{group.label}</span>
                      </div>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedGroup === group.id ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {/* Grup İçeriği */}
                    {expandedGroup === group.id && (
                      <div className="bg-[#011e30]">
                        {group.items.map(item => (
                          <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center py-2 px-4 pl-12 transition-colors ${
                              location.pathname === item.path
                                ? "bg-[#D98A3D]/70 text-white"
                                : "text-white/70 hover:bg-[#D98A3D]/20"
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span className="ml-3 text-sm">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {/* Tek Düzey Menü Öğeleri */}
            <div className="mt-4">
              <div className="px-4 mb-2 text-xs text-white/50 uppercase">
                {sidebarOpen ? (menuGroups.length > 0 ? "İşlemler" : "Menü") : ""}
              </div>
              
              {sharedItems.map((item) => (
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
            </div>
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
        className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"
          }`}
      >
        <header className="bg-white shadow-sm">
          <div className="flex justify-between items-center px-6 py-4">
            <div className="text-xl font-semibold text-gray-800">
              {/* Aktif sayfanın başlığını göster - menü gruplarını da kontrol et */}
              {baseMenuItems.find((item) => item.path === location.pathname)?.label || 
               menuGroups.flatMap(group => group.items).find(item => item.path === location.pathname)?.label ||
               sharedItems.find((item) => item.path === location.pathname)?.label || 
               "Yönetim Paneli"}
            </div>

            <div className="flex items-center gap-4">
              {/* Şube Seçici - Birden fazla şube varsa göster */}
              {userBranches.length > 0 && (
                <div className="bg-gray-100 border border-gray-300 rounded-lg px-3 py-2">
                  <label htmlFor="branch-select" className="text-sm text-gray-600 mr-2">Şube:</label>
                  <select
                    id="branch-select"
                    value={selectedBranchId || ""}
                    onChange={handleBranchChange}
                    className="bg-transparent border-none focus:outline-none text-gray-700 text-sm"
                  >
                    {userBranches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Kullanıcı Profil Kısmı */}
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
          {/* Context Provider ile seçili şubeyi tüm bileşenlere aktaralım */}
          <SelectedBranchContext.Provider value={selectedBranchId}>
            <Outlet />
          </SelectedBranchContext.Provider>
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