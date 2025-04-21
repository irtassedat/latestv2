import { useEffect, useState, useContext, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../lib/axios";
import { FiEdit2, FiTrash2, FiEye, FiEyeOff, FiPlus, FiUpload, FiDownload } from "react-icons/fi";
import { HiOutlineDocumentSearch } from "react-icons/hi";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import ReactPaginate from "react-paginate";
import { useAuth } from "../contexts/AuthContext";
import { SelectedBranchContext } from "../layout/MainLayout";
import { useRef } from "react";

// Loglama yardımcı fonksiyonu
const logger = {
  debug: process.env.NODE_ENV === 'development' ? console.debug : () => { },
  log: process.env.NODE_ENV === 'development' ? console.log : () => { },
  info: console.info,
  warn: console.warn,
  error: console.error
};

const BranchProductManager = () => {
  const { id: paramId } = useParams();
  const { currentUser, isSuperAdmin } = useAuth();

  // MainLayout'dan seçilen şube ID'si
  const contextBranchId = useContext(SelectedBranchContext);

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [branchLookup, setBranchLookup] = useState({});
  const [lastFetchedBranchId, setLastFetchedBranchId] = useState(null);
  const [isApiCallInProgress, setIsApiCallInProgress] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    price: "",
    category_id: "",
    is_visible: true,
    stock_count: 0,
  });

  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const apiCallTimeoutRef = useRef(null);

  // Kategorilere göre arkaplan renkleri
  const categoryColors = {
    "Tatlılar": "bg-pink-100 text-pink-800",
    "Kahveler": "bg-amber-100 text-amber-800",
    "Soğuk İçecekler": "bg-blue-100 text-blue-800",
    "Sıcak İçecekler": "bg-orange-100 text-orange-800",
    "Ana Yemekler": "bg-green-100 text-green-800",
    "Başlangıçlar": "bg-purple-100 text-purple-800",
    "İçecekler": "bg-cyan-100 text-cyan-800",
    "Atıştırmalıklar": "bg-yellow-100 text-yellow-800",
    "Salatalar": "bg-emerald-100 text-emerald-800",
    "Çaylar": "bg-red-100 text-red-800",
  };

  // Şubeleri getiren fonksiyon - Cache'leme ile optimize edilmiş
  const fetchBranches = useCallback(async () => {
    try {
      const response = await api.get("/api/branches");
      const branchesData = response.data || [];
      setBranches(branchesData);

      // Şube arama işlemlerini hızlandırmak için lookup tablosu oluştur
      const lookup = {};
      branchesData.forEach(branch => {
        lookup[branch.id] = branch;
      });
      setBranchLookup(lookup);

      return branchesData;
    } catch (error) {
      logger.error("Şubeler yüklenirken hata:", error);
      toast.error("Şubeler yüklenemedi!");
      return [];
    }
  }, []);

  // Kategorileri getiren fonksiyon
  const fetchCategories = useCallback(async () => {
    try {
      const response = await api.get("/api/categories");
      setCategories(response.data || []);
    } catch (error) {
      logger.error("Kategoriler yüklenirken hata:", error);
      toast.error("Kategoriler yüklenemedi!");
    }
  }, []);

  // Şube ürünlerini getiren fonksiyon - Debounce ve önbellek ile optimize edilmiş
  const fetchBranchProducts = useCallback(async (branchId) => {
    // Eğer şube ID'si yoksa işlem yapma
    if (!branchId) {
      logger.warn("fetchBranchProducts: Şube ID'si belirtilmedi");
      setLoading(false);
      return;
    }

    // Eğer zaten aynı şubenin ürünlerini yüklüyorsak ve bir API çağrısı devam ediyorsa işlemi iptal et
    if (lastFetchedBranchId === branchId && isApiCallInProgress) {
      logger.info(`${branchId} ID'li şubenin ürünleri zaten yükleniyor, tekrar istek yapılmayacak.`);
      return;
    }

    // Eğer daha önce bu şubenin ürünlerini yüklediysek ve ürünler varsa tekrar yükleme
    if (lastFetchedBranchId === branchId && products.length > 0) {
      logger.info(`${branchId} ID'li şubenin ürünleri zaten yüklü, tekrar yüklenmeyecek.`);
      setLoading(false);
      return;
    }

    // Önceki zamanlayıcıyı temizle
    if (apiCallTimeoutRef.current) {
      clearTimeout(apiCallTimeoutRef.current);
    }

    // API çağrısı için zamanlayıcı ayarla (debounce)
    apiCallTimeoutRef.current = setTimeout(async () => {
      // API çağrısı başlıyor
      setIsApiCallInProgress(true);
      setLoading(true);
      logger.info(`${branchId} ID'li şubenin ürünleri getiriliyor...`);

      try {
        // Önce şube bilgilerini ve şablon bilgisini alalım
        const branchResponse = await api.get(`/api/branches/${branchId}`);
        const branch = branchResponse.data;

        let productsResponse;

        // Şubenin menü şablonu varsa, o şablondaki ürünleri getir
        if (branch.menu_template_id) {
          logger.info(`Şube ${branchId} için menü şablonu ID: ${branch.menu_template_id}`);
          productsResponse = await api.get(`/api/products/branch/${branchId}`);
        } else {
          // Menü şablonu yoksa, normal şube ürünlerini getir (geriye uyumluluk)
          logger.info(`Şube ${branchId} için şablon bulunamadı, normal şube ürünlerini getiriyorum`);
          productsResponse = await api.get(`/api/products/branch/${branchId}`);
        }

        if (productsResponse.data && Array.isArray(productsResponse.data)) {
          logger.info(`${productsResponse.data.length} ürün başarıyla yüklendi`);
          setProducts(productsResponse.data);
        } else {
          logger.warn("API'den beklenmeyen yanıt formatı");
          setProducts([]);
        }

        // Son yüklenen şube ID'sini güncelle
        setLastFetchedBranchId(branchId);
      } catch (error) {
        logger.error("Ürünler yüklenirken hata:", error);
        setProducts([]);

        // Hata mesajını daha açıklayıcı hale getir
        if (error.response) {
          logger.error("Sunucu yanıtı:", error.response.status, error.response.data);
          toast.error(`Ürünler yüklenemedi! (${error.response.status}: ${error.response.data.error || 'Bilinmeyen hata'})`);
        } else if (error.request) {
          logger.error("Sunucudan yanıt alınamadı");
          toast.error("Sunucu yanıt vermiyor. Lütfen internet bağlantınızı kontrol edin!");
        } else {
          toast.error(`Ürünler yüklenemedi: ${error.message}`);
        }
      } finally {
        setLoading(false);
        setIsApiCallInProgress(false);
      }
    }, 300); // 300ms debounce
  }, [lastFetchedBranchId, isApiCallInProgress, products.length]);

  // Şube ve kategori verilerini yükle
  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([
        fetchBranches(),
        fetchCategories()
      ]);
    };

    loadInitialData();

    // Temizleme fonksiyonu
    return () => {
      if (apiCallTimeoutRef.current) {
        clearTimeout(apiCallTimeoutRef.current);
      }
    };
  }, [fetchBranches, fetchCategories]);

  // Şube seçimi değişince
  useEffect(() => {
    const determineEffectiveBranchId = async () => {
      // Şubeler henüz yüklenmediyse işlem yapma
      if (loading && branches.length === 0) return;

      // URL'den gelen paramId, context'ten gelen contextBranchId veya şube yöneticisinin kendi şubesi
      const effectiveBranchId = paramId || contextBranchId || (currentUser?.branch_id ? currentUser.branch_id.toString() : null);

      logger.debug("Şube seçimi güncelleniyor:", {
        paramId,
        contextBranchId,
        currentUserBranchId: currentUser?.branch_id,
        effectiveBranchId,
        branchesLoaded: branches.length > 0
      });

      if (effectiveBranchId) {
        setSelectedBranchId(effectiveBranchId);

        // Eğer bu şube ID'si daha önce yüklendiyse ve ürünler mevcutsa tekrar yükleme yapma
        if (lastFetchedBranchId !== effectiveBranchId) {
          fetchBranchProducts(effectiveBranchId);
        }

        // URL güncelleme (şube değiştiyse)
        if (!paramId || paramId !== effectiveBranchId) {
          navigate(`/admin/branches/${effectiveBranchId}/products`, { replace: true });
        }
      } else if (branches.length > 0) {
        // Eğer hiçbir ID belirtilmediyse ve şubeler yüklendiyse
        const firstBranchId = branches[0].id.toString();
        logger.info("Varsayılan ilk şube kullanılıyor:", firstBranchId);
        setSelectedBranchId(firstBranchId);

        // Yalnızca şube değiştiyse ürünleri yeniden yükle
        if (lastFetchedBranchId !== firstBranchId) {
          fetchBranchProducts(firstBranchId);
        }

        navigate(`/admin/branches/${firstBranchId}/products`, { replace: true });
      } else {
        logger.error("Şube seçilemedi: Kullanılabilir şube bulunamadı");
        setLoading(false);
        toast.error("Kullanılabilir şube bulunamadı. Lütfen sistem yöneticinize başvurun.");
      }
    };

    determineEffectiveBranchId();
  }, [paramId, contextBranchId, branches, currentUser, loading, navigate, fetchBranchProducts, lastFetchedBranchId]);

  // Ürün görünürlüğünü güncelle
  const handleVisibilityToggle = useCallback(async (product) => {
    try {
      // Ürün görünürlüğünü tersine çevir
      const newVisibility = !product.is_visible;

      await api.patch("/api/products/branch-product", {
        branch_id: selectedBranchId,
        product_id: product.id,
        is_visible: newVisibility
      });

      // UI'ı güncelle - mevcut ürünler üzerinde değişiklik yap
      setProducts(currentProducts =>
        currentProducts.map(p =>
          p.id === product.id ? { ...p, is_visible: newVisibility } : p
        )
      );

      toast.success(`${product.name} ${newVisibility ? 'görünür' : 'gizli'} yapıldı`);
    } catch (error) {
      logger.error("Görünürlük değiştirilirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  }, [selectedBranchId]);

  // Ürün stok durumunu güncelle
  const handleStockUpdate = useCallback(async (product, newStock) => {
    try {
      // Sayı olarak çevir ve negatif olmamasını sağla
      const stockCount = Math.max(0, parseInt(newStock) || 0);

      await api.patch("/api/products/branch-product", {
        branch_id: selectedBranchId,
        product_id: product.id,
        stock_count: stockCount
      });

      // UI'ı güncelle
      setProducts(currentProducts =>
        currentProducts.map(p =>
          p.id === product.id ? { ...p, stock_count: stockCount } : p
        )
      );

      toast.success(`${product.name} stok durumu güncellendi`);
    } catch (error) {
      logger.error("Stok güncellenirken hata:", error);
      toast.error("Stok güncellenemedi!");
    }
  }, [selectedBranchId]);

  // Ürün silme
  const handleDelete = useCallback(async (product) => {
    // Super Admin değilse engelle
    if (!isSuperAdmin) {
      toast.error("Bu işlem için yetkiniz bulunmamaktadır");
      return;
    }

    if (!window.confirm(`${product.name} ürününü silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      await api.delete(`/api/products/${product.id}`);

      // UI'dan ürünü kaldır
      setProducts(currentProducts => currentProducts.filter(p => p.id !== product.id));

      toast.success(`${product.name} başarıyla silindi`);
    } catch (error) {
      logger.error("Ürün silinirken hata:", error);
      toast.error("Ürün silinemedi!");
    }
  }, [isSuperAdmin]);

  // Düzenlemek için formu hazırla
  const handleEdit = useCallback((product) => {
    setEditingProduct(product);
    setForm({
      name: product.name,
      description: product.description || "",
      image_url: product.image_url || "",
      price: product.price,
      category_id: product.category_id,
      is_visible: product.is_visible !== false, // undefined ise true kabul et
      stock_count: product.stock_count || 0
    });
    setShowModal(true);
  }, []);

  // Yeni ürün eklemek için formu hazırla
  const handleAdd = useCallback(() => {
    // Super Admin değilse engelle
    if (!isSuperAdmin) {
      toast.error("Bu işlem için yetkiniz bulunmamaktadır");
      return;
    }

    setEditingProduct(null);
    setForm({
      name: "",
      description: "",
      image_url: "",
      price: "",
      category_id: "",
      is_visible: true,
      stock_count: 0
    });
    setShowModal(true);
  }, [isSuperAdmin]);

  // Form değişikliklerini izle
  const handleFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    // Checkbox için checked değerini, diğerleri için value değerini kullan
    const inputValue = type === 'checkbox' ? checked : value;

    setForm(prevForm => ({ ...prevForm, [name]: inputValue }));
  }, []);

  // Form gönderimi
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();

    try {
      let response;

      // Super Admin değilse ve yeni ürün eklemeye çalışıyorsa engelle
      if (!editingProduct && !isSuperAdmin) {
        toast.error("Yeni ürün ekleme yetkiniz bulunmamaktadır");
        return;
      }

      if (editingProduct) {
        // Var olan ürünü güncelle - Super Admin değilse sadece belirli alanları güncelleyebilir
        if (isSuperAdmin) {
          // Super Admin tüm özellikleri güncelleyebilir
          response = await api.put(`/api/products/${editingProduct.id}`, {
            name: form.name,
            description: form.description,
            image_url: form.image_url,
            price: parseFloat(form.price),
            category_id: form.category_id
          });
        }

        // Şube özelliklerini güncelle - Hem Super Admin hem de Şube Yöneticisi yapabilir
        await api.patch("/api/products/branch-product", {
          branch_id: selectedBranchId,
          product_id: editingProduct.id,
          is_visible: form.is_visible,
          stock_count: parseInt(form.stock_count)
        });

        toast.success(`${form.name} başarıyla güncellendi`);
      } else {
        // Yeni ürün ekle - Sadece Super Admin yapabilir
        response = await api.post("/api/products", {
          name: form.name,
          description: form.description,
          image_url: form.image_url,
          price: parseFloat(form.price),
          category_id: form.category_id
        });

        // Yeni ürün için şube özelliklerini ayarla
        await api.patch("/api/products/branch-product", {
          branch_id: selectedBranchId,
          product_id: response.data.id,
          is_visible: form.is_visible,
          stock_count: parseInt(form.stock_count)
        });

        toast.success(`${form.name} başarıyla eklendi`);
      }

      // Ürünleri yeniden yükle
      fetchBranchProducts(selectedBranchId);

      // Modalı kapat
      setShowModal(false);

    } catch (error) {
      logger.error("Form gönderilirken hata:", error);
      toast.error("İşlem başarısız oldu!");
    }
  }, [editingProduct, isSuperAdmin, selectedBranchId, form, fetchBranchProducts]);

  // Excel'e aktar
  const handleExportExcel = useCallback(() => {
    // Doğrudan mevcut ürünleri kullan

    // Excel için data hazırla
    const exportData = products.map(product => ({
      'Ürün Adı': product.name,
      'Kategori': product.category_name,
      'Fiyat': product.price,
      'Stok': product.stock_count || 0,
      'Görünür': product.is_visible ? 'Evet' : 'Hayır',
      'Açıklama': product.description || '',
      'Görsel URL': product.image_url || '',
      'Ürün ID': product.id
    }));

    // Excel dosyasını oluştur
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler");

    // Dosyayı indir
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });

    // Şube adını al
    const branchName = branchLookup[selectedBranchId]?.name || "Sube";

    // Dosya adında şube adı ve tarih bilgisi olsun
    const date = new Date().toISOString().split('T')[0];
    saveAs(data, `${branchName}_Urunler_${date}.xlsx`);

    toast.success("Excel dosyası indiriliyor...");
  }, [products, branchLookup, selectedBranchId]);

  // Excel'den içe aktar
  const handleImportExcel = useCallback(async (e) => {
    // Super Admin değilse engelle
    if (!isSuperAdmin) {
      toast.error("Bu işlem için yetkiniz bulunmamaktadır");
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);

    try {
      // Excel verilerini oku
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      // Önce şube bilgilerini alalım
      const branchCheck = await api.get(`/api/branches/${selectedBranchId}`);
      const branch = branchCheck.data;

      // Menü şablonu varsa yönetimi farklı yap
      if (branch.menu_template_id) {
        logger.info(`Şube ${selectedBranchId} için menü şablonu ID: ${branch.menu_template_id} kullanılacak`);

        // Bu işlem için özel bir API endpointi oluşturmamız gerekiyor
        // Filter out any rows missing a product name or category, then map to the payload shape
        const productsData = jsonData
          .filter(item => item['Ürün Adı'] && item['Kategori']) // Sadece geçerli ürünleri al
          .map(item => ({
            name: item['Ürün Adı'],
            category: item['Kategori'],
            price: parseFloat(item['Fiyat']) || 0,
            stock_count: parseInt(item['Stok']) || 0,
            is_visible: item['Görünür'] === 'Evet',
            description: item['Açıklama'] || '',
            image_url: item['Görsel URL'] || ''
          }));

        // En az bir ürün olduğundan emin ol
        if (productsData.length === 0) {
          throw new Error("İçe aktarılacak geçerli ürün bulunamadı");
        }

        const importData = {
          branchId: selectedBranchId, 
          menuTemplateId: branch.menu_template_id,
          products: productsData
        };

        console.log("API'ye gönderilecek veri:", importData);

        // Şablona ürün ekleyecek yeni API çağrısı
        await api.post(`/api/templates/import-template-products`, importData);


        // Şablona ürün ekleyecek yeni API çağrısı
        await api.post(`/api/templates/import-template-products`, importData);

        toast.success("Şablon ürünleri başarıyla içe aktarıldı");
      } else {
        // Şablonsuz içe aktarma (klasik yöntem)
        const products = jsonData.map(item => ({
          Ürün: item['Ürün Adı'] || item['Ürün'] || '',
          Kategori: item['Kategori'] || '',
          Fiyat: parseFloat(item['Fiyat']) || 0,
          Stok: parseInt(item['Stok']) || 0,
          Görsel: item['Görsel URL'] || item['Görsel'] || '',
          Açıklama: item['Açıklama'] || '',
          BranchId: parseInt(selectedBranchId) // Burada şube ID'sini de gönderiyoruz
        }));

        // Backend'e gönder
        const response = await api.post("/api/products/bulk", {
          products,
          branchId: selectedBranchId  // Şube ID'sini ayrıca gönderelim
        });

        toast.success(`İçe aktarma tamamlandı: ${response.data.stats.inserted} ürün eklendi, ${response.data.stats.skipped} atlandı`);
      }

      // Ürünleri yeniden yükle
      fetchBranchProducts(selectedBranchId);

    } catch (error) {
      logger.error("Excel içe aktarılırken hata:", error);
      toast.error("Excel içe aktarılamadı!");
    } finally {
      setUploadLoading(false);
      setShowUploadModal(false);
      // Dosya seçiciyi sıfırla
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isSuperAdmin, selectedBranchId, fetchBranchProducts]);

  // Filtreleme işlemleri
  const filteredProducts = products.filter(product => {
    // Arama terimini kontrol et
    const matchesSearch =
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (product.category_name && product.category_name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Kategori filtresini kontrol et
    const matchesCategory = !selectedCategory || product.category_id?.toString() === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Sayfalandırma
  const pageCount = Math.ceil(filteredProducts.length / itemsPerPage);
  const displayedProducts = filteredProducts.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Şube Ürün Yönetimi</h1>

          {/* Şube göstergesi */}
          <div className="w-full md:w-auto">
            {isSuperAdmin && branches.length > 1 ? (
              <select
                value={selectedBranchId || ""}
                onChange={(e) => navigate(`/admin/branches/${e.target.value}/products`)}
                className="w-full md:w-64 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Şube Seçin</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="text-lg font-medium text-gray-700 bg-gray-50 px-4 py-2 rounded-lg">
                Şube: {branchLookup[selectedBranchId]?.name || "Yükleniyor..."}
              </div>
            )}
          </div>
        </div>

        {selectedBranchId && (
          <>
            {/* Arama, Filtre ve İşlem Butonları */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                {/* Arama */}
                <div className="relative w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Ürün ara..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <HiOutlineDocumentSearch className="absolute left-2 top-2.5 text-gray-400" size={20} />
                </div>

                {/* Kategori Filtresi */}
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full md:w-48 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Tüm Kategoriler</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* İşlem Butonları */}
              <div className="flex flex-wrap gap-2">
                {/* Yeni Ürün - Sadece Super Admin */}
                {isSuperAdmin && (
                  <button
                    onClick={handleAdd}
                    className="flex items-center gap-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <FiPlus size={18} />
                    <span>Yeni Ürün</span>
                  </button>
                )}

                {/* Excel Yükle - Sadece Super Admin */}
                {isSuperAdmin && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="flex items-center gap-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <FiUpload size={18} />
                    <span>Excel Yükle</span>
                  </button>
                )}

                {/* Excel İndir - Herkes */}
                <button
                  onClick={handleExportExcel}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FiDownload size={18} />
                  <span>Excel İndir</span>
                </button>
              </div>
            </div>

            {/* Ürün Tablosu */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7c-2 0-3 1-3 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 11a2 2 0 100-4 2 2 0 000 4z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 16l-5-5-4 4-3-3" />
                </svg>
                <h3 className="text-lg font-medium text-gray-600 mb-2">Ürün Bulunamadı</h3>
                <p className="text-gray-500 mb-4">Arama kriterlerinize uygun ürün bulunmamaktadır.</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Filtreleri Temizle
                </button>

                {/* Şube yöneticisi ve ürün yoksa */}
                {!isSuperAdmin && products.length === 0 && !searchTerm && !selectedCategory && (
                  <p className="mt-4 text-orange-600">
                    Şu anda şubenizde görüntülenecek ürün bulunmamaktadır. Lütfen yöneticinizle iletişime geçin.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-left font-medium text-gray-600 border-b">Görsel</th>
                        <th className="p-3 text-left font-medium text-gray-600 border-b">Ürün</th>
                        <th className="p-3 text-left font-medium text-gray-600 border-b">Kategori</th>
                        <th className="p-3 text-right font-medium text-gray-600 border-b">Fiyat</th>
                        <th className="p-3 text-center font-medium text-gray-600 border-b">Stok</th>
                        <th className="p-3 text-center font-medium text-gray-600 border-b">Görünür</th>
                        <th className="p-3 text-center font-medium text-gray-600 border-b">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedProducts.map(product => (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-3 border-b">
                            <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100">
                              <img
                                src={product.image_url || "/uploads/guncellenecek.jpg"}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/uploads/guncellenecek.jpg";
                                }}
                              />
                            </div>
                          </td>
                          <td className="p-3 border-b">
                            <div className="font-medium">{product.name}</div>
                            {product.description && (
                              <div className="text-xs text-gray-500 mt-1 max-w-xs line-clamp-2">
                                {product.description}
                              </div>
                            )}
                          </td>
                          <td className="p-3 border-b">
                            <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${categoryColors[product.category_name] || "bg-gray-100 text-gray-800"}`}>
                              {product.category_name}
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium border-b">
                            {product.price} ₺
                          </td>
                          <td className="p-3 border-b">
                            <div className="flex justify-center">
                              <input
                                type="number"
                                min="0"
                                value={product.stock_count || 0}
                                onChange={(e) => handleStockUpdate(product, e.target.value)}
                                className="w-16 p-1 text-center border border-gray-300 rounded"
                              />
                            </div>
                          </td>
                          <td className="p-3 text-center border-b">
                            <button
                              onClick={() => handleVisibilityToggle(product)}
                              className={`p-2 rounded-full transition-colors ${product.is_visible
                                ? "bg-green-100 text-green-600 hover:bg-green-200"
                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                              title={product.is_visible ? "Görünür - Gizle" : "Gizli - Göster"}
                            >
                              {product.is_visible ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                            </button>
                          </td>
                          <td className="p-3 text-center border-b">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleEdit(product)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="Düzenle"
                              >
                                <FiEdit2 size={18} />
                              </button>

                              {/* Silme butonu - Sadece Super Admin */}
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleDelete(product)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                  title="Sil"
                                >
                                  <FiTrash2 size={18} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Sayfalandırma */}
                {pageCount > 1 && (
                  <div className="flex justify-between items-center mt-6">
                    <div className="text-sm text-gray-600">
                      Toplam {filteredProducts.length} ürün, {currentPage + 1}/{pageCount} sayfa
                    </div>
                    <ReactPaginate
                      previousLabel={"❮"}
                      nextLabel={"❯"}
                      breakLabel={"..."}
                      pageCount={pageCount}
                      marginPagesDisplayed={2}
                      pageRangeDisplayed={3}
                      onPageChange={(data) => setCurrentPage(data.selected)}
                      containerClassName={"flex items-center gap-1"}
                      pageClassName={"w-8 h-8 flex items-center justify-center rounded-md border hover:bg-gray-50 cursor-pointer"}
                      breakClassName={"w-8 h-8 flex items-center justify-center"}
                      previousClassName={"w-8 h-8 flex items-center justify-center rounded-md border hover:bg-gray-50 cursor-pointer"}
                      nextClassName={"w-8 h-8 flex items-center justify-center rounded-md border hover:bg-gray-50 cursor-pointer"}
                      activeClassName={"bg-blue-600 text-white hover:bg-blue-700 border-blue-600"}
                    />
                    <div className="flex items-center gap-2">
                      <label htmlFor="perPage" className="text-sm text-gray-600">
                        Sayfa başına:
                      </label>
                      <select
                        id="perPage"
                        value={itemsPerPage}
                        onChange={(e) => {
                          setItemsPerPage(Number(e.target.value));
                          setCurrentPage(0);
                        }}
                        className="border rounded-md px-2 py-1 text-sm"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Ürün Ekleme/Düzenleme Modalı */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingProduct ? `${editingProduct.name} Ürününü Düzenle` : "Yeni Ürün Ekle"}
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
                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Ürün Adı *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingProduct && !isSuperAdmin} // Şube yöneticisi düzenleyemez
                  />
                  {editingProduct && !isSuperAdmin && (
                    <p className="mt-1 text-xs text-gray-500">Ürün adını yalnızca Süper Admin değiştirebilir.</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Kategori *
                  </label>
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={handleFormChange}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingProduct && !isSuperAdmin} // Şube yöneticisi düzenleyemez
                  >
                    <option value="">Kategori Seçin</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {editingProduct && !isSuperAdmin && (
                    <p className="mt-1 text-xs text-gray-500">Kategoriyi yalnızca Süper Admin değiştirebilir.</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Fiyat (₺) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleFormChange}
                    step="0.01"
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={editingProduct && !isSuperAdmin} // Şube yöneticisi düzenleyemez
                  />
                  {editingProduct && !isSuperAdmin && (
                    <p className="mt-1 text-xs text-gray-500">Fiyatı yalnızca Süper Admin değiştirebilir.</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Stok Adedi
                  </label>
                  <input
                    type="number"
                    name="stock_count"
                    value={form.stock_count}
                    onChange={handleFormChange}
                    min="0"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">Şubenizde bulunan ürün stok adedi</p>
                </div>

                <div>
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Görsel URL
                  </label>
                  <input
                    type="text"
                    name="image_url"
                    value={form.image_url}
                    onChange={handleFormChange}
                    placeholder="https://example.com/image.jpg"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editingProduct && !isSuperAdmin} // Şube yöneticisi düzenleyemez
                  />
                  {editingProduct && !isSuperAdmin && (
                    <p className="mt-1 text-xs text-gray-500">Görseli yalnızca Süper Admin değiştirebilir.</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_visible"
                    name="is_visible"
                    checked={form.is_visible}
                    onChange={handleFormChange}
                    className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                  <label htmlFor="is_visible" className="ml-2 text-sm font-medium text-gray-700">
                    Ürün görünür olsun
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-700 text-sm font-medium mb-1">
                    Açıklama
                  </label>
                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleFormChange}
                    rows="3"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={editingProduct && !isSuperAdmin} // Şube yöneticisi düzenleyemez
                  ></textarea>
                  {editingProduct && !isSuperAdmin && (
                    <p className="mt-1 text-xs text-gray-500">Açıklamayı yalnızca Süper Admin değiştirebilir.</p>
                  )}
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingProduct ? "Güncelle" : "Ekle"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Yükleme Modalı */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                Excel Dosyası Yükle
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                Lütfen ürünlerinizi içeren bir Excel dosyası (.xlsx veya .xls) seçin.
                Dosyada şu sütunların bulunduğundan emin olun:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
                <li>Ürün Adı (zorunlu)</li>
                <li>Kategori (zorunlu)</li>
                <li>Fiyat (zorunlu)</li>
                <li>Stok (opsiyonel)</li>
                <li>Açıklama (opsiyonel)</li>
                <li>Görsel URL (opsiyonel)</li>
              </ul>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportExcel}
                accept=".xlsx, .xls"
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={uploadLoading}
              >
                İptal
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Yükleniyor...</span>
                  </>
                ) : (
                  <>
                    <FiUpload size={16} />
                    <span>Dosya Seç ve Yükle</span>
                  </>
                )}
              </button>
            </div>

            <div className="mt-4 text-xs text-gray-500">
              <p>Örnek Excel dosyası oluşturmak için önce mevcut ürünleri Excel'e aktarabilirsiniz.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BranchProductManager;