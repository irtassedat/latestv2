import { useState, useEffect } from "react"
import api from "../lib/axios"

const Heatmap = () => {
  const [timeRange, setTimeRange] = useState("week")
  const [selectedPage, setSelectedPage] = useState("all")
  const [loading, setLoading] = useState(true)
  
  const pages = [
    { id: "all", name: "Tüm Sayfalar" },
    { id: "menu", name: "Ana Menü" },
    { id: "product", name: "Ürün Detay" },
    { id: "cart", name: "Sepet" },
    { id: "checkout", name: "Sipariş Onay" }
  ]
  
  const metrics = [
    { 
      id: "clicks", 
      name: "Tıklama Sayısı", 
      value: 4328, 
      change: 12.4,
      positive: true
    },
    { 
      id: "views", 
      name: "Sayfa Görüntüleme", 
      value: 15872, 
      change: 8.7,
      positive: true
    },
    { 
      id: "duration", 
      name: "Ortalama Süre", 
      value: "2:14", 
      change: -3.2,
      positive: false
    },
    { 
      id: "conversion", 
      name: "Dönüşüm Oranı", 
      value: "18.5%", 
      change: 5.3,
      positive: true
    }
  ]
  
  const popularItems = [
    { id: 1, name: "Türk Kahvesi", clicks: 586, category: "Kahveler" },
    { id: 2, name: "Sütlaç", clicks: 423, category: "Tatlılar" },
    { id: 3, name: "Çeşme Kumru", clicks: 387, category: "Ana Yemekler" },
    { id: 4, name: "Sade Çay", clicks: 341, category: "Çaylar" },
    { id: 5, name: "Fındıklı Baklava", clicks: 312, category: "Tatlılar" }
  ]
  
  const mockData = {
    // Sıcaklık verileri (x, y, sıcaklık değeri)
    heatPoints: [
      [100, 150, 80], // Yüksek aktivite
      [250, 200, 70],
      [350, 100, 50],
      [150, 300, 65],
      [400, 250, 85], // Yüksek aktivite
      [450, 150, 45],
      [200, 50, 75],
      [300, 350, 55],
      [50, 250, 40],
      [200, 400, 60]
    ],
    pageSections: [
      { name: "Header", interactions: 2845 },
      { name: "Kategoriler", interactions: 3562 },
      { name: "Öne Çıkan Ürünler", interactions: 4189 },
      { name: "Arama", interactions: 1356 },
      { name: "Sepet", interactions: 2178 }
    ]
  }
  
  useEffect(() => {
    // API ile gerçek veri alınabilir
    // Şimdilik simüle ediyoruz
    setTimeout(() => {
      setLoading(false)
    }, 800)
  }, [timeRange, selectedPage])
  
  return (
    <div className="p-6 max-w-7xl mx-auto">
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
          
          <button className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm">
            ⬇️ Rapor İndir
          </button>
        </div>
      </div>
      
      {/* Metrikler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map(metric => (
          <div key={metric.id} className="bg-white rounded-xl shadow-sm p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm text-gray-500 font-medium">{metric.name}</h3>
                <p className="text-2xl font-bold mt-1">{metric.value}</p>
              </div>
              <span className={`text-sm font-medium px-2 py-1 rounded ${
                metric.positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {metric.positive ? '↑' : '↓'} {Math.abs(metric.change)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Sayfa Seçimi */}
      <div className="flex border-b mb-6">
        {pages.map(page => (
          <button
            key={page.id}
            onClick={() => setSelectedPage(page.id)}
            className={`px-4 py-2 -mb-px text-sm font-medium ${
              selectedPage === page.id
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
            <div className="relative w-full aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden mb-4">
              {/* Gerçek bir uygulama için D3.js veya benzeri kütüphane kullanılarak etkileşimli harita oluşturulabilir */}
              <img 
                src="/analytics/detailed-heatmap.jpg" 
                alt="Detaylı Isı Haritası"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/800x450?text=Detaylı+Isı+Haritası"
                  e.target.onerror = null
                }}
              />
              
              {/* Örnek ısı noktaları */}
              {mockData.heatPoints.map((point, i) => (
                <div 
                  key={i}
                  className="absolute w-14 h-14 rounded-full bg-red-500 opacity-30 -translate-x-1/2 -translate-y-1/2 animate-pulse"
                  style={{ 
                    left: `${point[0]}px`, 
                    top: `${point[1]}px`, 
                    opacity: point[2] / 200,
                    width: `${point[2]}px`,
                    height: `${point[2]}px`
                  }}
                ></div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-600 mb-1">En Çok Etkileşim</h3>
                <p className="text-lg font-bold text-[#1a9c95]">Ana Menü - Kategoriler</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-medium text-gray-600 mb-1">En Az Etkileşim</h3>
                <p className="text-lg font-bold text-gray-700">Footer Bölümü</p>
              </div>
            </div>
            
            {/* Sayfa bölümleri etkileşim grafiği */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-600 mb-3">Sayfa Bölümleri Etkileşimi</h3>
              <div className="space-y-2">
                {mockData.pageSections.map(section => {
                  // Maksimum etkileşime göre yüzdeyi hesapla
                  const maxInteractions = Math.max(...mockData.pageSections.map(s => s.interactions));
                  const percentage = (section.interactions / maxInteractions) * 100;
                  
                  return (
                    <div key={section.name} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">{section.name}</span>
                        <span className="text-xs font-medium">{section.interactions} etkileşim</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-[#1a9c95] h-2.5 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* Popüler ürünler ve öneriler */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">En Çok Tıklanan Ürünler</h2>
              <div className="space-y-4">
                {popularItems.map((item, index) => (
                  <div key={item.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      index < 3 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                    } font-bold text-sm mr-3`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category} • {item.clicks} tıklama</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Öneriler</h2>
              <div className="space-y-3">
                <div className="p-3 bg-yellow-50 border-l-2 border-yellow-400 rounded">
                  <p className="font-medium text-yellow-800">Kategori Düzeni</p>
                  <p className="text-sm text-yellow-700 mt-1">En popüler kategorileri daha üste taşıyarak erişim kolaylığı sağlayabilirsiniz.</p>
                </div>
                
                <div className="p-3 bg-green-50 border-l-2 border-green-400 rounded">
                  <p className="font-medium text-green-800">Ürün Görünürlüğü</p>
                  <p className="text-sm text-green-700 mt-1">Popüler ürünlerinizi "Öne Çıkanlar" bölümünde vurgulayın.</p>
                </div>
                
                <div className="p-3 bg-blue-50 border-l-2 border-blue-400 rounded">
                  <p className="font-medium text-blue-800">Tatlılar Kategorisi</p>
                  <p className="text-sm text-blue-700 mt-1">Bu kategori yüksek ilgi görüyor, daha fazla ürün çeşidi ekleyebilirsiniz.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Ek Analitik Bilgileri */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Kullanıcı Yolculuğu</h2>
          <div className="space-y-3">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-[#1a9c95]/10 flex items-center justify-center text-[#1a9c95] font-bold">1</div>
              <div className="h-12 w-1 bg-[#1a9c95]/10 mx-2"></div>
              <div className="bg-gray-50 flex-1 p-3 rounded-lg">
                <p className="font-medium">QR Menü Taraması</p>
                <p className="text-sm text-gray-500">100% kullanıcı</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-[#1a9c95]/10 flex items-center justify-center text-[#1a9c95] font-bold">2</div>
              <div className="h-12 w-1 bg-[#1a9c95]/10 mx-2"></div>
              <div className="bg-gray-50 flex-1 p-3 rounded-lg">
                <p className="font-medium">Kategori İnceleme</p>
                <p className="text-sm text-gray-500">94% kullanıcı</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-[#1a9c95]/10 flex items-center justify-center text-[#1a9c95] font-bold">3</div>
              <div className="h-12 w-1 bg-[#1a9c95]/10 mx-2"></div>
              <div className="bg-gray-50 flex-1 p-3 rounded-lg">
                <p className="font-medium">Ürün Detayı</p>
                <p className="text-sm text-gray-500">78% kullanıcı</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-[#1a9c95]/10 flex items-center justify-center text-[#1a9c95] font-bold">4</div>
              <div className="h-12 w-1 bg-[#1a9c95]/10 mx-2"></div>
              <div className="bg-gray-50 flex-1 p-3 rounded-lg">
                <p className="font-medium">Sepete Ekleme</p>
                <p className="text-sm text-gray-500">42% kullanıcı</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-[#1a9c95]/10 flex items-center justify-center text-[#1a9c95] font-bold">5</div>
              <div className="h-12 w-1 bg-[#1a9c95]/10 mx-2"></div>
              <div className="bg-gray-50 flex-1 p-3 rounded-lg">
                <p className="font-medium">Sipariş Tamamlama</p>
                <p className="text-sm text-gray-500">18% kullanıcı</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Zaman Bazlı Aktivite</h2>
          
          <div className="rounded-lg border overflow-hidden">
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map(day => (
                <div key={day} className="text-center p-2 font-medium bg-white text-sm">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-px bg-gray-200">
              {Array.from({ length: 24 }).map((_, hourIndex) => (
                Array.from({ length: 7 }).map((_, dayIndex) => {
                  // Rastgele aktivite seviyesi (gerçek verilerle değiştirilmeli)
                  const activity = Math.floor(Math.random() * 100);
                  let color = 'bg-green-50';
                  
                  if (activity > 80) color = 'bg-green-500';
                  else if (activity > 60) color = 'bg-green-400';
                  else if (activity > 40) color = 'bg-green-300';
                  else if (activity > 20) color = 'bg-green-200';
                  else if (activity > 5) color = 'bg-green-100';
                  
                  return (
                    <div 
                      key={`${hourIndex}-${dayIndex}`}
                      className={`w-full h-6 ${color} hover:opacity-80 cursor-pointer`}
                      title={`${hourIndex}:00 - Aktivite: ${activity}%`}
                    ></div>
                  );
                })
              ))}
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-50 rounded mr-1"></div>
              <span className="text-xs">Az</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-100 rounded mr-1"></div>
              <span className="text-xs"></span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-200 rounded mr-1"></div>
              <span className="text-xs"></span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-300 rounded mr-1"></div>
              <span className="text-xs"></span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
              <span className="text-xs"></span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
              <span className="text-xs">Çok</span>
            </div>
          </div>
          
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-600 mb-2">En Yoğun Saatler</h3>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500">Perşembe</p>
                <p className="font-medium">12:00 - 14:00</p>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500">Cuma</p>
                <p className="font-medium">18:00 - 20:00</p>
              </div>
              <div className="bg-gray-50 rounded p-2 text-center">
                <p className="text-xs text-gray-500">Cumartesi</p>
                <p className="font-medium">13:00 - 16:00</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Heatmap