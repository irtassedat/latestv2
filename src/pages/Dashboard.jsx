import { useState, useEffect } from "react" 
import { Link, useNavigate } from "react-router-dom"
import api from "../lib/axios"

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalBranches: 0,
    totalOrders: 0,
    totalCategories: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Gerçek bir API çağrısı yapılabilir veya mock data kullanılabilir
        // const response = await api.get("/stats")
        // setStats(response.data)
        
        // Şu an için örnek data kullanıyoruz
        setStats({
          totalProducts: 124,
          totalBranches: 3,
          totalOrders: 856,
          totalCategories: 8
        })

        // Son siparişleri getir
        const ordersResponse = await api.get("/orders?limit=5")
        setRecentOrders(ordersResponse.data.slice(0, 5))
      } catch (err) {
        console.error("İstatistikler yüklenirken hata:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  // Admin paneli menü öğeleri
  const menuItems = [
    { title: "Ürünler", icon: "📦", path: "/products", color: "bg-blue-500", description: "Tüm ürünleri yönetin" },
    { title: "Şube Ürünleri", icon: "🏪", path: "/branch-products", color: "bg-green-500", description: "Şubelere özel ürünler" },
    { title: "Siparişler", icon: "🧾", path: "/admin/orders", color: "bg-amber-500", description: "Tüm siparişleri görüntüleyin" },
    { title: "QR Menü", icon: "📱", path: "/menu", color: "bg-purple-500", description: "QR Menü önizleme" },
  ]

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Çeşme Kahve Yönetim Paneli</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition shadow-sm">
            Yardım
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition shadow-sm">
            Profil
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Toplam Ürün</h3>
            <span className="text-3xl bg-blue-100 text-blue-800 p-2 rounded-lg">📦</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalProducts}</p>
          <p className="text-xs text-gray-500 mt-1">Tüm şubeler</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Şube Sayısı</h3>
            <span className="text-3xl bg-green-100 text-green-800 p-2 rounded-lg">🏪</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalBranches}</p>
          <p className="text-xs text-gray-500 mt-1">Tüm lokasyonlar</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-amber-500">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Toplam Sipariş</h3>
            <span className="text-3xl bg-amber-100 text-amber-800 p-2 rounded-lg">🧾</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">Tüm zamanlar</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-500 text-sm font-medium">Kategori Sayısı</h3>
            <span className="text-3xl bg-purple-100 text-purple-800 p-2 rounded-lg">🏷️</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">{stats.totalCategories}</p>
          <p className="text-xs text-gray-500 mt-1">Aktif kategoriler</p>
        </div>
      </div>

      {/* Ana Menü Kartları */}
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Hızlı Erişim</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {menuItems.map((item, index) => (
          <Link 
            key={index} 
            to={item.path}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition border border-gray-100 relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${item.color} opacity-10 group-hover:opacity-20 transition -translate-x-8 -translate-y-8`}></div>
            <div className="mb-4">
              <span className="text-3xl">{item.icon}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-1">{item.title}</h3>
            <p className="text-sm text-gray-500">{item.description}</p>
          </Link>
        ))}
      </div>

      {/* Son Siparişler */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800">Son Siparişler</h2>
              <Link to="/admin/orders" className="text-blue-600 text-sm hover:underline">Tümünü Gör →</Link>
            </div>
            {recentOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 font-medium text-gray-600">Müşteri</th>
                      <th className="text-left py-3 font-medium text-gray-600">Masa</th>
                      <th className="text-right py-3 font-medium text-gray-600">Tutar</th>
                      <th className="text-right py-3 font-medium text-gray-600">Tarih</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3">{order.name}</td>
                        <td className="py-3">{order.table_number}</td>
                        <td className="py-3 text-right font-medium text-green-600">{order.total_price} ₺</td>
                        <td className="py-3 text-right text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-6">Henüz sipariş yok.</p>
            )}
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Hızlı İşlemler</h2>
            <div className="space-y-3">
              <button 
                onClick={() => navigate("/products")} 
                className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-blue-600">➕</span>
                  <span className="font-medium">Yeni Ürün Ekle</span>
                </span>
                <span className="text-gray-400">→</span>
              </button>
              
              <button 
                onClick={() => navigate("/branch-products")} 
                className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-green-600">🔄</span>
                  <span className="font-medium">Şube Ürünlerini Güncelle</span>
                </span>
                <span className="text-gray-400">→</span>
              </button>
              
              <button 
                onClick={() => navigate("/menu")} 
                className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-purple-600">📱</span>
                  <span className="font-medium">QR Menüyü Önizle</span>
                </span>
                <span className="text-gray-400">→</span>
              </button>
            </div>
          </div>
          
          {/* Sistem Bilgisi */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Sistem Bilgisi</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Yazılım Versiyonu</span>
                <span className="font-medium">v1.2.0</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Son Güncelleme</span>
                <span className="font-medium">6 Nisan 2024</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">API Durumu</span>
                <span className="font-medium text-green-600">Aktif</span>
              </div>
              <div className="mt-4 pt-3 border-t text-center">
                <span className="text-xs text-gray-500">© 2024 Çeşme Kahve - Tüm Hakları Saklıdır</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard