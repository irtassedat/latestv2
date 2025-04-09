import { useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import toast from "react-hot-toast"
import { motion, AnimatePresence } from "framer-motion"
import { useSwipeable } from "react-swipeable"
import api from "../lib/axios"

const ProductDetail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { product } = location.state || {}
  const [isImageFullscreen, setIsImageFullscreen] = useState(false)
  const [showReviews, setShowReviews] = useState(false)
  const [similarProducts, setSimilarProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const [activeFeature, setActiveFeature] = useState(null)
  const imageRef = useRef(null)
  const contentRef = useRef(null)

  // Ürün özellikleri örneği (to do:API Geliştirmesi YAP!)
  const productFeatures = [
    { id: 1, name: "Glutensiz", icon: "gluten-free", description: "Bu ürün gluten içermez ve çölyak hastaları için uygundur." },
    { id: 2, name: "Sütsüz", icon: "milk-free", description: "Bu ürün süt ve süt ürünleri içermez, laktoz intoleransı olanlar için uygundur." },
    { id: 3, name: "Vejetaryen", icon: "vegetarian", description: "Bu ürün et içermez ve vejetaryen beslenme için uygundur." },
    { id: 4, name: "Organik", icon: "organic", description: "Bu ürün organik sertifikalı malzemelerle hazırlanmıştır." },
  ]

  // Yorum örneği - bunlar da API'den gelebilir
  const reviews = [
    { id: 1, author: "Ahmet Y.", rating: 5, text: "Çok lezzetli, kesinlikle tavsiye ederim", date: "12.03.2023" },
    { id: 2, author: "Selin K.", rating: 4, text: "Güzel ama biraz daha sıcak servis edilebilir", date: "08.02.2023" },
  ]

  // Benzer ürünleri kategori bazlı getir
  const fetchSimilarProducts = async () => {
    if (!product || !product.category_id) return

    try {
      setLoading(true)
      const response = await api.get(`/products/branch/1`) // Şube ID'yi dinamik alabilirsiniz

      // Aynı kategorideki diğer ürünleri filtrele
      const filtered = response.data
        .filter(p => p.category_id === product.category_id && p.id !== product.id)
        .slice(0, 5) // Sadece 5 ürün göster

      setSimilarProducts(filtered)
    } catch (err) {
      console.error("Benzer ürünler yüklenirken hata:", err)
    } finally {
      setLoading(false)
    }
  }

  // Scroll pozisyonunu takip et
  const handleScroll = () => {
    setScrollY(window.scrollY)
  }

  useEffect(() => {
    // Scroll izleme
    window.addEventListener('scroll', handleScroll)

    // Scroll pozisyonunu en üste ayarla
    window.scrollTo(0, 0)
    setScrollY(0)

    // Benzer ürünleri yükle
    fetchSimilarProducts()

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [product])

  // Blur ve opaklık hesaplamaları
  const calculateBlur = () => {
    if (scrollY < 50) return 0

    // 50-200 piksel arası blur 
    const blurValue = Math.min((scrollY - 50) / 20, 8)
    return blurValue
  }

  const calculateOpacity = () => {
    if (scrollY < 50) return 1

    return Math.max(1 - (scrollY - 50) / 200 * 0.5, 0.5)
  }

  // Görsel yüksekliği hesaplaması - daha iyi görünüm için ayarlandı
  const calculateImageHeight = () => {
    // Sabit yükseklik yerine daha büyük bir başlangıç değeri ve daha yavaş bir azalma
    return Math.max(350 - scrollY * 0.5, 200);
  }

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem("qr_cart") || "[]")
    const existingItem = existingCart.find((item) => item.id === product.id)

    const updatedCart = existingItem
      ? existingCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
      : [...existingCart, { ...product, quantity: 1 }]

    localStorage.setItem("qr_cart", JSON.stringify(updatedCart))

    // Daha görünür toast mesajı
    toast.success(`${product.name} sepete eklendi!`, {
      duration: 3000,
      style: {
        borderRadius: '10px',
        background: '#22c55e', // Daha canlı bir yeşil
        color: '#fff',
        fontWeight: 'bold',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      icon: '🛒',
    })

    // Clarity olay izleme - ürün detay sayfasından sepete ekleme
    if (window.clarity) {
      window.clarity("event", "detail_add_to_cart", {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        fromPage: "product_detail"
      });

      console.log("Clarity: Ürün detayından sepete ekleme izlendi", product.name);
    }
  }

  const toggleFeatureDetails = (featureId) => {
    if (activeFeature === featureId) {
      setActiveFeature(null)
    } else {
      setActiveFeature(featureId)
      // Feature detayı gösterildiğinde hafifçe aşağı kaydır
      if (contentRef.current) {
        setTimeout(() => {
          window.scrollBy({ top: 50, behavior: 'smooth' })
        }, 100)
      }
    }
  }

  if (!product) {
    return (
      <div className="p-4 text-center">
        <p>Ürün bulunamadı.</p>
        <button onClick={() => navigate("/menu")} className="mt-4 text-[#1a9c95] underline">Menüye Dön</button>
      </div>
    )
  }

  useEffect(() => {
    if (product) {
      // Clarity olay izleme - ürün detayı görüntüleme
      if (window.clarity) {
        window.clarity("set", "product_detail_viewed", product.name);
        window.clarity("event", "product_detail_view", {
          productId: product.id,
          productName: product.name,
          category: product.category_name || "Kategori Yok",
          price: product.price,
          description: product.description || ""
        });

        console.log("Clarity: Ürün detay görüntüleme izlendi", product.name);
      }
    }
  }, [product]); // product değiştiğinde tetikle

  return (
    <div className="bg-gray-50 min-h-screen pb-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="relative">
          {/* Ürün Görseli - Tam Genişlik İçin Ayarlandı */}
          <div
            ref={imageRef}
            className="relative w-full transition-all duration-300 ease-out"
            style={{
              height: `${calculateImageHeight()}px`,
              overflow: 'hidden',
              margin: 0,
              padding: 0,
            }}
          >
            <img
              src={
                product.image_url && !product.image_url.includes("ibb.co")
                  ? product.image_url
                  : "/uploads/guncellenecek.jpg"
              }
              alt={product.name}
              className="w-full h-full object-cover transition-all duration-300 ease-out"
              style={{
                filter: `blur(${calculateBlur()}px)`,
                opacity: calculateOpacity(),
                objectPosition: 'center',
                width: '100%',
                margin: 0,
                padding: 0,
              }}
            />

            {/* Geri Butonu */}
            <button
              onClick={() => navigate(-1)}
              className="absolute top-4 left-4 bg-black/40 text-white rounded-full p-2 backdrop-blur-sm z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Sepete Ekle Butonu */}
            <button
              onClick={handleAddToCart}
              className="absolute top-4 right-4 bg-[#022B45]/70 text-white rounded-full p-2 backdrop-blur-sm z-10 hover:bg-[#022B45] transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>

          {/* Ürün İçeriği - Daha Yumuşak Radius ve Daha Yüksek Konum */}
          <div
            ref={contentRef}
            className="px-4 pt-6 pb-8 bg-white rounded-t-[30px] -mt-10 relative z-20 shadow-lg"
            style={{
              boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
            }}
          >
            <div className="flex items-start mb-3">
              {/* Ürün adı */}
              <div className="flex-1 pr-3">
                <h1 className="text-xl font-bold text-gray-900 leading-snug break-words">
                  {product.name}
                </h1>
              </div>

              {/* Fiyat kutusu */}
              <div className="min-w-[80px] px-2 py-1 bg-white rounded-md text-right">
                <div className="text-lg font-semibold text-[#D98A3D] flex items-center justify-end gap-1">
                  <span>{product.price}</span>
                  {/* TL Simgesi */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2v2.5L9.5 6v1.5L12 6.5v2L9.5 10v1.5L12 10.5V13h2v-2.5l2.5-1V8l-2.5 1V7l2.5-1V4.5L14 6V2h-2z" />
                  </svg>
                </div>
              </div>
            </div>


            {/* Ürün Açıklaması */}
            {product.description && (
              <p className="text-gray-700 text-base leading-relaxed mb-6">
                {product.description}
              </p>
            )}

            {/* Ürün Özellikleri (Sadece İkonlar) */}
            <div className="flex flex-wrap gap-3 mb-4">
              {productFeatures.map(feature => (
                <div
                  key={feature.id}
                  className={`${activeFeature === feature.id
                    ? 'bg-[#B8D7DD] ring-2 ring-[#D98A3D]'
                    : 'bg-gray-50 hover:bg-gray-100'
                    } flex items-center justify-center rounded-full w-12 h-12 cursor-pointer transition-all duration-200 relative`}
                  onClick={() => toggleFeatureDetails(feature.id)}
                >
                  <img
                    src={`/icons/${feature.icon}.svg`}
                    alt={feature.name}
                    className="w-7 h-7"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/icons/default.svg";
                    }}
                  />

                  {/* Kısa tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -translate-y-1 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    {feature.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Aktif Özellik Detayı */}
            <AnimatePresence>
              {activeFeature && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-[#B8D7DD] rounded-lg p-4 mb-6 overflow-hidden"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white rounded-full p-2 shadow-sm">
                      <img
                        src={`/icons/${productFeatures.find(f => f.id === activeFeature)?.icon}.svg`}
                        alt={productFeatures.find(f => f.id === activeFeature)?.name}
                        className="w-6 h-6"
                      />
                    </div>
                    <h3 className="font-medium text-[#022B45]">
                      {productFeatures.find(f => f.id === activeFeature)?.name}
                    </h3>
                  </div>
                  <p className="text-sm text-[#022B45]">
                    {productFeatures.find(f => f.id === activeFeature)?.description}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Yorum Kartı */}
            <div className="mb-4">
              <div
                onClick={() => setShowReviews(!showReviews)}
                className="bg-[#B8D7DD] text-[#022B45] px-4 py-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-[#B8D7DD]/90 transition"
              >
                <div className="flex items-center gap-1">
                  <span className="text-base font-bold">4.5</span>
                  <div className="text-[#D98A3D] text-sm">★★★★★</div>
                  <span className="ml-2 font-medium text-[#022B45]">{reviews.length} yorum</span>
                </div>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 text-[#022B45] transition-transform ${showReviews ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Yorumlar Listesi */}
              <AnimatePresence>
                {showReviews && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-4 space-y-4 bg-white rounded-lg mt-2 p-4 border border-[#B8D7DD]/50">
                      {reviews.map(review => (
                        <div key={review.id} className="border-b border-[#B8D7DD]/30 pb-4">
                          <div className="flex justify-between mb-1">
                            <span className="font-medium">{review.author}</span>
                            <span className="text-sm text-gray-500">{review.date}</span>
                          </div>
                          <div className="flex items-center mb-2">
                            {[1, 2, 3, 4, 5].map(star => (
                              <span
                                key={star}
                                className={star <= review.rating ? 'text-[#D98A3D]' : 'text-gray-300'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <p className="text-gray-700 text-sm">{review.text}</p>
                        </div>
                      ))}

                      <button className="text-[#022B45] font-medium text-sm">
                        Tüm yorumları gör
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* Benzer Ürünler - Normal akış içinde */}
            {similarProducts.length > 0 && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold mb-4">⭐ Benzer Ürünler</h3>
                <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                  {similarProducts.map(item => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/product/${item.id}`, { state: { product: item } })}
                      className="min-w-[110px] max-w-[110px] rounded-lg overflow-hidden shadow-sm bg-white border border-gray-100 cursor-pointer hover:shadow-md transition-shadow flex flex-col"
                    >
                      {/* Görsel Kapsayıcı */}
                      <div className="w-full h-[80px] overflow-hidden bg-gray-50">
                        <img
                          src={item.image_url || "/uploads/guncellenecek.jpg"}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          style={{ objectPosition: 'center' }}
                        />
                      </div>
                      <div className="p-2 flex-1 flex flex-col justify-between">
                        <h4 className="font-medium text-xs text-gray-900 truncate">{item.name}</h4>
                        <p className="text-[#D98A3D] font-bold text-xs mt-1">{item.price} ₺</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Tam Ekran Görüntü İçin CSS Düzenlemeleri */}
      <style dangerouslySetInnerHTML={{
        __html: `
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
        
        img {
          max-width: 100%;
          display: block;
        }
        
        /* Scrollbar gizleme */
        .scrollbar-hide {
          -ms-overflow-style: none;  /* IE ve Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none; /* Chrome, Safari ve Opera */
        }
        
        /* Sağ ve sol boşlukları yok etmek için */
        @media (max-width: 767px) {
          .relative > div:first-child {
            left: 0;
            right: 0;
            width: 100vw;
            max-width: 100vw;
          }
        }
      `}} />
    </div>
  )
}

export default ProductDetail