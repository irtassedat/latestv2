import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiStar, FiGift, FiUsers, FiSettings, FiTrendingUp,
  FiAward, FiActivity, FiCreditCard, FiBarChart2
} from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import api from "../lib/axios";
import toast from "react-hot-toast";

// Çeşme Kahvecisi tema renkleri
const theme = {
  primary: "#022B45",
  secondary: "#B8D7DD",
  accent: "#D98A3D",
  light: "#F4F7F8",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
};

const LoyaltyProgramManager = () => {
  const { isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAccounts: 0,
    activeAccounts: 0,
    totalPoints: 0,
    activeCampaigns: 0,
    monthlyTransactions: 0,
    averagePointsPerCustomer: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [activeCampaigns, setActiveCampaigns] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // İstatistikleri getir
      const statsResponse = await api.get('/api/loyalty/stats');
      setStats(statsResponse.data);

      // Son işlemleri getir
      const transactionsResponse = await api.get('/api/loyalty/transactions/recent?limit=10');
      setRecentTransactions(transactionsResponse.data);

      // En iyi müşterileri getir
      const customersResponse = await api.get('/api/loyalty/top-customers?limit=5');
      setTopCustomers(customersResponse.data);

      // Aktif kampanyaları getir
      const campaignsResponse = await api.get('/api/loyalty/campaigns?active=true&limit=3');
      setActiveCampaigns(campaignsResponse.data);
    } catch (err) {
      console.error('Dashboard verileri yüklenirken hata:', err);
      toast.error('Veriler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const dashboardCards = [
    {
      title: "Toplam Sadakat Hesabı",
      value: stats.totalAccounts,
      icon: <FiUsers size={24} />,
      color: "bg-blue-500",
      link: "/admin/loyalty/customers",
      trend: "+12%",
      trendUp: true
    },
    {
      title: "Aktif Hesaplar",
      value: stats.activeAccounts,
      icon: <FiActivity size={24} />,
      color: "bg-green-500",
      link: "/admin/loyalty/customers?active=true",
      trend: "+8%",
      trendUp: true
    },
    {
      title: "Toplam Puan",
      value: stats.totalPoints?.toLocaleString() || 0,
      icon: <FiStar size={24} />,
      color: "bg-amber-500",
      link: "/admin/loyalty/points",
      trend: "+15%",
      trendUp: true
    },
    {
      title: "Aktif Kampanyalar",
      value: stats.activeCampaigns,
      icon: <FiGift size={24} />,
      color: "bg-red-500",
      link: "/admin/loyalty/campaigns",
      trend: "-2",
      trendUp: false
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Başlık */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Sadakat Programı Yönetimi</h1>
            <p className="text-sm text-gray-500 mt-1">Müşteri sadakat programınızı yönetin ve analiz edin</p>
          </div>
          <button
            onClick={() => navigate('/admin/loyalty/settings')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            <FiSettings />
            Ayarlar
          </button>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {dashboardCards.map((card, index) => (
            <div
              key={index}
              onClick={() => navigate(card.link)}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className={`${card.color} text-white p-3 rounded-lg`}>
                  {card.icon}
                </div>
                <div className={`text-sm font-medium ${card.trendUp ? 'text-green-600' : 'text-red-600'}`}>
                  {card.trend}
                </div>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-800">{card.value}</p>
                <p className="text-sm text-gray-600">{card.title}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Alt Bölümler */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Son İşlemler */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Son Puan İşlemleri</h2>
              <button
                onClick={() => navigate('/admin/loyalty/transactions')}
                className="text-blue-500 text-sm hover:underline"
              >
                Tümünü Gör →
              </button>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      transaction.transaction_type === 'earn' ? 'bg-green-100 text-green-600' : 
                      transaction.transaction_type === 'spend' ? 'bg-red-100 text-red-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {transaction.transaction_type === 'earn' ? <FiTrendingUp /> : 
                       transaction.transaction_type === 'spend' ? <FiCreditCard /> : 
                       <FiAward />}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.customer_name || 'Anonim'}</p>
                      <p className="text-sm text-gray-500">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${
                      transaction.transaction_type === 'earn' ? 'text-green-600' : 
                      transaction.transaction_type === 'spend' ? 'text-red-600' : 
                      'text-blue-600'
                    }`}>
                      {transaction.transaction_type === 'spend' ? '-' : '+'}{transaction.points} puan
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="text-center text-gray-500 py-4">Henüz işlem yok</p>
              )}
            </div>
          </div>

          {/* En İyi Müşteriler */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">En İyi Müşteriler</h2>
              <button
                onClick={() => navigate('/admin/loyalty/customers?sort=points')}
                className="text-blue-500 text-sm hover:underline"
              >
                Tümünü Gör →
              </button>
            </div>
            <div className="space-y-3">
              {topCustomers.map((customer, index) => (
                <div key={customer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold
                      ${index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-amber-700' : 
                        'bg-blue-500'}`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{customer.full_name || customer.phone_number}</p>
                      <p className="text-sm text-gray-500">{customer.tier_level}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600">{customer.current_points} puan</p>
                    <p className="text-xs text-gray-500">Toplam: {customer.lifetime_points}</p>
                  </div>
                </div>
              ))}
              {topCustomers.length === 0 && (
                <p className="text-center text-gray-500 py-4">Henüz müşteri yok</p>
              )}
            </div>
          </div>
        </div>

        {/* Aktif Kampanyalar */}
        <div className="mt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold">Aktif Kampanyalar</h2>
            <button
              onClick={() => navigate('/admin/loyalty/campaigns')}
              className="text-blue-500 text-sm hover:underline"
            >
              Tüm Kampanyalar →
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activeCampaigns.map((campaign) => (
              <div key={campaign.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <FiGift />
                  </div>
                  <h3 className="font-medium">{campaign.name}</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">{campaign.description}</p>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">
                    {new Date(campaign.valid_until).toLocaleDateString('tr-TR')} tarihine kadar
                  </span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                    Aktif
                  </span>
                </div>
              </div>
            ))}
            {activeCampaigns.length === 0 && (
              <div className="col-span-3 text-center py-8 bg-gray-50 rounded-lg">
                <FiGift className="mx-auto text-4xl text-gray-400 mb-2" />
                <p className="text-gray-500">Aktif kampanya bulunmuyor</p>
              </div>
            )}
          </div>
        </div>

        {/* Hızlı İşlemler */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Hızlı İşlemler</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => navigate('/admin/loyalty/campaigns/new')}
              className="flex items-center gap-3 p-4 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              <FiGift size={24} />
              <div className="text-left">
                <p className="font-medium">Yeni Kampanya</p>
                <p className="text-sm">Kampanya oluştur</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/admin/loyalty/points/manual')}
              className="flex items-center gap-3 p-4 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <FiStar size={24} />
              <div className="text-left">
                <p className="font-medium">Manuel Puan İşlemi</p>
                <p className="text-sm">Puan ekle/çıkar</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/admin/loyalty/reports')}
              className="flex items-center gap-3 p-4 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100"
            >
              <FiBarChart2 size={24} />
              <div className="text-left">
                <p className="font-medium">Raporlar</p>
                <p className="text-sm">Detaylı analizler</p>
              </div>
            </button>
            
            <button
              onClick={() => navigate('/admin/loyalty/tiers')}
              className="flex items-center gap-3 p-4 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
            >
              <FiAward size={24} />
              <div className="text-left">
                <p className="font-medium">Üyelik Seviyeleri</p>
                <p className="text-sm">Tier yönetimi</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyProgramManager;