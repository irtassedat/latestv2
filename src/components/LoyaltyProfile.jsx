import { useState, useEffect } from 'react';
import { FiGift, FiStar, FiClock, FiTrendingUp, FiAward } from 'react-icons/fi';
import api from '../lib/axios';
import RewardsCatalog from './RewardsCatalog';
import RewardsHistory from './RewardsHistory';

const LoyaltyProfile = ({ customer }) => {
  const [loyaltyAccounts, setLoyaltyAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'rewards', 'history'

  useEffect(() => {
    fetchLoyaltyAccounts();
  }, []);

  const fetchLoyaltyAccounts = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const response = await api.get(`/api/loyalty/customer/${customer.id}/all-accounts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLoyaltyAccounts(response.data);
      
      // İlk hesabı seç
      if (response.data.length > 0) {
        setSelectedAccount(response.data[0]);
        fetchTransactions(response.data[0].id);
      }
    } catch (err) {
      console.error('Sadakat hesapları yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async (accountId) => {
    setTransactionsLoading(true);
    try {
      const token = localStorage.getItem('customer_token');
      const response = await api.get(`/api/loyalty/customer/${customer.id}/transactions`, {
        params: { 
          brand_id: selectedAccount?.brand_id,
          limit: 10 
        },
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions);
    } catch (err) {
      console.error('İşlem geçmişi yüklenemedi:', err);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'PLATINUM': return 'from-gray-400 to-gray-600';
      case 'GOLD': return 'from-yellow-400 to-yellow-600';
      case 'SILVER': return 'from-gray-300 to-gray-500';
      default: return 'from-amber-600 to-amber-800';
    }
  };

  const getTierIcon = (tier) => {
    switch (tier) {
      case 'PLATINUM': return '💎';
      case 'GOLD': return '👑';
      case 'SILVER': return '🥈';
      default: return '🥉';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="animate-pulse p-4">
        <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hesap Kartları */}
      <div className="space-y-4">
        {loyaltyAccounts.map(account => (
          <div
            key={account.id}
            onClick={() => {
              setSelectedAccount(account);
              fetchTransactions(account.id);
            }}
            className={`relative overflow-hidden rounded-xl shadow-lg bg-gradient-to-br ${getTierColor(account.tier_level)} text-white cursor-pointer transition-transform hover:scale-[1.02] ${
              selectedAccount?.id === account.id ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <div className="p-6">
              {/* Üst Başlık */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold">{account.brand_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm opacity-90">{account.tier_level} Üye</span>
                    <span>{getTierIcon(account.tier_level)}</span>
                  </div>
                </div>
                <img
                  src={account.logo_url || '/default-logo.png'}
                  alt={account.brand_name}
                  className="h-12 w-12 object-contain bg-white/10 rounded-lg p-2"
                />
              </div>

              {/* Puan Bilgisi */}
              <div className="mb-6">
                <div className="text-3xl font-bold">{account.current_points}</div>
                <div className="text-sm opacity-75">Mevcut Puan</div>
              </div>

              {/* Alt Bilgiler */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="flex flex-col items-center gap-1">
                  <FiStar className="opacity-75" />
                  <div className="font-medium">{account.lifetime_points}</div>
                  <div className="opacity-75 text-xs">Toplam Puan</div>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <FiTrendingUp className="opacity-75" />
                  <div className="font-medium">{account.total_earned || 0}</div>
                  <div className="opacity-75 text-xs">Kazanılan</div>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <FiGift className="opacity-75" />
                  <div className="font-medium">{account.total_spent || 0}</div>
                  <div className="opacity-75 text-xs">Harcanan</div>
                </div>
              </div>

              {/* Seviye İlerlemesi */}
              {account.tier_level !== 'PLATINUM' && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs mb-1">
                    <span>{account.tier_level}</span>
                    <span>{account.next_tier_requirement} puan</span>
                  </div>
                  <div className="w-full bg-white/20 rounded-full h-2">
                    <div 
                      className="bg-white h-2 rounded-full transition-all"
                      style={{ 
                        width: `${Math.min((account.lifetime_points / account.next_tier_requirement) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Kartın dalgalı deseni */}
            <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full"></div>
            <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full"></div>
          </div>
        ))}
      </div>

      {/* Tab Menü ve İçerikler */}
      {selectedAccount && (
        <div className="bg-white rounded-xl shadow-md mt-6">
          {/* Tab Menü */}
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Genel Bakış
              </button>
              <button
                onClick={() => setActiveTab('rewards')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'rewards'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Ödül Kataloğu
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Ödül Geçmişi
              </button>
            </div>
          </div>

          {/* Tab İçerikleri */}
          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">İşlem Geçmişi</h3>
                
                {transactionsLoading ? (
                  <div className="animate-pulse space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="h-12 bg-gray-100 rounded"></div>
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-3">
                    {transactions.map(transaction => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${
                            transaction.transaction_type === 'earn' ? 'bg-green-100' :
                            transaction.transaction_type === 'spend' ? 'bg-red-100' :
                            'bg-blue-100'
                          }`}>
                            {transaction.transaction_type === 'earn' ? (
                              <FiTrendingUp className="text-green-600" />
                            ) : transaction.transaction_type === 'spend' ? (
                              <FiGift className="text-red-600" />
                            ) : (
                              <FiAward className="text-blue-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-gray-500">
                              {formatDate(transaction.created_at)}
                              {transaction.branch_name && ` • ${transaction.branch_name}`}
                            </p>
                          </div>
                        </div>
                        <div className={`font-bold ${
                          transaction.transaction_type === 'earn' ? 'text-green-600' :
                          transaction.transaction_type === 'spend' ? 'text-red-600' :
                          'text-blue-600'
                        }`}>
                          {transaction.transaction_type === 'spend' ? '-' : '+'}{transaction.points}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">Henüz işlem yok</p>
                )}
              </div>
            )}

            {activeTab === 'rewards' && selectedAccount && (
              <RewardsCatalog 
                customer={customer}
                brandId={selectedAccount.brand_id}
                onRedeemSuccess={() => {
                  // Ödül kullanıldığında sadakat verilerini yenile
                  fetchLoyaltyAccounts();
                  fetchTransactions(selectedAccount.id);
                }}
              />
            )}

            {activeTab === 'history' && (
              <RewardsHistory customer={customer} />
            )}
          </div>
        </div>
      )}

      {/* Hesap yoksa */}
      {loyaltyAccounts.length === 0 && (
        <div className="text-center p-8 bg-gray-50 rounded-xl">
          <FiGift size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">Henüz Sadakat Kartınız Yok</h3>
          <p className="text-gray-500 mt-2">
            Sipariş vererek puan kazanmaya başlayın!
          </p>
        </div>
      )}
    </div>
  );
};

export default LoyaltyProfile;