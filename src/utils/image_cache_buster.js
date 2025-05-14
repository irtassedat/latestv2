// src/utils/image_cache_buster.js
// Resim önbellek kırma yardımcı fonksiyonları - Geliştirilmiş sürüm

/**
 * Resim URL'sine önbellek kırıcı parametreler ekleyen fonksiyon
 * @param {string} url - Orijinal resim URL'si
 * @param {boolean} forceRefresh - Zorunlu yenileme yapılıp yapılmayacağı
 * @param {boolean} useStrongBusting - Daha güçlü önbellek kırma kullan (varsayılan: true)
 * @returns {string} - Önbellek kırıcı parametreler eklenmiş URL
 */
export const addCacheBuster = (url, forceRefresh = false, useStrongBusting = true) => {
  if (!url) return url;

  // Temel önbellek kırıcı parametreler
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 12);

  // URL'de zaten parametre var mı kontrol et
  const separator = url.includes('?') ? '&' : '?';

  // Normal önbellek kırıcı
  let result = `${url}${separator}t=${timestamp}&r=${randomString}`;

  // Zorunlu yenileme isteniyorsa tarayıcı önbelleğini tamamen atla
  if (forceRefresh) {
    // Resmi doğrudan boyutundan tanıyan tarayıcıları yanıltmak için
    // 1 piksellik fark ekleyelim (tarayıcı farklı resim olarak algılar)
    result += '&_=' + Math.floor(Math.random() * 1000);

    // Güçlü önbellek kırma - HTTP başlıkları taklit eden query parametreleri ekle
    if (useStrongBusting) {
      result += `&nocache=${timestamp}`;
      result += `&version=${Math.floor(Math.random() * 100)}`;

      // Her tarayıcı farklı şekilde önbellek yönetimi yaptığı için
      // en yaygın tarayıcıların önbellek parametrelerini ekle
      const browserParams = [
        'no-cache',
        'no-store',
        'must-revalidate',
        'max-age=0',
        'max-stale=0',
        'post-check=0',
        'pre-check=0'
      ];

      // Query parametreleri olarak ekle
      browserParams.forEach(param => {
        result += `&${param.replace('-', '_')}=1`;
      });
    }
  }

  return result;
};

/**
 * Bir HTML resim elementine önbellek kırıcı uygulayan fonksiyon
 * @param {HTMLImageElement} imgElement - Resim elementi
 * @param {string} url - Yeni resim URL'si
 */
export const applyImageCacheBusting = (imgElement, url) => {
  if (!imgElement || !url) return;

  // Önce mevcut src'yi temizle
  imgElement.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  // Bir küçük gecikmeyle önbelleklenmiş versiyonu kaldır
  setTimeout(() => {
    // Güçlü önbellek kırıcı parametrelerle URL oluştur
    const bustedUrl = addCacheBuster(url, true, true);

    // Yeni src'yi ata
    imgElement.src = bustedUrl;
  }, 50);
};