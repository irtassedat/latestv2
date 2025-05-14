// src/components/modals/ProductsListModal.jsx
import { useState, useEffect, useRef } from "react";
import { 
  FiX, FiPlus, FiEdit2, FiTrash2, FiEye, FiEyeOff, FiSearch, 
  FiFilter, FiUpload, FiDownload, FiChevronDown, FiChevronRight,
  FiGrid, FiList, FiImage, FiRefreshCw
} from "react-icons/fi";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import useModalStore from "../../stores/modalStore";
import CategoryImageModal from "./CategoryImageModal";
import { refreshCategoryImages } from "../../utils/categoryImageHelper";

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

const ProductsListModal = ({ 
  isOpen, 
  onClose, 
  templateId, 
  templateType, 
  onExportToExcel,
  onImportFromExcel
}) => {
  const { openModal } = useModalStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // grid veya list
  const fileInputRef = useRef(null);
  
  // Kategori resmi düzenleme modal state'i
  const [showCategoryImageModal, setShowCategoryImageModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Ürün listesini getir
  const fetchProducts = async () => {
    setLoading(true);
    try {
      let response;
      
      if (templateType === "menu") {
        response = await api.get(`/api/templates/menu/${templateId}/products`);
      } else if (templateType === "price") {
        response = await api.get(`/api/templates/price/${templateId}/products`);
      }
      
      if (response?.data) {
        setProducts(response.data);
        
        // Kategorileri topla
        const uniqueCategories = {};
        response.data.forEach(product => {
          if (product.category_id && product.category_name) {
            uniqueCategories[product.category_id] = product.category_name;
          }
        });
        
        const categoriesArray = Object.entries(uniqueCategories).map(([id, name]) => ({
          id,
          name
        }));
        
        setCategories(categoriesArray);
        
        // Varsayılan olarak tüm kategorileri kapalı göster
        setExpandedCategories([]);
      }
    } catch (error) {
      console.error("Ürün listesi yüklenirken hata:", error);
      toast.error("Ürünler yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  // Ürün görünürlüğünü değiştir
  const handleToggleVisibility = async (productId, makeVisible) => {
    try {
      // Önce yerel state'i güncelle
      const updatedProducts = products.map(product =>
        product.id === productId
          ? { ...product, is_visible: makeVisible }
          : product
      );
      
      setProducts(updatedProducts);
      
      try {
        // Tek ürün için güncelleme isteği
        await api.post(`/api/templates/${templateType}/${templateId}/products`, {
          products: [{ product_id: productId, is_visible: makeVisible }]
        });
        
        // Sonra tüm ürünleri içeren ikinci bir güncelleme isteği gönder
        // Bu, backend'de olası bir sorunu aşmak için bir geçici çözüm
        const allProductUpdates = updatedProducts.map(product => ({
          product_id: product.id,
          is_visible: product.is_visible
        }));
        
        await api.post(`/api/templates/${templateType}/${templateId}/products`, {
          products: allProductUpdates
        });
      } catch (apiError) {
        // API isteği başarısız olursa, state'i geri al
        console.error("API isteği başarısız:", apiError);
        setProducts(products);
        throw apiError; // Hata fırlatmayı sürdür
      }

      toast.success(`Ürün ${makeVisible ? 'görünür' : 'gizli'} yapıldı`);
    } catch (error) {
      console.error("Ürün görünürlüğü değiştirilirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Kategori genişletme/daraltma
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Kategori bazlı görünürlük değiştirme
  const handleCategoryVisibilityToggle = async (categoryId, makeVisible) => {
    try {
      // Bu kategorideki tüm ürünleri bul
      const categoryProducts = products.filter(
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

      // Yerel state'i önce güncelle
      const updatedProducts = products.map(product => {
        if (product.category_id?.toString() === categoryId.toString()) {
          return { ...product, is_visible: makeVisible };
        }
        return product;
      });
      
      setProducts(updatedProducts);
      
      try {
        // Kategoriye özel güncelleme isteği gönder
        await api.post(`/api/templates/${templateType}/${templateId}/products`, {
          products: productUpdates
        });
        
        // Sonra tüm ürünleri içeren ikinci bir güncelleme isteği gönder
        // Bu, backend'de olası bir sorunu aşmak için bir geçici çözüm
        const allProductUpdates = updatedProducts.map(product => ({
          product_id: product.id,
          is_visible: product.is_visible
        }));
        
        await api.post(`/api/templates/${templateType}/${templateId}/products`, {
          products: allProductUpdates
        });
      } catch (apiError) {
        // API isteği başarısız olursa, state'i geri al
        console.error("API isteği başarısız:", apiError);
        setProducts(products);
        throw apiError; // Hata fırlatmayı sürdür
      }

      toast.success(`${categoryProducts.length} ürünün görünürlüğü değiştirildi`);
    } catch (error) {
      console.error("Kategori görünürlüğü güncellenirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Ürün seçme
  const toggleProductSelection = (productId) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  // Seçili ürünleri görünür yap
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

      // Yerel state'i önce güncelle
      const updatedProducts = products.map(product =>
        selectedProducts.includes(product.id)
          ? { ...product, is_visible: true }
          : product
      );
      
      setProducts(updatedProducts);
      
      try {
        // Önce seçili ürünleri güncelle
        await api.post(`/api/templates/${templateType}/${templateId}/products`, {
          products: productUpdates
        });
        
        // Sonra tüm ürünleri içeren ikinci bir güncelleme isteği gönder
        // Bu, backend'de olası bir sorunu aşmak için bir geçici çözüm
        const allProductUpdates = updatedProducts.map(product => ({
          product_id: product.id,
          is_visible: product.is_visible
        }));
        
        await api.post(`/api/templates/${templateType}/${templateId}/products`, {
          products: allProductUpdates
        });
      } catch (apiError) {
        // API isteği başarısız olursa, state'i geri al
        console.error("API isteği başarısız:", apiError);
        setProducts(products);
        throw apiError; // Hata fırlatmayı sürdür
      }

      toast.success(`${selectedProducts.length} ürün görünür yapıldı`);
      setSelectedProducts([]); // Seçimi temizle
    } catch (error) {
      console.error("Ürünler güncellenirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // Seçili ürünleri gizle
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

      // Yerel state'i önce güncelle
      const updatedProducts = products.map(product =>
        selectedProducts.includes(product.id)
          ? { ...product, is_visible: false }
          : product
      );
      
      setProducts(updatedProducts);
      
      try {
        // Önce seçili ürünleri güncelle
        await api.post(`/api/templates/${templateType}/${templateId}/products`, {
          products: productUpdates
        });
        
        // Sonra tüm ürünleri içeren ikinci bir güncelleme isteği gönder
        // Bu, backend'de olası bir sorunu aşmak için bir geçici çözüm
        const allProductUpdates = updatedProducts.map(product => ({
          product_id: product.id,
          is_visible: product.is_visible
        }));
        
        await api.post(`/api/templates/${templateType}/${templateId}/products`, {
          products: allProductUpdates
        });
      } catch (apiError) {
        // API isteği başarısız olursa, state'i geri al
        console.error("API isteği başarısız:", apiError);
        setProducts(products);
        throw apiError; // Hata fırlatmayı sürdür
      }

      toast.success(`${selectedProducts.length} ürün gizlendi`);
      setSelectedProducts([]); // Seçimi temizle
    } catch (error) {
      console.error("Ürünler güncellenirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  };

  // İlk render'da ürünleri yükle
  // Tüm kategorileri/ürünleri seçmek için state
  const [selectAllCategories, setSelectAllCategories] = useState(false);
  const [selectAllProducts, setSelectAllProducts] = useState(false);

  // Seçim durumunu izleyen efekt
  useEffect(() => {
    if (selectAllProducts) {
      // Tüm ürünleri seç
      const allProductIds = products.map(product => product.id);
      setSelectedProducts(allProductIds);
    } else if (selectedProducts.length === products.length && products.length > 0) {
      // Tüm ürünler zaten seçiliyse ve seçim tümünü seç değilse, temizle
      if (!selectAllProducts) {
        setSelectedProducts([]);
      }
    }
  }, [selectAllProducts, products]);

  useEffect(() => {
    if (isOpen && templateId) {
      fetchProducts();
    }
  }, [isOpen, templateId, templateType]);

  // Stil CSS'i
  useEffect(() => {
    if (isOpen) {
      const styles = `
        /* Düzenleme düğmelerini modalın üzerinde görünecek şekilde ayarla */
        .edit-button {
          position: relative;
          z-index: 1050;
          transition: all 0.2s ease;
        }

        .edit-button:hover {
          background-color: #dbeafe !important;
          transform: scale(1.05);
          box-shadow: 0 0 0 2px #3b82f6;
        }

        .edit-button.active {
          background-color: #dbeafe !important;
          transform: scale(1.05);
          box-shadow: 0 0 0 2px #3b82f6;
        }
      `;

      const styleEl = document.createElement('style');
      styleEl.id = 'product-list-modal-styles';
      styleEl.textContent = styles;
      document.head.appendChild(styleEl);

      return () => {
        const existingStyle = document.getElementById('product-list-modal-styles');
        if (existingStyle) {
          existingStyle.remove();
        }
      }
    }
  }, [isOpen]);

  // Modal kapalıysa render etme
  if (!isOpen) return null;

  // Filtreleme fonksiyonu
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = !categoryFilter || product.category_id?.toString() === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Kategoriye göre gruplanmış ürünler
  const groupedProducts = {};
  
  filteredProducts.forEach(product => {
    const categoryId = product.category_id || 'uncategorized';
    
    if (!groupedProducts[categoryId]) {
      groupedProducts[categoryId] = {
        name: product.category_name || 'Kategorisiz',
        products: []
      };
    }
    
    groupedProducts[categoryId].products.push(product);
  });

  // Başlık metni oluştur
  const getTitleText = () => {
    if (templateType === "menu") return "Menü Şablonu Ürünleri";
    if (templateType === "price") return "Fiyat Şablonu Ürünleri";
    return "Ürün Listesi";
  };

  const handleEditClick = (e, product) => {
    e.stopPropagation();
    const btn = e.currentTarget;
    btn.classList.add('active');

    // Fiyat şablonu için sadece fiyat düzenleme modalını aç
    if (templateType === "price") {
      // Sadece fiyat değiştirmek için daha basit bir modal veya prompt kullan
      const currentPrice = product.template_price || product.price || 0;
      const newPrice = window.prompt(
        `"${product.name}" ürünü için yeni fiyat girin:`,
        currentPrice.toString()
      );

      if (newPrice !== null) {
        const numericPrice = parseFloat(newPrice.replace(',', '.'));

        if (!isNaN(numericPrice) && numericPrice >= 0) {
          // Fiyatı güncelle
          api.post(`/api/templates/price/${templateId}/products`, {
            products: [{ product_id: product.id, price: numericPrice }]
          })
          .then(() => {
            // Başarılı olursa yerel state'i güncelle
            setProducts(prevProducts =>
              prevProducts.map(p =>
                p.id === product.id
                  ? { ...p, template_price: numericPrice }
                  : p
              )
            );
            toast.success(`"${product.name}" fiyatı güncellendi`);
            setTimeout(() => btn.classList.remove('active'), 1000);
          })
          .catch(error => {
            console.error("Fiyat güncellenirken hata:", error);
            toast.error("Fiyat güncellenemedi!");
            btn.classList.remove('active');
          });
        } else {
          toast.error("Geçerli bir fiyat girmelisiniz!");
          btn.classList.remove('active');
        }
      } else {
        btn.classList.remove('active');
      }
    } else {
      // Menü şablonu için tam ürün düzenleme modalını aç
      openModal('productModal', {
        editingProduct: product,
        currentTemplateId: templateId,
        currentTemplateType: templateType,
        // Ürün güncellendiğinde yenileme için callback
        onProductAdded: (updatedProduct) => {
          // Ürün güncellenince sadece o ürünün değişmesini sağla, tüm listeyi etkileme
          setProducts(prevProducts =>
            prevProducts.map(p =>
              p.id === updatedProduct.id ? {...p, ...updatedProduct} : p
            )
          );

          // Ayrıca ürünleri tamamen yeniden yükle, ancak bunu bir timeout sonrası yap
          // Böylece hem hızlı güncellenmiş UI görebiliriz, hem de arkadan tam data senkronize olur
          setTimeout(() => {
            fetchProducts();
            console.log("Ürünler yeniden yüklendi (güncelleme sonrası)");
          }, 500);

          btn.classList.remove('active');
        }
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[900] flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Başlık */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-50">
          <h2 className="text-xl font-bold">{getTitleText()}</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {/* Araç çubuğu */}
        <div className="p-4 bg-gray-50 border-b flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Ürün ara..."
                className="pl-10 pr-4 py-2 border rounded-lg w-64"
              />
            </div>

            {/* Yenileme butonu */}
            <button
              onClick={() => {
                setLoading(true);
                fetchProducts();
              }}
              className="p-2 border rounded-lg hover:bg-gray-50 text-gray-700 flex items-center gap-1"
              title="Listeyi Yenile"
            >
              <FiRefreshCw size={18} />
            </button>

            {/* Boş şablonda "Sistemdeki tüm ürünleri getir" butonu */}
            {products.length === 0 && (
              <button
                onClick={async () => {
                  try {
                    setLoading(true);

                    // Tüm ürünleri getir
                    const allProductsResponse = await api.get('/api/products');
                    const allProducts = allProductsResponse.data || [];

                    if (allProducts.length === 0) {
                      toast.warning("Sistemde henüz ürün bulunmuyor!");
                      return;
                    }

                    // Şablon türüne göre uygun API çağrısını yap
                    if (templateType === "menu") {
                      // Tüm ürünleri menü şablonuna ekle
                      const productUpdates = allProducts.map(product => ({
                        product_id: product.id,
                        is_visible: true
                      }));

                      await api.post(`/api/templates/menu/${templateId}/products`, {
                        products: productUpdates
                      });

                      toast.success(`${allProducts.length} ürün şablona eklendi`);
                    } else if (templateType === "price") {
                      // Tüm ürünleri fiyat şablonuna ekle
                      const productUpdates = allProducts.map(product => ({
                        product_id: product.id,
                        price: product.price || 0
                      }));

                      await api.post(`/api/templates/price/${templateId}/products`, {
                        products: productUpdates
                      });

                      toast.success(`${allProducts.length} ürün fiyat şablonuna eklendi`);
                    }

                    // Ürünleri yeniden yükle
                    fetchProducts();
                  } catch (error) {
                    console.error("Tüm ürünler şablona eklenirken hata:", error);
                    toast.error("Ürünler şablona eklenemedi!");
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1"
              >
                <FiRefreshCw size={18} />
                <span>Sistemdeki Tüm Ürünleri Getir</span>
              </button>
            )}

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border rounded-lg py-2 px-3"
            >
              <option value="">Tüm Kategoriler</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            {/* Tüm Ürünleri Seçme Checkbox'ı */}
            <div className="flex items-center gap-2 ml-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
              <input
                type="checkbox"
                id="selectAllProducts"
                checked={selectAllProducts}
                onChange={(e) => setSelectAllProducts(e.target.checked)}
                className="h-4 w-4 rounded text-blue-600"
              />
              <label htmlFor="selectAllProducts" className="text-sm font-medium text-blue-800">
                Tüm Ürünleri Seç
              </label>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onExportToExcel(templateId, templateType)}
              className="flex items-center gap-1 py-2 px-3 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <FiDownload size={18} />
              <span>Excel</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => onImportFromExcel(e, templateId, templateType)}
              className="hidden"
              accept=".xlsx, .xls"
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 py-2 px-3 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
            >
              <FiUpload size={18} />
              <span>İçe Aktar</span>
            </button>

            <button
              onClick={() => {
                const currentTemplate = { id: templateId };
                openModal('productModal', {
                  templateId,
                  currentTemplateId: templateId,
                  currentTemplateType: templateType,
                  // Ürün eklendiğinde yenileme için callback
                  onProductAdded: () => {
                    fetchProducts(); // Ürün listesini yenile
                  }
                });
              }}
              className="flex items-center gap-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              style={{
                backgroundColor: theme.accent
              }}
            >
              <FiPlus size={18} />
              <span>Yeni Ürün Ekle</span>
            </button>
          </div>
        </div>
        
        {/* Ürün listesi - kategorilere göre gruplandırılmış */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
            </div>
          ) : Object.keys(groupedProducts).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-lg">
              <p className="text-gray-500 mb-2">Hiç ürün bulunamadı</p>
              <button
                onClick={() => {
                  openModal('productModal', {
                    templateId,
                    currentTemplateId: templateId,
                    currentTemplateType: templateType,
                    // Ürün eklendiğinde yenileme için callback
                    onProductAdded: () => {
                      fetchProducts(); // Ürün listesini yenile
                    }
                  });
                }}
                className="flex items-center gap-1 py-2 px-4 bg-blue-600 text-white rounded-lg"
                style={{
                  backgroundColor: theme.accent
                }}
              >
                <FiPlus size={16} />
                <span>Ürün Ekle</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Kategorilere göre gruplandırılmış ürünler */}
              {Object.entries(groupedProducts).map(([categoryId, category]) => {
                const isExpanded = expandedCategories.includes(categoryId);
                const allVisible = category.products.every(p => p.is_visible);
                const allInvisible = category.products.every(p => !p.is_visible);
                
                return (
                  <div key={categoryId} className="border rounded-lg overflow-hidden">
                    {/* Kategori başlığı */}
                    <div
                      className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                      onClick={() => toggleCategory(categoryId)}
                    >
                      <div className="flex items-center">
                        {/* Kategori için tüm ürünleri seçme checkbox'u */}
                        <div
                          className="mr-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Kategorideki tüm ürün ID'lerini bul
                            const categoryProductIds = category.products.map(p => p.id);

                            // Eğer tüm ürünler seçili değilse, tümünü seç, aksi halde kaldır
                            if (categoryProductIds.every(id => selectedProducts.includes(id))) {
                              // Tümü seçiliyse, seçimi kaldır
                              setSelectedProducts(prev =>
                                prev.filter(id => !categoryProductIds.includes(id))
                              );
                            } else {
                              // Değilse, tümünü seç
                              setSelectedProducts(prev => {
                                const newSelection = [...prev];
                                categoryProductIds.forEach(id => {
                                  if (!newSelection.includes(id)) {
                                    newSelection.push(id);
                                  }
                                });
                                return newSelection;
                              });
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={
                              category.products.length > 0 &&
                              category.products.every(p => selectedProducts.includes(p.id))
                            }
                            className="h-4 w-4 rounded text-blue-600"
                            readOnly
                          />
                        </div>

                        {isExpanded ? (
                          <FiChevronDown size={20} className="mr-2 text-gray-500" />
                        ) : (
                          <FiChevronRight size={20} className="mr-2 text-gray-500" />
                        )}

                        {/* Kategori resmi var mı? */}
                        {category.image_url && (
                          <div className="w-8 h-8 rounded-md overflow-hidden mr-2 bg-white border">
                            <img
                              src={category.image_url}
                              alt={category.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/public/category/default.jpg';
                              }}
                            />
                          </div>
                        )}

                        <h3 className="font-medium">{category.name} ({category.products.length})</h3>
                      </div>
                      
                      {templateType === "menu" && (
                        <div className="flex items-center">
                          {/* Kategori resmi düzenleme butonu */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Güvenli bir şekilde kategori nesnesini oluştur
                              try {
                                // Kategori ID'sini sayısal değere çevir - hata durumunda varsayılan değer kullan
                                const numericId = parseInt(categoryId);
                                const validId = isNaN(numericId) ? null : numericId;

                                if (!validId) {
                                  console.warn("Geçersiz kategori ID'si:", categoryId);
                                  toast.warning("Kategori bilgisi tamamlanamadı");
                                  return;
                                }

                                const categoryObj = {
                                  id: validId,
                                  name: category.name || "Kategori",
                                  image_url: category.image_url || ""
                                };

                                setSelectedCategory(categoryObj);
                                setShowCategoryImageModal(true);
                              } catch (error) {
                                console.error("Kategori seçimi hatası:", error);
                                toast.error("Kategori bilgisi alınamadı");
                              }
                            }}
                            className="p-2 rounded-lg bg-blue-100 text-blue-700 mr-2 hover:bg-blue-200 transition-colors"
                            title="Kategori görseli ayarla"
                          >
                            <FiImage size={16} />
                          </button>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryVisibilityToggle(categoryId, true);
                            }}
                            className={`p-2 rounded-lg ${allVisible ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'} mr-2`}
                            title="Tüm ürünleri görünür yap"
                          >
                            <FiEye size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryVisibilityToggle(categoryId, false);
                            }}
                            className={`p-2 rounded-lg ${allInvisible ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
                            title="Tüm ürünleri gizle"
                          >
                            <FiEyeOff size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Kategori içeriği */}
                    {isExpanded && (
                      <div className="p-3">
                        {viewMode === "grid" ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {category.products.map(product => (
                              <div key={product.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow relative">
                                <div className="flex justify-between mb-2">
                                  <h4 className="font-medium">{product.name}</h4>
                                  <div className="flex items-center">
                                    {templateType === "menu" && (
                                      <button
                                        onClick={() => handleToggleVisibility(product.id, !product.is_visible)}
                                        className={`p-1.5 rounded-lg mr-2 ${product.is_visible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                        title={product.is_visible ? "Gizle" : "Görünür yap"}
                                      >
                                        {product.is_visible ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => handleEditClick(e, product)}
                                      className="p-1.5 rounded-lg bg-blue-100 text-blue-700 edit-button"
                                      title={templateType === "price" ? "Fiyat Düzenle" : "Düzenle"}
                                    >
                                      <FiEdit2 size={16} />
                                    </button>
                                  </div>
                                </div>
                                
                                {product.image_url && (
                                  <div className="mb-2 h-32 bg-gray-100 rounded-lg overflow-hidden">
                                    <img 
                                      src={product.image_url} 
                                      alt={product.name} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/public/vite.svg';
                                      }}
                                    />
                                  </div>
                                )}
                                
                                {product.description && (
                                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                                )}
                                
                                <div className="flex justify-between items-center">
                                  <div className="text-sm bg-gray-100 rounded-full px-2 py-0.5">
                                    {product.category_name || "Kategorisiz"}
                                  </div>
                                  
                                  {templateType === "price" ? (
                                    <div className="font-bold text-right">
                                      {product.template_price ? (
                                        <span>₺{typeof product.template_price === 'number' ? product.template_price.toFixed(2) : "0.00"}</span>
                                      ) : (
                                        <span>₺{typeof product.price === 'number' ? product.price.toFixed(2) : "0.00"}</span>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="font-bold text-right">
                                      ₺{typeof product.price === 'number' ? product.price.toFixed(2) : "0.00"}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="absolute top-2 left-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedProducts.includes(product.id)}
                                    onChange={() => toggleProductSelection(product.id)}
                                    className="h-4 w-4 rounded"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <table className="min-w-full border-collapse">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="p-2 border text-left w-6">
                                  <input
                                    type="checkbox"
                                    onChange={() => {
                                      const categoryProductIds = category.products.map(p => p.id);
                                      
                                      if (categoryProductIds.every(id => selectedProducts.includes(id))) {
                                        // Tümü seçiliyse, seçimi kaldır
                                        setSelectedProducts(prev => 
                                          prev.filter(id => !categoryProductIds.includes(id))
                                        );
                                      } else {
                                        // Değilse, tümünü seç
                                        setSelectedProducts(prev => {
                                          const newSelection = [...prev];
                                          categoryProductIds.forEach(id => {
                                            if (!newSelection.includes(id)) {
                                              newSelection.push(id);
                                            }
                                          });
                                          return newSelection;
                                        });
                                      }
                                    }}
                                    checked={
                                      category.products.length > 0 &&
                                      category.products.every(p => selectedProducts.includes(p.id))
                                    }
                                    className="h-4 w-4 rounded"
                                  />
                                </th>
                                <th className="p-2 border text-left">Ürün Adı</th>
                                <th className="p-2 border text-left">Açıklama</th>
                                <th className="p-2 border text-left">Kategori</th>
                                <th className="p-2 border text-right">Fiyat</th>
                                {templateType === "menu" && (
                                  <th className="p-2 border text-center">Görünür</th>
                                )}
                                <th className="p-2 border text-center">İşlemler</th>
                              </tr>
                            </thead>
                            <tbody>
                              {category.products.map(product => (
                                <tr key={product.id} className="hover:bg-gray-50">
                                  <td className="p-2 border">
                                    <input
                                      type="checkbox"
                                      checked={selectedProducts.includes(product.id)}
                                      onChange={() => toggleProductSelection(product.id)}
                                      className="h-4 w-4 rounded"
                                    />
                                  </td>
                                  <td className="p-2 border">{product.name}</td>
                                  <td className="p-2 border text-sm text-gray-600">
                                    {product.description ? (
                                      <span className="line-clamp-1">{product.description}</span>
                                    ) : (
                                      <span className="text-gray-400 italic">Açıklama yok</span>
                                    )}
                                  </td>
                                  <td className="p-2 border">
                                    <span className="text-sm bg-gray-100 rounded-full px-2 py-0.5">
                                      {product.category_name || "Kategorisiz"}
                                    </span>
                                  </td>
                                  <td className="p-2 border text-right font-medium">
                                    {templateType === "price" ? (
                                      product.template_price ? (
                                        <span>₺{typeof product.template_price === 'number' ? product.template_price.toFixed(2) : "0.00"}</span>
                                      ) : (
                                        <span>₺{typeof product.price === 'number' ? product.price.toFixed(2) : "0.00"}</span>
                                      )
                                    ) : (
                                      <span>₺{typeof product.price === 'number' ? product.price.toFixed(2) : "0.00"}</span>
                                    )}
                                  </td>
                                  {templateType === "menu" && (
                                    <td className="p-2 border text-center">
                                      <button
                                        onClick={() => handleToggleVisibility(product.id, !product.is_visible)}
                                        className={`p-1.5 rounded-lg ${product.is_visible ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                      >
                                        {product.is_visible ? <FiEye size={16} /> : <FiEyeOff size={16} />}
                                      </button>
                                    </td>
                                  )}
                                  <td className="p-2 border text-center">
                                    <button
                                      onClick={(e) => handleEditClick(e, product)}
                                      className="p-1.5 rounded-lg bg-blue-100 text-blue-700 edit-button"
                                      title={templateType === "price" ? "Fiyat Düzenle" : "Düzenle"}
                                    >
                                      <FiEdit2 size={16} />
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Alt çubuk - Toplu işlemler */}
        {selectedProducts.length > 0 && (
          <div className="p-3 bg-blue-50 border-t flex items-center justify-between">
            <div className="font-medium text-blue-800">
              {selectedProducts.length} ürün seçildi
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedProducts([])}
                className="px-3 py-1.5 border border-blue-300 text-blue-800 rounded-lg hover:bg-blue-100"
              >
                Seçimi Temizle
              </button>

              {templateType === "menu" && (
                <>
                  <button
                    onClick={makeSelectedProductsVisible}
                    className="px-3 py-1.5 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 flex items-center gap-1"
                  >
                    <FiEye size={16} />
                    <span>Görünür Yap</span>
                  </button>

                  <button
                    onClick={makeSelectedProductsInvisible}
                    className="px-3 py-1.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 flex items-center gap-1"
                  >
                    <FiEyeOff size={16} />
                    <span>Gizle</span>
                  </button>
                </>
              )}

              {templateType === "price" && (
                <button
                  onClick={() => {
                    if (selectedProducts.length === 0) {
                      toast.warning("Lütfen önce ürün seçin");
                      return;
                    }

                    // Toplu fiyat değişikliği işlemi
                    const currentPrices = products
                      .filter(p => selectedProducts.includes(p.id))
                      .map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.template_price || p.price || 0
                      }));

                    // Basit bir prompt yerine daha gelişmiş bir form açılabilir
                    const percentageChange = window.prompt(
                      `${selectedProducts.length} ürün için fiyat değişikliği yapın:\n` +
                      `Artış için: 10 (% olarak artış)\n` +
                      `Azalış için: -10 (% olarak azalış)\n` +
                      `Sabit fiyat için: =100 (TL olarak)`
                    );

                    if (!percentageChange) return;

                    // Fiyat değişikliği tipini belirle
                    let newPrices = [];

                    if (percentageChange.startsWith('=')) {
                      // Sabit fiyat
                      const fixedPrice = parseFloat(percentageChange.substring(1).replace(',', '.'));

                      if (isNaN(fixedPrice) || fixedPrice < 0) {
                        toast.error("Geçerli bir fiyat girmelisiniz!");
                        return;
                      }

                      newPrices = currentPrices.map(p => ({
                        product_id: p.id,
                        price: fixedPrice
                      }));

                      toast.info(`${selectedProducts.length} ürün için fiyat ${fixedPrice.toFixed(2)} TL olarak ayarlanacak`);
                    } else {
                      // Yüzdelik değişim
                      const percentValue = parseFloat(percentageChange.replace(',', '.'));

                      if (isNaN(percentValue)) {
                        toast.error("Geçerli bir yüzde değeri girmelisiniz!");
                        return;
                      }

                      newPrices = currentPrices.map(p => {
                        const currentPrice = parseFloat(p.price);
                        const changeAmount = currentPrice * (percentValue / 100);
                        const newPrice = Math.max(0, currentPrice + changeAmount).toFixed(2);

                        return {
                          product_id: p.id,
                          price: parseFloat(newPrice)
                        };
                      });

                      const action = percentValue >= 0 ? "artırılacak" : "azaltılacak";
                      toast.info(`${selectedProducts.length} ürün için fiyatlar %${Math.abs(percentValue)} ${action}`);
                    }

                    // API isteği
                    api.post(`/api/templates/price/${templateId}/products`, {
                      products: newPrices
                    })
                    .then(() => {
                      // Başarılı olursa yerel state'i güncelle
                      setProducts(prevProducts =>
                        prevProducts.map(p => {
                          const priceUpdate = newPrices.find(update => update.product_id === p.id);
                          if (priceUpdate) {
                            return { ...p, template_price: priceUpdate.price };
                          }
                          return p;
                        })
                      );
                      toast.success(`${newPrices.length} ürünün fiyatı güncellendi`);
                    })
                    .catch(error => {
                      console.error("Fiyatlar güncellenirken hata:", error);
                      toast.error("Fiyatlar güncellenemedi!");
                    });
                  }}
                  className="px-3 py-1.5 bg-purple-100 text-purple-800 rounded-lg hover:bg-purple-200 flex items-center gap-1"
                >
                  <FiEdit2 size={16} />
                  <span>Toplu Fiyat Değiştir</span>
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Görünüm modu değiştirme */}
        <div className="absolute bottom-4 right-4 bg-white border rounded-lg shadow-lg flex">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 ${viewMode === "grid" ? "bg-blue-100 text-blue-700" : ""}`}
            title="Kart Görünümü"
          >
            <FiGrid size={20} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 ${viewMode === "list" ? "bg-blue-100 text-blue-700" : ""}`}
            title="Liste Görünümü"
          >
            <FiList size={20} />
          </button>
        </div>
      </div>
      
      {/* Kategori görsel düzenleme modalı */}
      <CategoryImageModal
        isOpen={showCategoryImageModal}
        onClose={() => setShowCategoryImageModal(false)}
        category={selectedCategory}
        onImageUpdated={(updatedCategory) => {
          // Güvenlik kontrolü: updatedCategory değeri geçerli mi?
          if (!updatedCategory) {
            console.warn("Kategori güncellemesi: Geçersiz kategori verisi alındı");
            toast.error("Kategori görseli güncelleme başarısız oldu");
            return;
          }

          // Kategori ID ve name değerlerini güvenli bir şekilde al
          const categoryId = updatedCategory.id ?? (selectedCategory ? selectedCategory.id : null);
          const categoryName = updatedCategory.name ?? (selectedCategory ? selectedCategory.name : "Bilinmeyen Kategori");
          const imageUrl = updatedCategory.image_url ?? "";

          if (!categoryId) {
            console.warn("Kategori güncellemesi: Geçersiz kategori ID'si", updatedCategory);
            toast.error("Kategori görseli güncelleme başarısız oldu");
            return;
          }

          // Kategorileri güncelle
          const updatedCategories = categories.map(cat => {
            if (cat.id === categoryId) {
              return { ...cat, image_url: imageUrl };
            }
            return cat;
          });

          setCategories(updatedCategories);

          // Kategori objelerini de güncelle - güvenli bir şekilde
          if (groupedProducts) {
            Object.keys(groupedProducts).forEach(catId => {
              if (parseInt(catId) === categoryId) {
                if (groupedProducts[catId]) {
                  groupedProducts[catId].image_url = imageUrl;
                }
              }
            });
          }

          // Görüntüleri anında güncellemek için UI yenileme
          // Bu aynı zamanda dikey senkronizasyon için localStorage ve CustomEvent kullanır
          try {
            // Kategori resimlerini seçici ile bul ve güncelle (modalda)
            const categoryImages = document.querySelectorAll(`img[alt="${categoryName}"]`);
            if (categoryImages.length > 0 && imageUrl) {
              // Güçlü önbellek-kırıcı parametreler
              const timestamp = new Date().getTime();
              const random = Math.random().toString(36).substring(2, 9);
              const cacheParams = `?modal=true&t=${timestamp}&r=${random}`;

              const cacheBreakingUrl = imageUrl + cacheParams;

              categoryImages.forEach(img => {
                // Resmi güncelle
                img.src = cacheBreakingUrl;
                img.style.border = "2px solid yellow"; // Güncellenen resmi belirt (test için)
              });
            }
          } catch (e) {
            console.error("Modal içi resim güncellemede hata:", e);
          }

          toast.success(`"${categoryName}" kategori görseli güncellendi`);

          // Kategori resimlerini güncelle - tüm arayüzdeki resimleri yenile
          setTimeout(() => {
            refreshCategoryImages(categoryName);
            console.log(`Kategori görselleri yenileniyor: ${categoryName}`);
          }, 500);
        }}
      />
    </div>
  );
};

export default ProductsListModal;