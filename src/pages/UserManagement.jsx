// src/pages/UserManagement.jsx
import { useState, useEffect } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiUserPlus, FiKey, FiUser, FiMail, FiLock } from "react-icons/fi";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContext";

const UserManagement = () => {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "branch_manager",
    branch_id: "",
    is_active: true
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
    
    setForm({ ...form, [name]: inputValue });
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
        is_active: user.is_active !== false // undefined veya null ise true kabul et
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
        is_active: true
      });
    }
    
    setShowModal(true);
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

  // Kullanıcı formu gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      let response;
      
      // Form doğrulama
      if (!form.username || !form.email) {
        toast.error("Kullanıcı adı ve e-posta zorunludur");
        return;
      }
      
      // Yeni kullanıcıda şifre zorunlu
      if (!selectedUser && !form.password) {
        toast.error("Yeni kullanıcı için şifre zorunludur");
        return;
      }
      
      // Branch manager için şube seçimi zorunlu
      if (form.role === "branch_manager" && !form.branch_id) {
        toast.error("Şube yöneticileri için şube seçimi zorunludur");
        return;
      }
      
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

  // Filtreleme işlemleri
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.username?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.branch_name?.toLowerCase().includes(searchLower) ||
      (user.role === 'super_admin' && 'admin'.includes(searchLower)) ||
      (user.role === 'branch_manager' && 'şube'.includes(searchLower))
    );
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Kullanıcı Yönetimi</h1>
          
          <div className="flex flex-col md:flex-row gap-4">
            {/* Arama kutusu */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <FiUser className="absolute left-2 top-2.5 text-gray-400" size={20} />
            </div>
            
            {/* Yeni Kullanıcı Ekle butonu */}
            <button
              onClick={() => handleAddEditUser()}
              className="flex items-center justify-center gap-1 px-4 py-2 text-white rounded-lg transition-colors bg-[#022B45] hover:bg-[#022B45]/90"
            >
              <FiUserPlus size={18} />
              <span>Yeni Kullanıcı</span>
            </button>
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
              {searchTerm ? "Arama kriterlerinize uygun kullanıcı bulunmamaktadır." : "Henüz hiç kullanıcı eklenmemiş."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Aramayı Temizle
              </button>
            )}
          </div>
        ) : (
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
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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