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
    {
      title: "Ürünler",
      icon: "📦",
      path: "/admin/products",
      color: "bg-blue-500",
      description: "Tüm ürünleri yönetin",
      features: ["Excel/PDF export", "Toplu düzenleme", "Kategori yönetimi"]
    },
    {
      title: "Şube Ürünleri",
      icon: "🏪",
      path: "/admin/branch-products",
      color: "bg-green-500",
      description: "Şubelere özel ürünler",
      features: ["Stok takibi", "Görünürlük kontrolü", "Fiyat güncellemeleri"]
    },
    {
      title: "Siparişler",
      icon: "🧾",
      path: "/admin/orders",
      color: "bg-amber-500",
      description: "Tüm siparişleri görüntüleyin",
      features: ["Sipariş takibi", "Durum güncelleme", "Excel/PDF export"]
    },
    {
      title: "QR Menü",
      icon: "📱",
      path: "/menu",
      color: "bg-purple-500",
      description: "QR Menü önizleme",
      features: ["Müşteri görünümü", "Mobil uyumluluk", "Canlı test"]
    },
    {
      title: "Isı Haritası",
      icon: "🔥",
      path: "/admin/heatmap",
      color: "bg-red-500",
      description: "Kullanıcı davranışları analizi",
      features: ["Ürün popülaritesi", "Sayfa ziyaret analizi", "Tıklama verileri"]
    },
    {
      title: "Analitik",
      icon: "📊",
      path: "/admin/analytics",
      color: "bg-indigo-500",
      description: "Detaylı raporlar ve analizler",
      features: ["Satış grafikleri", "Trend analizi", "Performans raporu"]
    },
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
          <button className="px-4 py-2 bg-[#022B45] text-white rounded-lg text-sm hover:bg-[#022B45]/80 transition shadow-sm">
            Yardım
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition shadow-sm">
            Profil
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-[#D98A3D]">
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
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Yönetim Araçları</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
            <p className="text-sm text-gray-500 mb-4">{item.description}</p>

            {/* Özellik listesi */}
            <div className="space-y-1 mt-3">
              {item.features.map((feature, idx) => (
                <div key={idx} className="flex items-center text-xs text-gray-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-2"></span>
                  {feature}
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>

      {/* Isı Haritası Önizleme */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Kullanıcı Davranış Analizi</h2>
          <Link to="/admin/heatmap" className="text-blue-600 text-sm hover:underline">
            Detaylı Rapor →
          </Link>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="relative">
            <img
              src="/analytics/heatmap-preview.jpg"
              alt="Isı Haritası Önizleme"
              className="w-full rounded-lg"
              onError={(e) => {
                e.target.src = "/uploads/guncellenecek.jpg" // Projenin public/uploads içine bu resmi koyman yeterli
                e.target.onerror = null
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-4">
              <div className="text-white">
                <h3 className="font-bold">Popüler İçerikler</h3>
                <p className="text-sm">Kahveler ve Tatlılar kategorilerinde yoğunlaşma</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm">En Çok Tıklanan</h4>
              <p className="text-xl font-bold text-[#D98A3D]">Türk Kahvesi</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm">Sayfa Kalma Süresi</h4>
              <p className="text-xl font-bold text-[#D98A3D]">2.4 dk</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3">
              <h4 className="font-medium text-sm">Dönüşüm Oranı</h4>
              <p className="text-xl font-bold text-[#D98A3D]">%18.5</p>
            </div>
          </div>
        </div>
      </div>

      {/* Son Siparişler ve Hızlı İşlemler */}
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
                onClick={() => navigate("/admin/products")}
                className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-blue-600">➕</span>
                  <span className="font-medium">Yeni Ürün Ekle</span>
                </span>
                <span className="text-gray-400">→</span>
              </button>

              <button
                onClick={() => navigate("/admin/branch-products")}
                className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-green-600">🔄</span>
                  <span className="font-medium">Şube Ürünlerini Güncelle</span>
                </span>
                <span className="text-gray-400">→</span>
              </button>

              <button
                onClick={() => navigate("/admin/orders")}
                className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-amber-600">🧾</span>
                  <span className="font-medium">Siparişleri Yönet</span>
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

              <button
                onClick={() => navigate("/admin/heatmap")}
                className="w-full flex items-center justify-between bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition"
              >
                <span className="flex items-center gap-2">
                  <span className="text-red-600">🔥</span>
                  <span className="font-medium">Isı Haritası Analizi</span>
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