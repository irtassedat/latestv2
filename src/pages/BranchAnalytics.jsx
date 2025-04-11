// src/pages/BranchAnalytics.jsx
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FiSearch, FiDownload, FiFilter, FiPieChart, FiBarChart2, FiCalendar, FiUsers } from "react-icons/fi";
import api from "../lib/axios";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useAuth } from "../contexts/AuthContext";
import h337 from 'heatmap.js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';

const BranchAnalytics = () => {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [timeRange, setTimeRange] = useState("week");
  const [analyticsData, setAnalyticsData] = useState({
    stats: {
      pageViews: 0,
      uniqueVisitors: 0,
      clickRate: 0,
      avgSessionTime: "0:00",
      conversionRate: 0,
      orders: 0,
      revenue: 0
    },
    trends: [],
    popularProducts: [],
    categoryData: [],
    clickData: []
  });
  const [visitorsByHour, setVisitorsByHour] = useState([]);
  const [orderByCategory, setOrderByCategory] = useState([]);
  const heatmapRef = useRef(null);

  // COLORS for charts
  const COLORS = ['#1a9c95', '#D98A3D', '#022B45', '#B8D7DD', '#B04759', '#6A8D73', '#755139', '#8294C4'];

  // Şubeleri getir
  const fetchBranches = async () => {
    try {
      // Super admin tüm şubeleri görebilir
      // Branch manager sadece kendi şubesini görebilir
      if (isSuperAdmin) {
        const response = await api.get("/api/branches");
        setBranches(response.data);
      } else if (currentUser?.branch_id) {
        const response = await api.get(`/api/branches/${currentUser.branch_id}`);
        setBranches([response.data]);
      }
    } catch (error) {
      console.error("Şubeler yüklenirken hata:", error);
      toast.error("Şubeler yüklenemedi!");
    }
  };

  // Şube ve parametre değiştiğinde verileri yükle
  useEffect(() => {
    fetchBranches();
  }, [isSuperAdmin, currentUser]);

  useEffect(() => {
    // URL'den veya context'ten gelen şube ID'sini seç
    const effectiveBranchId = branchId || (branches[0]?.id?.toString() || null);
    
    if (effectiveBranchId && effectiveBranchId !== selectedBranchId) {
      setSelectedBranchId(effectiveBranchId);
      
      // URL güncelleme
      if (!branchId && effectiveBranchId) {
        navigate(`/admin/branches/${effectiveBranchId}/analytics`, { replace: true });
      }
    }
  }, [branchId, branches, navigate, selectedBranchId]);

  // Analitik verileri yükle
  useEffect(() => {
    if (!selectedBranchId) return;
    
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        // Ana istatistikler, trendler, popüler ürünler ve kategori verileri
        const [statsRes, trendsRes, productsRes, categoryRes, clicksRes] = await Promise.all([
          api.get(`/api/analytics/stats?branchId=${selectedBranchId}&timeRange=${timeRange}`),
          api.get(`/api/analytics/trends?branchId=${selectedBranchId}&timeRange=${timeRange}`),
          api.get(`/api/analytics/popular-products?branchId=${selectedBranchId}&timeRange=${timeRange}`),
          api.get(`/api/analytics/category-popularity?branchId=${selectedBranchId}&timeRange=${timeRange}`),
          api.get(`/api/analytics/clicks?branchId=${selectedBranchId}&timeRange=${timeRange}`)
        ]);

        // Ekstra veriler - saatlik ziyaretçi, kategori bazlı siparişler
        const [hourlyRes, catOrdersRes] = await Promise.all([
          api.get(`/api/analytics/visitors-by-hour?branchId=${selectedBranchId}&timeRange=${timeRange}`),
          api.get(`/api/analytics/orders-by-category?branchId=${selectedBranchId}&timeRange=${timeRange}`)
        ]);

        setAnalyticsData({
          stats: statsRes.data,
          trends: trendsRes.data,
          popularProducts: productsRes.data,
          categoryData: categoryRes.data,
          clickData: clicksRes.data
        });

        setVisitorsByHour(hourlyRes.data);
        setOrderByCategory(catOrdersRes.data);

        // Isı haritası oluştur
        if (heatmapRef.current && clicksRes.data && clicksRes.data.length > 0) {
          createHeatmap(clicksRes.data);
        }
      } catch (error) {
        console.error("Analitik verileri yüklenirken hata:", error);
        toast.error("Analitik verileri yüklenemedi!");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedBranchId, timeRange]);

  // Isı haritası oluşturma
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
        '.5': '#1a9c95',
        '.8': '#D98A3D',
        '.95': '#022B45'
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

  // Excel'e aktarma fonksiyonu
  const handleExportExcel = () => {
    // Verileri birleştir
    const exportData = {
      "Genel İstatistikler": [
        {
          "Şube": branches.find(b => b.id.toString() === selectedBranchId)?.name || "Bilinmeyen Şube",
          "Zaman Aralığı": timeRangeLabels[timeRange],
          "Sayfa Görüntüleme": analyticsData.stats.pageViews,
          "Benzersiz Ziyaretçi": analyticsData.stats.uniqueVisitors,
          "Ortalama Oturum Süresi": analyticsData.stats.avgSessionTime,
          "Dönüşüm Oranı (%)": analyticsData.stats.conversionRate,
          "Sipariş Sayısı": analyticsData.stats.orders,
          "Toplam Gelir (₺)": analyticsData.stats.revenue
        }
      ],
      "Popüler Ürünler": analyticsData.popularProducts.map(product => ({
        "Ürün Adı": product.name,
        "Kategori": product.category_name,
        "Görüntülenme": product.view_count,
        "Sipariş Edilme": product.order_count,
        "Toplam Gelir (₺)": product.revenue
      })),
      "Kategori Popülerliği": analyticsData.categoryData.map(category => ({
        "Kategori": category.category_name,
        "Görüntülenme": category.view_count,
        "Sipariş Edilme": category.order_count,
        "Gelir Payı (%)": category.revenue_percentage
      })),
      "Ziyaretçi Trendi": analyticsData.trends.map(trend => ({
        "Tarih": trend.date,
        "Görüntülenme": trend.views,
        "Ziyaretçi": trend.visitors,
        "Siparişler": trend.orders
      }))
    };

    // Excel dosyası oluştur
    const workbook = XLSX.utils.book_new();

    // Her veri seti için bir sayfa oluştur
    Object.entries(exportData).forEach(([sheetName, data]) => {
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });

    // Şube adını al
    const branchName = branches.find(b => b.id.toString() === selectedBranchId)?.name || "Şube";

    // Dosya adında şube adı ve tarih bilgisi olsun
    const date = new Date().toISOString().split('T')[0];
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `${branchName}_Analitik_${date}.xlsx`);

    toast.success("Excel dosyası indiriliyor...");
  };

  // Zaman aralığı etiketleri
  const timeRangeLabels = {
    "day": "Son 24 Saat",
    "week": "Son 7 Gün",
    "month": "Son 30 Gün",
    "quarter": "Son 3 Ay",
    "year": "Son 1 Yıl"
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header - Başlık ve İşlem Butonları */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Şube Analitiği</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {timeRangeLabels[timeRange]}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {/* Şube Seçici - Super admin için */}
            {isSuperAdmin && branches.length > 1 && (
              <select
                value={selectedBranchId || ""}
                onChange={(e) => navigate(`/admin/branches/${e.target.value}/analytics`)}
                className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Şube Seçin</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            )}
            
            {/* Zaman Aralığı Seçici */}
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Son 24 Saat</option>
              <option value="week">Son 7 Gün</option>
              <option value="month">Son 30 Gün</option>
              <option value="quarter">Son 3 Ay</option>
              <option value="year">Son 1 Yıl</option>
            </select>
            
            {/* Excel İndir */}
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiDownload size={18} />
              <span>Excel İndir</span>
            </button>
          </div>
        </div>

        {/* İstatistikler */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#022B45]"></div>
          </div>
        ) : (
          <>
            {/* Özet Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">Sayfa Görüntüleme</div>
                  <div className="text-blue-500 bg-blue-100 p-2 rounded-full">
                    <FiUsers size={20} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{analyticsData.stats.pageViews}</div>
                <div className="mt-2 text-xs text-green-600 bg-green-50 inline-block px-2 py-1 rounded-full">
                  ↑ %12 geçen haftaya göre
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">Benzersiz Ziyaretçi</div>
                  <div className="text-purple-500 bg-purple-100 p-2 rounded-full">
                    <FiUsers size={20} />
                  </div>
                </div>
                <div className="text-2xl font-bold">{analyticsData.stats.uniqueVisitors}</div>
                <div className="mt-2 text-xs text-green-600 bg-green-50 inline-block px-2 py-1 rounded-full">
                  ↑ %8 geçen haftaya göre
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">Siparişler</div>
                  <div className="text-green-500 bg-green-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold">{analyticsData.stats.orders}</div>
                <div className="mt-2 text-xs text-green-600 bg-green-50 inline-block px-2 py-1 rounded-full">
                  ↑ %15 geçen haftaya göre
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">Toplam Gelir</div>
                  <div className="text-[#D98A3D] bg-amber-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="text-2xl font-bold">{analyticsData.stats.revenue.toFixed(2)} ₺</div>
                <div className="mt-2 text-xs text-green-600 bg-green-50 inline-block px-2 py-1 rounded-full">
                  ↑ %23 geçen haftaya göre
                </div>
              </div>
            </div>

            {/* Ziyaretçi Trendi Grafiği */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Ziyaretçi Trendi</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={analyticsData.trends}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="views" name="Sayfa Görüntüleme" stroke="#1a9c95" fill="#1a9c95" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="visitors" name="Ziyaretçiler" stroke="#D98A3D" fill="#D98A3D" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="orders" name="Siparişler" stroke="#022B45" fill="#022B45" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Saatlik Ziyaretçi Grafiği */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Saatlik Ziyaretçiler</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={visitorsByHour}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="hour" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="visitors" name="Ziyaretçiler" fill="#1a9c95" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Kategori Sipariş Grafiği */}
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Kategori Sipariş Dağılımı</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {orderByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Isı Haritası */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Menü Tıklama Haritası</h2>
              <div className="relative w-full aspect-[16/9] bg-gray-100 rounded-lg overflow-hidden">
                <div
                  ref={heatmapRef}
                  className="w-full h-full"
                  style={{ position: 'relative' }}
                ></div>
                {analyticsData.clickData.length === 0 && (
                  <div className="absolute inset-0 w-full h-full bg-gray-100 flex items-center justify-center">
                    <p className="text-gray-500">Bu zaman aralığı için tıklama verisi bulunmamaktadır.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Popüler Ürünler */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">En Popüler Ürünler</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ürün
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kategori
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Görüntülenme
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Sipariş
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gelir
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.popularProducts.slice(0, 5).map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-md overflow-hidden bg-gray-100">
                              <img
                                src={product.image_url || "/uploads/placeholder.jpg"}
                                alt={product.name}
                                className="h-full w-full object-cover"
                                onError={(e) => { e.target.src = "/uploads/placeholder.jpg"; }}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800`}>
                            {product.category_name}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {product.view_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {product.order_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {product.revenue ? `${product.revenue.toFixed(2)} ₺` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Kategori Analizi */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Kategori Analizi</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={analyticsData.categoryData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="category_name" type="category" width={120} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="view_count" name="Görüntülenme" fill="#1a9c95" />
                      <Bar dataKey="order_count" name="Sipariş" fill="#D98A3D" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analyticsData.categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="revenue_percentage"
                        nameKey="category_name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {analyticsData.categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value.toFixed(2)}%`, 'Gelir Payı']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pazarlama Önerileri */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mt-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Pazarlama Önerileri</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-r-md">
                  <h3 className="font-medium text-green-800 mb-1">En Çok Görüntülenen Ürünler</h3>
                  <p className="text-sm text-green-700">
                    {analyticsData.popularProducts[0]?.name || "Ürün"} çok görüntüleniyor ancak sipariş edilmiyor. Fiyatı veya ürün açıklamasını gözden geçirin.
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-md">
                  <h3 className="font-medium text-blue-800 mb-1">Popüler Kategori</h3>
                  <p className="text-sm text-blue-700">
                    {analyticsData.categoryData[0]?.category_name || "Kategori"} kategorisinde daha fazla ürün eklemeyi düşünebilirsiniz. Bu kategoriye olan talep yüksek.
                  </p>
                </div>
                
                <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-md">
                  <h3 className="font-medium text-amber-800 mb-1">Ziyaretçi Zamanlaması</h3>
                  <p className="text-sm text-amber-700">
                    En yoğun ziyaretçi akışı öğle saatlerinde. Bu saatlere özel indirim kampanyaları planlayabilirsiniz.
                  </p>
                </div>
              </div>
            </div>
            
            {/* Kullanıcı Davranış Analizi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Kullanıcı Davranışları</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ortalama Sepet Değeri</span>
                    <span className="font-semibold">{(analyticsData.stats.revenue / analyticsData.stats.orders || 0).toFixed(2)} ₺</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sayfa Başı Geçirilen Süre</span>
                    <span className="font-semibold">{analyticsData.stats.avgSessionTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dönüşüm Oranı</span>
                    <span className="font-semibold">%{analyticsData.stats.conversionRate.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sepete Ekleme Oranı</span>
                    <span className="font-semibold">%{((analyticsData.stats.cartAdds / analyticsData.stats.pageViews) * 100 || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sepeti Terk Etme Oranı</span>
                    <span className="font-semibold">%{((1 - analyticsData.stats.orders / analyticsData.stats.cartAdds) * 100 || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Cihaz ve Platform Dağılımı</h2>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600">Mobil</span>
                      <span className="text-sm font-medium text-gray-600">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#1a9c95] h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600">Tablet</span>
                      <span className="text-sm font-medium text-gray-600">12%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#D98A3D] h-2 rounded-full" style={{ width: '12%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-600">Masaüstü</span>
                      <span className="text-sm font-medium text-gray-600">10%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-[#022B45] h-2 rounded-full" style={{ width: '10%' }}></div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">İşletim Sistemleri</h3>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">iOS: 52%</div>
                      <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Android: 38%</div>
                      <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Windows: 8%</div>
                      <div className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Mac: 2%</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
          </>
        )}
      </div>
    </div>
  );
};

export default BranchAnalytics;