// frontend_image_helper.js - Frontend için doğrudan upload işlemi
// Bu kodu projenize ekleyerek kategori görsellerini doğrudan güncelleyebilirsiniz

import api from '../lib/axios'; // axios instance'ınızı import edin
import { addCacheBuster } from './image_cache_buster'; // Yeni eklenen

/**
 * Kategori görselini doğrudan güncelleyen fonksiyon
 * @param {File} file - Yüklenecek dosya (File objesi)
 * @param {Object} category - Kategori bilgileri (id ve name içermeli)
 * @returns {Promise} - API yanıtı
 */
export const updateCategoryImageDirect = async (file, category) => {
  if (!file || !category || !category.id || !category.name) {
    throw new Error('Geçersiz dosya veya kategori bilgisi');
  }

  try {
    // FormData oluştur
    const formData = new FormData();
    formData.append('image', file);
    formData.append('categoryId', category.id);
    formData.append('categoryName', category.name);

    // Önbellek kırıcı parametreler
    const timestamp = new Date().getTime();
    const random = Math.random().toString(36).substring(2, 15);
    const uniqueId = `${timestamp}_${random}`;

    formData.append('timestamp', timestamp);
    formData.append('cacheBuster', random);
    formData.append('uniqueId', uniqueId);

    // Kategori adları ve dosya adları arasındaki eşleştirmeleri belirle
    const categoryFileNameMap = {
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

    // Eğer kategori için sabit bir resim adı varsa formData'ya ekle
    if (categoryFileNameMap[category.name]) {
      formData.append('staticFilename', categoryFileNameMap[category.name]);
      console.log(`Sabit kategori resim adı gönderiliyor: ${categoryFileNameMap[category.name]}`);
    }

    // API isteği yap - direkt normal endpoint'i kullan
    console.log('Normal kategori resim yükleme endpoint\'i kullanılıyor...');

    // Normal upload endpoint'i dene - güçlendirilmiş önbellek engelleme başlıkları ile
    const response = await api.post('/api/categories/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Cache-Buster': uniqueId
      }
    });

    // Backend'e bağlanamaz veya hata alırsa, oluşturduğumuz UI önbelleğini kullan
    // Bu durum backend cevap vermese bile önyüzde görselleri göstermeye devam eder

    // Kategori adını slug'a çevir
    const slugifiedName = category.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^\w\-]+/g, "")
      .replace(/--+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

    // Local Storage'a kategori-dosya adı eşleşmesini kaydet
    // Bu frontend uygulamanın kategori adı -> dosya adı dönüşümünü hatırlamasını sağlar
    const categoryMap = JSON.parse(localStorage.getItem('category_filenames') || '{}');
    categoryMap[category.name] = `${slugifiedName}.jpg`;
    localStorage.setItem('category_filenames', JSON.stringify(categoryMap));

    // Kategori isim eşleştirmelerini kontrol et ve sabit isim kullanan kategorileri güncelle
    const staticCategoryNames = {
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

    // Eğer bu kategori için sabit bir resim adı varsa, onu da kaydet
    if (staticCategoryNames[category.name]) {
      categoryMap[category.name] = staticCategoryNames[category.name];
      localStorage.setItem('category_filenames', JSON.stringify(categoryMap));
      console.log(`Sabit kategori resmi kullanılıyor: ${category.name} -> ${staticCategoryNames[category.name]}`);
    }

    // Yükleme zamanını kaydet - bu, aynı görselin farklı zamanlarda yüklenmesini ayırt etmeye yardımcı olur
    const uploadTimeMap = JSON.parse(localStorage.getItem('category_upload_times') || '{}');
    uploadTimeMap[category.name] = timestamp;
    localStorage.setItem('category_upload_times', JSON.stringify(uploadTimeMap));

    return response.data;
  } catch (error) {
    console.error('Kategori görseli güncellenirken hata:', error);
    throw error;
  }
};

/**
 * Kategori adından dosya adı oluşturan yardımcı fonksiyon
 * @param {string} categoryName - Kategori adı
 * @returns {string} - Dosya adı
 */
export const getCategoryFilename = (categoryName) => {
  if (!categoryName) return 'default.jpg';
  
  // Önce LocalStorage'dan eşleşme kontrolü yap
  const categoryMap = JSON.parse(localStorage.getItem('category_filenames') || '{}');
  if (categoryMap[categoryName]) {
    return categoryMap[categoryName];
  }
  
  // Eşleşme yoksa slug oluştur
  const slugifiedName = categoryName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^\w\-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
  
  return `${slugifiedName}.jpg`;
};

