import { useState, useEffect } from "react";
import { FiBarChart2, FiTrendingUp, FiCalendar, FiDownload } from "react-icons/fi";
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

const LoyaltyReportsManager = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    summary: {},
    dailyStats: [],
    campaignPerformance: [],
    tierDistribution: {},
    topCustomers: []
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/loyalty/reports', {
        params: {
          start_date: dateRange.start,
          end_date: dateRange.end
        }
      });
      setReportData(response.data);
    } catch (err) {
      console.error('Rapor verileri yüklenirken hata:', err);
      toast.error('Rapor verileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const response = await api.get('/api/loyalty/reports/export', {
        params: {
          format,
          start_date: dateRange.start,
          end_date: dateRange.end
        },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sadakat-raporu-${dateRange.start}-${dateRange.end}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Rapor export hatası:', err);
      toast.error('Rapor export edilemedi');
    }
  };

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Sadakat Programı Raporları</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="border rounded-lg p-2"
              />
              <span>-</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="border rounded-lg p-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => exportReport('pdf')}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                <FiDownload />
                PDF
              </button>
              <button
                onClick={() => exportReport('xlsx')}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                <FiDownload />
                Excel
              </button>
            </div>
          </div>
        </div>

        {/* Özet Kartlar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-700">Toplam Puan Kazanımı</h3>
            <p className="text-2xl font-bold text-blue-900">{reportData.summary.totalPointsEarned || 0}</p>
            <p className="text-sm text-blue-600">
              {reportData.summary.pointsEarnedChange || 0}% değişim
            </p>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-green-700">Toplam Puan Kullanımı</h3>
            <p className="text-2xl font-bold text-green-900">{reportData.summary.totalPointsSpent || 0}</p>
            <p className="text-sm text-green-600">
              {reportData.summary.pointsSpentChange || 0}% değişim
            </p>
          </div>
          
          <div className="bg-amber-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-amber-700">Yeni Üyeler</h3>
            <p className="text-2xl font-bold text-amber-900">{reportData.summary.newMembers || 0}</p>
            <p className="text-sm text-amber-600">
              {reportData.summary.newMembersChange || 0}% değişim
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-purple-700">Aktif Üye Oranı</h3>
            <p className="text-2xl font-bold text-purple-900">{reportData.summary.activeRate || 0}%</p>
            <p className="text-sm text-purple-600">
              Aktif/Toplam: {reportData.summary.activeMembers}/{reportData.summary.totalMembers}
            </p>
          </div>
        </div>

        {/* Günlük İstatistikler Grafiği */}
        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Günlük Puan İstatistikleri</h2>
          {/* Burada Chart.js veya Recharts kullanarak grafik gösterilebilir */}
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-500">Grafik alanı</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Kampanya Performansı */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Kampanya Performansı</h2>
            <div className="space-y-4">
              {reportData.campaignPerformance.map((campaign, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{campaign.name}</p>
                    <p className="text-sm text-gray-500">{campaign.type}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-blue-600">{campaign.pointsGenerated} puan</p>
                    <p className="text-sm text-gray-500">{campaign.participations} katılım</p>
                  </div>
                </div>
              ))}
              {reportData.campaignPerformance.length === 0 && (
                <p className="text-center text-gray-500">Kampanya verisi bulunamadı</p>
              )}
            </div>
          </div>

          {/* Tier Dağılımı */}
          <div className="bg-white rounded-lg border p-6">
            <h2 className="text-lg font-semibold mb-4">Üyelik Seviyesi Dağılımı</h2>
            <div className="space-y-4">
              {Object.entries(reportData.tierDistribution).map(([tier, data]) => (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white
                      ${tier === 'PLATINUM' ? 'bg-gray-800' :
                        tier === 'GOLD' ? 'bg-yellow-500' :
                        tier === 'SILVER' ? 'bg-gray-400' :
                        'bg-amber-700'}`}>
                      {tier.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{tier}</p>
                      <p className="text-sm text-gray-500">{data.count} üye</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{data.percentage}%</p>
                    <p className="text-sm text-gray-500">{data.avgPoints} ortalama puan</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* En Aktif Müşteriler */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">En Aktif Müşteriler</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Telefon</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seviye</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Kazanılan Puan</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Harcanan Puan</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlem Sayısı</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportData.topCustomers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.full_name || 'İsimsiz'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.phone_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full
                        ${customer.tier_level === 'PLATINUM' ? 'bg-gray-800 text-white' :
                          customer.tier_level === 'GOLD' ? 'bg-yellow-500 text-white' :
                          customer.tier_level === 'SILVER' ? 'bg-gray-400 text-white' :
                          'bg-amber-700 text-white'}`}>
                        {customer.tier_level}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-green-600">
                      +{customer.points_earned}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-red-600">
                      -{customer.points_spent}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                      {customer.transaction_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyReportsManager;