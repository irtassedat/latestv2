import { useState, useEffect } from "react";
import { 
  FiEdit2, FiTrash2, FiPlus, FiMap, FiPhone, FiMail, 
  FiHome, FiInfo, FiSettings, FiPackage, FiLayers, 
  FiShoppingBag, FiCheck, FiX, FiTruck, FiShoppingCart 
} from "react-icons/fi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { Tab } from '@headlessui/react';
import api from "../lib/axios";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";

// Çeşme Kahvecisi tema renkleri
const theme = {
  primary: "#022B45",      // Koyu mavi
  secondary: "#B8D7DD",    // Açık mavi
  accent: "#D98A3D",       // Amber/Turuncu
  light: "#F4F7F8",        // Açık gri
  dark: "#343a40",         // Koyu gri
  success: "#28a745",      // Yeşil
  danger: "#dc3545",       // Kırmızı
  warning: "#ffc107",      // Sarı
  info: "#17a2b8",         // Bilgi rengi
  white: "#ffffff",        // Beyaz
  textPrimary: "#495057",  // Ana metin rengi
  textSecondary: "#6c757d" // İkincil metin rengi
};

const EnhancedBranchManager = () => {
  const { brandId } = useParams();
  const navigate = useNavigate();

  const [brand, setBrand] = useState(null);
  const [branches, setBranches] = useState([]);
  const [templates, setTemplates] = useState({
    menu: [],
    price: [],
    integration: []
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selectedIntegrations, setSelectedIntegrations] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // "grid" veya "list" görünüm modu
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrBranch, setQrBranch] = useState(null);

  const [form, setForm] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    manager_name: "",
    branch_code: "",
    branch_password: "",
    opening_hours: "",
    description: "",
    is_active: true,
    branch_type: "MERKEZ",
    depot_info: "",
    menu_template_id: "",
    price_template_id: "",
    enable_cart: true,
    enable_popup: false,
    slider_template_id: "",
    payment_api_info: ""
  });

  // Verileri getir
  const fetchData = async () => {
    setLoading(true);
    try {
      if (brandId) {
        // Markayı getir
        const brandResponse = await api.get(`/api/brands/${brandId}`);
        setBrand(brandResponse.data);

        // Markaya ait şubeleri getir
        const branchesResponse = await api.get(`/api/brands/${brandId}/branches`);
        setBranches(branchesResponse.data.branches || branchesResponse.data || []);
      } else {
        // Tüm şubeleri getir
        const branchesResponse = await api.get("/api/branches");
        setBranches(branchesResponse.data);
      }

      // Şablonları getir
      const [menuRes, priceRes, integrationRes] = await Promise.all([
        api.get("/api/templates/menu"),
        api.get("/api/templates/price"),
        api.get("/api/integrations")
      ]);

      setTemplates({
        menu: menuRes.data,
        price: priceRes.data,
        integration: integrationRes.data
      });
    } catch (error) {
      console.error("Veriler yüklenirken hata:", error);
      toast.error("Veriler yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [brandId]);

  // Form değişikliklerini izle
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    setForm({ ...form, [name]: inputValue });
  };

  // Entegrasyon seçimi değişikliğini izle
  const handleIntegrationChange = (integrationId, isChecked) => {
    if (isChecked) {
      setSelectedIntegrations([...selectedIntegrations, integrationId]);
    } else {
      setSelectedIntegrations(selectedIntegrations.filter(id => id !== integrationId));
    }
  };

  // Şube ekleme/düzenleme modalını aç
  const handleAddEditBranch = (branch = null) => {
    if (branch) {
      // Düzenleme modu
      setEditingBranch(branch);
      setForm({
        name: branch.name || "",
        address: branch.address || "",
        phone: branch.phone || "",
        email: branch.email || "",
        manager_name: branch.manager_name || "",
        branch_code: branch.branch_code || "",
        branch_password: branch.branch_password || "",
        opening_hours: branch.opening_hours || "",
        description: branch.description || "",
        is_active: branch.is_active !== false,
        branch_type: branch.branch_type || "MERKEZ",
        depot_info: branch.depot_info || "",
        menu_template_id: branch.menu_template_id || "",
        price_template_id: branch.price_template_id || "",
        enable_cart: branch.enable_cart !== false,
        enable_popup: branch.enable_popup === true,
        slider_template_id: branch.slider_template_id || "",
        payment_api_info: branch.payment_api_info || ""
      });

      // Şubenin entegrasyonlarını getir
      if (branch.integrations) {
        setSelectedIntegrations(branch.integrations.map(i => i.id));
      } else {
        setSelectedIntegrations([]);
      }
    } else {
      // Ekleme modu
      setEditingBranch(null);
      setForm({
        name: "",
        address: "",
        phone: "",
        email: "",
        manager_name: "",
        branch_code: "",
        branch_password: "",
        opening_hours: "",
        description: "",
        is_active: true,
        branch_type: "MERKEZ",
        depot_info: "",
        menu_template_id: templates.menu[0]?.id || "",
        price_template_id: templates.price[0]?.id || "",
        enable_cart: true,
        enable_popup: false,
        slider_template_id: "",
        payment_api_info: ""
      });
      setSelectedIntegrations([]);
    }

    setShowModal(true);
  };

  // QR kod modalını aç
  const handleGenerateQR = (branch) => {
    setQrBranch(branch);
    setShowQrModal(true);
  };

  // Şablon seçim modalını aç
  const handleOpenTemplateModal = (branch) => {
    setEditingBranch(branch);
    setForm({
      ...form,
      menu_template_id: branch.menu_template_id || "",
      price_template_id: branch.price_template_id || "",
      enable_cart: branch.enable_cart !== false,
      enable_popup: branch.enable_popup === true,
      slider_template_id: branch.slider_template_id || "",
      payment_api_info: branch.payment_api_info || ""
    });

    // Şubenin entegrasyonlarını getir
    if (branch.integrations) {
      setSelectedIntegrations(branch.integrations.map(i => i.id));
    } else {
      setSelectedIntegrations([]);
    }

    setShowTemplateModal(true);
  };

  // Form gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      let formData = { ...form };

      // Marka ID'sini ekle (eğer varsa)
      if (brandId) {
        formData.brand_id = brandId;
      }

      if (editingBranch) {
        // Var olan şubeyi güncelle
        response = await api.put(`/api/branches/${editingBranch.id}`, formData);

        // Seçili entegrasyonları güncelle
        await api.post(`/api/integrations/branch/${editingBranch.id}`, {
          integration_ids: selectedIntegrations
        });

        toast.success(`${form.name} şubesi başarıyla güncellendi`);
      } else {
        // Yeni şube ekle
        response = await api.post("/api/branches", formData);

        // Seçili entegrasyonları ekle
        if (response.data && response.data.id) {
          await api.post(`/api/integrations/branch/${response.data.id}`, {
            integration_ids: selectedIntegrations
          });
        }

        toast.success(`${form.name} şubesi başarıyla eklendi`);
      }

      // Şubeleri yeniden yükle
      fetchData();

      // Modalı kapat
      setShowModal(false);
    } catch (error) {
      console.error("Form gönderilirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Şablon seçim formu gönderimi
  const handleTemplateSubmit = async (e) => {
    e.preventDefault();

    try {
      // Şablonları güncelle
      await api.patch(`/api/templates/branches/${editingBranch.id}/templates`, {
        menu_template_id: form.menu_template_id,
        price_template_id: form.price_template_id,
        slider_template_id: form.slider_template_id,
        enable_cart: form.enable_cart,
        enable_popup: form.enable_popup,
        payment_api_info: form.payment_api_info
      });

      // Entegrasyonları güncelle
      await api.post(`/api/integrations/branch/${editingBranch.id}`, {
        integration_ids: selectedIntegrations
      });

      toast.success(`${editingBranch.name} şubesi şablonları güncellendi`);

      // Şubeleri yeniden yükle
      fetchData();

      // Modalı kapat
      setShowTemplateModal(false);
    } catch (error) {
      console.error("Şablon güncellenirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Şube silme işlemi
  const handleDelete = async (branchId) => {
    try {
      await api.delete(`/api/branches/${branchId}`);
      setBranches(branches.filter(branch => branch.id !== branchId));
      toast.success("Şube başarıyla silindi");
      setConfirmDelete(null);
    } catch (error) {
      console.error("Şube silinirken hata:", error);
      toast.error("Şube silinemedi!");
    }
  };

  // Şube detayına git
  const handleGoToProducts = (branchId) => {
    navigate(`/admin/branches/${branchId}/products`);
  };

  // Şube analitik paneline git
  const handleGoToAnalytics = (branchId) => {
    navigate(`/admin/branches/${branchId}/analytics`);
  };

  // Şablon bilgisi getir
  const getTemplateName = (type, id) => {
    if (!id) return "-";
    const template = templates[type].find(t => t.id.toString() === id.toString());
    return template ? template.name : "-";
  };

  // Filtreleme
  const filteredBranches = Array.isArray(branches)
    ? branches.filter(branch => {
        return (
          branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.manager_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          branch.branch_code?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      })
    : [];

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
              {brand ? `${brand.name} Şubeleri` : "Şube Yönetimi"}
            </h1>
            {brand && (
              <p className="text-sm text-gray-500 mt-1">{brand.address}</p>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Arama kutusu */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Şube ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ borderColor: "rgba(2, 43, 69, 0.2)" }}
              />
              <HiOutlineDocumentSearch
                className="absolute left-2 top-2.5"
                size={20}
                style={{ color: theme.primary }}
              />
            </div>

            {/* Görünüm değiştirme butonları */}
            <div className="flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 ${viewMode === "grid" ? "bg-gray-100" : "bg-white"}`}
                title="Grid Görünüm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 ${viewMode === "list" ? "bg-gray-100" : "bg-white"}`}
                title="Liste Görünüm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            {/* Yeni Şube Ekle butonu */}
            <button
              onClick={() => handleAddEditBranch()}
              className="flex items-center justify-center gap-1 px-4 py-2 text-white rounded-lg transition-colors"
              style={{
                backgroundColor: theme.accent,
                fontWeight: 600,
                boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)"
              }}
            >
              <FiPlus size={18} />
              <span>Yeni Şube Ekle</span>
            </button>
          </div>
        </div>

        {/* Şube Listesi */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div
              className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
              style={{ borderColor: theme.primary }}
            ></div>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div
            className="rounded-lg p-8 text-center"
            style={{ backgroundColor: theme.light }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              style={{ color: theme.textSecondary }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
            <h3
              className="text-lg font-medium mb-2"
              style={{ color: theme.primary }}
            >
              Şube Bulunamadı
            </h3>
            <p
              className="mb-4"
              style={{ color: theme.textSecondary }}
            >
              {searchTerm ? "Arama kriterlerinize uygun şube bulunmamaktadır." : "Henüz hiç şube eklenmemiş."}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="px-4 py-2 text-white rounded-lg"
                style={{ backgroundColor: theme.primary }}
              >
                Aramayı Temizle
              </button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          // Grid Görünümü
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBranches.map(branch => (
              <div
                key={branch.id}
                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}
              >
                <div
                  className="text-white px-4 py-3 flex justify-between items-center"
                  style={{ backgroundColor: theme.primary }}
                >
                  <h3
                    className="font-semibold text-lg truncate"
                  >
                    {branch.name}
                    {branch.branch_code && <span className="ml-2 text-xs bg-blue-700 px-1.5 py-0.5 rounded">Kod: {branch.branch_code}</span>}
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAddEditBranch(branch)}
                      className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                      title="Düzenle"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(branch.id)}
                      className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                      style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                      title="Sil"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="p-4">
                  {branch.address && (
                    <div className="flex items-start gap-2 mb-2">
                      <FiMap style={{ color: theme.accent }} className="mt-0.5 flex-shrink-0" size={16} />
                      <p
                        className="text-sm"
                        style={{ color: theme.textPrimary }}
                      >
                        {branch.address}
                      </p>
                    </div>
                  )}

                  {branch.phone && (
                    <div className="flex items-center gap-2 mb-2">
                      <FiPhone style={{ color: theme.accent }} size={16} />
                      <p
                        className="text-sm"
                        style={{ color: theme.textPrimary }}
                      >
                        {branch.phone}
                      </p>
                    </div>
                  )}

                  {branch.manager_name && (
                    <div className="flex items-center gap-2 mb-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ color: theme.accent }}
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <p
                        className="text-sm"
                        style={{ color: theme.textPrimary }}
                      >
                        {branch.manager_name}
                      </p>
                    </div>
                  )}

                  {branch.branch_type && (
                    <div className="flex items-center gap-2 mb-2">
                      <FiHome style={{ color: theme.accent }} size={16} />
                      <p
                        className="text-sm"
                        style={{ color: theme.textPrimary }}
                      >
                        Şube Tipi: {branch.branch_type}
                      </p>
                    </div>
                  )}

                  {/* Şablon Bilgileri */}
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-sm font-medium mb-2 text-gray-600">Şablon Ayarları</h4>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Menü Şablonu:</span>
                      <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                        {getTemplateName('menu', branch.menu_template_id)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Fiyat Şablonu:</span>
                      <span className="text-xs font-medium px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                        {getTemplateName('price', branch.price_template_id)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">Entegrasyonlar:</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {branch.integrations?.map(integration => (
                          <span key={integration.id} className="text-xs font-medium px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded-full">
                            {integration.name}
                          </span>
                        ))}
                        {(!branch.integrations || branch.integrations.length === 0) && (
                          <span className="text-xs text-gray-400">Yok</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${branch.enable_cart ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-700'}`}>
                        {branch.enable_cart ? 'Sepet Aktif' : 'Sepet Pasif'}
                      </span>

                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${branch.enable_popup ? 'bg-blue-50 text-blue-700' : 'bg-gray-50 text-gray-700'}`}>
                        {branch.enable_popup ? 'Popup Aktif' : 'Popup Pasif'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleOpenTemplateModal(branch)}
                      className="w-full mt-2 px-2 py-1 text-xs text-center text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                    >
                      Şablonları Ayarla
                    </button>
                  </div>
                </div>

                <div
                  className="grid grid-cols-4 border-t"
                  style={{ backgroundColor: theme.light, borderColor: "rgba(2, 43, 69, 0.1)" }}
                >
                  <button
                    onClick={() => handleGoToProducts(branch.id)}
                    className="flex flex-col items-center justify-center py-3 hover:bg-gray-200 transition-colors"
                  >
                    <FiPackage size={18} style={{ color: theme.primary }} />
                    <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>Ürünler</span>
                  </button>

                  <button
                    onClick={() => handleGoToAnalytics(branch.id)}
                    className="flex flex-col items-center justify-center py-3 hover:bg-gray-200 transition-colors"
                  >
                    <FiSettings size={18} style={{ color: theme.accent }} />
                    <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>Analitik</span>
                  </button>

                  <button
                    onClick={() => handleGenerateQR(branch)}
                    className="flex flex-col items-center justify-center py-3 hover:bg-gray-200 transition-colors"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 11V3H11V11H3Z" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M3 21V13H11V21H3Z" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13 3H21V11H13V3Z" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13 13H16V16H13V13Z" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18 13H21V16H18V13Z" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M13 18H16V21H13V18Z" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M18 18H21V21H18V18Z" stroke={theme.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>QR Kod</span>
                  </button>

                  <div className="flex flex-col items-center justify-center py-3">
                    <div className={`w-3 h-3 rounded-full ${branch.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>{branch.is_active ? 'Aktif' : 'Pasif'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Liste Görünümü
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şube Adı
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adres
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şablonlar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entegrasyonlar
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBranches.map((branch) => (
                  <tr key={branch.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{branch.name}</div>
                          <div className="text-sm text-gray-500">Yönetici: {branch.manager_name || "-"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{branch.address}</div>
                      <div className="text-sm text-gray-500">{branch.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span>Menü: {getTemplateName('menu', branch.menu_template_id)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Fiyat: {getTemplateName('price', branch.price_template_id)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {branch.integrations?.map(integration => (
                          <span key={integration.id} className="inline-flex text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800">
                            {integration.name}
                          </span>
                        ))}
                        {(!branch.integrations || branch.integrations.length === 0) && (
                          <span className="text-xs text-gray-500">Entegrasyon yok</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          branch.is_active 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {branch.is_active ? "Aktif" : "Pasif"}
                        </span>
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          branch.enable_cart 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {branch.enable_cart ? "Sepet Açık" : "Sepet Kapalı"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleOpenTemplateModal(branch)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Şablonları Ayarla"
                        >
                          <FiSettings size={18} />
                        </button>
                        <button
                          onClick={() => handleGoToProducts(branch.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Ürünler"
                        >
                          <FiPackage size={18} />
                        </button>
                        <button
                          onClick={() => handleGenerateQR(branch)}
                          className="text-blue-600 hover:text-blue-900"
                          title="QR Kod"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 11V3H11V11H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M3 21V13H11V21H3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13 3H21V11H13V3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13 13H16V16H13V13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18 13H21V16H18V13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M13 18H16V21H13V18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M18 18H21V21H18V18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleAddEditBranch(branch)}
                          className="text-amber-600 hover:text-amber-900"
                          title="Düzenle"
                        >
                          <FiEdit2 size={18} />
                        </button>
                        <button
                          onClick={() => setConfirmDelete(branch.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Sil"
                        >
                          <FiTrash2 size={18} />
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

      {/* Şube Ekleme/Düzenleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
          >
            <div
              className="flex justify-between items-center p-4"
              style={{ borderBottom: `1px solid ${theme.secondary}` }}
            >
              <h3
                className="text-xl font-semibold"
                style={{ color: theme.primary }}
              >
                {editingBranch ? `${editingBranch.name} Şubesini Düzenle` : "Yeni Şube Ekle"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                      ${selected
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-500 hover:bg-white/[0.12] hover:text-blue-600'
                      }`
                    }
                  >
                    Temel Bilgiler
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                      ${selected
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-500 hover:bg-white/[0.12] hover:text-blue-600'
                      }`
                    }
                  >
                    Şablonlar ve Entegrasyonlar
                  </Tab>
                </Tab.List>

                <Tab.Panels>
                  {/* Temel Bilgiler Tab */}
                  <Tab.Panel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Şube Adı *
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                          required
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Şube Tipi
                        </label>
                        <select
                          name="branch_type"
                          value={form.branch_type}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        >
                          <option value="MERKEZ">MERKEZ</option>
                          <option value="ŞUBE">ŞUBE</option>
                          <option value="BAYİ">BAYİ</option>
                          <option value="DİĞER">DİĞER</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Şube Kodu
                        </label>
                        <input
                          type="text"
                          name="branch_code"
                          value={form.branch_code}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Şube Şifresi
                        </label>
                        <input
                          type="password"
                          name="branch_password"
                          value={form.branch_password}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Adres *
                        </label>
                        <textarea
                          name="address"
                          value={form.address}
                          onChange={handleFormChange}
                          rows="2"
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                          required
                        ></textarea>
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Telefon
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={form.phone}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          E-posta
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Şube Yöneticisi
                        </label>
                        <input
                          type="text"
                          name="manager_name"
                          value={form.manager_name}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Depo Bilgisi
                        </label>
                        <input
                          type="text"
                          name="depot_info"
                          value={form.depot_info}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Çalışma Saatleri
                        </label>
                        <input
                          type="text"
                          name="opening_hours"
                          value={form.opening_hours}
                          onChange={handleFormChange}
                          placeholder="Örn: 09:00-18:00"
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Açıklama
                        </label>
                        <textarea
                          name="description"
                          value={form.description}
                          onChange={handleFormChange}
                          rows="3"
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        ></textarea>
                      </div>

                      <div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="is_active"
                            name="is_active"
                            checked={form.is_active}
                            onChange={handleFormChange}
                            className="h-4 w-4 rounded focus:ring-0 border-2"
                            style={{
                              borderColor: theme.secondary,
                              accentColor: theme.accent
                            }}
                          />
                          <label
                            htmlFor="is_active"
                            className="ml-2 text-sm font-medium"
                            style={{
                              color: theme.primary
                            }}
                          >
                            Şube aktif
                          </label>
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>

                  {/* Şablonlar ve Entegrasyonlar Tab */}
                  <Tab.Panel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Menü Şablonu
                        </label>
                        <select
                          name="menu_template_id"
                          value={form.menu_template_id}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        >
                          <option value="">Şablon Seçin</option>
                          {templates.menu.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Fiyat Şablonu
                        </label>
                        <select
                          name="price_template_id"
                          value={form.price_template_id}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        >
                          <option value="">Şablon Seçin</option>
                          {templates.price.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Slider Şablonu
                        </label>
                        <select
                          name="slider_template_id"
                          value={form.slider_template_id}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        >
                          <option value="">Şablon Seçin</option>
                          <option value="slider1">Standart Slider</option>
                          <option value="slider2">Promosyon Slider</option>
                          <option value="slider3">Minimal Slider</option>
                        </select>
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Ödeme API Bilgisi
                        </label>
                        <input
                          type="text"
                          name="payment_api_info"
                          value={form.payment_api_info}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                          placeholder="API Key veya URL"
                        />
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="enable_cart"
                          name="enable_cart"
                          checked={form.enable_cart}
                          onChange={handleFormChange}
                          className="h-4 w-4 rounded focus:ring-0 border-2"
                          style={{
                            borderColor: theme.secondary,
                            accentColor: theme.accent
                          }}
                        />
                        <label
                          htmlFor="enable_cart"
                          className="ml-2 text-sm font-medium"
                          style={{ color: theme.primary }}
                        >
                          Sepet özelliğini aktifleştir
                        </label>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="enable_popup"
                          name="enable_popup"
                          checked={form.enable_popup}
                          onChange={handleFormChange}
                          className="h-4 w-4 rounded focus:ring-0 border-2"
                          style={{
                            borderColor: theme.secondary,
                            accentColor: theme.accent
                          }}
                        />
                        <label
                          htmlFor="enable_popup"
                          className="ml-2 text-sm font-medium"
                          style={{ color: theme.primary }}
                        >
                          Popup gösterimini aktifleştir
                        </label>
                      </div>

                      <div className="md:col-span-2 mt-4">
                        <label
                          className="block text-sm font-medium mb-2"
                          style={{ color: theme.primary }}
                        >
                          Entegrasyonlar
                        </label>
                        <div className="border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                          {templates.integration.length === 0 ? (
                            <div className="text-center text-gray-500 py-4">
                              Henüz hiç entegrasyon şablonu tanımlanmamış
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {templates.integration.map(integration => (
                                <div key={integration.id} className="flex items-center">
                                  <input
                                    type="checkbox"
                                    id={`integration-${integration.id}`}
                                    checked={selectedIntegrations.includes(integration.id)}
                                    onChange={(e) => handleIntegrationChange(integration.id, e.target.checked)}
                                    className="h-4 w-4 rounded focus:ring-0 border-2"
                                    style={{
                                      borderColor: theme.secondary,
                                      accentColor: theme.accent
                                    }}
                                  />
                                  <label
                                    htmlFor={`integration-${integration.id}`}
                                    className="ml-2 text-sm"
                                    style={{ color: theme.textPrimary }}
                                  >
                                    {integration.name}
                                    <span className="ml-1 text-xs text-gray-500">
                                      ({integration.type})
                                    </span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: theme.secondary,
                    color: theme.primary,
                    fontWeight: 600
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{
                    backgroundColor: theme.accent,
                    fontWeight: 600,
                    boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)"
                  }}
                >
                  {editingBranch ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Şablon ve Entegrasyon Seçim Modalı */}
      {showTemplateModal && editingBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            style={{ boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
          >
            <div
              className="flex justify-between items-center p-4"
              style={{ borderBottom: `1px solid ${theme.secondary}` }}
            >
              <h3
                className="text-xl font-semibold"
                style={{ color: theme.primary }}
              >
                {editingBranch.name} - Şablon Ayarları
              </h3>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTemplateSubmit} className="p-6">
              <Tab.Group>
                <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1 mb-6">
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                      ${selected
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-500 hover:bg-white/[0.12] hover:text-blue-600'
                      }`
                    }
                  >
                    Temel Şablonlar
                  </Tab>
                  <Tab
                    className={({ selected }) =>
                      `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                      ${selected
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-500 hover:bg-white/[0.12] hover:text-blue-600'
                      }`
                    }
                  >
                    Entegrasyonlar
                  </Tab>
                </Tab.List>

                <Tab.Panels>
                  <Tab.Panel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Menü Şablonu
                        </label>
                        <select
                          name="menu_template_id"
                          value={form.menu_template_id}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        >
                          <option value="">Şablon Seçin</option>
                          {templates.menu.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                          ))}
                        </select>

                        {form.menu_template_id && (
                          <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <h4 className="text-sm font-medium text-blue-700 mb-1">
                              {templates.menu.find(t => t.id.toString() === form.menu_template_id.toString())?.name}
                            </h4>
                            <p className="text-xs text-blue-600">
                              {templates.menu.find(t => t.id.toString() === form.menu_template_id.toString())?.description || "Bu şablona ait açıklama bulunmuyor."}
                            </p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Fiyat Şablonu
                        </label>
                        <select
                          name="price_template_id"
                          value={form.price_template_id}
                          onChange={handleFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          style={{
                            borderColor: theme.secondary
                          }}
                        >
                          <option value="">Şablon Seçin</option>
                          {templates.price.map(template => (
                            <option key={template.id} value={template.id}>{template.name}</option>
                          ))}
                        </select>

                        {form.price_template_id && (
                          <div className="mt-2 p-3 bg-amber-50 rounded-lg">
                            <h4 className="text-sm font-medium text-amber-700 mb-1">
                              {templates.price.find(t => t.id.toString() === form.price_template_id.toString())?.name}
                            </h4>
                            <p className="text-xs text-amber-600">
                              {templates.price.find(t => t.id.toString() === form.price_template_id.toString())?.description || "Bu şablona ait açıklama bulunmuyor."}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </Tab.Panel>

                  <Tab.Panel>
                    <h4 className="font-medium mb-3 text-gray-700">Kullanılacak Entegrasyonlar</h4>

                    <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                      {templates.integration.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          Henüz hiç entegrasyon şablonu eklenmemiş.
                        </div>
                      ) : (
                        <ul className="divide-y divide-gray-200">
                          {templates.integration.map(integration => (
                            <li key={integration.id} className="p-3 hover:bg-gray-50">
                              <label className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={selectedIntegrations.includes(integration.id)}
                                  onChange={(e) => handleIntegrationChange(integration.id, e.target.checked)}
                                  className="h-4 w-4 rounded focus:ring-0 border-2"
                                  style={{
                                    borderColor: theme.secondary,
                                    accentColor: theme.accent
                                  }}
                                />
                                <div className="flex-1">
                                  <div className="flex justify-between">
                                    <span className="font-medium text-gray-800">{integration.name}</span>
                                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full">
                                      {integration.type === 'delivery' && <span className="flex items-center"><FiTruck size={12} className="mr-1" /> Teslimat</span>}
                                      {integration.type === 'payment' && <span className="flex items-center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M1 10h22M12 15h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg> Ödeme</span>}
                                      {integration.type === 'order' && <span className="flex items-center"><FiShoppingCart size={12} className="mr-1" /> Sipariş</span>}
                                      {integration.type === 'menu' && <span className="flex items-center"><FiLayers size={12} className="mr-1" /> Menü</span>}
                                      {integration.type === 'other' && <span className="flex items-center"><FiSettings size={12} className="mr-1" /> Diğer</span>}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 mt-0.5">{integration.description}</p>
                                </div>
                              </label>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </Tab.Panel>
                </Tab.Panels>
              </Tab.Group>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTemplateModal(false)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: theme.secondary,
                    color: theme.primary,
                    fontWeight: 600
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{
                    backgroundColor: theme.accent,
                    fontWeight: 600,
                    boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)"
                  }}
                >
                  Şablonları Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Silme Onay Modalı */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            style={{ boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
          >
            <div className="text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                style={{ color: theme.danger }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>

              <h3
                className="text-xl font-semibold mb-2"
                style={{ color: theme.primary }}
              >
                Şubeyi Sil
              </h3>
              <p
                className="mb-6"
                style={{ color: theme.textSecondary }}
              >
                Bu şubeyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve şubeye bağlı tüm ürünler de etkilenebilir.
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: theme.secondary,
                    color: theme.primary,
                    fontWeight: 600
                  }}
                >
                  İptal
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete)}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{
                    backgroundColor: theme.danger,
                    fontWeight: 600
                  }}
                >
                  Evet, Sil
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QR Kod Modalı */}
      {showQrModal && qrBranch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div
            className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6"
            style={{ boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)" }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3
                className="text-xl font-semibold"
                style={{ color: theme.primary }}
              >
                {qrBranch.name} - QR Kod
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="text-center">
              <div className="bg-white p-4 rounded-lg border shadow-sm mb-4 mx-auto max-w-[280px]">
                <div className="mb-3 text-left">
                  <h4 className="text-lg font-semibold text-gray-800">{qrBranch.name}</h4>
                  <p className="text-xs text-gray-500">{qrBranch.address}</p>
                </div>
                
                <div id="qrcode" className="mx-auto mb-2">
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}/menu/${qrBranch.id}`)}`} 
                    alt="QR Code"
                    className="w-full h-auto" 
                  />
                </div>
                
                <p className="text-sm mt-2 text-gray-600">
                  <span style={{ color: theme.primary }} className="font-medium">Çeşme Kahve</span> QR Menü
                </p>
              </div>

              <p className="mb-4 text-sm text-gray-600">
                Bu QR kodu telefonla taratarak menüye erişebilirsiniz.
              </p>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    const qrUrl = `${window.location.origin}/menu/${qrBranch.id}`;
                    navigator.clipboard.writeText(qrUrl);
                    toast.success("Menü linki kopyalandı!");
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                  style={{
                    borderColor: theme.secondary,
                    color: theme.primary,
                    fontWeight: 600
                  }}
                >
                  Linki Kopyala
                </button>
                <button
                  onClick={() => {
                    const printWindow = window.open('', '_blank');
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>${qrBranch.name} QR Menü</title>
                          <style>
                            body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
                            .qr-container { max-width: 400px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
                            .branch-name { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #022B45; }
                            .branch-address { font-size: 14px; color: #6c757d; margin-bottom: 20px; }
                            .qr-image { width: 100%; max-width: 300px; height: auto; }
                            .footer { margin-top: 20px; font-size: 14px; color: #6c757d; }
                            .brand { color: #022B45; font-weight: bold; }
                            @media print {
                              .no-print { display: none; }
                              body { margin: 0; padding: 0; }
                              .qr-container { border: none; max-width: none; width: 100%; }
                            }
                          </style>
                        </head>
                        <body>
                          <div class="qr-container">
                            <div class="branch-name">${qrBranch.name}</div>
                            <div class="branch-address">${qrBranch.address || ''}</div>
                            <img class="qr-image" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`${window.location.origin}/menu/${qrBranch.id}`)}" alt="QR Code" />
                            <div class="footer">
                              <span class="brand">Çeşme Kahve</span> QR Menü
                            </div>
                          </div>
                          <div class="no-print" style="margin-top: 30px;">
                            <button onclick="window.print()" style="padding: 10px 20px; background-color: #022B45; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">Yazdır</button>
                          </div>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }}
                  className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
                  style={{
                    backgroundColor: theme.accent,
                    fontWeight: 600,
                    boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)"
                  }}
                >
                  Yazdır
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedBranchManager;

