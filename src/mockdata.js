// src/mockData.js
export const mockData = {
    // İstatistik verileri
    stats: {
      pageViews: 1250,
      uniqueVisitors: 856,
      clickRate: 3.5,
      avgSessionTime: "3:45",
      conversionRate: 2.8,
      orders: 35,
      revenue: 4500,
      cartAdds: 120
    },
    
    // Trend verileri
    trends: Array(7).fill().map((_, i) => ({
      date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
      views: Math.floor(Math.random() * 200) + 100,
      visitors: Math.floor(Math.random() * 150) + 50,
      orders: Math.floor(Math.random() * 10) + 1
    })),
    
    // Popüler ürünler
    popularProducts: Array(5).fill().map((_, i) => ({
      id: i + 1,
      name: `Örnek Ürün ${i + 1}`,
      category_name: ["Kahveler", "Tatlılar", "Ana Yemekler"][i % 3],
      view_count: Math.floor(Math.random() * 100) + 20,
      order_count: Math.floor(Math.random() * 20) + 5,
      revenue: Math.floor(Math.random() * 1000) + 200,
      image_url: ""
    })),
    
    // Kategori verileri
    categoryData: [
      { category_name: "Kahveler", view_count: 230, order_count: 45, revenue_percentage: 28.5 },
      { category_name: "Tatlılar", view_count: 180, order_count: 32, revenue_percentage: 22.3 },
      { category_name: "Ana Yemekler", view_count: 150, order_count: 28, revenue_percentage: 19.8 },
      { category_name: "Soğuk İçecekler", view_count: 120, order_count: 22, revenue_percentage: 16.2 },
      { category_name: "Çaylar", view_count: 100, order_count: 18, revenue_percentage: 13.2 }
    ],
    
    // Tıklama verileri (ısı haritası için)
    clickData: Array(50).fill().map(() => ({
      x: Math.floor(Math.random() * 800),
      y: Math.floor(Math.random() * 600),
      value: Math.floor(Math.random() * 5) + 1
    })),
    
    // Saatlik ziyaretçi verileri
    visitorsByHour: Array(24).fill().map((_, i) => ({
      hour: i.toString(),
      visitors: Math.floor(Math.random() * 30) + 5
    })),
    
    // Kategori bazlı sipariş verileri
    orderByCategory: [
      { name: "Kahveler", value: 35 },
      { name: "Tatlılar", value: 25 },
      { name: "Ana Yemekler", value: 20 },
      { name: "Soğuk İçecekler", value: 15 },
      { name: "Çaylar", value: 5 }
    ]
  };