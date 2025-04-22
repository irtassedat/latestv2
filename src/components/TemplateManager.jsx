import { useState, useEffect, useRef } from "react";
import {
  FiEdit2, FiTrash2, FiPlus, FiInfo, FiSettings, FiCheck,
  FiX, FiUpload, FiDownload, FiEye, FiEyeOff, FiPackage, FiCopy,
  FiGrid, FiList
} from "react-icons/fi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { FiLink } from 'react-icons/fi';
import { MdLinkOff } from 'react-icons/md';
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

const EnhancedTemplateManager = () => {
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

  // Görünüm Modu
  const [viewMode, setViewMode] = useState("grid"); // "grid" veya "table"

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
    year: new Date().getFullYear(),
    menu_template_id: "" // Menü şablonu ID'si eklendi
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
  // 2. Şablon kopyalama ile ilgili state
  const [copyingTemplate, setCopyingTemplate] = useState(null);
  const [copyName, setCopyName] = useState("");
  const [copyDetails, setCopyDetails] = useState(null);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyStep, setCopyStep] = useState(0);

  // LocalStorage'dan görünüm tercihini yükle
  useEffect(() => {
    const savedViewMode = localStorage.getItem('templateManagerViewMode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Görünüm tercihini kaydet
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('templateManagerViewMode', mode);
  };

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

  // Şablon kopyalama işlemini başlatan fonksiyon - Bu fonksiyonu en üst seviyede tanımladık
  const handleInitiateCopy = async (template, type) => {
    try {
      // Kopyalama yükleniyor durumunu başlat
      setCopyLoading(true);

      // Kopyalanacak şablonu ve varsayılan adını ayarla
      setCopyingTemplate({ ...template, type });
      setCopyName(`${template.name} - Kopya`);

      // Şablon detaylarını getir - Her şablon türü için farklı işlem
      let details = { items: 0, categories: new Set() };

      if (type === templateTypes.MENU) {
        // Menü şablonundaki görünür ürünleri getir
        console.log(`Menü şablonu (ID: ${template.id}) ürünleri getiriliyor...`);

        const productsResponse = await api.get(`/api/templates/menu/${template.id}/products`, {
          params: { onlyTemplateProducts: 'true' }
        });

        if (productsResponse?.data) {
          const products = productsResponse.data;
          details.items = products.length;

          // Benzersiz kategorileri hesapla
          details.categories = new Set(products.map(p => p.category_name).filter(Boolean));

          console.log(`${details.items} ürün ve ${details.categories.size} kategori bulundu`);
        }
      }
      else if (type === templateTypes.PRICE) {
        // Fiyat şablonundaki fiyat bilgilerini getir
        console.log(`Fiyat şablonu (ID: ${template.id}) ürünleri getiriliyor...`);

        const priceResponse = await api.get(`/api/templates/price/${template.id}/products`);

        if (priceResponse?.data) {
          const priceProducts = priceResponse.data;
          details.items = priceProducts.length;

          // Fiyat ayarlanmış ürün sayısını hesapla
          const productsWithCustomPrice = priceProducts.filter(p =>
            p.template_price && p.template_price !== p.price
          ).length;

          details.customPrices = productsWithCustomPrice;

          // Bağlı menü şablonu adını getir
          if (template.menu_template_id) {
            details.linkedMenu = getTemplateName('menu', template.menu_template_id);
            details.linkedMenuId = template.menu_template_id;
          }

          console.log(`${details.items} ürün fiyatı bulundu (${details.customPrices} özel fiyat)`);
        }
      }
      else if (type === templateTypes.INTEGRATION) {
        // Entegrasyon için ekstra bilgiye genelde gerek yok
        details.integrationType = template.type;
        console.log(`Entegrasyon türü: ${details.integrationType}`);
      }

      // Şablon detaylarını state'e kaydet ve kopyalama adımını başlat
      setCopyDetails(details);
      setCopyStep(0);
    } catch (error) {
      console.error("Kopyalama başlatılırken hata:", error);
      toast.error("Kopyalama bilgileri alınamadı");
    } finally {
      setCopyLoading(false);
    }
  };

  // Kopyalama işlemini gerçekleştiren fonksiyon
  const executeTemplateCopy = async () => {
    if (!copyingTemplate || !copyName.trim()) return;

    try {
      setCopyLoading(true);
      let newCopyId = null;

      // Şablon tipine göre farklı kopyalama işlemleri
      if (copyingTemplate.type === templateTypes.MENU) {
        console.log(`Menü şablonu kopyalanıyor... (ID: ${copyingTemplate.id})`);

        // 1. Önce şablonun kendisini kopyala
        const copyResponse = await api.post("/api/templates/menu", {
          name: copyName,
          description: copyingTemplate.description,
          is_active: copyingTemplate.is_active
        });

        newCopyId = copyResponse.data.id;
        console.log(`Yeni menü şablonu oluşturuldu (ID: ${newCopyId})`);

        // 2. Eski şablondaki ürünleri getir
        const productsResponse = await api.get(`/api/templates/menu/${copyingTemplate.id}/products`, {
          params: { onlyTemplateProducts: 'true' }
        });

        const products = productsResponse.data;

        // 3. Ürünleri yeni şablona ekle
        if (products && products.length > 0) {
          console.log(`${products.length} ürün kopyalanıyor...`);

          const productUpdates = products.map(product => ({
            product_id: product.id,
            is_visible: product.is_visible
          }));

          await api.post(`/api/templates/menu/${newCopyId}/products`, {
            products: productUpdates
          });

          console.log(`${products.length} ürün başarıyla kopyalandı`);
        }
      }
      else if (copyingTemplate.type === templateTypes.PRICE) {
        console.log(`Fiyat şablonu kopyalanıyor... (ID: ${copyingTemplate.id})`);

        // 1. Önce şablonun kendisini kopyala
        const copyResponse = await api.post("/api/templates/price", {
          name: copyName,
          description: copyingTemplate.description,
          is_active: copyingTemplate.is_active,
          year: copyingTemplate.year || new Date().getFullYear(),
          // Checkbox'a göre menü şablonunu kopyala veya boş bırak
          menu_template_id: copyDetails.keepMenuLink ? copyingTemplate.menu_template_id : null
        });

        newCopyId = copyResponse.data.id;
        console.log(`Yeni fiyat şablonu oluşturuldu (ID: ${newCopyId})`);

        // 2. Eski şablondaki fiyatları getir
        const priceProductsResponse = await api.get(`/api/templates/price/${copyingTemplate.id}/products`);
        const priceProducts = priceProductsResponse.data;

        // 3. Fiyatları yeni şablona ekle
        if (priceProducts && priceProducts.length > 0) {
          console.log(`${priceProducts.length} ürün fiyatı kopyalanıyor...`);

          const priceUpdates = priceProducts.map(product => ({
            product_id: product.id,
            price: product.template_price || product.price
          }));

          await api.post(`/api/templates/price/${newCopyId}/products`, {
            products: priceUpdates
          });

          console.log(`${priceProducts.length} ürün fiyatı başarıyla kopyalandı`);
        }
      }
      else if (copyingTemplate.type === templateTypes.INTEGRATION) {
        console.log(`Entegrasyon şablonu kopyalanıyor... (ID: ${copyingTemplate.id})`);

        // Entegrasyon şablonunu kopyala
        const copyResponse = await api.post("/api/integrations", {
          name: copyName,
          type: copyingTemplate.type,
          description: copyingTemplate.description,
          is_active: copyingTemplate.is_active,
          config: copyingTemplate.config
        });

        newCopyId = copyResponse.data.id;
        console.log(`Yeni entegrasyon şablonu oluşturuldu (ID: ${newCopyId})`);
      }

      // Kopyalama başarılı, sonraki adıma geç
      console.log(`"${copyName}" şablonu başarıyla oluşturuldu`);
      toast.success(`"${copyName}" şablonu başarıyla oluşturuldu`);
      setCopyStep(2);

    } catch (error) {
      console.error("Şablon kopyalanırken hata:", error);
      let errorMessage = "Şablon kopyalanamadı";

      // API'nin sunduğu hata mesajını göster, yoksa genel hata mesajı
      if (error.response?.data?.error) {
        errorMessage += ": " + error.response.data.error;
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }

      toast.error(errorMessage);
      setCopyStep(0); // Hata durumunda ilk adıma dön
    } finally {
      setCopyLoading(false);
    }
  };

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
          year: template.year || new Date().getFullYear(),
          menu_template_id: template.menu_template_id || ""
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
          year: new Date().getFullYear(),
          menu_template_id: "" // Boş başlar
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

  const handleManagePriceProducts = async (templateId) => {
    setProductLoading(true);
    try {
      const checkTemplate = templates.price.find(t => t.id.toString() === templateId.toString());
      if (!checkTemplate) {
        throw new Error(`ID: ${templateId} ile fiyat şablonu bulunamadı.`);
      }

      console.log("Fiyat şablonu yönetimi başlatılıyor:", checkTemplate.name);

      try {
        const templateResponse = await api.get(`/api/templates/price/${templateId}`);
        const priceTemplate = templateResponse.data;
        console.log("Fiyat şablonu detayları:", priceTemplate);

        if (priceTemplate.menu_template_id) {
          console.log(`Bağlı menü şablonu ID: ${priceTemplate.menu_template_id} için ürünleri getir`);

          try {
            const menuProductsResponse = await api.get(`/api/templates/menu/${priceTemplate.menu_template_id}/products`, {
              params: { onlyTemplateProducts: 'true' }
            });

            const priceProductsResponse = await api.get(`/api/templates/price/${templateId}/products`);

            const menuProducts = menuProductsResponse.data;
            const priceProducts = priceProductsResponse.data;

            console.log(`Menü şablonunda ${menuProducts.length} ürün bulundu, fiyat şablonunda ${priceProducts.length} ürün fiyatı mevcut`);

            const mergedProducts = menuProducts.map(menuProduct => {
              const priceProduct = priceProducts.find(p => p.id === menuProduct.id);
              return {
                ...menuProduct,
                template_price: priceProduct?.template_price || menuProduct.price
              };
            });

            setTemplatePriceProducts(mergedProducts);
          } catch (innerError) {
            console.error("Menü şablonu ürünleri alınırken hata:", innerError);
            // Hata durumunda yine de devam et, normal fiyatları getirmeyi dene
            throw new Error(`Menü şablonu ürünleri alınamadı: ${innerError.message}`);
          }
        } else {
          console.log("Bağlı menü şablonu yok, tüm ürünlerin fiyatlarını getir");
          // Eski davranış: Menü şablonu belirtilmemişse tüm ürünleri getir
          const productsResponse = await api.get(`/api/templates/price/${templateId}/products`);
          setTemplatePriceProducts(productsResponse.data);
        }
      } catch (detailError) {
        console.error("Fiyat şablonu detayları alınırken hata:", detailError);
        // Fiyat şablonu detayları alınamazsa doğrudan fiyat ürünlerini getirmeyi dene
        console.log("Alternatif yöntemle sadece fiyat ürünlerini getiriyorum");
        const fallbackResponse = await api.get(`/api/templates/price/${templateId}/products`);
        setTemplatePriceProducts(fallbackResponse.data);
      }

      // Fiyat yönetim modalını aç
      setCurrentTemplateId(templateId);
      setShowPriceProductsModal(true);
    } catch (error) {
      console.error("Şablon ürün fiyatları yüklenirken hata:", error);
      toast.error(`Fiyat şablonu ürünleri yüklenemedi: ${error.message}`);
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
      // Önce fiyat şablonunu getir (menu_template_id'yi kontrol için)
      const templateResponse = await api.get(`/api/templates/price/${currentTemplateId}`);
      const priceTemplate = templateResponse.data;

      // Excel dosyasını oku
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log("Excel fiyat verisi okundu:", jsonData.slice(0, 3)); // İlk 3 satırı logla

      // Eğer fiyat şablonuna bağlı bir menü şablonu varsa, sadece o menüdeki ürünleri filtrele
      if (priceTemplate.menu_template_id) {
        // Menü şablonundaki ürünleri getir
        const menuProductsResponse = await api.get(`/api/templates/menu/${priceTemplate.menu_template_id}/products`, {
          params: { onlyTemplateProducts: 'true' }
        });

        const menuProducts = menuProductsResponse.data;
        const menuProductNames = menuProducts.map(p => p.name.toLowerCase());

        // JSON verilerini filtrele - sadece menüde olan ürünleri al
        const filteredJsonData = jsonData.filter(item => {
          const productName = item['Ürün Adı']?.toLowerCase();
          return productName && menuProductNames.includes(productName);
        });

        if (filteredJsonData.length === 0) {
          toast.warning(`Excel dosyasında seçili menü şablonundaki ürünler bulunamadı. Lütfen menü şablonunuzla uyumlu bir dosya yükleyin.`);
          setProductLoading(false);
          return;
        }

        // Filtrelenmiş verileri API'ye gönder
        await api.post(`/api/templates/price/${currentTemplateId}/products/batch`, filteredJsonData);

        toast.success(`Fiyat şablonu ürünleri başarıyla içe aktarıldı (${filteredJsonData.length} ürün)`);
      } else {
        // Eski davranış: Tüm ürünler için fiyat güncelle
        await api.post(`/api/templates/price/${currentTemplateId}/products/batch`, jsonData);
        toast.success("Fiyat şablonu ürünleri başarıyla içe aktarıldı");
      }

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

  // Şablon adını getir
  const getTemplateName = (type, id) => {
    if (!id) return "-";
    const template = templates[type]?.find(t => t.id.toString() === id.toString());
    return template ? template.name : "-";
  };

  // Tarihi formatlı göster
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Rastgele arka plan rengi oluştur - menü kartları için
  const getRandomPastelColor = (seed) => {
    // Seed'i sayıya çevir (basit bir hash)
    const hash = String(seed).split('').reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    // Pastel renkler için hue değerleri
    const hues = [15, 30, 55, 80, 140, 180, 200, 220, 260, 300, 340]; // Çeşme Kahvecisi temasına uygun tonlar
    const hue = hues[Math.abs(hash) % hues.length];

    return `hsl(${hue}, 70%, 90%)`;
  };

  // Menü kartı arka plan resmi
  const getMenuCardBackground = (templateName, templateId) => {
    const backgrounds = [
      '/backgrounds/menu-bg-1.jpg',
      '/backgrounds/menu-bg-2.jpg',
      '/backgrounds/menu-bg-3.jpg',
      '/backgrounds/menu-bg-4.jpg'
    ];

    // Template ID'ye göre sabit bir arka plan seç (ID değişmediği sürece aynı arka plan kalır)
    const index = templateId % backgrounds.length;
    return backgrounds[index] || backgrounds[0];
  };

  // Fiyat şablonu arka planı
  const getPriceCardBackground = (templateName, templateId) => {
    const backgrounds = [
      '/backgrounds/price-bg-1.jpg',
      '/backgrounds/price-bg-2.jpg',
      '/backgrounds/price-bg-3.jpg',
      '/backgrounds/price-bg-4.jpg'
    ];

    // Template ID'ye göre sabit bir arka plan seç
    const index = templateId % backgrounds.length;
    return backgrounds[index] || backgrounds[0];
  };

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

            {/* Görünüm modu değiştirme */}
            <div className="flex border rounded-lg overflow-hidden" style={{ borderColor: "rgba(2, 43, 69, 0.2)" }}>
              <button
                onClick={() => handleViewModeChange("grid")}
                className={`px-3 py-2 flex items-center gap-1 ${viewMode === "grid" ? "bg-[#022B45] text-white" : ""}`}
                title="Kart Görünümü"
              >
                <FiGrid size={16} />
                <span className="text-sm">Kart</span>
              </button>
              <button
                onClick={() => handleViewModeChange("table")}
                className={`px-3 py-2 flex items-center gap-1 ${viewMode === "table" ? "bg-[#022B45] text-white" : ""}`}
                title="Liste Görünümü"
              >
                <FiList size={16} />
                <span className="text-sm">Liste</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tablar */}
        <div className="mb-6">
          <Tab.Group selectedIndex={activeTab} onChange={handleTabChange}>
            <Tab.List className="flex space-x-1 rounded-xl p-1" style={{ backgroundColor: theme.light }}>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                  ${selected
                    ? 'bg-white text-[#022B45] shadow-sm'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-[#022B45]'
                  }`
                }
              >
                Menü Şablonları
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                  ${selected
                    ? 'bg-white text-[#022B45] shadow-sm'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-[#022B45]'
                  }`
                }
              >
                Fiyat Şablonları
              </Tab>
              <Tab
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                  ${selected
                    ? 'bg-white text-[#022B45] shadow-sm'
                    : 'text-gray-600 hover:bg-white/[0.12] hover:text-[#022B45]'
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
                ) : viewMode === "grid" ? (
                  // Kart görünümü
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredTemplates(templateTypes.MENU).map(template => (
                      <div
                        key={template.id}
                        className="rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-gray-300 h-[320px] flex flex-col relative group"
                      >
                        {/* Menü Kartı Görünümü */}
                        <div
                          className="h-40 bg-cover bg-center relative flex-shrink-0"
                          style={{
                            backgroundImage: `url(${getMenuCardBackground(template.name, template.id)})`,
                            backgroundColor: getRandomPastelColor(template.id)
                          }}
                        >
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="text-center text-white p-5">
                              <div className="text-2xl font-bold mb-1 shadow-text">MENÜ</div>
                              <div className="text-xl font-semibold mb-2 tracking-wider shadow-text">{template.name}</div>
                              {template.is_active && (
                                <div className="inline-block bg-[#D98A3D] text-white px-3 py-0.5 text-xs rounded-full shadow-sm">
                                  Aktif
                                </div>
                              )}
                            </div>
                          </div>

                          {/* İşlem butonları - hover'da görünür */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitiateCopy(template, templateTypes.MENU);
                              }}
                              className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-[#022B45] transition-colors shadow-sm"
                              title="Şablonu Kopyala"
                            >
                              <FiCopy size={16} />
                            </button>
                            <button
                              onClick={() => handleAddEditTemplate(template, templateTypes.MENU)}
                              className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-[#022B45] transition-colors shadow-sm"
                              title="Düzenle"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: template.id, type: templateTypes.MENU })}
                              className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-red-500 transition-colors shadow-sm"
                              title="Sil"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Menü İçeriği */}
                        <div className="p-5 flex-grow flex flex-col justify-between bg-white">
                          <div className="space-y-3">
                            {template.description && (
                              <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
                            )}

                            <div className="space-y-2">
                              <div className="flex items-center text-sm text-gray-600 gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#F4F7F8] flex items-center justify-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#022B45]"></span>
                                </span>
                                <span>Oluşturulma: {formatDate(template.created_at)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#F4F7F8] flex items-center justify-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#022B45]"></span>
                                </span>
                                <span>Son güncelleme: {formatDate(template.updated_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Ürün yönetimi butonu */}
                          <button
                            onClick={() => handleManageMenuProducts(template.id)}
                            className="mt-3 w-full py-2.5 bg-[#022B45] text-white rounded-lg font-medium hover:bg-[#022B45]/90 transition-colors flex items-center justify-center gap-2"
                          >
                            <FiPackage size={16} />
                            <span>Ürünleri Yönet</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Tablo görünümü
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Şablon Adı
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Açıklama
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Son Güncelleme
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredTemplates(templateTypes.MENU).map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-[#022B45] rounded-full flex items-center justify-center text-white font-bold">
                                  {template.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{template.name}</div>
                                  <div className="text-sm text-gray-500">Menü Şablonu</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900 line-clamp-2">{template.description || "-"}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {template.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(template.updated_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleManageMenuProducts(template.id)}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 p-1.5 rounded transition-colors"
                                  title="Ürünleri Yönet"
                                >
                                  <FiPackage size={16} />
                                </button>
                                <button
                                  onClick={() => handleAddEditTemplate(template, templateTypes.MENU)}
                                  className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 p-1.5 rounded transition-colors"
                                  title="Düzenle"
                                >
                                  <FiEdit2 size={16} />
                                </button>
                                <button
                                  onClick={() => setConfirmDelete({ id: template.id, type: templateTypes.MENU })}
                                  className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 p-1.5 rounded transition-colors"
                                  title="Sil"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                ) : viewMode === "grid" ? (
                  // Kart görünümü
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredTemplates(templateTypes.PRICE).map(template => (
                      <div
                        key={template.id}
                        className="rounded-xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg border border-gray-200 hover:border-gray-300 h-[340px] flex flex-col relative group"
                      >
                        {/* Fiyat Kartı Görünümü */}
                        <div
                          className="h-40 bg-cover bg-center relative flex-shrink-0"
                          style={{
                            backgroundImage: `url(${getPriceCardBackground(template.name, template.id)})`,
                            backgroundColor: getRandomPastelColor(template.id + 100) // Farklı renkler için offset
                          }}
                        >
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="text-center text-white p-5">
                              <div className="text-2xl font-bold mb-1 shadow-text">FİYAT TABLOSU</div>
                              <div className="text-xl font-semibold mb-2 tracking-wider shadow-text">{template.name}</div>
                              <div className="text-sm font-medium mb-1 shadow-text">{template.year || new Date().getFullYear()}</div>
                              {template.is_active && (
                                <div className="inline-block bg-[#D98A3D] text-white px-3 py-0.5 text-xs rounded-full shadow-sm">
                                  Aktif
                                </div>
                              )}
                            </div>
                          </div>

                          {/* İşlem butonları - hover'da görünür */}
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInitiateCopy(template, templateTypes.PRICE);
                              }}
                              className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-[#022B45] transition-colors shadow-sm"
                              title="Şablonu Kopyala"
                            >
                              <FiCopy size={16} />
                            </button>
                            <button
                              onClick={() => handleAddEditTemplate(template, templateTypes.PRICE)}
                              className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-[#022B45] transition-colors shadow-sm"
                              title="Düzenle"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: template.id, type: templateTypes.PRICE })}
                              className="p-1.5 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white text-red-500 transition-colors shadow-sm"
                              title="Sil"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Fiyat Şablonu İçeriği */}
                        <div className="p-5 flex-grow flex flex-col justify-between bg-white h-[200px]">
                          <div className="space-y-3 overflow-hidden flex-grow">
                            {template.description && (
                              <p className="text-sm text-gray-600 line-clamp-2 h-10">{template.description}</p>
                            )}

                            {/* Menü şablonu bağlantısı */}
                            <div className="flex items-center mt-2 p-2 rounded-lg border border-blue-100 bg-blue-50">
                              {template.menu_template_id ? (
                                <div className="flex items-center gap-2 text-sm text-blue-700 truncate">
                                  <FiLink size={14} className="text-blue-500 flex-shrink-0" />
                                  <span className="font-medium">{getTemplateName('menu', template.menu_template_id)}</span>
                                  <span className="text-xs text-blue-500 truncate">menüsüne bağlı</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <MdLinkOff size={14} className="text-gray-400 flex-shrink-0" />
                                  <span>Menü şablonuna bağlı değil</span>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2 hidden sm:block">
                              <div className="flex items-center text-sm text-gray-600 gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#F4F7F8] flex items-center justify-center flex-shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#022B45]"></span>
                                </span>
                                <span>Oluşturulma: {formatDate(template.created_at)}</span>
                              </div>
                              <div className="flex items-center text-sm text-gray-600 gap-2">
                                <span className="w-4 h-4 rounded-full bg-[#F4F7F8] flex items-center justify-center flex-shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#022B45]"></span>
                                </span>
                                <span>Son güncelleme: {formatDate(template.updated_at)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Fiyat yönetimi butonu */}
                          <button
                            onClick={() => handleManagePriceProducts(template.id)}
                            className="mt-3 w-full py-2.5 bg-[#D98A3D] text-white rounded-lg font-medium hover:bg-[#D98A3D]/90 transition-colors flex items-center justify-center gap-2"
                          >
                            <FiSettings size={16} />
                            <span>Fiyatları Yönet</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Tablo görünümü
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Şablon Adı
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Yıl
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Bağlı Menü
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Durum
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Son Güncelleme
                          </th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            İşlemler
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {getFilteredTemplates(templateTypes.PRICE).map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-[#D98A3D] rounded-full flex items-center justify-center text-white font-bold">
                                  {template.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{template.name}</div>
                                  <div className="text-sm text-gray-500">Fiyat Şablonu</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{template.year || new Date().getFullYear()}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {template.menu_template_id ? (
                                <div className="flex items-center text-xs">
                                  <FiLink className="text-blue-500 mr-1" size={14} />
                                  <span className="font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded-full">
                                    {getTemplateName('menu', template.menu_template_id)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-500 flex items-center"><MdLinkOff className="mr-1" size={14} /> Bağlantı yok</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {template.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(template.updated_at)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleManagePriceProducts(template.id)}
                                  className="text-amber-600 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 p-1.5 rounded transition-colors"
                                  title="Fiyatları Yönet"
                                >
                                  <FiSettings size={16} />
                                </button>
                                <button
                                  onClick={() => handleAddEditTemplate(template, templateTypes.PRICE)}
                                  className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 p-1.5 rounded transition-colors"
                                  title="Düzenle"
                                >
                                  <FiEdit2 size={16} />
                                </button>
                                <button
                                  onClick={() => setConfirmDelete({ id: template.id, type: templateTypes.PRICE })}
                                  className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 p-1.5 rounded transition-colors"
                                  title="Sil"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                ) : viewMode === "grid" ? (
                  // Kart görünümü
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredTemplates(templateTypes.INTEGRATION).map(template => (
                      <div
                        key={template.id}
                        className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-gray-300 flex flex-col group relative"
                      >
                        <div className="bg-gray-700 text-white p-4 flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                              {template.type === 'delivery' && '🚚'}
                              {template.type === 'payment' && '💳'}
                              {template.type === 'order' && '📋'}
                              {template.type === 'menu' && '🍽️'}
                              {template.type === 'other' && '🔗'}
                            </div>
                            <div>
                              <h3 className="font-bold">{template.name}</h3>
                              <p className="text-xs text-gray-300 uppercase tracking-wide">
                                {template.type === 'delivery' && 'Teslimat Entegrasyonu'}
                                {template.type === 'payment' && 'Ödeme Entegrasyonu'}
                                {template.type === 'order' && 'Sipariş Entegrasyonu'}
                                {template.type === 'menu' && 'Menü Entegrasyonu'}
                                {template.type === 'other' && 'Diğer Entegrasyon'}
                              </p>
                            </div>
                          </div>

                          {/* İşlem butonları - hover'da görünür */}
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => handleAddEditTemplate(template, templateTypes.INTEGRATION)}
                              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                              title="Düzenle"
                            >
                              <FiEdit2 size={16} />
                            </button>
                            <button
                              onClick={() => setConfirmDelete({ id: template.id, type: templateTypes.INTEGRATION })}
                              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
                              title="Sil"
                            >
                              <FiTrash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-white flex-grow">
                          {template.description && (
                            <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                          )}

                          <div className="space-y-3">
                            {/* API Konfigürasyonu */}
                            <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                              <h4 className="text-xs uppercase text-gray-500 mb-2 font-semibold">Entegrasyon Bilgileri</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {template.config?.api_key && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-500">API Anahtarı</p>
                                    <p className="text-sm font-mono truncate bg-gray-100 p-1 rounded">
                                      {template.config.api_key.substring(0, 8)}...
                                    </p>
                                  </div>
                                )}

                                {template.config?.endpoint && (
                                  <div className="col-span-2">
                                    <p className="text-xs text-gray-500">Endpoint</p>
                                    <p className="text-sm font-mono truncate bg-gray-100 p-1 rounded">
                                      {template.config.endpoint}
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-sm pt-2 border-t">
                              <span className="text-gray-500">Durum</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {template.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Tablo görünümü
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Entegrasyon Adı
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tip
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Endpoint
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
                        {getFilteredTemplates(templateTypes.INTEGRATION).map((template) => (
                          <tr key={template.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 bg-gray-700 text-white rounded-full flex items-center justify-center text-lg">
                                  {template.type === 'delivery' && '🚚'}
                                  {template.type === 'payment' && '💳'}
                                  {template.type === 'order' && '📋'}
                                  {template.type === 'menu' && '🍽️'}
                                  {template.type === 'other' && '🔗'}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{template.name}</div>
                                  <div className="text-sm text-gray-500 truncate max-w-xs">{template.description || "Açıklama yok"}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
                                {template.type === 'delivery' && 'Teslimat'}
                                {template.type === 'payment' && 'Ödeme'}
                                {template.type === 'order' && 'Sipariş'}
                                {template.type === 'menu' && 'Menü'}
                                {template.type === 'other' && 'Diğer'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              {template.config?.endpoint ? (
                                <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded truncate max-w-xs inline-block">
                                  {template.config.endpoint}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {template.is_active ? 'Aktif' : 'Pasif'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleInitiateCopy(template, templateTypes.INTEGRATION);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 bg-blue-100 hover:bg-blue-200 p-1.5 rounded transition-colors"
                                  title="Şablonu Kopyala"
                                >
                                  <FiCopy size={16} />
                                </button>
                                <button
                                  onClick={() => handleAddEditTemplate(template, templateTypes.INTEGRATION)}
                                  className="text-indigo-600 hover:text-indigo-900 bg-indigo-100 hover:bg-indigo-200 p-1.5 rounded transition-colors"
                                  title="Düzenle"
                                >
                                  <FiEdit2 size={16} />
                                </button>
                                <button
                                  onClick={() => setConfirmDelete({ id: template.id, type: templateTypes.INTEGRATION })}
                                  className="text-red-600 hover:text-red-900 bg-red-100 hover:bg-red-200 p-1.5 rounded transition-colors"
                                  title="Sil"
                                >
                                  <FiTrash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                {currentType === templateTypes.MENU ? (
                  /* Menü Şablonu Formu */
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
                        value={menuForm.name}
                        onChange={handleMenuFormChange}
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
                        Açıklama
                      </label>
                      <textarea
                        name="description"
                        value={menuForm.description}
                        onChange={handleMenuFormChange}
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
                          checked={menuForm.is_active}
                          onChange={handleMenuFormChange}
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
                ) : (
                  /* Fiyat Şablonu Formu */
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
                        value={priceForm.name}
                        onChange={handlePriceFormChange}
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
                        Menü Şablonu
                      </label>
                      <select
                        name="menu_template_id"
                        value={priceForm.menu_template_id}
                        onChange={handlePriceFormChange}
                        className="w-full p-2 border rounded-lg focus:outline-none"
                        style={{ borderColor: theme.secondary }}
                      >
                        <option value="">Şablon Seçin</option>
                        {templates.menu.map(template => (
                          <option key={template.id} value={template.id}>{template.name}</option>
                        ))}
                      </select>

                      {priceForm.menu_template_id && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <h4 className="text-sm font-medium text-blue-700 mb-1">
                            {getTemplateName('menu', priceForm.menu_template_id)}
                          </h4>
                          <p className="text-xs text-blue-600">
                            Bu menü şablonundaki ürünler için fiyat belirleyebileceksiniz.
                          </p>
                        </div>
                      )}
                    </div>

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

                    <div>
                      <label
                        className="block text-sm font-medium mb-1"
                        style={{ color: theme.primary }}
                      >
                        Açıklama
                      </label>
                      <textarea
                        name="description"
                        value={priceForm.description}
                        onChange={handlePriceFormChange}
                        rows="3"
                        className="w-full p-2 border rounded-lg focus:outline-none"
                        style={{ borderColor: theme.secondary }}
                      ></textarea>
                    </div>

                    <div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="price_is_active"
                          name="is_active"
                          checked={priceForm.is_active}
                          onChange={handlePriceFormChange}
                          className="h-4 w-4 rounded focus:ring-0 border-2"
                          style={{
                            borderColor: theme.secondary,
                            accentColor: theme.accent
                          }}
                        />
                        <label
                          htmlFor="price_is_active"
                          className="ml-2 text-sm font-medium"
                          style={{ color: theme.primary }}
                        >
                          Şablon aktif
                        </label>
                      </div>
                    </div>
                  </div>
                )}

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
                {/* Excel Import/Export Butonları ve Tüm Ürünleri Göster Checkbox'ı */}
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

                  {/* Sistemdeki tüm ürünleri göster checkbox'ı */}
                  <div className="flex items-center ml-4">
                    <input
                      type="checkbox"
                      id="showAllProducts"
                      checked={showAllProducts}
                      onChange={(e) => {
                        setShowAllProducts(e.target.checked);
                        // Checkbox değiştiğinde ürünleri yeniden getir
                        handleRefreshProducts(currentTemplateId, e.target.checked);
                      }}
                      className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="showAllProducts" className="ml-2 text-sm text-gray-700">
                      Sistemdeki tüm ürünleri göster
                    </label>
                  </div>
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

                {/* Tümünü Görünür Yap Butonu - Tablodan sonra ayrı bir kontrol olarak */}
                {filteredTemplateProducts.length > 0 && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleMakeAllVisible}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      <FiEye className="inline mr-2" size={16} />
                      Tümünü Görünür Yap
                    </button>
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
                    {showAllProducts && " Şu anda sistemdeki tüm ürünleri görüntülüyorsunuz."}
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
                  {/* Menü şablonu bilgisi */}
                  {templates.price.find(t => t.id === currentTemplateId)?.menu_template_id && (
                    <div className="mb-4 flex items-center gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <FiLink className="text-blue-600" size={20} />
                      <div>
                        <p className="text-blue-700 font-medium">
                          Bu fiyat şablonu {getTemplateName('menu', templates.price.find(t => t.id === currentTemplateId)?.menu_template_id)} şablonuna bağlı
                        </p>
                        <p className="text-sm text-blue-600">
                          Sadece bu menü şablonunda bulunan ürünler listelenmektedir
                        </p>
                      </div>
                    </div>
                  )}

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
                      {templates.price.find(t => t.id === currentTemplateId)?.menu_template_id
                        ? `Bu fiyat şablonu, seçili "${getTemplateName('menu', templates.price.find(t => t.id === currentTemplateId)?.menu_template_id)}" menü şablonundaki ürünler için fiyat belirlemenizi sağlar.`
                        : "Fiyat şablonunu bir menü şablonuna bağlarsanız, sadece o menüdeki ürünler için fiyat belirleyebilirsiniz. Bu sayede daha kontrollü fiyatlandırma yapabilirsiniz."
                      }
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

        {/* Şablon Kopyalama Modalı */}
        {copyingTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div
              className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-y-auto"
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
                  {copyingTemplate.type === templateTypes.MENU ? "Menü Şablonunu Kopyala" :
                    copyingTemplate.type === templateTypes.PRICE ? "Fiyat Şablonunu Kopyala" :
                      "Entegrasyon Şablonunu Kopyala"}
                </h3>
                <button
                  onClick={() => {
                    setCopyingTemplate(null);
                    setCopyStep(0);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              {/* Adım 1: Kopyalama Bilgileri ve İsim Belirleme */}
              {copyStep === 0 && (
                <div className="p-6">
                  {/* Kopyalanacak şablonun bilgileri */}
                  <div className="mb-6 bg-[#F4F7F8] p-4 rounded-lg">
                    <h4 className="font-medium text-[#022B45] mb-2">Kopyalanacak Şablon</h4>
                    <p className="text-[#495057] font-bold">{copyingTemplate.name}</p>

                    {copyDetails && (
                      <div className="mt-3 text-sm text-[#495057]">
                        {copyDetails.items > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#D98A3D]" fill="currentColor">
                              <path d="M9,10V12H7V10H9M13,10V12H11V10H13M17,10V12H15V10H17M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5A2,2 0 0,1 5,3H6V1H8V3H16V1H18V3H19M19,19V8H5V19H19M9,14V16H7V14H9M13,14V16H11V14H13M17,14V16H15V14H17Z" />
                            </svg>
                            <span>{copyDetails.items} ürün</span>
                          </div>
                        )}

                        {copyDetails.categories?.size > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#D98A3D]" fill="currentColor">
                              <path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" />
                            </svg>
                            <span>{copyDetails.categories.size} kategori</span>
                          </div>
                        )}

                        {copyDetails.customPrices > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#D98A3D]" fill="currentColor">
                              <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z" />
                            </svg>
                            <span>{copyDetails.customPrices} özel fiyat</span>
                          </div>
                        )}

                        {copyDetails.linkedMenu && (
                          <div className="flex items-center gap-2 mb-1">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#D98A3D]" fill="currentColor">
                              <path d="M3.9,12C3.9,10.29 5.29,8.9 7,8.9H11V7H7A5,5 0 0,0 2,12A5,5 0 0,0 7,17H11V15.1H7C5.29,15.1 3.9,13.71 3.9,12M8,13H16V11H8V13M17,7H13V8.9H17C18.71,8.9 20.1,10.29 20.1,12C20.1,13.71 18.71,15.1 17,15.1H13V17H17A5,5 0 0,0 22,12A5,5 0 0,0 17,7Z" />
                            </svg>
                            <span>Bağlı menü: {copyDetails.linkedMenu}</span>
                          </div>
                        )}

                        {copyDetails.integrationType && (
                          <div className="flex items-center gap-2 mb-1">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-[#D98A3D]" fill="currentColor">
                              <path d="M12,3C7.58,3 4,4.79 4,7V17C4,19.21 7.59,21 12,21C16.41,21 20,19.21 20,17V7C20,4.79 16.42,3 12,3M18,17C18,17.5 15.87,19 12,19C8.13,19 6,17.5 6,17V14.77C7.61,15.55 9.72,16 12,16C14.28,16 16.39,15.55 18,14.77V17M18,12.45C16.7,13.4 14.42,14 12,14C9.58,14 7.3,13.4 6,12.45V9.64C7.47,10.47 9.61,11 12,11C14.39,11 16.53,10.47 18,9.64V12.45M12,9C8.13,9 6,7.5 6,7C6,6.5 8.13,5 12,5C15.87,5 18,6.5 18,7C18,7.5 15.87,9 12,9Z" />
                            </svg>
                            <span>
                              Entegrasyon tipi:
                              {copyDetails.integrationType === 'delivery' && ' Teslimat'}
                              {copyDetails.integrationType === 'payment' && ' Ödeme'}
                              {copyDetails.integrationType === 'order' && ' Sipariş'}
                              {copyDetails.integrationType === 'menu' && ' Menü'}
                              {copyDetails.integrationType === 'other' && ' Diğer'}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Yeni şablon adı giriş alanı */}
                  <div className="mb-4">
                    <label
                      className="block text-sm font-medium mb-1"
                      style={{ color: theme.primary }}
                    >
                      Yeni Şablon Adı *
                    </label>
                    <input
                      type="text"
                      value={copyName}
                      onChange={(e) => setCopyName(e.target.value)}
                      className="w-full p-2 border rounded-lg focus:outline-none"
                      style={{ borderColor: theme.secondary }}
                      placeholder="Örn: Yaz Menüsü 2025"
                      required
                    />

                    {copyingTemplate.type === templateTypes.PRICE && (
                      <div className="mt-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!copyDetails.keepMenuLink}
                            onChange={(e) => {
                              setCopyDetails({
                                ...copyDetails,
                                keepMenuLink: e.target.checked
                              });
                            }}
                            className="mr-2 h-4 w-4"
                            style={{ accentColor: theme.accent }}
                          />
                          <span className="text-sm text-gray-700">
                            Menü şablonu bağlantısını koru {copyDetails.linkedMenu ? `(${copyDetails.linkedMenu})` : ''}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Bilgilendirme kutusu */}
                  <div className="bg-blue-50 p-4 rounded-lg mb-6">
                    <div className="flex gap-3 mb-2">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <FiInfo size={20} className="text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-blue-700">Neler Kopyalanacak?</h4>
                        <p className="text-sm text-blue-600 mt-1">
                          {copyingTemplate.type === templateTypes.MENU ? (
                            "Menü şablonundaki tüm ürünler ve görünürlük ayarları yeni oluşturacağınız şablona kopyalanacaktır."
                          ) : copyingTemplate.type === templateTypes.PRICE ? (
                            "Fiyat şablonundaki tüm ürün fiyatları yeni şablona aktarılacaktır. " +
                            (copyDetails.linkedMenu ? "Menü şablonu bağlantısını korumayı seçerseniz, yeni fiyat şablonu da aynı menü şablonuna bağlı olacaktır." : "")
                          ) : (
                            "Entegrasyon ayarları ve bağlantı bilgileri aynı kalacak şekilde yeni bir entegrasyon şablonu oluşturulacaktır."
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Butonlar */}
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCopyingTemplate(null);
                        setCopyStep(0);
                      }}
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
                      onClick={() => setCopyStep(1)}
                      disabled={!copyName.trim() || copyLoading}
                      className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: theme.accent,
                        fontWeight: 600,
                        boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)",
                        opacity: !copyName.trim() || copyLoading ? 0.7 : 1
                      }}
                    >
                      <span>Devam Et</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Adım 2: Onay */}
              {copyStep === 1 && (
                <div className="p-6">
                  <div className="bg-green-50 p-4 rounded-lg mb-6">
                    <div className="flex gap-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <FiCheck size={20} className="text-green-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-green-700">Onay</h4>
                        <p className="text-sm text-green-600 mt-1">
                          "{copyingTemplate.name}" isimli şablonu "{copyName}" adıyla kopyalamak üzeresiniz. Bu işlem sonucunda kaynak şablonu etkilenmeden yeni bir şablon oluşturulacaktır.
                        </p>

                        {copyDetails && copyDetails.items > 0 && (
                          <ul className="mt-2 text-sm text-green-600 list-disc pl-5">
                            {copyingTemplate.type === templateTypes.MENU && (
                              <>
                                <li>{copyDetails.items} ürün kopyalanacak</li>
                                {copyDetails.categories?.size > 0 && (
                                  <li>{copyDetails.categories.size} kategoriden ürünler içerecek</li>
                                )}
                              </>
                            )}

                            {copyingTemplate.type === templateTypes.PRICE && (
                              <>
                                <li>{copyDetails.items} ürün fiyatı kopyalanacak</li>
                                {copyDetails.customPrices > 0 && (
                                  <li>{copyDetails.customPrices} özel fiyat ayarı korunacak</li>
                                )}
                                {copyDetails.linkedMenu && copyDetails.keepMenuLink && (
                                  <li>"{copyDetails.linkedMenu}" menü şablonu bağlantısı korunacak</li>
                                )}
                              </>
                            )}

                            {copyingTemplate.type === templateTypes.INTEGRATION && (
                              <li>
                                Entegrasyon türü ve ayarları aynen kopyalanacak
                              </li>
                            )}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setCopyStep(0)}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: theme.secondary,
                        color: theme.primary,
                        fontWeight: 600
                      }}
                    >
                      Geri
                    </button>
                    <button
                      onClick={executeTemplateCopy}
                      disabled={copyLoading}
                      className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: theme.accent,
                        fontWeight: 600,
                        boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)",
                        opacity: copyLoading ? 0.7 : 1
                      }}
                    >
                      {copyLoading ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          <span>İşleniyor...</span>
                        </>
                      ) : (
                        <>
                          <FiCopy size={16} />
                          <span>Kopyala</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Adım 3: Sonuç */}
              {copyStep === 2 && (
                <div className="p-6">
                  <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <FiCheck size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-green-700 mb-2">Kopyalama Başarılı!</h3>
                    <p className="text-gray-600">
                      "{copyName}" isimli yeni şablonunuz başarıyla oluşturuldu.
                    </p>
                  </div>

                  <div className="flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setCopyingTemplate(null);
                        setCopyStep(0);
                        fetchTemplates(); // Şablonları yenile
                      }}
                      className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                      style={{
                        borderColor: theme.secondary,
                        color: theme.primary,
                        fontWeight: 600
                      }}
                    >
                      Kapat
                    </button>
                    <button
                      onClick={() => {
                        // Yeni oluşturulan şablonu düzenleme modunda aç
                        const newTemplateType = copyingTemplate.type;
                        setCopyingTemplate(null);
                        setCopyStep(0);

                        // API'den yeni şablonu bul ve düzenleme modalını aç
                        fetchTemplates().then(() => {
                          // Son eklenen şablonu bul
                          setTimeout(() => {
                            const newTemplate = templates[newTemplateType].find(t => t.name === copyName);
                            if (newTemplate) {
                              handleAddEditTemplate(newTemplate, newTemplateType);
                            }
                          }, 300);
                        });
                      }}
                      className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
                      style={{
                        backgroundColor: theme.primary,
                        fontWeight: 600
                      }}
                    >
                      <FiEdit2 size={16} />
                      <span>Yeni Şablonu Düzenle</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="bg-blue-50 p-4 rounded-lg mt-6 border border-blue-100">
          <div className="flex gap-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <FiInfo size={20} className="text-blue-600" />
            </div>
            <div>
              <h4 className="font-medium text-blue-700">Şablon Kopyalama Özelliği</h4>
              <p className="text-sm text-blue-600 mt-1">
                Mevcut şablonlarınızı kopyalayarak yeni şablonlar oluşturabilirsiniz.
                Örneğin, mevsimsel menüler, fiyat değişiklikleri veya yeni şubeler için
                mevcut bir şablonu temel alarak hızlıca yeni versiyonlar oluşturabilirsiniz.
              </p>
              <p className="text-sm text-blue-600 mt-2">
                Kopyalama yapmak için şablonun yanındaki <FiCopy size={14} className="inline" /> kopyala butonunu kullanın.
              </p>
            </div>
          </div>
        </div>

        {/* Çeşme Kahvecisi font ailesi için */}
        <style>
          {`
            @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&display=swap');
            
            /* Menu Card Shadow Text class */
            .shadow-text {
              text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
            }
          `}
        </style>
      </div>
    </div>
  );
};

export default EnhancedTemplateManager;