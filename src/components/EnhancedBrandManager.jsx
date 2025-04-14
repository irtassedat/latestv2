import { useState, useEffect } from "react";
import {
    FiEdit2, FiTrash2, FiPlus, FiMapPin, FiPhone, FiMail,
    FiHome, FiInfo, FiSettings, FiPackage, FiLayers,
    FiShoppingBag, FiCheck, FiX, FiBriefcase, FiGlobe
} from "react-icons/fi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { Tab } from '@headlessui/react';
import api from "../lib/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

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

const EnhancedBrandManager = () => {
    const navigate = useNavigate();

    const [brands, setBrands] = useState([]);
    const [templates, setTemplates] = useState({
        menu: [],
        price: []
    });
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [viewMode, setViewMode] = useState("grid"); // "grid" veya "list" görünüm modu
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [detailsBrand, setDetailsBrand] = useState(null);
    const [branchesCount, setBranchesCount] = useState({});

    // Form state
    const [form, setForm] = useState({
        name: "",
        logo_url: "",
        contact_email: "",
        contact_phone: "",
        address: "",
        website: "",
        description: "",
        is_active: true,
        default_menu_template_id: "",
        default_price_template_id: ""
    });

    // Verileri getir
    // Verileri getir
    const fetchData = async () => {
        setLoading(true);
        try {
            // Markaları getir
            const brandsResponse = await api.get("/api/brands");
            console.log("Brands response:", brandsResponse.data);

            const brandList = Array.isArray(brandsResponse.data)
                ? brandsResponse.data
                : brandsResponse.data.brands || brandsResponse.data.data || [];

            setBrands(brandList);

            // Menü ve fiyat şablonlarını aynı anda getir
            const [menuRes, priceRes] = await Promise.all([
                api.get("/api/templates/menu"),
                api.get("/api/templates/price"),
            ]);

            setTemplates({
                menu: menuRes.data || [],
                price: priceRes.data || [],
            });

            // Her marka için şube sayısını getir
            const branchCounts = {};

            for (const brand of brandList) {
                try {
                    const branchesRes = await api.get(`/api/brands/${brand.id}/branches`);
                    const branches = Array.isArray(branchesRes.data)
                        ? branchesRes.data
                        : branchesRes.data.branches || branchesRes.data || [];
                    branchCounts[brand.id] = branches.length;
                } catch (err) {
                    console.error(`${brand.id} ID'li marka için şube sayısı alınamadı:`, err);
                    branchCounts[brand.id] = 0;
                }
            }

            setBranchesCount(branchCounts);
        } catch (error) {
            console.error("Veriler yüklenirken hata:", error);
            toast.error("Veriler yüklenemedi!");
            setBrands([]);
            setTemplates({ menu: [], price: [] });
            setBranchesCount({});
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
        const inputValue = type === 'checkbox' ? checked : value;
        setForm({ ...form, [name]: inputValue });
    };

    // Marka ekleme/düzenleme modalını aç
    const handleAddEditBrand = (brand = null) => {
        if (brand) {
            // Düzenleme modu
            setEditingBrand(brand);
            setForm({
                name: brand.name || "",
                logo_url: brand.logo_url || "",
                contact_email: brand.contact_email || "",
                contact_phone: brand.contact_phone || "",
                address: brand.address || "",
                website: brand.website || "",
                description: brand.description || "",
                is_active: brand.is_active !== false,
                default_menu_template_id: brand.default_menu_template_id || "",
                default_price_template_id: brand.default_price_template_id || ""
            });
        } else {
            // Ekleme modu
            setEditingBrand(null);
            setForm({
                name: "",
                logo_url: "",
                contact_email: "",
                contact_phone: "",
                address: "",
                website: "",
                description: "",
                is_active: true,
                default_menu_template_id: templates.menu[0]?.id || "",
                default_price_template_id: templates.price[0]?.id || ""
            });
        }

        setShowModal(true);
    };

    // Marka detayları modalını aç
    const handleOpenDetails = async (brand) => {
        setDetailsBrand(brand);

        try {
            // Marka detaylarını getir
            const brandDetails = await api.get(`/api/brands/${brand.id}`);
            setDetailsBrand({ ...brand, ...brandDetails.data });
        } catch (err) {
            console.error("Marka detayları alınırken hata:", err);
            // Hata durumunda mevcut veriyi kullan
        }

        setShowDetailsModal(true);
    };

    // Form gönderimi
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            let response;

            if (editingBrand) {
                // Var olan markayı güncelle
                response = await api.put(`/api/brands/${editingBrand.id}`, form);
                toast.success(`${form.name} markası başarıyla güncellendi`);
            } else {
                // Yeni marka ekle
                response = await api.post("/api/brands", form);
                toast.success(`${form.name} markası başarıyla eklendi`);
            }

            // Markaları yeniden yükle
            fetchData();

            // Modalı kapat
            setShowModal(false);
        } catch (error) {
            console.error("Form gönderilirken hata:", error);
            toast.error("İşlem başarısız oldu!");
        }
    };

    // Marka silme işlemi
    const handleDelete = async (brandId) => {
        try {
            await api.delete(`/api/brands/${brandId}`);
            setBrands(brands.filter(brand => brand.id !== brandId));
            toast.success("Marka başarıyla silindi");
            setConfirmDelete(null);
        } catch (error) {
            console.error("Marka silinirken hata:", error);
            toast.error("Marka silinemedi!");
        }
    };

    // Şube yönetim sayfasına git
    const handleGoToBranches = (brandId) => {
        navigate(`/admin/brands/${brandId}/branches`);
    };

    // Şablon bilgisi getir
    const getTemplateName = (type, id) => {
        if (!id) return "-";
        const template = templates[type]?.find(t => t.id.toString() === id.toString());
        return template ? template.name : "-";
    };

    // Filtreleme
    const filteredBrands = Array.isArray(brands)
        ? brands.filter(brand => {
            return (
                brand.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                brand.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                brand.contact_email?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        })
        : [];

    return (
        <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
                            Marka Yönetimi
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">Tüm markaları buradan yönetebilirsiniz</p>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Arama kutusu */}
                        <div className="relative w-full md:w-64">
                            <input
                                type="text"
                                placeholder="Marka ara..."
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

                        {/* Yeni Marka Ekle butonu */}
                        <button
                            onClick={() => handleAddEditBrand()}
                            className="flex items-center justify-center gap-1 px-4 py-2 text-white rounded-lg transition-colors"
                            style={{
                                backgroundColor: theme.accent,
                                fontWeight: 600,
                                boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)"
                            }}
                        >
                            <FiPlus size={18} />
                            <span>Yeni Marka Ekle</span>
                        </button>
                    </div>
                </div>

                {/* Marka Listesi */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                            style={{ borderColor: theme.primary }}
                        ></div>
                    </div>
                ) : filteredBrands.length === 0 ? (
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
                            Marka Bulunamadı
                        </h3>
                        <p
                            className="mb-4"
                            style={{ color: theme.textSecondary }}
                        >
                            {searchTerm ? "Arama kriterlerinize uygun marka bulunmamaktadır." : "Henüz hiç marka eklenmemiş."}
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
                        {filteredBrands.map(brand => (
                            <div
                                key={brand.id}
                                className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}
                            >
                                <div className="h-40 bg-gray-50 flex items-center justify-center p-4 relative">
                                    <img
                                        src={brand.logo_url || "/logos/default-logo.png"}
                                        alt={brand.name}
                                        className="max-h-full object-contain"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/logos/default-logo.png";
                                        }}
                                    />
                                    <div className="absolute top-2 right-2 flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddEditBrand(brand);
                                            }}
                                            className="p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm"
                                            title="Düzenle"
                                        >
                                            <FiEdit2 size={16} style={{ color: theme.primary }} />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDelete(brand.id);
                                            }}
                                            className="p-1.5 rounded-full bg-white/80 hover:bg-white transition-colors shadow-sm"
                                            title="Sil"
                                        >
                                            <FiTrash2 size={16} style={{ color: theme.danger }} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-semibold text-lg mb-2">{brand.name}</h3>

                                    <div className="space-y-2 mb-3">
                                        {brand.address && (
                                            <div className="flex items-start gap-2">
                                                <FiMapPin style={{ color: theme.accent }} className="mt-0.5 flex-shrink-0" size={16} />
                                                <p
                                                    className="text-sm"
                                                    style={{ color: theme.textPrimary }}
                                                >
                                                    {brand.address}
                                                </p>
                                            </div>
                                        )}

                                        {brand.contact_phone && (
                                            <div className="flex items-center gap-2">
                                                <FiPhone style={{ color: theme.accent }} size={16} />
                                                <p
                                                    className="text-sm"
                                                    style={{ color: theme.textPrimary }}
                                                >
                                                    {brand.contact_phone}
                                                </p>
                                            </div>
                                        )}

                                        {brand.contact_email && (
                                            <div className="flex items-center gap-2">
                                                <FiMail style={{ color: theme.accent }} size={16} />
                                                <p
                                                    className="text-sm"
                                                    style={{ color: theme.textPrimary }}
                                                >
                                                    {brand.contact_email}
                                                </p>
                                            </div>
                                        )}

                                        {brand.website && (
                                            <div className="flex items-center gap-2">
                                                <FiGlobe style={{ color: theme.accent }} size={16} />
                                                <p
                                                    className="text-sm"
                                                    style={{ color: theme.textPrimary }}
                                                >
                                                    {brand.website}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Şablon Bilgileri */}
                                    <div className="mt-3 pt-3 border-t border-gray-200">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs text-gray-500">Varsayılan Menü:</span>
                                            <span className="text-xs font-medium px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                                                {getTemplateName('menu', brand.default_menu_template_id)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between mb-1">
                                            <span className="text-xs text-gray-500">Varsayılan Fiyat:</span>
                                            <span className="text-xs font-medium px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full">
                                                {getTemplateName('price', brand.default_price_template_id)}
                                            </span>
                                        </div>

                                        <div className="flex justify-between mt-2">
                                            <span className="text-xs text-gray-500">Toplam Şube:</span>
                                            <span className="text-xs font-medium px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                                                {branchesCount[brand.id] || 0}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 border-t" style={{ backgroundColor: theme.light }}>
                                    <button
                                        onClick={() => handleGoToBranches(brand.id)}
                                        className="flex flex-col items-center justify-center py-3 hover:bg-gray-200 transition-colors"
                                    >
                                        <FiHome size={18} style={{ color: theme.primary }} />
                                        <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>Şubeler</span>
                                    </button>

                                    <button
                                        onClick={() => handleOpenDetails(brand)}
                                        className="flex flex-col items-center justify-center py-3 hover:bg-gray-200 transition-colors"
                                    >
                                        <FiInfo size={18} style={{ color: theme.accent }} />
                                        <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>Detaylar</span>
                                    </button>

                                    <div className="flex flex-col items-center justify-center py-3">
                                        <div className={`w-3 h-3 rounded-full ${brand.is_active ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                        <span className="text-xs mt-1" style={{ color: theme.textSecondary }}>{brand.is_active ? 'Aktif' : 'Pasif'}</span>
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
                                        Marka Adı
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        İletişim
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Şablonlar
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Şube Sayısı
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
                                {filteredBrands.map((brand) => (
                                    <tr key={brand.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full overflow-hidden">
                                                    <img
                                                        src={brand.logo_url || "/logos/default-logo.png"}
                                                        alt={brand.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = "/logos/default-logo.png";
                                                        }}
                                                    />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                                                    <div className="text-sm text-gray-500">{brand.website || ''}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{brand.contact_email || '-'}</div>
                                            <div className="text-sm text-gray-500">{brand.contact_phone || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className="flex items-center gap-1 mb-1">
                                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                                    <span>Menü: {getTemplateName('menu', brand.default_menu_template_id)}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                                    <span>Fiyat: {getTemplateName('price', brand.default_price_template_id)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                {branchesCount[brand.id] || 0}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${brand.is_active
                                                ? "bg-green-100 text-green-800"
                                                : "bg-gray-100 text-gray-800"
                                                }`}>
                                                {brand.is_active ? "Aktif" : "Pasif"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleOpenDetails(brand)}
                                                    className="text-blue-600 hover:text-blue-900"
                                                    title="Detaylar"
                                                >
                                                    <FiInfo size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleGoToBranches(brand.id)}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Şubeler"
                                                >
                                                    <FiHome size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleAddEditBrand(brand)}
                                                    className="text-amber-600 hover:text-amber-900"
                                                    title="Düzenle"
                                                >
                                                    <FiEdit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDelete(brand.id)}
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

            {/* Marka Ekleme/Düzenleme Modalı */}
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
                                {editingBrand ? `${editingBrand.name} Markasını Düzenle` : "Yeni Marka Ekle"}
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
                                        Genel Bilgiler
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
                                        Şablonlar
                                    </Tab>
                                </Tab.List>

                                <Tab.Panels>
                                    {/* Genel Bilgiler Tab */}
                                    <Tab.Panel>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label
                                                    className="block text-sm font-medium mb-1"
                                                    style={{ color: theme.primary }}
                                                >
                                                    Marka Adı *
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
                                                    Logo URL
                                                </label>
                                                <input
                                                    type="text"
                                                    name="logo_url"
                                                    value={form.logo_url}
                                                    onChange={handleFormChange}
                                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{
                                                        borderColor: theme.secondary
                                                    }}
                                                    placeholder="https://example.com/logo.png"
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
                                                    name="contact_email"
                                                    value={form.contact_email}
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
                                                    Telefon
                                                </label>
                                                <input
                                                    type="tel"
                                                    name="contact_phone"
                                                    value={form.contact_phone}
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
                                                    Website
                                                </label>
                                                <input
                                                    type="text"
                                                    name="website"
                                                    value={form.website}
                                                    onChange={handleFormChange}
                                                    className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    style={{
                                                        borderColor: theme.secondary
                                                    }}
                                                    placeholder="https://example.com"
                                                />
                                            </div>

                                            <div className="md:col-span-2">
                                                <label
                                                    className="block text-sm font-medium mb-1"
                                                    style={{ color: theme.primary }}
                                                >
                                                    Adres
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
                                                ></textarea>
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
                                                        Marka aktif
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </Tab.Panel>

                                    {/* Şablonlar Tab */}
                                    <Tab.Panel>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label
                                                    className="block text-sm font-medium mb-1"
                                                    style={{ color: theme.primary }}
                                                >
                                                    Varsayılan Menü Şablonu
                                                </label>
                                                <select
                                                    name="default_menu_template_id"
                                                    value={form.default_menu_template_id}
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

                                                {form.default_menu_template_id && (
                                                    <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                                        <h4 className="text-sm font-medium text-blue-700 mb-1">
                                                            {templates.menu.find(t => t.id.toString() === form.default_menu_template_id.toString())?.name}
                                                        </h4>
                                                        <p className="text-xs text-blue-600">
                                                            {templates.menu.find(t => t.id.toString() === form.default_menu_template_id.toString())?.description || "Bu şablona ait açıklama bulunmuyor."}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div>
                                                <label
                                                    className="block text-sm font-medium mb-1"
                                                    style={{ color: theme.primary }}
                                                >
                                                    Varsayılan Fiyat Şablonu
                                                </label>
                                                <select
                                                    name="default_price_template_id"
                                                    value={form.default_price_template_id}
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

                                                {form.default_price_template_id && (
                                                    <div className="mt-2 p-3 bg-amber-50 rounded-lg">
                                                        <h4 className="text-sm font-medium text-amber-700 mb-1">
                                                            {templates.price.find(t => t.id.toString() === form.default_price_template_id.toString())?.name}
                                                        </h4>
                                                        <p className="text-xs text-amber-600">
                                                            {templates.price.find(t => t.id.toString() === form.default_price_template_id.toString())?.description || "Bu şablona ait açıklama bulunmuyor."}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
                                                <h4 className="text-sm font-medium mb-2" style={{ color: theme.primary }}>Bilgi</h4>
                                                <p className="text-xs text-gray-600">
                                                    Bu şablonlar marka için varsayılan ayarları belirler. Yeni şubeler oluşturulduğunda bu şablonlar otomatik olarak atanır,
                                                    ancak daha sonra her şube için özel şablonlar tanımlanabilir.
                                                </p>
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
                                    {editingBrand ? "Güncelle" : "Ekle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Marka Detayları Modalı */}
            {showDetailsModal && detailsBrand && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div
                        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
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
                                {detailsBrand.name} Detayları
                            </h3>
                            <button
                                onClick={() => setShowDetailsModal(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="flex mb-6">
                                <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden mr-4 flex-shrink-0">
                                    <img
                                        src={detailsBrand.logo_url || "/logos/default-logo.png"}
                                        alt={detailsBrand.name}
                                        className="w-full h-full object-contain"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "/logos/default-logo.png";
                                        }}
                                    />
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold" style={{ color: theme.primary }}>{detailsBrand.name}</h2>
                                    <div className="flex items-center mt-1 mb-2">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${detailsBrand.is_active
                                            ? "bg-green-100 text-green-800"
                                            : "bg-gray-100 text-gray-800"
                                            }`}>
                                            {detailsBrand.is_active ? "Aktif" : "Pasif"}
                                        </span>
                                        <span className="mx-2 text-gray-300">•</span>
                                        <span className="text-sm text-gray-500">
                                            Toplam {branchesCount[detailsBrand.id] || 0} şube
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600">{detailsBrand.description}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <h4 className="text-sm font-medium mb-2" style={{ color: theme.primary }}>İletişim Bilgileri</h4>
                                    <ul className="space-y-2">
                                        {detailsBrand.contact_email && (
                                            <li className="flex items-center gap-2 text-sm">
                                                <FiMail className="text-gray-400" />
                                                <span>{detailsBrand.contact_email}</span>
                                            </li>
                                        )}
                                        {detailsBrand.contact_phone && (
                                            <li className="flex items-center gap-2 text-sm">
                                                <FiPhone className="text-gray-400" />
                                                <span>{detailsBrand.contact_phone}</span>
                                            </li>
                                        )}
                                        {detailsBrand.website && (
                                            <li className="flex items-center gap-2 text-sm">
                                                <FiGlobe className="text-gray-400" />
                                                <span>{detailsBrand.website}</span>
                                            </li>
                                        )}
                                        {detailsBrand.address && (
                                            <li className="flex items-start gap-2 text-sm">
                                                <FiMapPin className="text-gray-400 mt-1" />
                                                <span>{detailsBrand.address}</span>
                                            </li>
                                        )}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium mb-2" style={{ color: theme.primary }}>Varsayılan Şablonlar</h4>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            <span className="text-sm">Menü: {getTemplateName('menu', detailsBrand.default_menu_template_id)}</span>
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                            <span className="text-sm">Fiyat: {getTemplateName('price', detailsBrand.default_price_template_id)}</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <div className="border-t pt-4 flex justify-between">
                                <div>
                                    <span className="text-xs text-gray-500">Oluşturulma: {new Date(detailsBrand.created_at).toLocaleDateString('tr-TR')}</span>
                                    {detailsBrand.updated_at && (
                                        <span className="text-xs text-gray-500 ml-3">Son Güncelleme: {new Date(detailsBrand.updated_at).toLocaleDateString('tr-TR')}</span>
                                    )}
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            handleAddEditBrand(detailsBrand);
                                        }}
                                        className="px-3 py-1 text-xs rounded bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    >
                                        Düzenle
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDetailsModal(false);
                                            handleGoToBranches(detailsBrand.id);
                                        }}
                                        className="px-3 py-1 text-xs rounded bg-green-50 text-green-600 hover:bg-green-100"
                                    >
                                        Şubelere Git
                                    </button>
                                </div>
                            </div>
                        </div>
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
                                Markayı Sil
                            </h3>
                            <p
                                className="mb-6"
                                style={{ color: theme.textSecondary }}
                            >
                                Bu markayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve markaya bağlı tüm şubeler de silinecektir.
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
        </div>
    );
};

export default EnhancedBrandManager;