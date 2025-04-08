// src/pages/HeatMap.jsx
import { useState, useEffect, useRef } from "react"
import api from "../lib/axios"
import h337 from 'heatmap.js'; // Bu paketi yüklemeyi unutmayın: npm install heatmap.js
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts'; // Recharts yüklemeyi unutmayın: npm install recharts

const Heatmap = () => {
  const [timeRange, setTimeRange] = useState("week")
  const [selectedPage, setSelectedPage] = useState("all")
  const [loading, setLoading] = useState(true)
  const [popularProducts, setPopularProducts] = useState([])
  const [pageViews, setPageViews] = useState([])
  const [clickData, setClickData] = useState([])
  const [stats, setStats] = useState({
    conversion_rate: 0,
    average_time: "0:00",
    clicks: 0,
    views: 0
  })
  const [categoryData, setCategoryData] = useState([])
  const heatmapRef = useRef(null)

  const pages = [
    { id: "all", name: "Tüm Sayfalar" },
    { id: "menu", name: "Ana Menü" },
    { id: "product", name: "Ürün Detay" },
    { id: "cart", name: "Sepet" },
    { id: "checkout", name: "Sipariş Onay" }
  ]

  // Renk paleti - kategoriler için
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        console.log("Analitik verileri yükleniyor...");
        setLoading(true);

        // Tüm veri isteklerini paralel olarak yap
        console.log("Popüler ürünler alınıyor...");
        const [productsRes, viewsRes, clicksRes, statsRes, categoryRes] = await Promise.all([
          api.get(`/analytics/popular-products?timeRange=${timeRange}`),
          api.get(`/analytics/page-views?timeRange=${timeRange}`),
          api.get(`/analytics/clicks?timeRange=${timeRange}&page=${selectedPage}`),
          api.get(`/analytics/stats?timeRange=${timeRange}`),
          api.get(`/analytics/category-popularity?timeRange=${timeRange}`)
        ]);

        // Verileri state'lere ata
        setPopularProducts(productsRes.data || []);
        setPageViews(viewsRes.data || []);
        setClickData(clicksRes.data || []);
        setStats(statsRes.data || {
          conversion_rate: 0,
          average_time: "0:00",
          clicks: 0,
          views: 0
        });
        setCategoryData(categoryRes.data || []);

        // Isı haritası oluştur
        if (heatmapRef.current && clicksRes.data && clicksRes.data.length > 0) {
          createHeatmap(clicksRes.data);
        }
      } catch (err) {
        console.error("Analitik verileri alınırken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [timeRange, selectedPage]);

  const createHeatmap = (data) => {
    // Önceki ısı haritasını temizle
    if (heatmapRef.current) {
      while (heatmapRef.current.firstChild) {
        heatmapRef.current.removeChild(heatmapRef.current.firstChild);
      }
    }

    // Yeni ısı haritası oluştur
    const heatmapInstance = h337.create({
      container: heatmapRef.current,
      radius: 40,
      maxOpacity: 0.8,
      minOpacity: 0.1,
      blur: 0.85,
      gradient: {
        '.5': 'blue',
        '.8': 'red',
        '.95': 'white'
      }
    });

    // Veri noktalarını ekle
    const points = data.map(point => ({
      x: parseInt(point.x),
      y: parseInt(point.y),
      value: parseInt(point.value)
    }));

    if (points.length > 0) {
      // Veriyi ayarla
      heatmapInstance.setData({
        max: Math.max(...points.map(p => p.value), 10),
        data: points
      });
    }
  };

  // JSX kısmı - mevcut kodunuza entegre edin
  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Başlık ve Filtreler */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🔥 Kullanıcı Davranış Analizi</h1>

        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-lg px-3 py-2 bg-white text-sm"
          >
            <option value="day">Son 24 Saat</option>
            <option value="week">Son 7 Gün</option>
            <option value="month">Son 30 Gün</option>
            <option value="quarter">Son 3 Ay</option>
          </select>

          <button
            onClick={() => alert("Bu özellik henüz mevcut değil.")}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
          >
            ⬇️ Rapor İndir
          </button>
        </div>
      </div>

      {/* Metrikler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm text-gray-500 font-medium">Tıklama Sayısı</h3>
              <p className="text-2xl font-bold mt-1">{stats.clicks}</p>
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded bg-green-100 text-green-800">
              ↑ 12.4%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm text-gray-500 font-medium">Sayfa Görüntüleme</h3>
              <p className="text-2xl font-bold mt-1">{stats.views}</p>
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded bg-green-100 text-green-800">
              ↑ 8.7%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm text-gray-500 font-medium">Ortalama Süre</h3>
              <p className="text-2xl font-bold mt-1">{stats.average_time}</p>
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded bg-red-100 text-red-800">
              ↓ 3.2%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm text-gray-500 font-medium">Dönüşüm Oranı</h3>
              <p className="text-2xl font-bold mt-1">{stats.conversion_rate}%</p>
            </div>
            <span className="text-sm font-medium px-2 py-1 rounded bg-green-100 text-green-800">
              ↑ 5.3%
            </span>
          </div>
        </div>
      </div>

      {/* Sayfa Seçimi */}
      <div className="flex border-b mb-6 overflow-x-auto">
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => setSelectedPage(page.id)}
            className={`px-4 py-2 -mb-px text-sm font-medium whitespace-nowrap ${selectedPage === page.id
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 hover:text-gray-700'
              }`}
          >
            {page.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-xl shadow-sm p-20 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Isı haritası verisi yükleniyor...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Isı haritası */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Etkileşim Isı Haritası</h2>
            <div className="relative w-full aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
              {/* Bu div'de ısı haritası render edilecek */}
              <div
                ref={heatmapRef}
                className="w-full h-full"
                style={{ position: 'relative' }}
              ></div>
              {clickData.length === 0 && (
                <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100">
                    <defs>
                      <radialGradient id="heat1" cx="25%" cy="25%" r="50%" fx="25%" fy="25%">
                        <stop offset="0%" stopColor="rgba(255,0,0,0.8)" />
                        <stop offset="100%" stopColor="rgba(255,0,0,0)" />
                      </radialGradient>
                      <radialGradient id="heat2" cx="75%" cy="50%" r="50%" fx="75%" fy="50%">
                        <stop offset="0%" stopColor="rgba(255,165,0,0.8)" />
                        <stop offset="100%" stopColor="rgba(255,165,0,0)" />
                      </radialGradient>
                      <radialGradient id="heat3" cx="40%" cy="75%" r="40%" fx="40%" fy="75%">
                        <stop offset="0%" stopColor="rgba(0,0,255,0.7)" />
                        <stop offset="100%" stopColor="rgba(0,0,255,0)" />
                      </radialGradient>
                    </defs>
                    <rect width="100%" height="100%" fill="#f5f5f5" rx="4" ry="4" />
                    <circle cx="25%" cy="25%" r="20" fill="url(#heat1)" />
                    <circle cx="75%" cy="50%" r="25" fill="url(#heat2)" />
                    <circle cx="40%" cy="75%" r="15" fill="url(#heat3)" />
                    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fill="#555" fontFamily="Arial" fontSize="10">
                      Isı Haritası Önizleme
                    </text>
                  </svg>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-600 mb-1">En Çok Etkileşim</h3>
                <p className="text-lg font-bold text-[#1a9c95]">
                  {popularProducts[0]?.category_name || "Ana Menü - Kategoriler"}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-600 mb-1">En Az Etkileşim</h3>
                <p className="text-lg font-bold text-gray-700">Footer Bölümü</p>
              </div>
            </div>

            {/* Sayfa görüntüleme grafiği */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Günlük Sayfa Görüntülemeleri</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={pageViews}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="views" stroke="#1a9c95" name="Görüntülemeler" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Popüler ürünler ve öneriler */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">En Çok Tıklanan Ürünler</h2>
              <div className="space-y-4">
                {(popularProducts.length > 0 ? popularProducts : [
                  { id: 1, name: "Türk Kahvesi", view_count: 586, category_name: "Kahveler" },
                  { id: 2, name: "Sütlaç", view_count: 423, category_name: "Tatlılar" },
                  { id: 3, name: "Çeşme Kumru", view_count: 387, category_name: "Ana Yemekler" },
                  { id: 4, name: "Sade Çay", view_count: 341, category_name: "Çaylar" },
                  { id: 5, name: "Fındıklı Baklava", view_count: 312, category_name: "Tatlılar" }
                ]).slice(0, 5).map((item, index) => (
                  <div key={item.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${index < 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                      } font-bold text-sm mr-3`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.category_name} • {item.view_count || 0} görüntüleme, {item.cart_count || 0} sepete ekleme
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Kategori Popülerlik Grafiği */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Kategori İlgi Dağılımı</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData.slice(0, 5)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total_interactions"
                    nameKey="category_name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.slice(0, 5).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Öneriler</h2>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border-l-2 border-yellow-400 rounded">
                  <p className="font-medium text-yellow-800">Kategori Düzeni</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    {categoryData[0]?.category_name || "Popüler"} kategorisini daha üste taşıyarak erişim kolaylığı sağlayabilirsiniz.
                  </p>
                </div>

                <div className="p-3 bg-green-50 border-l-2 border-green-400 rounded">
                  <p className="font-medium text-green-800">Ürün Görünürlüğü</p>
                  <p className="text-sm text-green-700 mt-1">
                    {popularProducts[0]?.name || "Popüler ürünlerinizi"} "Öne Çıkanlar" bölümünde vurgulayın.
                  </p>
                </div>

                <div className="p-3 bg-blue-50 border-l-2 border-blue-400 rounded">
                  <p className="font-medium text-blue-800">
                    {categoryData[0]?.category_name || "Tatlılar"} Kategorisi
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Bu kategori yüksek ilgi görüyor, daha fazla ürün çeşidi ekleyebilirsiniz.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ek Analitik Grafikleri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* Popüler Ürünler Bar Grafiği */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">En Popüler Ürünler</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={popularProducts.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="view_count" fill="#1a9c95" name="Görüntüleme" />
              <Bar dataKey="cart_count" fill="#d49e36" name="Sepete Ekleme" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Kategori Popülerlik Grafiği */}
        <div className="bg-white p-6 rounded-xl shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Kategori Etkileşim Oranları</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData.slice(0, 5)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="category_name" type="category" width={100} />
              <Tooltip />
              <Legend />
              <Bar dataKey="view_count" fill="#8884d8" name="Görüntüleme" />
              <Bar dataKey="cart_count" fill="#82ca9d" name="Sepete Ekleme" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Heatmap;