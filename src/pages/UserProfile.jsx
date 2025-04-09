// src/pages/UserProfile.jsx
import { useState } from "react";
import { FiEdit2, FiSave, FiLock, FiUser, FiMail, FiMapPin, FiClock } from "react-icons/fi";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";


const UserProfile = () => {
  const { currentUser, changePassword, updateUserInfo } = useAuth();
  const [isPasswordChanging, setIsPasswordChanging] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // Son giriş tarihi formatla
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('tr-TR', {
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Şifre formunu güncelle
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  // Şifre değiştirme formunu gönder
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    // Form doğrulama
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Yeni şifreler eşleşmiyor");
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }
    
    setLoading(true);
    
    try {
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      toast.success("Şifreniz başarıyla değiştirildi");
      
      // Formu sıfırla ve kapalı moda al
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setIsPasswordChanging(false);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı rol adı
  const getRoleName = (role) => {
    switch (role) {
      case 'super_admin':
        return 'Süper Admin';
      case 'branch_manager':
        return 'Şube Yöneticisi';
      default:
        return role;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Hesap Profili</h1>
        
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Profil Üst Kısmı */}
          <div className="p-6 sm:p-8 bg-gradient-to-r from-[#022B45] to-[#034268] text-white">
            <div className="flex flex-col sm:flex-row gap-6 items-center">
              <div className="h-24 w-24 rounded-full bg-white text-[#022B45] flex items-center justify-center text-4xl font-bold">
                {currentUser?.username?.charAt(0)?.toUpperCase()}
              </div>
              
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold mb-1">{currentUser?.username}</h2>
                <p className="text-blue-100 text-sm mb-2">{currentUser?.email}</p>
                <span className="inline-block px-3 py-1 bg-blue-900/50 rounded-full text-xs font-medium">
                  {getRoleName(currentUser?.role)}
                </span>
              </div>
            </div>
          </div>
          
          {/* Profil Detayları */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Kullanıcı Bilgileri</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <FiUser className="text-gray-400 mr-3" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Kullanıcı Adı</p>
                  <p className="font-medium">{currentUser?.username}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FiMail className="text-gray-400 mr-3" size={20} />
                <div>
                  <p className="text-sm text-gray-500">E-posta Adresi</p>
                  <p className="font-medium">{currentUser?.email}</p>
                </div>
              </div>
              
              {currentUser?.branch_name && (
                <div className="flex items-center">
                  <FiMapPin className="text-gray-400 mr-3" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Şube</p>
                    <p className="font-medium">{currentUser?.branch_name}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center">
                <FiClock className="text-gray-400 mr-3" size={20} />
                <div>
                  <p className="text-sm text-gray-500">Son Giriş</p>
                  <p className="font-medium">{formatDate(currentUser?.last_login)}</p>
                </div>
              </div>
            </div>
            
            {/* Şifre Değiştirme Bölümü */}
            <div className="mt-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Şifre Yönetimi</h3>
                <button
                  onClick={() => setIsPasswordChanging(!isPasswordChanging)}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {isPasswordChanging ? (
                    <>
                      <span>İptal</span>
                    </>
                  ) : (
                    <>
                      <FiEdit2 size={14} />
                      <span>Şifre Değiştir</span>
                    </>
                  )}
                </button>
              </div>
              
              {isPasswordChanging ? (
                <form onSubmit={handlePasswordSubmit} className="mt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mevcut Şifre
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-gray-400" size={16} />
                      </div>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={handlePasswordFormChange}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Şifre
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-gray-400" size={16} />
                      </div>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordFormChange}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        placeholder="En az 6 karakter"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yeni Şifre (Tekrar)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-gray-400" size={16} />
                      </div>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordFormChange}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex items-center justify-center gap-1 w-full py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 ${
                        loading ? "opacity-70 cursor-not-allowed" : ""
                      }`}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>İşleniyor...</span>
                        </>
                      ) : (
                        <>
                          <FiSave size={16} />
                          <span>Şifreyi Değiştir</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Güvenliğiniz için şifrenizi düzenli olarak değiştirmenizi öneririz. Şifrenizi değiştirmek için "Şifre Değiştir" butonuna tıklayın.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;