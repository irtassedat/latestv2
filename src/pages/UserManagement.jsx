// src/pages/UserManagement.jsx
import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiUserPlus, FiKey, FiUser, FiMail, FiLock, FiSearch, FiFilter, FiCheck, FiX, FiSettings, FiDownload, FiUpload, FiInfo } from "react-icons/fi";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const UserManagement = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [branchFilter, setBranchFilter] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" veya "table"
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "branch_manager",
    branch_id: "",
    is_active: true,
    phone: "", 
    full_name: ""
  });
  
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: ""
  });

  // Şubeleri ve kullanıcıları getir
  const fetchData = async () => {
    setLoading(true);
    try {
      // Paralel olarak şube ve kullanıcı verilerini getir
      const [branchesRes, usersRes] = await Promise.all([
        api.get("/api/branches"),
        api.get("/api/users")
      ]);
      
      setBranches(branchesRes.data);
      setUsers(usersRes.data);
    } catch (error) {
      console.error("Veriler yüklenirken hata:", error);
      toast.error("Veriler yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Form değişikliklerini izle
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Checkbox için checked değerini, diğerleri için value değerini kullan
    const inputValue = type === 'checkbox' ? checked : value;
    
    // Role değiştiğinde super_admin seçilirse branch_id'yi boşalt
    if (name === 'role' && value === 'super_admin') {
      setForm(prevForm => ({
        ...prevForm,
        [name]: value,
        branch_id: ''
      }));
    } else {
      setForm(prevForm => ({ ...prevForm, [name]: inputValue }));
    }
  };
  
  // Password form değişikliklerini izle
  const handlePasswordFormChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  // Kullanıcı ekleme/düzenleme modalını aç
  const handleAddEditUser = (user = null) => {
    if (user) {
      // Düzenleme modu
      setSelectedUser(user);
      setForm({
        username: user.username || "",
        email: user.email || "",
        password: "", // Düzenlerken şifre alanını boş bırak
        role: user.role || "branch_manager",
        branch_id: user.branch_id || "",
        is_active: user.is_active !== false, // undefined veya null ise true kabul et
        phone: user.phone || "",
        full_name: user.full_name || ""
      });
    } else {
      // Ekleme modu
      setSelectedUser(null);
      setForm({
        username: "",
        email: "",
        password: "",
        role: "branch_manager",
        branch_id: "",
        is_active: true,
        phone: "",
        full_name: ""
      });
    }
    
    setShowModal(true);
  };

  // Kullanıcı bilgilerini görüntüle
  const handleViewUserInfo = (user) => {
    setSelectedUserInfo(user);
    setShowInfoModal(true);
  };

  // Şifre sıfırlama modalını aç
  const handleResetPassword = (user) => {
    setSelectedUser(user);
    setPasswordForm({
      newPassword: "",
      confirmPassword: ""
    });
    setShowPasswordModal(true);
  };

  // Form validation işlemi
  const validateForm = () => {
    if (!form.username) {
      toast.error("Kullanıcı adı zorunludur");
      return false;
    }
    
    if (!form.email) {
      toast.error("E-posta adresi zorunludur");
      return false;
    }
    
    // Yeni kullanıcı ekliyorsak şifre zorunlu
    if (!selectedUser && !form.password) {
      toast.error("Şifre zorunludur");
      return false;
    }
    
    // Branch Manager için şube seçimi zorunlu
    if (form.role === "branch_manager" && !form.branch_id) {
      toast.error("Şube Yöneticisi için şube seçimi zorunludur");
      return false;
    }
    
    return true;
  };

  // Kullanıcı formu gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form doğrulama
    if (!validateForm()) {
      return;
    }
    
    try {
      let response;
      
      // Var olan kullanıcıyı güncelle
      if (selectedUser) {
        // Şifreyi güncelleme formundan çıkar - ayrı bir endpoint ile yönetilecek
        const updateData = { ...form };
        delete updateData.password;
        
        response = await api.put(`/api/users/${selectedUser.id}`, updateData);
        toast.success("Kullanıcı başarıyla güncellendi");
      } else {
        // Yeni kullanıcı ekle
        response = await api.post("/api/users", form);
        toast.success("Yeni kullanıcı başarıyla eklendi");
      }
      
      // Kullanıcıları yeniden yükle
      fetchData();
      
      // Modalı kapat
      setShowModal(false);
      
    } catch (err) {
      console.error("Form gönderilirken hata:", err);
      toast.error(err.response?.data?.error || "İşlem başarısız oldu!");
    }
  };

  // Şifre sıfırlama formu gönderimi
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Şifre doğrulama
      if (!passwordForm.newPassword) {
        toast.error("Şifre alanı boş olamaz");
        return;
      }
      
      if (passwordForm.newPassword.length < 6) {
        toast.error("Şifre en az 6 karakter olmalıdır");
        return;
      }
      
      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error("Şifreler eşleşmiyor");
        return;
      }
      
      // Şifreyi sıfırla
      await api.post(`/api/users/${selectedUser.id}/reset-password`, {
        newPassword: passwordForm.newPassword
      });
      
      toast.success("Şifre başarıyla sıfırlandı");
      setShowPasswordModal(false);
      
    } catch (err) {
      console.error("Şifre sıfırlanırken hata:", err);
      toast.error(err.response?.data?.error || "Şifre sıfırlanamadı!");
    }
  };

  // Kullanıcı silme işlemi
  const handleDelete = async (userId) => {
    try {
      await api.delete(`/api/users/${userId}`);
      
      // Kullanıcı listesini güncelle
      setUsers(users.filter(user => user.id !== userId));
      
      toast.success("Kullanıcı başarıyla silindi");
      setConfirmDelete(null); // Silme onay penceresini kapat
    } catch (error) {
      console.error("Kullanıcı silinirken hata:", error);
      toast.error(error.response?.data?.error || "Kullanıcı silinemedi!");
    }
  };

  // Excel'e aktarma fonksiyonu
  const handleExportExcel = () => {
    const exportData = filteredUsers.map(user => ({
      'Kullanıcı Adı': user.username,
      'Tam Ad': user.full_name || '',
      'E-posta': user.email,
      'Telefon': user.phone || '',
      'Rol': user.role === 'super_admin' ? 'Süper Admin' : 'Şube Yöneticisi',
      'Şube': user.branch_name || '',
      'Durum': user.is_active ? 'Aktif' : 'Pasif',
      'Son Giriş': user.last_login ? new Date(user.last_login).toLocaleString() : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Kullanıcılar");

    // Dosyayı indir
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, `kullanicilar_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Filtreleme işlemleri - arama ve filtreler
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.branch_name?.toLowerCase().includes(searchLower) ||
      (user.full_name?.toLowerCase().includes(searchLower));

    // Şube filtresi 
    const matchesBranch = !branchFilter || user.branch_id === branchFilter;
    
    // Rol filtresi
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    // Durum filtresi
    const matchesStatus = statusFilter === "" || 
      (statusFilter === "active" && user.is_active) || 
      (statusFilter === "inactive" && !user.is_active);
    
    return matchesSearch && matchesBranch && matchesRole && matchesStatus;
  });

  // Super Admin değilse dashboard'a yönlendir
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="bg-orange-50 text-orange-700 p-4 rounded-lg max-w-lg text-center">
          <h3 className="text-lg font-medium mb-2">Yetkisiz Erişim</h3>
          <p>Bu sayfaya erişim yetkiniz bulunmamaktadır. Sadece Süper Adminler kullanıcı yönetimi yapabilir.</p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Header - Başlık ve İşlem Butonları */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-800">Kullanıcı Yönetimi</h1>
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {filteredUsers.length} Kullanıcı
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleAddEditUser()}
              className="flex items-center justify-center gap-1 px-4 py-2 text-white rounded-lg transition-colors bg-[#022B45] hover:bg-[#022B45]/90"
            >
              <FiUserPlus size={18} />
              <span>Yeni Kullanıcı</span>
            </button>
            
            <button
              onClick={handleExportExcel}
              className="flex items-center justify-center gap-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiDownload size={18} />
              <span>Excel</span>
            </button>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button 
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 ${viewMode === "table" ? "bg-gray-100" : "bg-white"}`}
                title="Tablo Görünümü"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
              </button>
              <button 
                onClick={() => setViewMode("grid")}
                className={`px-3 py-2 ${viewMode === "grid" ? "bg-gray-100" : "bg-white"}`}
                title="Kart Görünümü"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7"></rect>
                  <rect x="14" y="3" width="7" height="7"></rect>
                  <rect x="14" y="14" width="7" height="7"></rect>
                  <rect x="3" y="14" width="7" height="7"></rect>
                </svg>
              </button>
            </div>
          </div>
        </div>
        
        {/* Filtreler Satırı */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Arama kutusu */}
          <div className="relative">
            <input
              type="text"
              placeholder="Kullanıcı ara..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <FiSearch className="absolute left-2 top-2.5 text-gray-400" size={18} />
          </div>
          
          {/* Şube filtresi */}
          <div className="relative">
            <select
              value={branchFilter}
              onChange={e => setBranchFilter(e.target.value)}
              className="w-full p-2 pl-8 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Şubeler</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
            <FiFilter className="absolute left-2 top-2.5 text-gray-400" size={18} />
          </div>
          
          {/* Rol filtresi */}
          <div className="relative">
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="w-full p-2 pl-8 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Roller</option>
              <option value="super_admin">Süper Admin</option>
              <option value="branch_manager">Şube Yöneticisi</option>
            </select>
            <FiSettings className="absolute left-2 top-2.5 text-gray-400" size={18} />
          </div>
          
          {/* Durum filtresi */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full p-2 pl-8 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tüm Durumlar</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
            <div className="absolute left-2 top-2.5 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Kullanıcı Listesi */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-lg p-8 text-center bg-gray-50">
            <FiUser size={48} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Kullanıcı Bulunamadı
            </h3>
            <p className="mb-4 text-gray-500">
              {searchTerm || branchFilter || roleFilter || statusFilter !== "" ? "Arama ve filtre kriterlerinize uygun kullanıcı bulunmamaktadır." : "Henüz hiç kullanıcı eklenmemiş."}
            </p>
            {(searchTerm || branchFilter || roleFilter || statusFilter !== "") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setBranchFilter("");
                  setRoleFilter("");
                  setStatusFilter("");
                }}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Filtreleri Temizle
              </button>
            )}
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Kullanıcı
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şube
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-[#022B45] text-white flex items-center justify-center">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.username}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'super_admin' ? 'Süper Admin' : 'Şube Yöneticisi'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.branch_name || (user.role === 'super_admin' ? 'Tüm Şubeler' : 'Atanmamış')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {user.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleViewUserInfo(user)}
                          className="text-indigo-500 hover:text-indigo-700"
                          title="Detaylar"
                        >
                          <FiInfo size={18} />
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Şifreyi Sıfırla"
                        >
                          <FiKey size={18} />
                        </button>
                        <button
                          onClick={() => handleAddEditUser(user)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Düzenle"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Sil"
                          disabled={user.role === 'super_admin'} // Super Admin silinemez
                        >
                          <FiTrash2 size={18} className={user.role === 'super_admin' ? 'opacity-30 cursor-not-allowed' : ''} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Kart Görünümü (Grid)
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map(user => (
              <div 
                key={user.id} 
                className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className={`h-2 ${user.role === 'super_admin' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                
                <div className="p-5">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-14 w-14 rounded-full bg-[#022B45] text-white flex items-center justify-center text-xl font-semibold">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">{user.username}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Rol:</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'super_admin' 
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'super_admin' ? 'Süper Admin' : 'Şube Yöneticisi'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Şube:</span>
                      <span className="font-medium">{user.branch_name || (user.role === 'super_admin' ? 'Tüm Şubeler' : 'Atanmamış')}</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Durum:</span>
                      <div className="flex items-center">
                        <span className={`w-2 h-2 rounded-full mr-1.5 ${user.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span>{user.is_active ? 'Aktif' : 'Pasif'}</span>
                      </div>
                    </div>
                    
                    {user.last_login && (
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Son Giriş:</span>
                        <span>{new Date(user.last_login).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t">
                    <button
                      onClick={() => handleViewUserInfo(user)}
                      className="flex-1 text-gray-600 hover:text-gray-800 py-1 rounded"
                      title="Detaylar"
                    >
                      <FiInfo size={16} className="inline mr-1" /> Detaylar
                    </button>
                    <button
                      onClick={() => handleAddEditUser(user)}
                      className="flex-1 text-blue-600 hover:text-blue-800 py-1 rounded"
                      title="Düzenle"
                    >
                      <FiEdit2 size={16} className="inline mr-1" /> Düzenle
                    </button>
                    <button
                      onClick={() => handleResetPassword(user)}
                      className="flex-1 text-green-600 hover:text-green-800 py-1 rounded"
                      title="Şifre Sıfırla"
                    >
                      <FiKey size={16} className="inline mr-1" /> Şifre
                    </button>
                    <button
                      onClick={() => setConfirmDelete(user.id)}
                      className={`flex-1 py-1 rounded ${
                        user.role === 'super_admin' 
                          ? 'text-gray-400 cursor-not-allowed' 
                          : 'text-red-600 hover:text-red-800'
                      }`}
                      title="Sil"
                      disabled={user.role === 'super_admin'}
                    >
                      <FiTrash2 size={16} className="inline mr-1" /> Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Kullanıcı Ekleme/Düzenleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {selectedUser ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı Ekle"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kullanıcı Adı *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={form.username}
                      onChange={handleFormChange}
                      className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tam Ad
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiUser className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="text"
                      name="full_name"
                      value={form.full_name}
                      onChange={handleFormChange}
                      placeholder="Ad Soyad"
                      className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-posta *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FiMail className="text-gray-400" size={16} />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleFormChange}
                      className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefon
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={form.phone}
                      onChange={handleFormChange}
                      placeholder="İsteğe bağlı"
                      className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {!selectedUser && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Şifre {selectedUser ? "" : "*"}
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FiLock className="text-gray-400" size={16} />
                      </div>
                      <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleFormChange}
                        className="pl-10 w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required={!selectedUser}
                        placeholder={selectedUser ? "Değiştirmek için yeni şifre girin" : "Şifre en az 6 karakter olmalıdır"}
                      />
                    </div>
                    {selectedUser && (
                      <p className="mt-1 text-xs text-gray-500">Kullanıcının şifresini değiştirmek için Şifre Sıfırla seçeneğini kullanın.</p>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol *
                  </label>
                  <select
                    name="role"
                    value={form.role}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="super_admin">Süper Admin</option>
                    <option value="branch_manager">Şube Yöneticisi</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Şube {form.role === 'branch_manager' ? '*' : ''}
                  </label>
                  <select
                    name="branch_id"
                    value={form.branch_id}
                    onChange={handleFormChange}
                    className={`w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      form.role === 'branch_manager' && !form.branch_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required={form.role === 'branch_manager'}
                    disabled={form.role === 'super_admin'}
                  >
                    <option value="">Şube Seçin</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  {form.role === 'super_admin' && (
                    <p className="mt-1 text-xs text-gray-500">Süper Admin tüm şubelere erişebilir, şube seçimine gerek yoktur.</p>
                  )}
                  {form.role === 'branch_manager' && !form.branch_id && (
                    <p className="mt-1 text-xs text-red-500">Şube Yöneticisi için şube seçimi zorunludur.</p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleFormChange}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                      Kullanıcı aktif
                    </label>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Pasif kullanıcılar sisteme giriş yapamaz. Geçici olarak erişimi kısıtlamak için kullanılabilir.
                  </p>
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-[#022B45] rounded-lg hover:bg-[#022B45]/90"
                >
                  {selectedUser ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Şifre Sıfırlama Modalı */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Şifre Sıfırla: {selectedUser.username}
              </h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handlePasswordSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yeni Şifre *
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
                    Şifreyi Doğrula *
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
                      placeholder="Şifreyi tekrar girin"
                    />
                  </div>
                </div>
                
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <strong>Dikkat:</strong> Şifre sıfırlama işlemi anında gerçekleşir ve geri alınamaz.
                  </p>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Şifreyi Sıfırla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Kullanıcı Bilgi Modalı */}
      {showInfoModal && selectedUserInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Kullanıcı Detayları
              </h3>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-[#022B45] text-white flex items-center justify-center text-2xl font-semibold">
                  {selectedUserInfo.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-xl font-semibold text-gray-900">{selectedUserInfo.full_name || selectedUserInfo.username}</h4>
                  <p className="text-sm text-gray-500">{selectedUserInfo.email}</p>
                  {selectedUserInfo.phone && <p className="text-sm text-gray-500">{selectedUserInfo.phone}</p>}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Rol</p>
                  <p className="font-medium">
                    {selectedUserInfo.role === 'super_admin' ? 'Süper Admin' : 'Şube Yöneticisi'}
                  </p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Durum</p>
                  <div className="flex items-center">
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${selectedUserInfo.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    <span className="font-medium">{selectedUserInfo.is_active ? 'Aktif' : 'Pasif'}</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Şube</p>
                  <p className="font-medium">{selectedUserInfo.branch_name || (selectedUserInfo.role === 'super_admin' ? 'Tüm Şubeler' : 'Atanmamış')}</p>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-500 mb-1">Hesap Oluşturulma</p>
                  <p className="font-medium">{new Date(selectedUserInfo.created_at).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <h5 className="font-medium text-sm text-gray-700 mb-2">Kullanıcı Etkinliği</h5>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Son Giriş:</span>
                  <span>{selectedUserInfo.last_login ? new Date(selectedUserInfo.last_login).toLocaleString() : 'Hiç giriş yapmadı'}</span>
                </div>
                
                {/* İsteğe bağlı diğer etkinlik verileri ileride eklenebilir */}
              </div>
              
              <div className="border-t mt-6 pt-4 flex gap-2">
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    handleAddEditUser(selectedUserInfo);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 text-blue-600 hover:text-blue-800 p-2 border border-blue-600 rounded-lg"
                >
                  <FiEdit2 size={16} />
                  <span>Düzenle</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    handleResetPassword(selectedUserInfo);
                  }}
                  className="flex-1 flex items-center justify-center gap-1 text-green-600 hover:text-green-800 p-2 border border-green-600 rounded-lg"
                >
                  <FiKey size={16} />
                  <span>Şifre Sıfırla</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Silme Onay Modalı */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Kullanıcıyı Sil</h3>
            <p className="text-gray-600 mb-6">
              Bu kullanıcıyı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;