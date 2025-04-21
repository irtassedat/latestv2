import { useState, useEffect, useRef } from "react";
import { FiEdit2, FiTrash2, FiPlus, FiInfo, FiSettings, FiCheck, FiX, FiUpload, FiDownload, FiEye, FiEyeOff, FiPackage } from "react-icons/fi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { Tab } from '@headlessui/react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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

// Şablon türleri
const templateTypes = {
  MENU: "menu",
  PRICE: "price",
  INTEGRATION: "integration"
};

const TemplateManager = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [templates, setTemplates] = useState({
    [templateTypes.MENU]: [],
    [templateTypes.PRICE]: [],
    [templateTypes.INTEGRATION]: []
  });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Ürün Yönetimi
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showPriceProductsModal, setShowPriceProductsModal] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(null);
  const [templateProducts, setTemplateProducts] = useState([]);
  const [templatePriceProducts, setTemplatePriceProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productFilter, setProductFilter] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Excel import için dosya referansı
  const fileInputRef = useRef(null);
  const priceFileInputRef = useRef(null);

  const [currentType, setCurrentType] = useState(templateTypes.MENU);

  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    is_active: true
  });

  const [priceForm, setPriceForm] = useState({
    name: "",
    description: "",
    is_active: true,
    year: new Date().getFullYear()
  });

  const [integrationForm, setIntegrationForm] = useState({
    name: "",
    type: "delivery",
    description: "",
    is_active: true,
    config: {
      api_key: "",
      endpoint: "",
      options: {}
    }
  });

  // Şablonları getir
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      // Farklı türlerdeki şablonlar için paralel API istekleri
      const [menuRes, priceRes, integrationRes] = await Promise.all([
        api.get("/api/templates/menu"),
        api.get("/api/templates/price"),
        api.get("/api/integrations")
      ]);

      setTemplates({
        [templateTypes.MENU]: menuRes.data,
        [templateTypes.PRICE]: priceRes.data,
        [templateTypes.INTEGRATION]: integrationRes.data
      });
    } catch (error) {
      console.error("Şablonlar yüklenirken hata:", error);
      toast.error("Şablonlar yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  // Tüm ürünleri getir
  const fetchAllProducts = async () => {
    try {
      const response = await api.get("/api/products");
      setAllProducts(response.data);
    } catch (error) {
      console.error("Tüm ürünler yüklenirken hata:", error);
      toast.error("Ürünler yüklenemedi!");
    }
  };

  // Kategorileri getir
  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/categories");
      setCategories(response.data);
    } catch (error) {
      console.error("Kategoriler yüklenirken hata:", error);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchAllProducts();
    fetchCategories();
  }, []);

  // Form değişikliklerini izle
  const handleMenuFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    setMenuForm({ ...menuForm, [name]: inputValue });
  };

  const handlePriceFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    setPriceForm({ ...priceForm, [name]: inputValue });
  };

  const handleIntegrationFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    if (name.startsWith('config.')) {
      // Config alt nesnesi için değişiklik
      const configKey = name.split('.')[1];
      setIntegrationForm({
        ...integrationForm,
        config: {
          ...integrationForm.config,
          [configKey]: value
        }
      });
    } else {
      setIntegrationForm({ ...integrationForm, [name]: inputValue });
    }
  };

  // Şablon ekleme/düzenleme modalını aç
  const handleAddEditTemplate = (template = null, type) => {
    setCurrentType(type);

    if (template) {
      // Düzenleme modu
      setEditingTemplate(template);

      if (type === templateTypes.MENU) {
        setMenuForm({
          name: template.name || "",
          description: template.description || "",
          is_active: template.is_active !== false
        });
        setShowModal(true);
      }
      else if (type === templateTypes.PRICE) {
        setPriceForm({
          name: template.name || "",
          description: template.description || "",
          is_active: template.is_active !== false,
          year: template.year || new Date().getFullYear()
        });
        setShowModal(true);
      }
      else if (type === templateTypes.INTEGRATION) {
        setIntegrationForm({
          name: template.name || "",
          type: template.type || "delivery",
          description: template.description || "",
          is_active: template.is_active !== false,
          config: template.config || {
            api_key: "",
            endpoint: "",
            options: {}
          }
        });
        setShowIntegrationModal(true);
      }
    } else {
      // Ekleme modu
      setEditingTemplate(null);

      if (type === templateTypes.MENU) {
        setMenuForm({
          name: "",
          description: "",
          is_active: true
        });
        setShowModal(true);
      }
      else if (type === templateTypes.PRICE) {
        setPriceForm({
          name: "",
          description: "",
          is_active: true,
          year: new Date().getFullYear()
        });
        setShowModal(true);
      }
      else if (type === templateTypes.INTEGRATION) {
        setIntegrationForm({
          name: "",
          type: "delivery",
          description: "",
          is_active: true,
          config: {
            api_key: "",
            endpoint: "",
            options: {}
          }
        });
        setShowIntegrationModal(true);
      }
    }
  };

  // Form gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      let formData;
      let endpoint;

      if (currentType === templateTypes.MENU) {
        formData = menuForm;
        endpoint = "/api/templates/menu";
      }
      else if (currentType === templateTypes.PRICE) {
        formData = priceForm;
        endpoint = "/api/templates/price";
      }

      if (editingTemplate) {
        // Var olan şablonu güncelle
        response = await api.put(`${endpoint}/${editingTemplate.id}`, formData);
        toast.success(`${formData.name} şablonu başarıyla güncellendi`);
      } else {
        // Yeni şablon ekle
        response = await api.post(endpoint, formData);
        toast.success(`${formData.name} şablonu başarıyla eklendi`);
      }

      // Şablonları yeniden yükle
      fetchTemplates();

      // Modalı kapat
      setShowModal(false);

    } catch (error) {
      console.error("Form gönderilirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Entegrasyon formu gönderimi
  const handleIntegrationSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;

      if (editingTemplate) {
        // Var olan entegrasyonu güncelle
        response = await api.put(`/api/integrations/${editingTemplate.id}`, integrationForm);
        toast.success(`${integrationForm.name} entegrasyonu başarıyla güncellendi`);
      } else {
        // Yeni entegrasyon ekle
        response = await api.post("/api/integrations", integrationForm);
        toast.success(`${integrationForm.name} entegrasyonu başarıyla eklendi`);
      }

      // Şablonları yeniden yükle
      fetchTemplates();

      // Modalı kapat
      setShowIntegrationModal(false);

    } catch (error) {
      console.error("Entegrasyon formu gönderilirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Şablon silme işlemi
  const handleDelete = async (templateId, type) => {
    try {
      let endpoint;

      if (type === templateTypes.MENU) {
        endpoint = "/api/templates/menu";
      }
      else if (type === templateTypes.PRICE) {
        endpoint = "/api/templates/price";
      }
      else if (type === templateTypes.INTEGRATION) {
        endpoint = "/api/integrations";
      }

      await api.delete(`${endpoint}/${templateId}`);

      // Şablonları güncelle
      setTemplates(prev => ({
        ...prev,
        [type]: prev[type].filter(template => template.id !== templateId)
      }));

      toast.success("Şablon başarıyla silindi");
      setConfirmDelete(null); // Silme onay penceresini kapat
    } catch (error) {
      console.error("Şablon silinirken hata:", error);
      toast.error("Şablon silinemedi!");
    }
  };

  // Filtreleme işlemleri
  const getFilteredTemplates = (type) => {
    return templates[type].filter(template => {
      return (
        template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  };

  // Tab değişikliğini izle
  const handleTabChange = (index) => {
    setActiveTab(index);

    // Tab değiştiğinde şablon türünü güncelle
    if (index === 0) setCurrentType(templateTypes.MENU);
    else if (index === 1) setCurrentType(templateTypes.PRICE);
    else if (index === 2) setCurrentType(templateTypes.INTEGRATION);
  };

  // Şube ürünlerini yeniden yükle 
  const handleRefreshProducts = async (templateId, showAll = false) => {
    if (!templateId) return;
    
    setProductLoading(true);
    try {
      // API çağrısını güncelle: showAll true ise tüm ürünleri getir
      const response = await api.get(`/api/templates/menu/${templateId}/products`, {
        params: { onlyTemplateProducts: !showAll ? 'true' : 'false' }
      });
      
      setTemplateProducts(response.data);
    } catch (error) {
      console.error("Ürünler yenilenirken hata:", error);
      toast.error("Ürünler yenilenemedi!");
    } finally {
      setProductLoading(false);
    }
  };

  // Menü şablonundaki ürünleri yönetme fonksiyonu
  const handleManageMenuProducts = async (templateId) => {
    setProductLoading(true);
    try {
      console.log(`Template ID ${templateId} için ürünler getiriliyor...`);
      
      // showAllProducts state'ini kullan
      const response = await api.get(`/api/templates/menu/${templateId}/products`, {
        params: { onlyTemplateProducts: !showAllProducts ? 'true' : 'false' }
      });
      
      console.log(`Şablon ürünleri başarıyla alındı:`, response.data);
  
      // Ürün yönetim modalını aç
      setTemplateProducts(response.data);
      setCurrentTemplateId(templateId);
      setShowProductsModal(true);
    } catch (error) {
      console.error("Şablon ürünleri yüklenirken hata:", error);
      console.error("Hata detayları:", error.response?.data || "Detay yok");
      toast.error("Şablon ürünleri yüklenemedi!");
    } finally {
      setProductLoading(false);
    }
  };

  // Fiyat şablonundaki ürünleri yönetme fonksiyonu
  const handleManagePriceProducts = async (templateId) => {
    setProductLoading(true);
    try {
      // Şablondaki ürün fiyatlarını getir
      const response = await api.get(`/api/templates/price/${templateId}/products`);
      const products = response.data;

      // Fiyat yönetim modalını aç
      setTemplatePriceProducts(products);
      setCurrentTemplateId(templateId);
      setShowPriceProductsModal(true);
    } catch (error) {
      console.error("Şablon ürün fiyatları yüklenirken hata:", error);
      toast.error("Şablon ürün fiyatları yüklenemedi!");
    } finally {
      setProductLoading(false);
    }
  };

  // Ürün görünürlüğünü güncelle - Menü şablonu için
  const handleProductVisibilityToggle = async (productId, isVisible) => {
    try {
      // API için istek hazırla
      await api.post(`/api/templates/menu/${currentTemplateId}/products`, {
        products: [{ product_id: productId, is_visible: !isVisible }]
      });

      // Yerel state'i güncelle
      setTemplateProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId
            ? { ...product, is_visible: !isVisible }
            : product
        )
      );

      toast.success("Ürün görünürlüğü güncellendi");
    } catch (error) {
      console.error("Görünürlük güncellenirken hata:", error);
      toast.error("Görünürlük güncellenemedi!");
    }
  };

  // Fiyat güncelleme - Fiyat şablonu için
  const handlePriceUpdate = async (productId, newPrice) => {
    try {
      await api.post(`/api/templates/price/${currentTemplateId}/products`, {
        products: [{ product_id: productId, price: parseFloat(newPrice) }]
      });

      // Yerel state'i güncelle
      setTemplatePriceProducts(prevProducts =>
        prevProducts.map(product =>
          product.id === productId
            ? { ...product, template_price: parseFloat(newPrice) }
            : product
        )
      );

      toast.success("Ürün fiyatı güncellendi");
    } catch (error) {
      console.error("Fiyat güncellenirken hata:", error);
      toast.error("Fiyat güncellenemedi!");
    }
  };

  const handleMakeAllVisible = async () => {
    try {
      const productUpdates = templateProducts.map(product => ({
        product_id: product.id,
        is_visible: true
      }));

      await api.post(`/api/templates/menu/${currentTemplateId}/products`, {
        products: productUpdates
      });

      // UI'ı güncelle
      setTemplateProducts(prevProducts =>
        prevProducts.map(product => ({ ...product, is_visible: true }))
      );

      toast.success("Tüm ürünler görünür yapıldı");
    } catch (error) {
      console.error("Ürünler güncellenirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Excel import fonksiyonu - Menü şablonu için (güncellenmiş)
  const handleMenuTemplateExcelImport = async (e) => {
    if (!currentTemplateId) {
      toast.error("Lütfen önce bir menü şablonu seçin");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setProductLoading(true);

    try {
      // Önce şube ID'sini bir kez getir
      const branchesResponse = await api.get("/api/branches");
      const defaultBranchId = branchesResponse.data[0]?.id || 1;
      console.log("Varsayılan şube ID'si:", defaultBranchId);

      // Excel dosyasını oku
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Excel verisi okundu:", jsonData.slice(0, 3));

      // Excel verilerini işle - kategori ve ürün kontrolü yap
      const processedData = [];

      for (const item of jsonData) {
        // Temel bilgileri kontrol et
        if (!item['Ürün Adı']) {
          console.warn("Ürün adı eksik, bu satır atlanıyor:", item);
          continue;
        }
        if (!item['Kategori']) {
          console.warn("Kategori eksik, bu satır atlanıyor:", item);
          continue;
        }

        // İşlenmiş ürün verisi - ID ALANINI ÇIKARIYORUZ
        const processedItem = {
          name: item['Ürün Adı'],
          category: item['Kategori'],
          price: parseFloat(item['Fiyat']) || 0,
          is_visible: item['Görünür'] === 'Evet',
          description: item['Açıklama'] || '',
          image_url: item['Görsel URL'] || '',
          stock_count: parseInt(item['Stok']) || 0
        };

        // Eğer Excel dosyasında ID sütunu varsa, bunu çıkar
        // ID değerini backend belirlesin
        delete processedItem.id;

        processedData.push(processedItem);
      }

      // Sadece isim ve kategorisi olan ürünleri al
      const cleanProducts = processedData.filter(p => p.name && p.category);

      if (cleanProducts.length === 0) {
        throw new Error("Geçerli ürün verisi bulunamadı. Her ürünün en az isim ve kategori bilgisi olmalıdır.");
      }

      console.log(`${cleanProducts.length} ürün işlendi, API'ye gönderiliyor...`);

      // Özel JSON formatı oluştur
      const importData = {
        branchId: defaultBranchId,
        menuTemplateId: currentTemplateId,
        products: cleanProducts
      };

      // API'ye gönderilecek veriyi logla
      console.log("API'ye gönderilecek veri:", importData);

      // Şablona ürün ekleyecek API çağrısı
      const response = await api.post('/api/templates/import-template-products', importData);
      console.log("API yanıtı:", response.data);

      toast.success("Menü şablonu ürünleri başarıyla içe aktarıldı");

      // Güncel ürünleri yeniden yükle
      handleManageMenuProducts(currentTemplateId);
    } catch (error) {
      console.error("Excel içe aktarılırken hata:", error);
      console.error("Hata detayları:", error.response?.data || error.message);

      // Daha açıklayıcı hata mesajı göster
      if (error.message?.includes("duplicate key value") || error.response?.data?.error?.includes("duplicate")) {
        toast.error("Bazı ürünler zaten sistemde mevcut. Lütfen yeni ürünler ekleyin veya mevcut ürünleri güncelleyin.");
      } else {
        toast.error(`İçe aktarma hatası: ${error.message || error.response?.data?.error || "Bilinmeyen hata"}`);
      }
    } finally {
      setProductLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Excel export fonksiyonu - Menü şablonu için
  const handleMenuTemplateExcelExport = () => {
    if (!currentTemplateId || templateProducts.length === 0) {
      toast.error("Dışa aktarılacak ürün bulunamadı");
      return;
    }

    // Excel için data hazırla
    const excelData = templateProducts.map(product => ({
      "Ürün Adı": product.name,
      "Kategori": product.category_name,
      "Görünür": product.is_visible ? "Evet" : "Hayır",
      "Açıklama": product.description || "",
      "Fiyat": product.price || 0,
      "Görsel URL": product.image_url || "",
      "Ürün ID": product.id
    }));

    // Excel dosyasını oluştur
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");

    // Dosyayı indir
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // Şablon adını al
    const template = templates[templateTypes.MENU].find(t => t.id === currentTemplateId);
    const templateName = template ? template.name.replace(/\s+/g, '_') : 'menu_template';

    saveAs(data, `${templateName}.xlsx`);

    toast.success("Excel dosyası indiriliyor...");
  };

  // Excel import fonksiyonu - Fiyat şablonu için
  const handlePriceTemplateExcelImport = async (e) => {
    if (!currentTemplateId) {
      toast.error("Lütfen önce bir fiyat şablonu seçin");
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setProductLoading(true);

    try {
      // Excel dosyasını oku
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Excel fiyat verisi okundu:", jsonData.slice(0, 3)); // İlk 3 satırı logla

      // Excel verilerini API'ye gönder
      await api.post(`/api/templates/price/${currentTemplateId}/products/batch`, jsonData);
      toast.success("Fiyat şablonu ürünleri başarıyla içe aktarıldı");

      // Güncel ürünleri yeniden yükle
      handleManagePriceProducts(currentTemplateId);
    } catch (error) {
      console.error("Excel içe aktarılırken hata:", error);
      console.error("Hata detayları:", error.response?.data || "Detay yok");
      toast.error("Fiyat şablonu ürünleri içe aktarılamadı");
    } finally {
      setProductLoading(false);
      if (priceFileInputRef.current) {
        priceFileInputRef.current.value = '';
      }
    }
  };

  // Excel export fonksiyonu - Fiyat şablonu için
  const handlePriceTemplateExcelExport = () => {
    if (!currentTemplateId || templatePriceProducts.length === 0) {
      toast.error("Dışa aktarılacak ürün bulunamadı");
      return;
    }

    // Excel için data hazırla
    const excelData = templatePriceProducts.map(product => ({
      "Ürün Adı": product.name,
      "Kategori": product.category_name,
      "Fiyat (TL)": product.template_price || product.price || 0,
      "Ürün ID": product.id
    }));

    // Excel dosyasını oluştur
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ürün Fiyatları");

    // Dosyayı indir
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // Şablon adını al
    const template = templates[templateTypes.PRICE].find(t => t.id === currentTemplateId);
    const templateName = template ? template.name.replace(/\s+/g, '_') : 'price_template';

    saveAs(data, `${templateName}.xlsx`);

    toast.success("Excel dosyası indiriliyor...");
  };

  // Ürünleri filtrele - Menü şablonu için
  const filteredTemplateProducts = templateProducts.filter(product => {
    return (
      (product.name?.toLowerCase().includes(productFilter.toLowerCase()) ||
        product.category_name?.toLowerCase().includes(productFilter.toLowerCase())) &&
      (productCategoryFilter === "" || product.category_id?.toString() === productCategoryFilter)
    );
  });

  // Ürünleri filtrele - Fiyat şablonu için
  const filteredTemplatePriceProducts = templatePriceProducts.filter(product => {
    return (
      (product.name?.toLowerCase().includes(productFilter.toLowerCase()) ||
        product.category_name?.toLowerCase().includes(productFilter.toLowerCase())) &&
      (productCategoryFilter === "" || product.category_id?.toString() === productCategoryFilter)
    );
  });

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>Şablon Yönetimi</h1>

          <div className="flex flex-col md:flex-row gap-4">
            {/* Arama kutusu */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                placeholder="Şablon ara..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none"
                style={{
                  borderColor: "rgba(2, 43, 69, 0.2)",
                  boxShadow: "0 1px 3px rgba(2, 43, 69, 0.1)"
                }}
              />
              <HiOutlineDocumentSearch
                className="absolute left-2 top-2.5"
                size={20}
                style={{ color: theme.primary }}
              />
            </div>
          </div>
        </div>

        {/* Tablar */}
        <div className="mb-6">
          <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
            <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                  ${selected
                    ? 'bg-white text-blue-600 shadow'
                    : 'text-gray-500 hover:bg-white/[0.12] hover:text-blue-600'
                  }`
                }
              >
                Menü Şablonları
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
                Fiyat Şablonları
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
                Entegrasyon Şablonları
              </Tab>
            </Tab.List>

            <Tab.Panels className="mt-4">
              {/* Menü Şablonları Panel */}
              <Tab.Panel>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => handleAddEditTemplate(null, templateTypes.MENU)}
                    className="flex items-center justify-center gap-1 px-4 py-2 text-white rounded-lg transition-colors"
                    style={{
                      backgroundColor: theme.accent,
                      fontWeight: 600
                    }}
                  >
                    <FiPlus size={18} />
                    <span>Yeni Menü Şablonu</span>
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div
                      className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                      style={{ borderColor: theme.primary }}
                    ></div>
                  </div>
                ) : getFilteredTemplates(templateTypes.MENU).length === 0 ? (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3
                      className="text-lg font-medium mb-2"
                      style={{ color: theme.primary }}
                    >
                      Menü Şablonu Bulunamadı
                    </h3>
                    <p
                      className="mb-4"
                      style={{ color: theme.textSecondary }}
                    >
                      {searchTerm ? "Arama kriterlerinize uygun şablon bulunmamaktadır." : "Henüz hiç menü şablonu eklenmemiş."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredTemplates(templateTypes.MENU).map(template => (
                      <div
                        key={template.id}
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
                            {template.name}
                          </h3>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleAddEditTemplate(template, templateTypes.MENU)}
                              className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                              title="Düzenle"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: template.id, type: templateTypes.MENU })}
                              className="p-1.5 rounded-full hover:bg-blue-500 transition-colors"
                              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                              title="Sil"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-4">
                          {template.description && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">Durum</span>
                            <span className={`py-1 px-2 text-xs rounded-full ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {template.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>

                          {/* Ürün yönetimi butonu */}
                          <button
                            onClick={() => handleManageMenuProducts(template.id)}
                            className="w-full mt-4 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                          >
                            <FiPackage size={16} />
                            <span>Ürünleri Yönet</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Panel>

              {/* Fiyat Şablonları Panel */}
              <Tab.Panel>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => handleAddEditTemplate(null, templateTypes.PRICE)}
                    className="flex items-center justify-center gap-1 px-4 py-2 text-white rounded-lg transition-colors"
                    style={{
                      backgroundColor: theme.accent,
                      fontWeight: 600
                    }}
                  >
                    <FiPlus size={18} />
                    <span>Yeni Fiyat Şablonu</span>
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div
                      className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                      style={{ borderColor: theme.primary }}
                    ></div>
                  </div>
                ) : getFilteredTemplates(templateTypes.PRICE).length === 0 ? (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3
                      className="text-lg font-medium mb-2"
                      style={{ color: theme.primary }}
                    >
                      Fiyat Şablonu Bulunamadı
                    </h3>
                    <p
                      className="mb-4"
                      style={{ color: theme.textSecondary }}
                    >
                      {searchTerm ? "Arama kriterlerinize uygun şablon bulunmamaktadır." : "Henüz hiç fiyat şablonu eklenmemiş."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredTemplates(templateTypes.PRICE).map(template => (
                      <div
                        key={template.id}
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}
                      >
                        <div
                          className="text-white px-4 py-3 flex justify-between items-center"
                          style={{ backgroundColor: theme.accent }}
                        >
                          <h3
                            className="font-semibold text-lg truncate"
                          >
                            {template.name}
                          </h3>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleAddEditTemplate(template, templateTypes.PRICE)}
                              className="p-1.5 rounded-full hover:bg-yellow-500 transition-colors"
                              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                              title="Düzenle"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: template.id, type: templateTypes.PRICE })}
                              className="p-1.5 rounded-full hover:bg-yellow-500 transition-colors"
                              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                              title="Sil"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-4">
                          {template.description && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">Yıl</span>
                            <span className="py-1 px-2 text-xs rounded-full bg-blue-100 text-blue-800">
                              {template.year || new Date().getFullYear()}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">Durum</span>
                            <span className={`py-1 px-2 text-xs rounded-full ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {template.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>

                          {/* Fiyat yönetimi butonu */}
                          <button
                            onClick={() => handleManagePriceProducts(template.id)}
                            className="w-full mt-4 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg flex items-center justify-center gap-2 transition-colors"
                          >
                            <FiSettings size={16} />
                            <span>Fiyatları Yönet</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Panel>

              {/* Entegrasyon Şablonları Panel */}
              <Tab.Panel>
                <div className="flex justify-end mb-4">
                  <button
                    onClick={() => handleAddEditTemplate(null, templateTypes.INTEGRATION)}
                    className="flex items-center justify-center gap-1 px-4 py-2 text-white rounded-lg transition-colors"
                    style={{
                      backgroundColor: theme.accent,
                      fontWeight: 600
                    }}
                  >
                    <FiPlus size={18} />
                    <span>Yeni Entegrasyon</span>
                  </button>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div
                      className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                      style={{ borderColor: theme.primary }}
                    ></div>
                  </div>
                ) : getFilteredTemplates(templateTypes.INTEGRATION).length === 0 ? (
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                    </svg>
                    <h3
                      className="text-lg font-medium mb-2"
                      style={{ color: theme.primary }}
                    >
                      Entegrasyon Şablonu Bulunamadı
                    </h3>
                    <p
                      className="mb-4"
                      style={{ color: theme.textSecondary }}
                    >
                      {searchTerm ? "Arama kriterlerinize uygun entegrasyon bulunmamaktadır." : "Henüz hiç entegrasyon şablonu eklenmemiş."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredTemplates(templateTypes.INTEGRATION).map(template => (
                      <div
                        key={template.id}
                        className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        style={{ borderColor: "rgba(2, 43, 69, 0.1)" }}
                      >
                        <div
                          className="text-white px-4 py-3 flex justify-between items-center"
                          style={{ backgroundColor: "#6B7280" }}
                        >
                          <h3
                            className="font-semibold text-lg truncate"
                          >
                            {template.name}
                          </h3>
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleAddEditTemplate(template, templateTypes.INTEGRATION)}
                              className="p-1.5 rounded-full hover:bg-gray-500 transition-colors"
                              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                              title="Düzenle"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: template.id, type: templateTypes.INTEGRATION })}
                              className="p-1.5 rounded-full hover:bg-gray-500 transition-colors"
                              style={{ backgroundColor: "rgba(255, 255, 255, 0.1)" }}
                              title="Sil"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-4">
                          {template.description && (
                            <div className="mb-3">
                              <p className="text-sm text-gray-600">{template.description}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">Tip</span>
                            <span className="py-1 px-2 text-xs rounded-full bg-purple-100 text-purple-800">
                              {template.type === 'delivery' && 'Teslimat'}
                              {template.type === 'payment' && 'Ödeme'}
                              {template.type === 'order' && 'Sipariş'}
                              {template.type === 'menu' && 'Menü'}
                              {template.type === 'other' && 'Diğer'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-500">Durum</span>
                            <span className={`py-1 px-2 text-xs rounded-full ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {template.is_active ? 'Aktif' : 'Pasif'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Tab.Panel>
            </Tab.Panels>
          </Tab.Group>
        </div>

        {/* Şablon Ekleme/Düzenleme Modalı - Menü ve Fiyat */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
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
                  {editingTemplate
                    ? `${editingTemplate.name} Şablonunu Düzenle`
                    : currentType === templateTypes.MENU
                      ? "Yeni Menü Şablonu Ekle"
                      : "Yeni Fiyat Şablonu Ekle"
                  }
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: theme.primary }}
                    >
                      Şablon Adı *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={currentType === templateTypes.MENU ? menuForm.name : priceForm.name}
                      onChange={currentType === templateTypes.MENU ? handleMenuFormChange : handlePriceFormChange}
                      className="w-full p-2 border rounded-lg focus:outline-none"
                      style={{ borderColor: theme.secondary }}
                      required
                    />
                  </div>

                  {currentType === templateTypes.PRICE && (
                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: theme.primary }}
                      >
                        Yıl *
                      </label>
                      <input
                        type="number"
                        name="year"
                        value={priceForm.year}
                        onChange={handlePriceFormChange}
                        className="w-full p-2 border rounded-lg focus:outline-none"
                        style={{ borderColor: theme.secondary }}
                        min={2020}
                        max={2100}
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: theme.primary }}
                    >
                      Açıklama
                    </label>
                    <textarea
                      name="description"
                      value={currentType === templateTypes.MENU ? menuForm.description : priceForm.description}
                      onChange={currentType === templateTypes.MENU ? handleMenuFormChange : handlePriceFormChange}
                      rows="3"
                      className="w-full p-2 border rounded-lg focus:outline-none"
                      style={{ borderColor: theme.secondary }}
                    ></textarea>
                  </div>

                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="is_active"
                        name="is_active"
                        checked={currentType === templateTypes.MENU ? menuForm.is_active : priceForm.is_active}
                        onChange={currentType === templateTypes.MENU ? handleMenuFormChange : handlePriceFormChange}
                        className="h-4 w-4 rounded focus:ring-0 border-2"
                        style={{
                          borderColor: theme.secondary,
                          accentColor: theme.accent
                        }}
                      />
                      <label
                        htmlFor="is_active"
                        className="ml-2 text-sm font-medium"
                        style={{ color: theme.primary }}
                      >
                        Şablon aktif
                      </label>
                    </div>
                  </div>
                </div>

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
                    {editingTemplate ? "Güncelle" : "Ekle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entegrasyon Şablonu Modalı */}
        {showIntegrationModal && (
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
                  {editingTemplate
                    ? `${editingTemplate.name} Entegrasyonunu Düzenle`
                    : "Yeni Entegrasyon Şablonu Ekle"
                  }
                </h3>
                <button
                  onClick={() => setShowIntegrationModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleIntegrationSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: theme.primary }}
                    >
                      Entegrasyon Adı *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={integrationForm.name}
                      onChange={handleIntegrationFormChange}
                      className="w-full p-2 border rounded-lg focus:outline-none"
                      style={{ borderColor: theme.secondary }}
                      required
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: theme.primary }}
                    >
                      Entegrasyon Tipi *
                    </label>
                    <select
                      name="type"
                      value={integrationForm.type}
                      onChange={handleIntegrationFormChange}
                      className="w-full p-2 border rounded-lg focus:outline-none"
                      style={{ borderColor: theme.secondary }}
                      required
                    >
                      <option value="delivery">Teslimat</option>
                      <option value="payment">Ödeme</option>
                      <option value="order">Sipariş</option>
                      <option value="menu">Menü</option>
                      <option value="other">Diğer</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="integration_is_active"
                        name="is_active"
                        checked={integrationForm.is_active}
                        onChange={handleIntegrationFormChange}
                        className="h-4 w-4 rounded focus:ring-0 border-2"
                        style={{
                          borderColor: theme.secondary,
                          accentColor: theme.accent
                        }}
                      />
                      <label
                        htmlFor="integration_is_active"
                        className="ml-2 text-sm font-medium"
                        style={{ color: theme.primary }}
                      >
                        Entegrasyon aktif
                      </label>
                    </div>
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
                      value={integrationForm.description}
                      onChange={handleIntegrationFormChange}
                      rows="2"
                      className="w-full p-2 border rounded-lg focus:outline-none"
                      style={{ borderColor: theme.secondary }}
                    ></textarea>
                  </div>

                  {/* Entegrasyon Konfigürasyonu */}
                  <div className="md:col-span-2 border-t pt-4 mt-2">
                    <h4 className="font-medium mb-3 text-gray-700">Entegrasyon Konfigürasyonu</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          API Anahtarı
                        </label>
                        <input
                          type="text"
                          name="config.api_key"
                          value={integrationForm.config.api_key}
                          onChange={handleIntegrationFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none"
                          style={{ borderColor: theme.secondary }}
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-medium mb-1"
                          style={{ color: theme.primary }}
                        >
                          Endpoint URL
                        </label>
                        <input
                          type="text"
                          name="config.endpoint"
                          value={integrationForm.config.endpoint}
                          onChange={handleIntegrationFormChange}
                          className="w-full p-2 border rounded-lg focus:outline-none"
                          style={{ borderColor: theme.secondary }}
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500 mb-2">
                        Not: Entegrasyon detayları şubelere özel olarak her şubede ayrıca ayarlanabilir.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowIntegrationModal(false)}
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
                    {editingTemplate ? "Güncelle" : "Ekle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Menü Şablonu Ürün Yönetimi Modalı */}
        {showProductsModal && (
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
                  Menü Şablonu Ürünleri
                </h3>
                <button
                  onClick={() => setShowProductsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                {/* Excel Import/Export Butonları */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleMenuTemplateExcelImport}
                    accept=".xlsx, .xls"
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={productLoading}
                  >
                    <FiUpload size={16} />
                    <span>Excel'den İçe Aktar</span>
                  </button>

                  <button
                    onClick={handleMenuTemplateExcelExport}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={productLoading || templateProducts.length === 0}
                  >
                    <FiDownload size={16} />
                    <span>Excel'e Dışa Aktar</span>
                  </button>
                </div>

                {/* Filtre ve Arama */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Ürün ara..."
                      value={productFilter}
                      onChange={e => setProductFilter(e.target.value)}
                      className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none"
                    />
                    <HiOutlineDocumentSearch className="absolute left-2 top-2.5 text-gray-400" size={20} />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={e => setProductCategoryFilter(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none"
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id.toString()}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {/* Ürün Listesi */}
                {productLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div
                      className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                      style={{ borderColor: theme.primary }}
                    ></div>
                  </div>
                ) : filteredTemplateProducts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto mb-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M9 12h6m-6 4h6m-6-8h6M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">Ürün Bulunamadı</h3>
                    <p className="text-gray-500 mb-4">Şablonda ürün bulunmuyor veya filtrelere uygun ürün yok.</p>
                    <p className="text-sm text-gray-400">Excel ile ürün ekleyebilir veya filtrelerinizi değiştirebilirsiniz.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b">Ürün</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b">Kategori</th>
                          <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 border-b">Görünür</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 border-b">Normal Fiyat</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTemplateProducts.map(product => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 border-b">
                              <div className="flex items-center">
                                <div className="w-10 h-10 flex-shrink-0 mr-3 bg-gray-100 rounded overflow-hidden">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/uploads/guncellenecek.jpg";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                                      No Image
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  {product.description && (
                                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                      {product.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-b">
                              {product.category_name ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {product.category_name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 border-b text-center">
                              <button
                                onClick={() => handleProductVisibilityToggle(product.id, product.is_visible)}
                                className={`p-1.5 rounded-full transition-colors ${product.is_visible
                                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                  }`}
                                title={product.is_visible ? "Görünür - Gizle" : "Gizli - Göster"}
                              >
                                {product.is_visible ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                              </button>
                              <button
                                onClick={handleMakeAllVisible}
                                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                              >
                                Tümünü Görünür Yap
                              </button>
                            </td>
                            <td className="px-4 py-3 border-b text-right font-medium">
                              {product.price} ₺
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bilgi Notu */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-medium text-blue-700 mb-1 flex items-center gap-1">
                    <FiInfo size={16} />
                    <span>Menü Şablonu Hakkında</span>
                  </h4>
                  <p className="text-sm text-blue-600">
                    Bu menü şablonunu kullanan şubeler yalnızca "Görünür" olarak işaretlenen ürünleri müşterilerine gösterecektir.
                    Excel ile toplu içe/dışa aktarma yapabilir veya her ürünün görünürlüğünü tek tek değiştirebilirsiniz.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowProductsModal(false)}
                    className="px-4 py-2 text-white rounded-lg"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fiyat Şablonu Ürün Fiyatları Modalı */}
        {showPriceProductsModal && (
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
                  Fiyat Şablonu Yönetimi
                </h3>
                <button
                  onClick={() => setShowPriceProductsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                {/* Excel Import/Export Butonları */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <input
                    type="file"
                    ref={priceFileInputRef}
                    onChange={handlePriceTemplateExcelImport}
                    accept=".xlsx, .xls"
                    style={{ display: 'none' }}
                  />
                  <button
                    onClick={() => priceFileInputRef.current.click()}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    disabled={productLoading}
                  >
                    <FiUpload size={16} />
                    <span>Excel'den Fiyat İçe Aktar</span>
                  </button>

                  <button
                    onClick={handlePriceTemplateExcelExport}
                    className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={productLoading || templatePriceProducts.length === 0}
                  >
                    <FiDownload size={16} />
                    <span>Fiyatları Excel'e Aktar</span>
                  </button>
                </div>

                {/* Filtre ve Arama */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="relative flex-1 min-w-[200px]">
                    <input
                      type="text"
                      placeholder="Ürün ara..."
                      value={productFilter}
                      onChange={e => setProductFilter(e.target.value)}
                      className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none"
                    />
                    <HiOutlineDocumentSearch className="absolute left-2 top-2.5 text-gray-400" size={20} />
                  </div>

                  <select
                    value={productCategoryFilter}
                    onChange={e => setProductCategoryFilter(e.target.value)}
                    className="p-2 border border-gray-300 rounded-lg focus:outline-none"
                  >
                    <option value="">Tüm Kategoriler</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id.toString()}>{category.name}</option>
                    ))}
                  </select>
                </div>

                {/* Ürün Fiyat Listesi */}
                {productLoading ? (
                  <div className="flex items-center justify-center h-64">
                    <div
                      className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2"
                      style={{ borderColor: theme.primary }}
                    ></div>
                  </div>
                ) : filteredTemplatePriceProducts.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 mx-auto mb-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="text-lg font-medium mb-2">Ürün Bulunamadı</h3>
                    <p className="text-gray-500 mb-4">Ürün fiyatı bulunamadı veya filtrelere uygun ürün yok.</p>
                    <p className="text-sm text-gray-400">Excel ile fiyat ekleyebilir veya filtrelerinizi değiştirebilirsiniz.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b">Ürün</th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 border-b">Kategori</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 border-b">Normal Fiyat</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-500 border-b">Şablon Fiyatı</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTemplatePriceProducts.map(product => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 border-b">
                              <div className="flex items-center">
                                <div className="w-10 h-10 flex-shrink-0 mr-3 bg-gray-100 rounded overflow-hidden">
                                  {product.image_url ? (
                                    <img
                                      src={product.image_url}
                                      alt={product.name}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = "/uploads/guncellenecek.jpg";
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 text-xs">
                                      No Image
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{product.name}</div>
                                  {product.description && (
                                    <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                      {product.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 border-b">
                              {product.category_name ? (
                                <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                                  {product.category_name}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 border-b text-right font-medium text-gray-500">
                              {product.price} ₺
                            </td>
                            <td className="px-4 py-3 border-b">
                              <div className="flex items-center justify-end">
                                <input
                                  type="number"
                                  className="w-24 p-1 text-right border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  value={product.template_price || product.price}
                                  min="0"
                                  step="0.01"
                                  onChange={(e) => handlePriceUpdate(product.id, e.target.value)}
                                  onBlur={(e) => {
                                    // Boş değer veya 0 ise gerçek fiyatı kullan
                                    if (!e.target.value || parseFloat(e.target.value) <= 0) {
                                      handlePriceUpdate(product.id, product.price);
                                    }
                                  }}
                                />
                                <span className="ml-2 text-gray-700">₺</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Bilgi Notu */}
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <h4 className="text-sm font-medium text-amber-700 mb-1 flex items-center gap-1">
                    <FiInfo size={16} />
                    <span>Fiyat Şablonu Hakkında</span>
                  </h4>
                  <p className="text-sm text-amber-600">
                    Bu fiyat şablonunu kullanan şubeler için özel fiyatlar tanımlayabilirsiniz. Excel ile toplu fiyat güncellemesi
                    yapabilir veya ürünlerin fiyatlarını tek tek değiştirebilirsiniz. Değişiklikler anlık olarak kaydedilir.
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowPriceProductsModal(false)}
                    className="px-4 py-2 text-white rounded-lg"
                    style={{ backgroundColor: theme.primary }}
                  >
                    Kapat
                  </button>
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
                  Şablonu Sil
                </h3>
                <p
                  className="mb-6"
                  style={{ color: theme.textSecondary }}
                >
                  Bu şablonu silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve şablonu kullanan şubeler etkilenebilir.
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
                    onClick={() => handleDelete(confirmDelete.id, confirmDelete.type)}
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

        {/* Çeşme Kahvecisi font ailesi için */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap');
          `}
        </style>
      </div>
    </div>
  );
};

export default TemplateManager;