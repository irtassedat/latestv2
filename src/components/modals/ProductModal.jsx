// src/components/modals/ProductModal.jsx
import { useState, useEffect, useRef } from "react";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { FiX, FiUpload, FiImage, FiTrash2, FiDollarSign, FiTag, FiInfo } from "react-icons/fi";

const ProductModal = ({ 
  isOpen, 
  onClose, 
  currentTemplateId, 
  onProductAdded,
  categories,
  initialProduct = null
}) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef(null);
  
  // Ürün formu başlangıç durumu
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    image_url: "",
    price: "",
    category_id: "",
    is_visible: true,
    additional_info: "",
    allergens: []
  });
  
  // Ürün görseli önizleme
  const [imagePreview, setImagePreview] = useState("");

  // initialProduct değiştiğinde formu güncelle
  useEffect(() => {
    if (initialProduct) {
      setProductForm({
        name: initialProduct.name || "",
        description: initialProduct.description || "",
        image_url: initialProduct.image_url || "",
        price: initialProduct.price || "",
        category_id: initialProduct.category_id || "",
        is_visible: initialProduct.is_visible !== undefined ? initialProduct.is_visible : true,
        additional_info: initialProduct.additional_info || "",
        allergens: initialProduct.allergens || []
      });
      
      // Eğer ürünün görseli varsa önizlemeyi ayarla
      if (initialProduct.image_url) {
        setImagePreview(initialProduct.image_url);
      } else {
        setImagePreview("");
      }
    } else {
      // Yeni ürün ekleme durumunda formu ve önizlemeyi sıfırla
      setProductForm({
        name: "",
        description: "",
        image_url: "",
        price: "",
        category_id: "",
        is_visible: true,
        additional_info: "",
        allergens: []
      });
      setImagePreview("");
    }
  }, [initialProduct]);

  // Form değişikliklerini yönetme
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;
    setProductForm({ ...productForm, [name]: inputValue });
  };
  
  // Görsel yükleme işlemi
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Desteklenmeyen dosya formatı! Lütfen JPEG, PNG, GIF veya WebP formatında bir resim yükleyin.");
      return;
    }
    
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("Dosya boyutu çok büyük! Maksimum 5MB destekleniyor.");
      return;
    }
    
    try {
      setImageLoading(true);
      
      // FormData ile dosyayı gönder
      const formData = new FormData();

      // ThemeManager.jsx'de başarılı olan kodu temel alalım
      formData.append('media', file); // ThemeManager.jsx'de 'media' olarak kullanılıyor

      // Ürün ID'si varsa ekleyelim
      if (initialProduct?.id) {
        formData.append('productId', initialProduct.id);
      }
      
      // API isteği için hata yakalama ve yeniden deneme eklendi
      let retryCount = 0;
      let response;

      while (retryCount < 3) {
        try {
          // ThemeManager.jsx'deki gibi medya yükleme API'sini kullanalım
          response = await api.post('/api/theme/upload-media', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            },
            timeout: 30000 // 30 saniye zaman aşımı
          });

          // Başarılı olursa döngüden çık
          break;
        } catch (uploadError) {
          console.warn(`Görsel yükleme denemesi ${retryCount + 1} başarısız:`, uploadError);
          retryCount++;

          // Son deneme başarısız olursa, hata fırlat
          if (retryCount >= 3) {
            throw uploadError;
          }

          // Yeniden denemeden önce kısa bir bekleme ekle
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // Yanıt doğrulama ve hata kontrolü ekle
      if (!response || !response.data) {
        console.error("API yanıtı geçersiz:", response);
        throw new Error("Görsel yükleme yanıtı alınamadı");
      }

      // ThemeManager.jsx'deki gibi API yanıtını işleyelim
      console.log("API yanıtı:", response.data);

      if (response.data.success) {
        // Doğru URL'yi oluştur - ThemeManager.jsx'deki gibi sunucu adresi ile birleştir
        const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';
        const imageUrl = `${apiBaseUrl}${response.data.url}`;
        console.log("Oluşturulan tam URL:", imageUrl);
      } else {
        console.error("API yanıtı başarısız:", response.data);
        throw new Error(response.data.error || "Görsel yüklenemedi");
      }

      // Doğru URL'yi oluştur - ThemeManager.jsx'deki gibi sunucu adresi ile birleştir
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5050';
      const imageUrl = `${apiBaseUrl}${response.data.url}`;

      console.log("Başarıyla yüklenen görsel URL'si:", imageUrl);

      // URL'yi kontrol et ve gerekirse düzelt
      let fixedUrl = imageUrl;
      if (imageUrl.includes('?')) {
        // URL'de sorgu parametresi varsa, zaman damgası ekle
        fixedUrl = `${imageUrl}&t=${new Date().getTime()}`;
      } else {
        // URL'de sorgu parametresi yoksa, zaman damgası ekle
        fixedUrl = `${imageUrl}?t=${new Date().getTime()}`;
      }

      // Konsola düzeltilmiş URL'yi yazdır
      console.log("Düzeltilmiş URL:", fixedUrl);

      // Form ve önizlemeyi güncelle
      setProductForm({ ...productForm, image_url: fixedUrl });
      setImagePreview(fixedUrl);

      toast.success("Görsel başarıyla yüklendi");
    } catch (error) {
      console.error("Görsel yüklenemedi:", error);

      // Hata mesajını analiz et ve daha açıklayıcı bir mesaj göster
      let errorMessage = "Görsel yüklenirken bir hata oluştu";

      if (error.response) {
        // Sunucu yanıtı hatalarını ayrıntılı göster
        console.error("Sunucu yanıtı içeriği:", error.response.data);

        // Özel olarak 404 hatası için daha açıklayıcı mesaj oluştur
        if (error.response.status === 404) {
          errorMessage = "API endpoint'i bulunamadı: /api/theme/upload-media endpointi sunucuda mevcut değil.";

          // Farklı bir endpoint daha deneyelim - belki diğer endpoint çalışır
          try {
            console.log("Alternatif endpoint deneniyor: /api/uploads/image");
            const altFormData = new FormData();
            altFormData.append('file', file);

            const altResponse = await api.post('/api/uploads/image', altFormData, {
              headers: { 'Content-Type': 'multipart/form-data' },
              timeout: 30000
            });

            if (altResponse && altResponse.data) {
              console.log("Alternatif endpoint başarılı:", altResponse.data);

              // Alternatif endpoint'ten gelen URL'yi kullan
              const altImageUrl = altResponse.data.url || altResponse.data.path || "";

              if (altImageUrl) {
                setProductForm({ ...productForm, image_url: altImageUrl });
                setImagePreview(altImageUrl);
                toast.success("Görsel başarıyla yüklendi (alternatif endpoint)");
                return; // Ana try-catch blokundan çık
              }
            }
          } catch (altError) {
            console.error("Alternatif endpoint de başarısız:", altError);
          }
        } else if (error.response.status === 500) {
          // 500 hatalarında daha ayrıntılı bilgi almaya çalışalım
          const serverError = error.response.data?.error || error.response.data?.message || "";
          errorMessage = `Sunucu hatası: ${serverError || "Görsel yüklenemedi. Dosya boyutu veya formatı uygun olmayabilir."}`;
        } else if (error.response.status === 413) {
          errorMessage = "Dosya boyutu çok büyük. Lütfen daha küçük bir görsel seçin.";
        } else if (error.response.status === 403) {
          errorMessage = "Yetki hatası: Görsel yükleme izniniz yok.";
        } else if (error.response.status === 400) {
          // 400 Bad Request - genellikle form alanları için hata mesajları içerir
          const fieldError = error.response.data?.error || error.response.data?.message || "";
          errorMessage = `Form hatası: ${fieldError || "Geçersiz form alanları"}`;
        } else if (error.response.data && error.response.data.error) {
          errorMessage = `Hata: ${error.response.data.error}`;
        } else if (error.response.data && error.response.data.message) {
          errorMessage = `Hata: ${error.response.data.message}`;
        } else {
          errorMessage = `Sunucu hatası (${error.response.status}): Görsel yüklenemedi.`;
        }
      } else if (error.request) {
        // İstek gönderildi ama yanıt alınamadı
        errorMessage = "Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.";
      } else if (error.message && error.message.includes("timeout")) {
        errorMessage = "Yükleme zaman aşımına uğradı. Lütfen daha sonra tekrar deneyin.";
      }

      toast.error(errorMessage);

      // Alternatif yöntem: URL ile devam et
      const urlInput = window.prompt(
        "Görsel yüklenemedi. İsterseniz görselin URL'sini manuel olarak girebilirsiniz:\n\n" +
        "Örnek URL formatları:\n" +
        "1. /uploads/gorsel.jpg (Sunucu klasöründeki bir dosya)\n" +
        "2. https://example.com/gorsel.jpg (Dış kaynak)\n\n" +
        "Not: Ürün görseli yüklerken sorun yaşıyorsanız, şu adımları deneyebilirsiniz:\n" +
        "- Görselleri önce /public/uploads/ klasörüne FTP ile yükleyip, sonra /uploads/gorsel.jpg formatında URL girin\n" +
        "- Kategori görsel yükleme sistemini test edin (Kategori bölümünden)",
        productForm.image_url || ""
      );

      if (urlInput) {
        setProductForm({ ...productForm, image_url: urlInput });
        setImagePreview(urlInput);
        toast.info("Manuel URL girişi kullanıldı");
      }
    } finally {
      setImageLoading(false);
    }
  };
  
  // Görseli kaldır
  const handleRemoveImage = () => {
    setProductForm({ ...productForm, image_url: "" });
    setImagePreview("");
  };

  // Form gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      // Formda zorunlu alanların kontrolü
      if (!productForm.name.trim()) {
        toast.error("Ürün adı girmelisiniz!");
        return;
      }
      
      if (!productForm.category_id) {
        toast.error("Lütfen bir kategori seçin!");
        return;
      }
      
      if (isNaN(parseFloat(productForm.price)) || parseFloat(productForm.price) < 0) {
        toast.error("Lütfen geçerli bir fiyat girin!");
        return;
      }

      const productData = {
        name: productForm.name,
        description: productForm.description,
        image_url: productForm.image_url,
        price: parseFloat(productForm.price) || 0,
        category_id: productForm.category_id,
        additional_info: productForm.additional_info,
        allergens: productForm.allergens
      };

      let productId;

      if (initialProduct) {
        // Ürünü güncelle
        await api.put(`/api/products/${initialProduct.id}`, productData);
        
        productId = initialProduct.id;
        
        // Şablondaki ürün görünürlüğünü güncelle (menü şablonu ise)
        if (currentTemplateId) {
          // Önce mevcut ürünleri al ve sadece güncellenen ürünün görünürlüğünü değiştir
          const productsResponse = await api.get(`/api/templates/menu/${currentTemplateId}/products`);
          const existingProducts = productsResponse?.data || [];
          console.log("Mevcut template ürünleri:", existingProducts.length);

          // Tüm ürünlerin düzenlenen ürün hariç aynı kaldığı bir products array'i oluştur
          const productsToUpdate = existingProducts.map(p => ({
            product_id: p.id,
            is_visible: p.id === initialProduct.id ? productForm.is_visible : p.is_visible
          }));

          // Tek ürün yerine tüm ürünleri güncelle (sadece düzenlenen ürünün görünürlüğü değişecek)
          await api.post(`/api/templates/menu/${currentTemplateId}/products`, {
            products: productsToUpdate
          });
        }
        
        toast.success(`"${productForm.name}" başarıyla güncellendi`);
      } else {
        // Yeni ürün oluştur
        const productResponse = await api.post("/api/products", productData);
        productId = productResponse.data.id;

        // Ürünü şablona ekle (menü şablonu ise)
        if (currentTemplateId) {
          await api.post(`/api/templates/menu/${currentTemplateId}/products`, {
            products: [{ 
              product_id: productId, 
              is_visible: productForm.is_visible 
            }]
          });
        }

        toast.success(`"${productForm.name}" başarıyla eklendi`);
      }
      
      // Formu sıfırla ve ebeveyn bileşeni bilgilendir
      setProductForm({
        name: "",
        description: "",
        image_url: "",
        price: "",
        category_id: "",
        is_visible: true,
        additional_info: "",
        allergens: []
      });
      setImagePreview("");
      
      // Callback ile işlem tamamlandığını ve ilgili verileri bildir
      if (onProductAdded) {
        // Ürün verilerini geri gönder
        const productData = initialProduct
          ? {
              ...initialProduct,
              ...productForm,
              id: initialProduct.id,  // id'nin kesinlikle korunduğundan emin ol
              name: productForm.name,
              description: productForm.description,
              image_url: productForm.image_url,
              price: parseFloat(productForm.price) || 0,
              category_id: productForm.category_id,
              is_visible: productForm.is_visible
            }
          : response?.data;

        console.log("Güncellenen ürün verisi:", productData);
        onProductAdded(productData, initialProduct ? 'update' : 'add');
      }
      onClose();
    } catch (error) {
      console.error("Ürün işlemi sırasında hata:", error);
      
      // Hata mesajını API'den al
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        (initialProduct ? "Ürün güncellenemedi!" : "Ürün eklenemedi!");
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-white z-10">
          <h2 className="text-xl font-bold">
            {initialProduct ? "Ürün Düzenle" : "Yeni Ürün Ekle"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Sol Sütun - Ürün Görseli */}
            <div className="md:col-span-1">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 flex items-center">
                  <FiImage className="mr-1" size={16} />
                  Ürün Görseli
                </label>
                
                <div className="border rounded-lg overflow-hidden flex flex-col">
                  <div className="relative">
                    {imagePreview ? (
                      <div className="w-full aspect-square bg-gray-100 relative">
                        <img
                          src={imagePreview}
                          alt="Ürün Görseli"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/public/vite.svg';
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md hover:bg-red-50"
                          title="Görseli Kaldır"
                        >
                          <FiTrash2 size={14} className="text-red-500" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 flex items-center justify-center text-gray-400">
                        <div className="text-center p-4">
                          <FiImage size={48} className="mx-auto mb-2" />
                          <p className="text-sm">Görsel Ekleyin</p>
                        </div>
                      </div>
                    )}
                    
                    {imageLoading && (
                      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-2 border-t">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                      accept="image/*"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded flex items-center justify-center gap-1"
                    >
                      <FiUpload size={14} />
                      <span>Görsel Yükle</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">Görsel URL</label>
                  <input
                    type="text"
                    name="image_url"
                    value={productForm.image_url}
                    onChange={handleFormChange}
                    placeholder="https://..."
                    className="w-full border rounded-lg p-2 text-sm"
                  />
                </div>
              </div>
            </div>
            
            {/* Sağ Sütun - Ürün Bilgileri */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center">
                  <FiTag className="mr-1" size={16} />
                  Ürün Adı
                </label>
                <input
                  type="text"
                  name="name"
                  value={productForm.name}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg p-2"
                  required
                  placeholder="Ürün Adı"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Açıklama</label>
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg p-2"
                  rows="3"
                  placeholder="Ürün açıklaması..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1 flex items-center">
                    <FiDollarSign className="mr-1" size={16} />
                    Fiyat
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">₺</span>
                    <input
                      type="number"
                      name="price"
                      value={productForm.price}
                      onChange={handleFormChange}
                      className="w-full border rounded-lg p-2 pl-8"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select
                    name="category_id"
                    value={productForm.category_id}
                    onChange={handleFormChange}
                    className="w-full border rounded-lg p-2"
                    required
                  >
                    <option value="">Kategori Seçin</option>
                    {categories && categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 flex items-center">
                  <FiInfo className="mr-1" size={16} />
                  Ek Bilgiler
                </label>
                <textarea
                  name="additional_info"
                  value={productForm.additional_info}
                  onChange={handleFormChange}
                  className="w-full border rounded-lg p-2"
                  rows="2"
                  placeholder="Alerjenler, kalori değerleri, içerik bilgileri..."
                />
              </div>
              
              <div className="flex items-center p-3 rounded-lg bg-blue-50">
                <input
                  type="checkbox"
                  name="is_visible"
                  id="is_visible"
                  checked={productForm.is_visible}
                  onChange={handleFormChange}
                  className="mr-2 h-4 w-4"
                />
                <label htmlFor="is_visible" className="text-sm text-blue-800">
                  Menüde görünür olsun
                </label>
              </div>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>{initialProduct ? "Güncelleniyor..." : "Ekleniyor..."}</span>
                </>
              ) : (
                <>{initialProduct ? "Güncelle" : "Ürün Ekle"}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;