/**
 * Kategori görselinin URL'sini döndüren fonksiyon - önbellek kırıcı parametrelerle
 * @param {string} categoryName - Kategori adı
 * @param {boolean} forceCacheBust - Önbellek kırıcıyı zorunlu kıl (varsayılan: true)
 * @returns {string} - Kategori görselinin URL'si
 */
export const getCategoryImageUrl = (categoryName, forceCacheBust = true) => {
  try {
    // Kategori adı güvenlik kontrolü
    if (!categoryName) {
      console.warn("getCategoryImageUrl: Kategori adı bulunamadı, varsayılan resim kullanılıyor");
      return `/category/default.jpg?error=no-name&t=${Date.now()}`;
    }

    // Sabit kategori isim eşleştirmelerini kontrol et
    const staticCategoryNames = {
      "Kahveler": "kahveler.jpg",
      "Çaylar": "caylar.jpg",
      "Ana Yemekler": "ana-yemekler.jpg",
      "Tatlılar": "tatlilar.jpg",
      "Soğuk İçecekler": "soguk-icecekler.jpg",
      "Bitki Çayları": "bitki-caylari.jpg",
      "Tost ve Bazlama": "tost-ve-bazlama.jpg",
      "Tost & Sandviç": "tost-ve-sandvic.jpg",
      "Sandviçler": "sandvicler.jpg",
      "Kruvasan": "kruvasan.jpg",
      "Makarnalar": "makarnalar.jpg",
      "Kurabiyeler": "kurabiyeler.jpg",
      "Kahvaltılıklar": "kahvaltiliklar.jpg",
      "Yumurtalar": "yumurtalar.jpg",
      "Omlet & Yumurta": "omlet.jpg",
      "Salatalar": "salatalar.jpg",
      "Menemen": "menemen.jpg",
      "Kumru": "kumru.jpg",
      "Büble Tea": "buble-tea.jpg",
      "Frappe": "frappe.jpg",
      "Frozen": "frozen.jpg",
      "Hot Drinks": "hot-drinks.jpg",
      "Iced Coffee": "iced-coffee.jpg",
      "Refresh & Lemonade": "refresh-&-lemonade.jpg",
      "Tea": "tea.jpg",
      "Brew Bar": "brew-bar.jpg",
      "Other Drinks": "other-drinks.jpg"
    };

    // Önce sabit eşleştirmeleri kontrol et
    if (staticCategoryNames[categoryName]) {
      const staticFilename = staticCategoryNames[categoryName];
      const baseImageUrl = `/category/${staticFilename}`;

      // Önbellek kırıcı parametreler ekle
      if (forceCacheBust) {
        return addCacheBuster(baseImageUrl, true);
      }
      return baseImageUrl;
    }

    // Sabit eşleştirme yoksa dinamik oluştur
    const filename = getCategoryFilename(categoryName);

    // Resim URL'sini oluştur
    const baseImageUrl = `/category/${filename}`;

    // Önbellek kırıcı parametreler kullanarak URL döndür
    if (forceCacheBust) {
      // Yeni eklenen yardımcı fonksiyonu kullan - daha güçlü önbellek kırma
      return addCacheBuster(baseImageUrl, true);
    }

    return baseImageUrl;
  } catch (error) {
    // Herhangi bir hata durumunda varsayılan URL döndür, uygulama çalışmaya devam etsin
    console.error("getCategoryImageUrl hatası:", error);
    return `/category/default.jpg?error=1&t=${Date.now()}`;
  }
};

/**
 * Kategorinin yüklenme zamanını kontrol eden ve değişip değişmediğini döndüren fonksiyon 
 * @param {string} categoryName - Kategori adı
 * @param {number} lastCheckTime - Son kontrol zamanı (epoch)
 * @returns {boolean} - Kategori son kontrol zamanından sonra güncellenmiş mi
 */
export const hasCategoryImageChanged = (categoryName, lastCheckTime) => {
  if (!categoryName || !lastCheckTime) return true;
  
  try {
    // Kategori yükleme zamanlarını al
    const uploadTimeMap = JSON.parse(localStorage.getItem('category_upload_times') || '{}');
    const uploadTime = uploadTimeMap[categoryName];
    
    // Eğer yükleme zamanı yoksa veya son kontrol zamanından sonraysa, true döndür
    if (!uploadTime) return false;
    return uploadTime > lastCheckTime;
  } catch (error) {
    console.error("Kategori değişim kontrolü hatası:", error);
    return true; // Hata durumunda değişmiş kabul et
  }
};