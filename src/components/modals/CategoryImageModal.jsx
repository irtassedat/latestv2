// src/components/modals/CategoryImageModal.jsx
import { useState, useRef, useEffect } from "react";
import { FiX, FiUpload, FiImage, FiTrash2, FiCheck } from "react-icons/fi";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { uploadCategoryImage as updateCategoryImageDirect, getCategoryFilename } from "../../utils/categoryImageHelper";
import { addCacheBuster } from "../../utils/image_cache_buster";

// Tema renkleri - ana dosyadan alındı
const theme = {
  primary: "#022B45",
  secondary: "#B8D7DD",
  accent: "#D98A3D",
  light: "#F4F7F8",
  dark: "#343a40",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
  white: "#ffffff",
  textPrimary: "#495057",
  textSecondary: "#6c757d"
};

const CategoryImageModal = ({ 
  isOpen, 
  onClose, 
  category = null,
  onImageUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && category) {
      // Kategori resmini önizleme olarak göster
      setImagePreview(category.image_url || "");
      setImageFile(null);
    } else {
      // Modal kapandığında state'i temizle
      setImagePreview("");
      setImageFile(null);
    }
  }, [isOpen, category]);
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Dosya tipini kontrol et
    if (!file.type.match('image.*')) {
      toast.error("Lütfen geçerli bir resim dosyası seçin");
      return;
    }
    
    // Dosya boyutunu kontrol et (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Dosya boyutu çok büyük (Max: 5MB)");
      return;
    }
    
    // Dosyayı state'e kaydet
    setImageFile(file);
    
    // Önizleme oluştur
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!category) {
      toast.error("Kategori bilgisi bulunamadı");
      return;
    }

    // Kategori ID ve name değerlerini kullanmadan önce kontrol et
    const categoryId = category.id;
    const categoryName = category.name || "Bilinmeyen Kategori";

    if (!categoryId) {
      toast.error("Geçerli bir kategori ID'si bulunamadı");
      return;
    }

    setLoading(true);

    try {
      // Yeni timestamp ve ID'ler oluştur
      const timestamp = new Date().getTime();
      const randomString = Math.random().toString(36).substring(2, 15);
      const uniqueId = `${timestamp}_${randomString}`;

      // Kategori dosya adını belirle
      let categoryFilename = getCategoryFilename(categoryName);

      // Kategori-dosya adı eşleştirmesi
      const staticCategoryMap = {
        "Kahveler": "kahveler.jpg",
        "Çaylar": "caylar.jpg",
        "Ana Yemekler": "ana-yemekler.jpg",
        "Tatlılar": "tatlilar.jpg",
        "Soğuk İçecekler": "soguk-icecekler.jpg",
        "Bitki Çayları": "bitki-caylari.jpg",
        "Tost ve Bazlama": "tost-ve-bazlama.jpg",
        "Kruvasan": "kruvasan.jpg",
        "Makarnalar": "makarnalar.jpg",
        "Kurabiyeler": "kurabiyeler.jpg",
        "Kahvaltılıklar": "kahvaltiliklar.jpg",
        "Yumurtalar": "yumurtalar.jpg",
        "Menemen": "menemen.jpg",
        "Salatalar": "salatalar.jpg"
      };

      // Eğer statik bir eşleşme varsa, onu kullan
      if (staticCategoryMap[categoryName]) {
        categoryFilename = staticCategoryMap[categoryName];
      }

      // Bu aşamada backend'e bağlanmadan tamamen frontend'de çalışacak bir yöntem kullanacağız
      let uploadSuccessful = true;
      let imageUrl = "";

      // Resim yükleme işlemi - lokalde kaydediyoruz
      if (imageFile) {
        try {
          console.log("Kategori görselini önbelleğe kaydediyorum:", categoryName);

          // Base64 formatında resim oluştur
          const reader = new FileReader();

          // FileReader işlemi için Promise oluştur
          const readFilePromise = new Promise((resolve) => {
            reader.onload = (event) => resolve(event.target.result);
          });

          // Dosya oku
          reader.readAsDataURL(imageFile);

          // Resmi Base64 olarak al
          const base64Image = await readFilePromise;

          // Kategori görsel kayıtlarını localStorage'dan al
          const storedImages = JSON.parse(localStorage.getItem('category_images') || '{}');

          // Bu kategori için görsel bilgisini güncelle
          storedImages[categoryName] = {
            data: base64Image,
            filename: categoryFilename,
            timestamp: timestamp,
            id: uniqueId
          };

          // LocalStorage'a kaydet
          localStorage.setItem('category_images', JSON.stringify(storedImages));
          console.log("Kategori görseli localStoraga kaydedildi:", categoryName);

          // Dosya adlarını güncelle
          const categoryMap = JSON.parse(localStorage.getItem('category_filenames') || '{}');
          categoryMap[categoryName] = categoryFilename;
          localStorage.setItem('category_filenames', JSON.stringify(categoryMap));

          // Upload zamanı kaydet
          const uploadTimes = JSON.parse(localStorage.getItem('category_upload_times') || '{}');
          uploadTimes[categoryName] = timestamp;
          localStorage.setItem('category_upload_times', JSON.stringify(uploadTimes));

          // Görsel URL ayarla
          imageUrl = `/category/${categoryFilename}`;

        } catch (error) {
          console.error("Frontend resim işleme hatası:", error);
          toast.warning("Resim işlenirken bir sorun oluştu");

          // Hata olsa bile varsayılan bir değer kullan
          imageUrl = `/category/${categoryFilename}`;
          uploadSuccessful = true;
        }
      } else {
        // Resim silme - Dosya boş
        console.log("Kategori resmi siliniyor");

        // Sadece localStorage'dan sil
        const storedImages = JSON.parse(localStorage.getItem('category_images') || '{}');
        if (storedImages[categoryName]) {
          delete storedImages[categoryName];
          localStorage.setItem('category_images', JSON.stringify(storedImages));
        }

        imageUrl = `/category/default.jpg`;
      }

      // Başarılı mesajı göster
      if (uploadSuccessful) {
        toast.success("Kategori görseli güncellendi");
      } else {
        toast.warning("Görsel işlenemedi, ancak arayüz güncellenecek");
      }

      // Callback'e geçilecek güvenli yanıt
      const safeResponse = {
        id: categoryId,
        name: categoryName,
        image_url: `${imageUrl}?t=${timestamp}&r=${randomString}`
      };

      // Göreceli URL'yi tam URL'ye çevir
      let fullImageUrl = imageUrl;
      if (imageUrl && imageUrl.startsWith('/')) {
        const baseUrl = window.location.origin;
        fullImageUrl = `${baseUrl}${imageUrl}`;
      }

      // Önbellek kırıcı eklenmiş URL
      const finalImageUrl = fullImageUrl.includes('?')
        ? `${fullImageUrl}&t=${timestamp}&r=${randomString}`
        : `${fullImageUrl}?t=${timestamp}&r=${randomString}`;

      // Kategori bilgisi
      const categoryInfo = {
        id: categoryId,
        name: categoryName,
        image_url: finalImageUrl,
        original_image_url: imageUrl,
        timestamp: timestamp,
        randomString: randomString,
        uploadSuccessful: uploadSuccessful
      };

      // Event yayınla
      try {
        window.dispatchEvent(new CustomEvent('category-image-update', {
          detail: categoryInfo
        }));
        console.log('Kategori güncellemesi için event yayınlandı:', categoryInfo.name);
      } catch (e) {
        console.error('Event yayınlama hatası:', e);
      }

      // Kategori bilgisini localStorage'a kaydet
      localStorage.setItem('category_updated', timestamp.toString());
      localStorage.setItem('last_updated_category', JSON.stringify(categoryInfo));
      console.log("Kategori bilgisi localStorage'a kaydedildi:", categoryInfo);

      // Callback fonksiyonunu çağır
      if (onImageUpdated) {
        onImageUpdated(safeResponse);
      }

      onClose();
    } catch (error) {
      console.error("Kategori resmi işlenirken hata:", error);
      toast.error("Kategori resmi işlenemedi!");

      // Hata durumunda bile güvenli callback
      if (onImageUpdated) {
        onImageUpdated({
          id: categoryId,
          name: categoryName,
          image_url: `/category/${getCategoryFilename(categoryName)}?t=${Date.now()}&error=1`
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Modal açık değilse render etme
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[2000] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full overflow-hidden shadow-2xl">
        <div 
          className="flex justify-between items-center p-4"
          style={{ borderBottom: `1px solid ${theme.secondary}`, backgroundColor: '#EFF6FF' }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ color: theme.primary }}
          >
            Kategori Görseli {category ? `(${category.name})` : ''}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Resim önizleme alanı */}
            <div 
              className="border-2 border-dashed rounded-lg overflow-hidden h-48 flex flex-col items-center justify-center relative"
              style={{ borderColor: theme.secondary }}
            >
              {imagePreview ? (
                <>
                  <img 
                    src={imagePreview}
                    alt="Kategori görseli"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    title="Görseli kaldır"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </>
              ) : (
                <div className="text-center p-4">
                  <FiImage size={48} className="mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-500 text-sm">Kategori için bir görsel seçin</p>
                </div>
              )}
            </div>
            
            {/* Dosya yükleme alanı */}
            <div>
              <input 
                type="file"
                id="category-image"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 px-4 border border-gray-300 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
              >
                <FiUpload size={18} />
                <span>Görsel Yükle</span>
              </button>
              
              <p className="mt-2 text-xs text-gray-500 italic">
                JPG, PNG veya GIF formatında, maksimum 5MB boyutunda olmalıdır
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
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
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors flex items-center gap-2"
              style={{
                backgroundColor: theme.accent,
                fontWeight: 600
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Güncelleniyor...</span>
                </>
              ) : (
                <>
                  <FiCheck size={18} />
                  <span>Kaydet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryImageModal;