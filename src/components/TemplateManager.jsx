import { useState, useEffect, useRef } from "react";
import {
  FiEdit2, FiTrash2, FiPlus, FiInfo, FiSettings, FiCheck,
  FiX, FiUpload, FiDownload, FiEye, FiEyeOff, FiPackage, FiCopy,
  FiGrid, FiList, FiChevronDown, FiChevronRight, FiLink
} from "react-icons/fi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import { MdLinkOff } from 'react-icons/md';
import React from "react";
import api from "../lib/axios";
import toast from "react-hot-toast";
import { Tab } from '@headlessui/react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

// Yeni modal bileşenleri import
import ProductModal from "./modals/ProductModal";
import TemplateModal from "./modals/TemplateModal";
import CopyModal from "./modals/CopyModal";
import ConfirmModal from "./modals/ConfirmModal";
import LinkTemplateModal from "./modals/LinkTemplateModal";
import ProductsListModal from "./modals/ProductsListModal";

// Zustand store import
import useModalStore from "../stores/modalStore";

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
  // Zustand modal store'dan gerekli durumları al
  const { 
    modals, 
    openModal, 
    closeModal, 
    currentTemplate, 
    currentTemplateType, 
    currentTemplateId,
    setModalState 
  } = useModalStore();
  
  // Eski state'leri kaldırdık ve Zustand ile değiştirdik:
  const [searchTerm, setSearchTerm] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmDeleteType, setConfirmDeleteType] = useState(null);
  const [currentPriceTemplate, setCurrentPriceTemplate] = useState(null);

  // Görünüm Modu
  const [viewMode, setViewMode] = useState("grid"); // "grid" veya "table"

  // Ürün Yönetimi
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showPriceProductsModal, setShowPriceProductsModal] = useState(false);
  // currentTemplateId zaten Zustand'dan alınıyor, tekrar tanımlamaya gerek yok
  const [templateProducts, setTemplateProducts] = useState([]);
  const [templatePriceProducts, setTemplatePriceProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productFilter, setProductFilter] = useState("");
  const [productCategoryFilter, setProductCategoryFilter] = useState("");
  const [productLoading, setProductLoading] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Yeni ürün ekleme modalını aç - Zustand ile güncellendi
  const handleAddProductClick = () => {
    openModal('productModal', {
      editingProduct: null
    });
  };
  
  // Ürün düzenleme modalını aç - Zustand ile güncellendi
  const handleEditProductClick = (product) => {
    openModal('productModal', {
      editingProduct: product
    });
  };

  // Kategori bazlı görünürlük ayarları için yeni state
  const [expandedCategories, setExpandedCategories] = useState([]);

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

  // Şablon kopyalama ile ilgili state
  const [copyingTemplate, setCopyingTemplate] = useState(null);
  const [copyName, setCopyName] = useState("");
  const [copyDetails, setCopyDetails] = useState(null);
  const [copyLoading, setCopyLoading] = useState(false);
  const [copyStep, setCopyStep] = useState(0);
  const [newTemplateInfo, setNewTemplateInfo] = useState(null);
  const [copyResults, setCopyResults] = useState(null);
  // LocalStorage'dan görünüm tercihini yükle
  useEffect(() => {
    const savedViewMode = localStorage.getItem('templateManagerViewMode');
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // Seçili ürünler değiştiğinde sabit çubuğu göster/gizle
  useEffect(() => {
    const fixedBar = document.getElementById('fixed-action-bar');
    if (fixedBar) {
      if (selectedProducts.length > 0) {
        fixedBar.classList.remove('hidden');
        fixedBar.classList.add('flex');
      } else {
        fixedBar.classList.add('hidden');
        fixedBar.classList.remove('flex');
      }
    }

    // Eğer sayfadan ayrılırken seçim varsa temizle
    return () => {
      if (selectedProducts.length > 0) {
        setSelectedProducts([]);
      }
    };
  }, [selectedProducts]);

  // Görünüm tercihini kaydet
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('templateManagerViewMode', mode);
    
    // Tercih değiştiğinde CSS sınıflarını da güncelle
    const container = document.getElementById('templates-container');
    if (container) {
      if (mode === 'grid') {
        container.classList.remove('template-list-view');
        container.classList.add('template-grid-view');
      } else {
        container.classList.remove('template-grid-view');
        container.classList.add('template-list-view');
      }
    }
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

  // Kategori açılıp kapanmasını kontrol eder
  const toggleCategoryExpand = (categoryId) => {
    if (expandedCategories.includes(categoryId)) {
      setExpandedCategories(expandedCategories.filter(id => id !== categoryId));
    } else {
      setExpandedCategories([...expandedCategories, categoryId]);
    }
  };

  // Kategori bazlı görünürlük değiştirme
  const handleCategoryVisibilityToggle = async (categoryId, makeVisible, e) => {
    // Event propagasyonunu durdur
    if (e) {
      e.stopPropagation();
    }

    try {
      // Bu kategorideki tüm ürünleri bul
      const categoryProducts = templateProducts.filter(
        product => product.category_id?.toString() === categoryId.toString()
      );

      if (categoryProducts.length === 0) {
        toast.warning("Bu kategoride ürün bulunamadı");
        return;
      }

      // Ürün ID'lerini topla
      const productIds = categoryProducts.map(product => product.id);

      // API için istek hazırla
      const productUpdates = productIds.map(productId => ({
        product_id: productId,
        is_visible: makeVisible
      }));

      // Toplu güncelleme isteği gönder
      await api.post(`/api/templates/menu/${currentTemplateId}/products`, {
        products: productUpdates
      });

      // Sadece yerel state'i güncelle - ÖNEMLİ: Tüm state'i YENİLEME, sadece ilgili kategoriyi güncelle
      setTemplateProducts(prevProducts =>
        prevProducts.map(product => {
          if (product.category_id?.toString() === categoryId.toString()) {
            return { ...product, is_visible: makeVisible };
          }
          return product;
        })
      );

      toast.success(`${categoryProducts.length} ürünün görünürlüğü değiştirildi`);
    } catch (error) {
      console.error("Kategori görünürlüğü güncellenirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };
  // Şablonun adını ID'ye göre bul
  const getTemplateName = (type, id) => {
    if (!templates[type] || !id) return null;
    const template = templates[type].find(t => t.id === id);
    return template ? template.name : null;
  };
  
  const handleInitiateCopy = async (template, type) => {
    try {
      setCopyLoading(true);
      setCopyingTemplate({ ...template, type });
      setCopyName(`${template.name} - Kopya`);

      // Daha detaylı bilgiler topla
      let details = {
        items: 0,
        categories: new Set(),
        lastUpdated: template.updated_at,
        customFields: []
      };

      if (type === templateTypes.MENU) {
        const productsResponse = await api.get(`/api/templates/menu/${template.id}/products`, {
          params: { onlyTemplateProducts: 'true' }
        });

        if (productsResponse?.data) {
          const products = productsResponse.data;

          details.items = products.length;

          const categories = new Set();
          const categoryStats = {};

          products.forEach(p => {
            if (p.category_name) {
              categories.add(p.category_name);

              if (!categoryStats[p.category_name]) {
                categoryStats[p.category_name] = 0;
              }
              categoryStats[p.category_name]++;
            }
          });

          details.categories = categories;
          details.categoryStats = categoryStats;

          details.visibleItems = products.filter(p => p.is_visible).length;

          details.topCategories = Object.entries(categoryStats)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([name, count]) => ({ name, count }));
        }
      }
      else if (type === templateTypes.PRICE) {
        const priceResponse = await api.get(`/api/templates/price/${template.id}/products`);

        if (priceResponse?.data) {
          const priceProducts = priceResponse.data;
          details.items = priceProducts.length;

          const customPriceProducts = priceProducts.filter(p =>
            p.template_price && p.template_price !== p.price
          );

          details.customPrices = customPriceProducts.length;

          if (customPriceProducts.length > 0) {
            let totalPriceChange = 0;
            let priceChanges = {
              increased: 0,
              decreased: 0,
              same: 0
            };

            customPriceProducts.forEach(p => {
              const originalPrice = p.price || 0;
              const templatePrice = p.template_price || 0;
              const diff = templatePrice - originalPrice;

              totalPriceChange += diff;

              if (diff > 0) priceChanges.increased++;
              else if (diff < 0) priceChanges.decreased++;
              else priceChanges.same++;
            });

            details.priceChanges = priceChanges;
            details.avgPriceChange = totalPriceChange / customPriceProducts.length;
          }

          if (template.menu_template_id) {
            details.linkedMenu = getTemplateName('menu', template.menu_template_id);
            details.linkedMenuId = template.menu_template_id;
            details.keepMenuLink = true;
          }
        }
      }

      setCopyDetails(details);
      setCopyStep(0);
      // Modal'ı aç
      openModal('copyModal');
    } catch (error) {
      console.error("Kopyalama başlatılırken hata:", error);
      toast.error("Kopyalama bilgileri alınamadı");
    } finally {
      setCopyLoading(false);
    }
  };

  // Ürün seçimini açıp kapatan fonksiyon
  const toggleProductSelection = (productId, e) => {
    // Event gelirse önce propagasyonu durdur
    if (e) {
      e.stopPropagation();
    }

    // Seçimi güncelle
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Seçili ürünleri görünür yapma fonksiyonu
  const makeSelectedProductsVisible = async () => {
    try {
      if (selectedProducts.length === 0) {
        toast.warning("Lütfen önce ürün seçin");
        return;
      }

      const productUpdates = selectedProducts.map(productId => ({
        product_id: productId,
        is_visible: true
      }));

      // Toplu güncelleme isteği gönder
      await api.post(`/api/templates/menu/${currentTemplateId}/products`, {
        products: productUpdates
      });

      // Yerel state'i güncelle
      setTemplateProducts(prevProducts =>
        prevProducts.map(product =>
          selectedProducts.includes(product.id)
            ? { ...product, is_visible: true }
            : product
        )
      );

      toast.success(`${selectedProducts.length} ürün görünür yapıldı`);
      setSelectedProducts([]); // Seçimi temizle

    } catch (error) {
      console.error("Ürünler güncellenirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };
  // Seçili ürünleri görünmez yapma fonksiyonu - Düzeltilmiş
  const makeSelectedProductsInvisible = async () => {
    try {
      if (selectedProducts.length === 0) {
        toast.warning("Lütfen önce ürün seçin");
        return;
      }

      const productUpdates = selectedProducts.map(productId => ({
        product_id: productId,
        is_visible: false
      }));

      // Toplu güncelleme isteği gönder
      await api.post(`/api/templates/menu/${currentTemplateId}/products`, {
        products: productUpdates
      });

      // Yerel state'i güncelle
      setTemplateProducts(prevProducts =>
        prevProducts.map(product =>
          selectedProducts.includes(product.id)
            ? { ...product, is_visible: false }
            : product
        )
      );

      toast.success(`${selectedProducts.length} ürün gizlendi`);
      setSelectedProducts([]); // Seçimi temizle

    } catch (error) {
      console.error("Ürünler güncellenirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Şablon bağlantılarını güncelleme
  const handleUpdateTemplateLink = async (priceTemplateId, menuTemplateId) => {
    try {
      if (!priceTemplateId) return;
      
      // API'ye gönderilecek veriyi hazırla
      const payload = {
        menu_template_id: menuTemplateId
      };
      
      // API'ye istek gönder
      await api.put(`/api/templates/price/${priceTemplateId}`, payload);
      
      // Yerel state'i güncelle
      setTemplates(prev => {
        const updatedTemplates = { ...prev };
        const templateIndex = updatedTemplates[templateTypes.PRICE].findIndex(t => t.id === priceTemplateId);
        
        if (templateIndex !== -1) {
          updatedTemplates[templateTypes.PRICE][templateIndex] = {
            ...updatedTemplates[templateTypes.PRICE][templateIndex],
            menu_template_id: menuTemplateId
          };
        }
        
        return updatedTemplates;
      });
      
      // Bildirim göster
      if (menuTemplateId) {
        const menuTemplateName = getTemplateName('menu', menuTemplateId);
        toast.success(`"${menuTemplateName || 'Menü şablonu'}" ile bağlantı kuruldu`);
      } else {
        toast.info("Menü şablonu bağlantısı kaldırıldı");
      }
      
    } catch (error) {
      console.error("Şablon bağlantısı güncellenirken hata:", error);
      toast.error("Bağlantı güncellenemedi");
    }
  };
  
  // Excel'e veri dışa aktarma fonksiyonu
  const handleExportToExcel = async (templateId, type) => {
    try {
      let endpoint = '';
      let fileName = '';
      let sheetName = '';
      
      if (type === templateTypes.MENU) {
        endpoint = `/api/templates/menu/${templateId}/products`;
        fileName = 'menu_template_products.xlsx';
        sheetName = 'Menü Ürünleri';
      } 
      else if (type === templateTypes.PRICE) {
        endpoint = `/api/templates/price/${templateId}/products`;
        fileName = 'price_template_products.xlsx';
        sheetName = 'Fiyat Listesi';
      }
      else {
        toast.error("Bu şablon türü Excel dışa aktarmayı desteklemiyor");
        return;
      }
      
      // İlgili verileri getir
      const response = await api.get(endpoint);
      
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        toast.error("Dışa aktarılacak veri bulunamadı");
        return;
      }
      
      // Excel dosyası oluşturma
      const products = response.data;
      
      // Excel formatına uygun veri hazırlama
      const excelData = products.map(product => {
        // Ortak alanlar
        const data = {
          'ID': product.id,
          'Ürün Adı': product.name,
          'Açıklama': product.description || '',
          'Kategori': product.category_name || '',
          'Görsel URL': product.image_url || ''
        };
        
        // Şablon tipine göre ek veri alanları
        if (type === templateTypes.MENU) {
          data['Görünür'] = product.is_visible ? 'Evet' : 'Hayır';
          data['Fiyat'] = product.price || 0;
        }
        else if (type === templateTypes.PRICE) {
          data['Ürün Fiyatı'] = product.price || 0;
          data['Şablon Fiyatı'] = product.template_price || product.price || 0;
        }
        
        return data;
      });
      
      // Excel çalışma kitabı oluştur
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Excel dosyasını indirme
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
      
      toast.success("Excel dosyası başarıyla oluşturuldu");
      
    } catch (error) {
      console.error("Excel dışa aktarma hatası:", error);
      toast.error("Excel dışa aktarma işlemi başarısız oldu");
    }
  };
  
  // Excel'den veri içe aktarma fonksiyonu - GÜNCELLENDİ
  const handleImportFromExcel = async (event, templateId, type) => {
    try {
      const file = event.target.files[0];
      
      if (!file) {
        toast.error("Lütfen bir Excel dosyası seçin");
        return;
      }

      toast.loading("Excel dosyası işleniyor...");
      
      // Dosyayı oku
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // İlk sayfayı al
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // JSON verisine dönüştür
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          if (!jsonData || jsonData.length === 0) {
            toast.dismiss();
            toast.error("Excel dosyasında veri bulunamadı");
            return;
          }

          console.log("Excel'den okunan ham veri:", jsonData);
          
          if (type === templateTypes.MENU) {
            // MODE 1: Yeni ürün ekleme (excel'de ID olmayan ürünler olduğunda)
            if (jsonData.some(row => !row['ID'] && !row['id'] && !row['Ürün ID'] && (row['Ürün Adı'] || row['Ürün']))) {
              console.log("Yeni ürün ekleme modu tespit edildi");
              // Format data for API - Import endpoint'i kullan
              const productsData = jsonData
                .filter(item => {
                  const name = item['Ürün Adı'] || item['Ürün'] || item['Name'] || item['Product Name'];
                  const category = item['Kategori'] || item['Category'] || item['Kategori Adı'] || item['Category Name'];
                  return name && category;
                })
                .map(item => {
                  const name = item['Ürün Adı'] || item['Ürün'] || item['Name'] || item['Product Name'];
                  const category = item['Kategori'] || item['Category'] || item['Kategori Adı'] || item['Category Name'];
                  const price = parseFloat(item['Fiyat'] || item['Price'] || 0);
                  const isVisible = item['Görünür'] === 'Evet' || item['Visible'] === 'Yes' || item['Görünür'] === true;
                  const description = item['Açıklama'] || item['Description'] || '';
                  const imageUrl = item['Görsel URL'] || item['Image URL'] || item['Image'] || '';
                  
                  return {
                    name,
                    category, // Önemli: API category (category_name değil) bekliyor
                    price,
                    stock_count: 100,
                    is_visible: isVisible,
                    description,
                    image_url: imageUrl
                  };
                });
              
              if (productsData.length === 0) {
                toast.dismiss();
                toast.error("İçe aktarılacak geçerli ürün bulunamadı");
                return;
              }
              
              console.log("API'ye gönderilecek ürün verileri:", productsData);
              
              // Şablon ve alt departman ID'sini bul
              let branchId = 1; // Varsayılan şube ID'si
              
              try {
                // Menü şablonunun hangi şubeye ait olduğunu bul
                const templateResponse = await api.get(`/api/templates/menu/${templateId}`);
                if (templateResponse.data && templateResponse.data.branch_id) {
                  branchId = templateResponse.data.branch_id;
                  console.log(`Şablon için şube ID'si bulundu: ${branchId}`);
                }
              } catch (error) {
                console.warn("Şube ID'si bulunamadı, varsayılan ID kullanılıyor:", error);
              }
              
              // Import endpoint'ine istek gönder
              const importResponse = await api.post("/api/templates/import-template-products", {
                branchId: branchId,
                menuTemplateId: templateId,
                products: productsData
              });
              
              toast.dismiss();
              
              if (importResponse.data && importResponse.data.success) {
                const stats = importResponse.data.stats || {};
                toast.success(`İçe aktarma başarılı: ${stats.inserted || 0} ürün eklendi, ${stats.updated || 0} güncellendi, ${stats.skipped || 0} atlandı`);
                
                // Şablon ürünlerini yeniden yükle
                fetchProductsForTemplate(templateId, type);
              } else {
                toast.error("İçe aktarma sırasında bir hata oluştu");
              }
            } 
            // MODE 2: Var olan ürünleri güncelleme (görünürlük, fiyat vb)
            else {
              console.log("Ürün güncelleme modu tespit edildi");
              
              // Menü şablonu için ürün görünürlük güncellemeleri
              const productUpdates = jsonData.map(row => {
                const productId = row['ID'] || row['id'] || row['Ürün ID'];
                const isVisible = 
                  typeof row['Görünür'] === 'string'
                    ? row['Görünür'].toLowerCase() === 'evet'
                    : Boolean(row['Görünür'] || row['is_visible'] || row['visible']);
                
                if (!productId) return null;
                
                return {
                  product_id: productId,
                  is_visible: isVisible
                };
              }).filter(Boolean);
              
              if (productUpdates.length === 0) {
                toast.dismiss();
                toast.error("Güncellenecek ürün bulunamadı");
                return;
              }
              
              // Standart endpoint ile güncelleme
              await api.post(`/api/templates/menu/${templateId}/products`, {
                products: productUpdates
              });
              
              toast.dismiss();
              toast.success(`${productUpdates.length} ürünün görünürlük ayarları güncellendi`);
              
              // Şablon ürünlerini yeniden yükle
              fetchProductsForTemplate(templateId, type);
            }
          } 
          else if (type === templateTypes.PRICE) {
            // Fiyat şablonu için fiyat güncellemeleri
            const productUpdates = jsonData.map(row => {
              const productId = row['ID'] || row['id'] || row['Ürün ID'];
              const price = parseFloat(row['Şablon Fiyatı'] || row['template_price'] || row['Fiyat'] || row['Price'] || 0);
              
              if (!productId) return null;
              
              return {
                product_id: productId,
                price: price
              };
            }).filter(Boolean);
            
            if (productUpdates.length === 0) {
              toast.dismiss();
              toast.error("Güncellenecek ürün bulunamadı");
              return;
            }
            
            // Standart endpoint ile güncelleme
            await api.post(`/api/templates/price/${templateId}/products`, {
              products: productUpdates
            });
            
            toast.dismiss();
            toast.success(`${productUpdates.length} ürünün fiyat bilgileri güncellendi`);
            
            // Şablon ürünlerini yeniden yükle
            fetchProductsForTemplate(templateId, type);
          }
          else {
            toast.dismiss();
            toast.error("Bu şablon türü Excel içe aktarmayı desteklemiyor");
          }
          
        } catch (parseError) {
          toast.dismiss();
          console.error("Excel dosyası işlenirken hata:", parseError);
          toast.error(`Excel dosyası işlenemedi: ${parseError.message}`);
        }
      };
      
      reader.onerror = () => {
        toast.dismiss();
        toast.error("Dosya okunamadı");
      };
      
      reader.readAsArrayBuffer(file);
      
    } catch (error) {
      toast.dismiss();
      console.error("Excel içe aktarma hatası:", error);
      toast.error(`Excel içe aktarma işlemi başarısız oldu: ${error.message}`);
    } finally {
      // Dosya seçicisini temizle
      event.target.value = null;
    }
  };
  
  // Şablon ürünlerini getir - yardımcı fonksiyon
  const fetchProductsForTemplate = async (templateId, type) => {
    try {
      if (type === templateTypes.MENU) {
        handleManageProducts(templateId, type);
      } else if (type === templateTypes.PRICE) {
        // Fiyat şablonu için özel bir yükleme mantığı varsa burada
        handleManageProducts(templateId, type);
      }
    } catch (error) {
      console.error("Şablon ürünleri yüklenirken hata:", error);
    }
  };
  
  // Şablon silme fonksiyonu
  const handleDeleteTemplate = async (template, type) => {
    try {
      if (!template || !template.id) return;
      
      let endpoint = '';
      
      if (type === templateTypes.MENU) {
        endpoint = `/api/templates/menu/${template.id}`;
      } 
      else if (type === templateTypes.PRICE) {
        endpoint = `/api/templates/price/${template.id}`;
      }
      else if (type === templateTypes.INTEGRATION) {
        endpoint = `/api/integrations/${template.id}`;
      }
      
      await api.delete(endpoint);
      
      // Yerel state'den şablonu kaldır
      setTemplates(prev => ({
        ...prev,
        [type]: prev[type].filter(t => t.id !== template.id)
      }));
      
      toast.success(`"${template.name}" şablonu başarıyla silindi`);
      
      // Eğer şablon bir fiyat şablonuysa ve menü şablonuna bağlıysa, ilgili bağlantı bilgisini göster
      if (type === templateTypes.PRICE && template.menu_template_id) {
        const menuTemplateName = getTemplateName('menu', template.menu_template_id);
        if (menuTemplateName) {
          toast.info(`"${menuTemplateName}" menü şablonu ile bağlantı kaldırıldı`);
        }
      }
      
    } catch (error) {
      console.error("Şablon silinirken hata:", error);
      let errorMessage = "Şablon silinemedi";
      
      // API'nin sunduğu hata mesajını göster, yoksa genel hata mesajı
      if (error.response?.data?.error) {
        errorMessage += ": " + error.response.data.error;
      } else if (error.message) {
        errorMessage += ": " + error.message;
      }
      
      toast.error(errorMessage);
    }
  };
  
  // Kopyalama işlemini gerçekleştiren fonksiyon
  const executeTemplateCopy = async () => {
    if (!copyingTemplate || !copyName.trim()) return;

    try {
      setCopyLoading(true);
      let newCopyId = null;
      let copyResults = {
        success: false,
        templateId: null,
        copiedItems: 0,
        categories: 0,
        details: []
      };

      // Şablon tipine göre farklı kopyalama işlemleri
      if (copyingTemplate.type === templateTypes.MENU) {

        const copyResponse = await api.post("/api/templates/menu", {
          name: copyName,
          description: copyingTemplate.description,
          is_active: copyingTemplate.is_active
        });

        newCopyId = copyResponse.data.id;
        console.log(`Yeni menü şablonu oluşturuldu (ID: ${newCopyId})`);

        const productsResponse = await api.get(`/api/templates/menu/${copyingTemplate.id}/products`, {
          params: { onlyTemplateProducts: 'true' }
        });

        const products = productsResponse.data;

        if (products && products.length > 0) {
          console.log(`${products.length} ürün kopyalanıyor...`);

          const productUpdates = products.map(product => ({
            product_id: product.id,
            is_visible: product.is_visible
          }));

          await api.post(`/api/templates/menu/${newCopyId}/products`, {
            products: productUpdates
          });

          copyResults = {
            success: true,
            templateId: newCopyId,
            copiedItems: products.length,
            categories: copyDetails.categories.size,
            details: [
              `${products.length} ürün başarıyla kopyalandı`,
              `${copyDetails.visibleItems} görünür ürün`,
              `${copyDetails.categories.size} farklı kategoride ürün`
            ]
          };
        }
      }
      else if (copyingTemplate.type === templateTypes.PRICE) {

        const copyResponse = await api.post("/api/templates/price", {
          name: copyName,
          description: copyingTemplate.description,
          is_active: copyingTemplate.is_active,
          year: copyingTemplate.year || new Date().getFullYear(),
          // Checkbox'a göre menü şablonunu kopyala veya boş bırak
          menu_template_id: copyDetails.keepMenuLink ? copyingTemplate.menu_template_id : null
        });

        newCopyId = copyResponse.data.id;

        // 2. Eski şablondaki fiyatları getir
        const priceProductsResponse = await api.get(`/api/templates/price/${copyingTemplate.id}/products`);
        const priceProducts = priceProductsResponse.data;

        // 3. Fiyatları yeni şablona ekle
        if (priceProducts && priceProducts.length > 0) {

          const priceUpdates = priceProducts.map(product => ({
            product_id: product.id,
            price: product.template_price || product.price
          }));

          await api.post(`/api/templates/price/${newCopyId}/products`, {
            products: priceUpdates
          });

          const details = [];
          details.push(`${priceProducts.length} ürün fiyatı başarıyla kopyalandı`);

          if (copyDetails.customPrices > 0) {
            details.push(`${copyDetails.customPrices} özel fiyat ayarı korundu`);
          }

          if (copyDetails.keepMenuLink && copyDetails.linkedMenu) {
            details.push(`"${copyDetails.linkedMenu}" menü şablonu bağlantısı korundu`);
          }

          copyResults = {
            success: true,
            templateId: newCopyId,
            copiedItems: priceProducts.length,
            customPrices: copyDetails.customPrices,
            linkedMenu: copyDetails.keepMenuLink ? copyDetails.linkedMenu : null,
            details: details
          };
        }
      }
      else if (copyingTemplate.type === templateTypes.INTEGRATION) {

        const copyResponse = await api.post("/api/integrations", {
          name: copyName,
          type: copyingTemplate.type,
          description: copyingTemplate.description,
          is_active: copyingTemplate.is_active,
          config: copyingTemplate.config
        });

        newCopyId = copyResponse.data.id;

        copyResults = {
          success: true,
          templateId: newCopyId,
          details: [
            "Entegrasyon ayarları başarıyla kopyalandı",
            `Entegrasyon türü: ${copyingTemplate.type === 'delivery' ? 'Teslimat' :
              copyingTemplate.type === 'payment' ? 'Ödeme' :
                copyingTemplate.type === 'order' ? 'Sipariş' :
                  copyingTemplate.type === 'menu' ? 'Menü' : 'Diğer'}`
          ]
        };
      }
      setCopyResults(copyResults);
      // Kopyalama başarılı, sonraki adıma geç
      toast.success(`"${copyName}" şablonu başarıyla oluşturuldu`);
      setCopyStep(2);

      if (newCopyId) {
        setNewTemplateInfo({
          id: newCopyId,
          type: copyingTemplate.type,
          name: copyName
        });
      }

      // Şablonları yeniden yükle
      fetchTemplates();

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

  // Şablon ekleme/düzenleme modalını aç - Zustand ile güncellendi
  const handleAddEditTemplate = (template = null, type) => {
    // Modal türüne göre doğru modalı belirle
    const modalName = type === templateTypes.INTEGRATION 
      ? 'integrationModal' 
      : 'templateModal';
    
    // Zustand store'u kullanarak modalı aç
    openModal(modalName, {
      template: template,
      templateType: type
    });
  };

  // Ürün modalını aç - Zustand ile güncelleyelim
  const handleProductModal = (product = null) => {
    openModal('productModal', {
      editingProduct: product
    });
  };

  // Ürün listesini yönetme fonksiyonu - ProductsListModal'ı açar
  const handleManageProducts = (templateId, templateType) => {
    setModalState({ 
      currentTemplateId: templateId,
      currentTemplateType: templateType
    });
    openModal('productsListModal');
  };
  
  // Ürün eklendiğinde ürün listesini günceller
  const handleProductUpdated = () => {
    if (currentTemplateId) {
      // Ürün listesi modalı açıksa yeniden ürünleri yükle
      if (modals.productsListModal) {
        handleManageProducts(currentTemplateId, currentTemplateType);
      }
      // Şablonları yeniden yükle
      fetchTemplates();
    }
  };
  
  // Render fonksiyonu
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Şablon Yönetimi</h1>
        <p className="text-gray-600">
          Menü, fiyat ve entegrasyon şablonlarını yönetin.
        </p>
      </div>

      <Tab.Group selectedIndex={activeTab} onChange={setActiveTab}>
        <div className="flex justify-between items-center mb-4">
          <Tab.List className="flex p-1 space-x-1 bg-blue-100 rounded-xl">
            <Tab
              className={({ selected }) =>
                `py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                  selected ? 'bg-white shadow' : 'hover:bg-blue-200'
                }`
              }
            >
              Menü Şablonları
            </Tab>
            <Tab
              className={({ selected }) =>
                `py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                  selected ? 'bg-white shadow' : 'hover:bg-blue-200'
                }`
              }
            >
              Fiyat Şablonları
            </Tab>
            <Tab
              className={({ selected }) =>
                `py-2 px-4 text-sm font-medium rounded-lg transition-colors ${
                  selected ? 'bg-white shadow' : 'hover:bg-blue-200'
                }`
              }
            >
              Entegrasyonlar
            </Tab>
          </Tab.List>

          <div className="flex gap-2">
            <button
              onClick={() => handleViewModeChange("grid")}
              className={`p-2 rounded-lg ${
                viewMode === "grid" ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              title="Kart Görünümü"
            >
              <FiGrid size={20} />
            </button>
            <button
              onClick={() => handleViewModeChange("table")}
              className={`p-2 rounded-lg ${
                viewMode === "table" ? 'bg-blue-100' : 'hover:bg-gray-100'
              }`}
              title="Tablo Görünümü"
            >
              <FiList size={20} />
            </button>
          </div>
        </div>

        <Tab.Panels className="mt-2">
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

            {/* Menü Şablonları Listesi - Burada ayrı bir bileşen kullanılabilir */}
            <div className="bg-gray-100 p-4 rounded-lg border">
              {loading ? (
                <div className="py-8 text-center">Şablonlar yükleniyor...</div>
              ) : templates[templateTypes.MENU].length === 0 ? (
                <div className="py-8 text-center">Henüz şablon eklenmemiş</div>
              ) : (
                <div id="templates-container" className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'} template-${viewMode}-view`}>
                  {templates[templateTypes.MENU].map(template => (
                    <div key={template.id} className="bg-white p-4 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-bold">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => handleManageProducts(template.id, templateTypes.MENU)}
                          className="p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          title="Ürünleri Yönet"
                          style={{
                            backgroundColor: `${theme.secondary}30`,
                            color: theme.primary
                          }}
                        >
                          <FiPackage size={16} />
                        </button>
                        <button
                          onClick={() => handleExportToExcel(template.id, templateTypes.MENU)}
                          className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                          title="Excel'e Aktar"
                        >
                          <FiDownload size={16} />
                        </button>
                        <input
                          type="file"
                          id={`excel-import-menu-${template.id}`}
                          accept=".xlsx, .xls"
                          className="hidden"
                          onChange={(e) => handleImportFromExcel(e, template.id, templateTypes.MENU)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={() => document.getElementById(`excel-import-menu-${template.id}`).click()}
                          className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                          title="Excel'den İçe Aktar"
                        >
                          <FiUpload size={16} />
                        </button>
                        <button
                          onClick={() => handleInitiateCopy(template, templateTypes.MENU)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                          title="Şablonu Kopyala"
                        >
                          <FiCopy size={16} />
                        </button>
                        <button
                          onClick={() => handleAddEditTemplate(template, templateTypes.MENU)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                          title="Şablonu Düzenle"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete(template);
                            setConfirmDeleteType(templateTypes.MENU);
                            openModal('confirmModal');
                          }}
                          className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                          title="Şablonu Sil"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

            {/* Fiyat Şablonları Listesi */}
            <div className="bg-gray-100 p-4 rounded-lg border">
              {loading ? (
                <div className="py-8 text-center">Şablonlar yükleniyor...</div>
              ) : templates[templateTypes.PRICE].length === 0 ? (
                <div className="py-8 text-center">Henüz şablon eklenmemiş</div>
              ) : (
                <div id="templates-price-container" className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'} template-${viewMode}-view`}>
                  {templates[templateTypes.PRICE].map(template => (
                    <div key={template.id} className="bg-white p-4 rounded-lg shadow-sm border">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-bold">{template.name}</h3>
                        {template.menu_template_id && (
                          <div 
                            className="flex items-center text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full"
                            title={`${getTemplateName('menu', template.menu_template_id) || 'Menü Şablonu'} ile bağlantılı`}
                          >
                            <FiLink size={12} className="mr-1" />
                            <span>{getTemplateName('menu', template.menu_template_id) || 'Menü Şablonu'}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => handleManageProducts(template.id, templateTypes.PRICE)}
                          className="p-2 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                          title="Ürün Fiyatlarını Yönet"
                          style={{
                            backgroundColor: `${theme.secondary}30`,
                            color: theme.primary
                          }}
                        >
                          <FiPackage size={16} />
                        </button>
                        <button
                          onClick={() => {
                            // Link Template modalını aç
                            setCurrentPriceTemplate(template);
                            openModal('linkTemplateModal');
                          }}
                          className="p-2 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100"
                          title={template.menu_template_id ? "Menü şablonu bağlantısını değiştir" : "Menü şablonuna bağla"}
                        >
                          {template.menu_template_id ? <MdLinkOff size={16} /> : <FiLink size={16} />}
                        </button>
                        <button
                          onClick={() => handleExportToExcel(template.id, templateTypes.PRICE)}
                          className="p-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                          title="Excel'e Aktar"
                        >
                          <FiDownload size={16} />
                        </button>
                        <input
                          type="file"
                          id={`excel-import-price-${template.id}`}
                          accept=".xlsx, .xls"
                          className="hidden"
                          onChange={(e) => handleImportFromExcel(e, template.id, templateTypes.PRICE)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={() => document.getElementById(`excel-import-price-${template.id}`).click()}
                          className="p-2 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                          title="Excel'den İçe Aktar"
                        >
                          <FiUpload size={16} />
                        </button>
                        <button
                          onClick={() => handleInitiateCopy(template, templateTypes.PRICE)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                          title="Şablonu Kopyala"
                        >
                          <FiCopy size={16} />
                        </button>
                        <button
                          onClick={() => handleAddEditTemplate(template, templateTypes.PRICE)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                          title="Şablonu Düzenle"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete(template);
                            setConfirmDeleteType(templateTypes.PRICE);
                            openModal('confirmModal');
                          }}
                          className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                          title="Şablonu Sil"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

            {/* Entegrasyon Şablonları Listesi */}
            <div className="bg-gray-100 p-4 rounded-lg border">
              {loading ? (
                <div className="py-8 text-center">Şablonlar yükleniyor...</div>
              ) : templates[templateTypes.INTEGRATION].length === 0 ? (
                <div className="py-8 text-center">Henüz şablon eklenmemiş</div>
              ) : (
                <div id="templates-integration-container" className={`${viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'} template-${viewMode}-view`}>
                  {templates[templateTypes.INTEGRATION].map(template => (
                    <div key={template.id} className="bg-white p-4 rounded-lg shadow-sm border">
                      <h3 className="text-lg font-bold">{template.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      <div className="mt-4 flex justify-end gap-2">
                        <button
                          onClick={() => handleInitiateCopy(template, templateTypes.INTEGRATION)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                          title="Şablonu Kopyala"
                        >
                          <FiCopy size={16} />
                        </button>
                        <button
                          onClick={() => handleAddEditTemplate(template, templateTypes.INTEGRATION)}
                          className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100"
                          title="Şablonu Düzenle"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setConfirmDelete(template);
                            setConfirmDeleteType(templateTypes.INTEGRATION);
                            openModal('confirmModal');
                          }}
                          className="p-2 rounded-lg bg-red-50 text-red-700 hover:bg-red-100"
                          title="Şablonu Sil"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Modal bileşenleri - Zustand ile */}
      <ProductModal
        isOpen={modals.productModal}
        onClose={() => closeModal('productModal')}
        currentTemplateId={currentTemplateId || ""}
        onProductAdded={handleProductUpdated}
        categories={categories}
        initialProduct={useModalStore(state => state.editingProduct)}
      />
      
      {/* TemplateModal bileşeni - Zustand ile */}
      <TemplateModal
        isOpen={modals.templateModal}
        onClose={() => closeModal('templateModal')}
        template={currentTemplate}
        type={currentTemplateType}
        templates={templates}
        onTemplateAdded={(updatedTemplate) => {
          if (!updatedTemplate || !currentTemplateType) return;
          
          const templateType = currentTemplateType;
          const updatedTemplates = { ...templates };
          const existingIndex = updatedTemplates[templateType].findIndex(t => t.id === updatedTemplate.id);
          
          if (existingIndex !== -1) {
            // Var olan şablonu güncelle
            updatedTemplates[templateType][existingIndex] = updatedTemplate;
          } else {
            // Yeni şablon ekle
            updatedTemplates[templateType].push(updatedTemplate);
          }
          
          setTemplates(updatedTemplates);
        }}
      />
      
      {/* Entegrasyon şablonu için TemplateModal - Zustand ile */}
      <TemplateModal
        isOpen={modals.integrationModal}
        onClose={() => closeModal('integrationModal')}
        template={currentTemplate}
        type={templateTypes.INTEGRATION}
        templates={templates}
        onTemplateAdded={(updatedTemplate) => {
          if (!updatedTemplate) return;
          
          const updatedTemplates = { ...templates };
          const existingIndex = updatedTemplates[templateTypes.INTEGRATION].findIndex(t => t.id === updatedTemplate.id);
          
          if (existingIndex !== -1) {
            // Var olan şablonu güncelle
            updatedTemplates[templateTypes.INTEGRATION][existingIndex] = updatedTemplate;
          } else {
            // Yeni şablon ekle
            updatedTemplates[templateTypes.INTEGRATION].push(updatedTemplate);
          }
          
          setTemplates(updatedTemplates);
        }}
      />
      
      {/* Kopyalama Modalı */}
      <CopyModal
        isOpen={modals.copyModal}
        onClose={() => closeModal('copyModal')}
        copyingTemplate={copyingTemplate}
        copyDetails={copyDetails}
        copyStep={copyStep}
        setCopyStep={setCopyStep}
        copyName={copyName}
        setCopyName={setCopyName}
        copyLoading={copyLoading}
        executeTemplateCopy={executeTemplateCopy}
        copyResults={copyResults}
        newTemplateInfo={newTemplateInfo}
      />
      
      {/* Silme Onay Modalı */}
      <ConfirmModal
        isOpen={modals.confirmModal}
        onClose={() => {
          closeModal('confirmModal');
          setConfirmDelete(null);
          setConfirmDeleteType(null);
        }}
        title="Şablonu Sil"
        message={
          confirmDelete ? 
          `"${confirmDelete.name}" şablonunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz.` : 
          "Bu şablonu silmek istediğinize emin misiniz?"
        }
        confirmText="Evet, Sil"
        cancelText="İptal"
        type="danger"
        onConfirm={() => {
          if (confirmDelete && confirmDeleteType) {
            handleDeleteTemplate(confirmDelete, confirmDeleteType);
          }
          setConfirmDelete(null);
          setConfirmDeleteType(null);
        }}
      />
      
      {/* Şablon Bağlantı Modalı */}
      <LinkTemplateModal
        isOpen={modals.linkTemplateModal}
        onClose={() => {
          closeModal('linkTemplateModal');
          setCurrentPriceTemplate(null);
        }}
        menuTemplates={templates[templateTypes.MENU] || []}
        priceTemplate={currentPriceTemplate}
        onLinkUpdate={(menuTemplateId) => {
          if (currentPriceTemplate) {
            handleUpdateTemplateLink(currentPriceTemplate.id, menuTemplateId);
          }
        }}
      />

      {/* Ürün Listesi Modalı */}
      <ProductsListModal
        isOpen={modals.productsListModal}
        onClose={() => closeModal('productsListModal')}
        templateId={currentTemplateId}
        templateType={currentTemplateType}
        onExportToExcel={handleExportToExcel}
        onImportFromExcel={handleImportFromExcel}
      />
    </div>
  );
};

export default EnhancedTemplateManager;
