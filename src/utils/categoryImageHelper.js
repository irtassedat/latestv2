// src/utils/categoryImageHelper.js
// Kategori resimleri için frontend yardımcı fonksiyonları

// api import'unu yorum satırına alarak backend gerektirmeden çalıştırabiliriz
// import api from '../lib/axios';
import { addCacheBuster, applyImageCacheBusting } from './image_cache_buster';

/**
 * Kategori görselini API ile yükleyen fonksiyon
 * @param {File} file - Yüklenecek dosya
 * @param {Object} category - Kategori bilgileri
 * @returns {Promise} - API yanıtı
 */
export const uploadCategoryImage = async (file, category) => {
  if (!file || !category || !category.id || !category.name) {
    throw new Error('Geçersiz dosya veya kategori bilgisi');
  }

  try {
    // Önbellek kırıcı parametreler
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const uniqueId = `${timestamp}_${random}`;

    console.log('Frontend-only resim işleme, API bağlantısı olmadan:', category.name);

    // Kategori dosya adı oluştur
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

    // Dosya adını belirle - önce statik eşleşme var mı kontrol et
    let filename = staticCategoryMap[category.name] || `${slugifiedName}.jpg`;

    // Base64 formatında resim oluştur
    const reader = new FileReader();

    // FileReader işlemi için Promise oluştur
    const readFilePromise = new Promise((resolve) => {
      reader.onload = (event) => resolve(event.target.result);
    });

    // Dosya oku
    reader.readAsDataURL(file);

    // Resmi Base64 olarak al
    const base64Image = await readFilePromise;

    // Kategori görsel kayıtlarını localStorage'dan al
    const storedImages = JSON.parse(localStorage.getItem('category_images') || '{}');

    // Bu kategori için görsel bilgisini güncelle
    storedImages[category.name] = {
      data: base64Image,
      filename: filename,
      timestamp: timestamp,
      id: uniqueId
    };

    // LocalStorage'a kaydet
    localStorage.setItem('category_images', JSON.stringify(storedImages));
    console.log("Kategori görseli localStorage'a kaydedildi:", category.name);

    // Local Storage'a kategori-dosya adı eşleşmesini kaydet
    const categoryMap = JSON.parse(localStorage.getItem('category_filenames') || '{}');
    categoryMap[category.name] = filename;
    localStorage.setItem('category_filenames', JSON.stringify(categoryMap));

    // Yükleme zamanını kaydet
    const uploadTimes = JSON.parse(localStorage.getItem('category_upload_times') || '{}');
    uploadTimes[category.name] = timestamp;
    localStorage.setItem('category_upload_times', JSON.stringify(uploadTimes));

    // Uygulama genelinde bir güncelleme işareti
    localStorage.setItem('category_updated', timestamp.toString());

    // Yapay bir yanıt nesne oluştur - normalde API'den dönerdi
    const responseData = {
      id: category.id,
      name: category.name,
      image_url: `/category/${filename}`,
      timestamp: timestamp,
      image_version: Math.floor(Math.random() * 1000)
    };

    // Son güncellenen kategori bilgisini kaydet
    localStorage.setItem('last_updated_category', JSON.stringify({
      id: category.id,
      name: category.name,
      image_url: responseData.image_url,
      timestamp: timestamp,
      version: responseData.image_version
    }));

    // Güncelleme olayı yayınla
    try {
      window.dispatchEvent(new CustomEvent('category-image-update', {
        detail: {
          id: category.id,
          name: category.name,
          image_url: responseData.image_url,
          timestamp: timestamp
        }
      }));
    } catch (e) {
      console.error('Event yayınlama hatası:', e);
    }

    return responseData;
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
 * Kategori görselinin URL'sini döndüren fonksiyon
 * @param {string} categoryName - Kategori adı
 * @param {number} version - Resim versiyonu (varsa)
 * @returns {string} - Kategori görselinin URL'si
 */
export const getCategoryImageUrl = (categoryName, version = null) => {
  try {
    if (!categoryName) {
      return `/category/default.jpg?error=no-name&t=${Date.now()}`;
    }

    // Eşleşen mevcut bir dosya var mı kontrol et - Güncellenmiş ve genişletilmiş liste
    const existingFiles = {
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

    // Eğer kategori adı için hazır bir dosya adı varsa, onu kullan
    if (existingFiles[categoryName]) {
      const baseUrl = `/category/${existingFiles[categoryName]}`;

      // Versiyon, zaman damgası ve rastgele değer ekle
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 10);
      const versionStr = version ? `v=${version}&` : '';

      return `${baseUrl}?${versionStr}t=${timestamp}&r=${randomStr}`;
    }

    // Kategori adını slug formatına çevir
    const filename = getCategoryFilename(categoryName);
    const baseUrl = `/category/${filename}`;
    
    // Versiyon, zaman damgası ve rastgele değer ekle
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 10);
    const versionStr = version ? `v=${version}&` : '';
    
    return `${baseUrl}?${versionStr}t=${timestamp}&r=${randomStr}`;
  } catch (error) {
    console.error("Kategori resim URL'si oluşturma hatası:", error);
    return `/category/default.jpg?error=1&t=${Date.now()}`;
  }
};

/**
 * Resim DOM elementine yeni src atayan ve önbelleği engelleyen fonksiyon
 * @param {HTMLImageElement} imgElement - Güncellenecek resim elementi
 * @param {string} url - Yeni resim URL'si
 */
export const updateImageWithForcedRefresh = (imgElement, url) => {
  if (!imgElement || !url) return;

  // Önce mevcut event listenerları temizle
  imgElement.onload = null;
  imgElement.onerror = null;

  // Resim elementini görünmez yap
  imgElement.style.opacity = '0';
  imgElement.style.transition = 'opacity 0.2s';

  // Daha güçlü önbellek kırma fonksiyonunu kullan
  applyImageCacheBusting(imgElement, url);

  // Resim yüklendiğinde görünür yap
  imgElement.onload = () => {
    imgElement.style.opacity = '1';
    console.log(`Resim başarıyla güncellendi: ${url}`);
  };

  // Hata durumunda mevcut kategori resimlerinden deneme yapılacak
  imgElement.onerror = () => {
    console.warn(`Resim yüklenemedi: ${url}, alternatif dosyalar deneniyor...`);

    // Kategori adını al ve alternatif isimleri dene
    const categoryName = imgElement.getAttribute('data-category-name');
    if (!categoryName) {
      applyImageCacheBusting(imgElement, '/category/default.jpg');
      imgElement.style.opacity = '1';
      return;
    }

    // Kategori isimlerinin olası alternatif yazımları
    const alternatives = {
      "Kahveler": ["kahveler.jpg", "kahve.jpg", "coffee.jpg"],
      "Çaylar": ["caylar.jpg", "cay.jpg", "tea.jpg"],
      "Ana Yemekler": ["ana-yemekler.jpg", "yemekler.jpg", "ana-yemek.jpg", "hot-drinks.jpg"],
      "Tatlılar": ["tatlilar.jpg", "tatli.jpg", "pastalar.jpg"],
      "Soğuk İçecekler": ["soguk-icecekler.jpg", "icecekler.jpg", "soguk.jpg"],
      "Tost ve Bazlama": ["tost-ve-bazlama.jpg", "tost.jpg", "sandvicler.jpg"],
      "Kruvasan": ["kruvasan.jpg", "kruasan.jpg"],
      "Makarnalar": ["makarnalar.jpg", "makarna.jpg"],
      "Kurabiyeler": ["kurabiyeler.jpg", "cookies.jpg"]
    };

    const defaultAlternatives = ["default.jpg"];

    // Kategori için alternatif dosya isimlerini al veya varsayılanları kullan
    const tryFiles = alternatives[categoryName] || defaultAlternatives;

    // Alternatif isimleri sırayla dene
    let tried = 0;
    const tryNext = () => {
      if (tried >= tryFiles.length) {
        // Tüm alternatifler denendi, varsayılanı göster
        applyImageCacheBusting(imgElement, '/category/default.jpg');
        imgElement.style.opacity = '1';
        return;
      }

      const nextFile = tryFiles[tried++];
      const nextSrc = `/category/${nextFile}`;

      imgElement.onload = () => {
        imgElement.style.opacity = '1';
        console.log(`Alternatif resim başarıyla yüklendi: ${nextSrc}`);
      };

      imgElement.onerror = tryNext;
      applyImageCacheBusting(imgElement, nextSrc);
    };

    tryNext();
  };
};

/**
 * Sayfadaki tüm kategori resimlerini zorla yeniler
 * @param {string} categoryName - Yenilenecek kategori adı (belirtilmezse tüm resimler)
 */
export const refreshCategoryImages = (categoryName = null) => {
  // Tüm kategori resimlerini seç veya belirli bir kategoriye ait olanları
  const selector = categoryName 
    ? `img[data-category-name="${categoryName}"]` 
    : 'img[data-category-name]';
  
  const images = document.querySelectorAll(selector);
  console.log(`${images.length} kategori resmi yenileniyor...`);
  
  // Her resim için
  images.forEach(img => {
    const imgCategoryName = img.getAttribute('data-category-name');
    if (!imgCategoryName) return;
    
    // Resim URL'sini oluş
    const imageUrl = getCategoryImageUrl(imgCategoryName);
    
    // Resmi zorla yenile
    updateImageWithForcedRefresh(img, imageUrl);
  });
};

// Kategori resim güncellemelerini otomatik izleme
export const setupCategoryImageListener = () => {
  // LocalStorage değişikliklerini dinle
  window.addEventListener('storage', (event) => {
    if (event.key === 'category_updated' || event.key === 'last_updated_category') {
      console.log('Kategori resim güncellemesi algılandı:', event.key);
      
      // Tüm resimleri güncelle veya sadece belirli bir kategoriyi
      if (event.key === 'last_updated_category') {
        try {
          const categoryInfo = JSON.parse(event.newValue);
          if (categoryInfo && categoryInfo.name) {
            refreshCategoryImages(categoryInfo.name);
          }
        } catch (e) {
          console.error('Kategori bilgisi ayrıştırma hatası:', e);
          refreshCategoryImages(); // Tüm resimleri güncelle
        }
      } else {
        refreshCategoryImages(); // Tüm resimleri güncelle
      }
    }
  });
  
  // Özel olay dinleyicisi
  window.addEventListener('category-image-update', (event) => {
    console.log('Kategori resim güncelleme olayı algılandı:', event.detail);
    
    if (event.detail && event.detail.name) {
      refreshCategoryImages(event.detail.name);
    } else {
      refreshCategoryImages();
    }
  });
  
  console.log('Kategori resim güncelleyici etkinleştirildi');
};