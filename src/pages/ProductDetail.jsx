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

  // Ürün özellikleri örneği - bunlar API'den gelebilir veya ürün nesnesine eklenebilir
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
    
    // 50-200 piksel arası blur 0'dan 8px'e kadar artacak
    const blurValue = Math.min((scrollY - 50) / 20, 8)
    return blurValue
  }

  const calculateOpacity = () => {
    if (scrollY < 50) return 1
    
    // 50-250 piksel arası opacity 1'den 0.5'e kadar düşecek
    return Math.max(1 - (scrollY - 50) / 200 * 0.5, 0.5)
  }
  
  // Görsel yüksekliği hesaplaması - daha fazla küçülme etkisi
  const calculateImageHeight = () => {
    return Math.max(280 - scrollY * 0.8, 100); // Daha agresif küçülme
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
  
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => setIsImageFullscreen(false),
    trackMouse: true
  })

  if (!product) {
    return (
      <div className="p-4 text-center">
        <p>Ürün bulunamadı.</p>
        <button onClick={() => navigate("/menu")} className="mt-4 text-[#1a9c95] underline">Menüye Dön</button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-50 min-h-screen"
    >
      {/* Tam ekran görsel modali */}
      <AnimatePresence>
        {isImageFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex items-center justify-center"
            onClick={() => setIsImageFullscreen(false)}
            {...swipeHandlers}
          >
            <div className="relative w-full h-full">
              <img
                src={
                  product.image_url && !product.image_url.includes("ibb.co")
                    ? product.image_url
                    : "/uploads/guncellenecek.jpg"
                }
                alt={product.name}
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setIsImageFullscreen(false)}
                className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Ürün Görseli */}
        <div 
          ref={imageRef} 
          className="relative w-full transition-all duration-300 ease-out"
          style={{
            height: `${calculateImageHeight()}px`,
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
            onClick={() => setIsImageFullscreen(true)}
            style={{ 
              filter: `blur(${calculateBlur()}px)`, 
              opacity: calculateOpacity(),
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
            className="absolute top-4 right-4 bg-[#1a9c95]/70 text-white rounded-full p-2 backdrop-blur-sm z-10 hover:bg-[#1a9c95] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
          
          {/* Zoom İkonu */}
          <div className="absolute bottom-4 right-4 bg-white/70 backdrop-blur-sm rounded-full p-2 z-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Ürün İçeriği */}
        <div 
          ref={contentRef}
          className="px-4 pt-6 pb-28 bg-white rounded-t-3xl -mt-6 relative z-20 shadow-md min-h-screen"
        >
          {/* Ürün Adı ve Fiyatı */}
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <div className="text-xl font-bold text-[#1a9c95]">{product.price} ₺</div>
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
                className={`${
                  activeFeature === feature.id 
                    ? 'bg-[#f4e9c7] ring-2 ring-[#d49e36]' 
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
                className="bg-[#f4e9c7] rounded-lg p-4 mb-6 overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="bg-white rounded-full p-2 shadow-sm">
                    <img 
                      src={`/icons/${productFeatures.find(f => f.id === activeFeature)?.icon}.svg`} 
                      alt={productFeatures.find(f => f.id === activeFeature)?.name}
                      className="w-6 h-6"
                    />
                  </div>
                  <h3 className="font-medium text-[#d49e36]">
                    {productFeatures.find(f => f.id === activeFeature)?.name}
                  </h3>
                </div>
                <p className="text-sm text-[#9c7832]">
                  {productFeatures.find(f => f.id === activeFeature)?.description}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Yorum Kartı */}
          <div className="mb-8">
            <div 
              onClick={() => setShowReviews(!showReviews)}
              className="bg-[#f4e9c7] text-[#d49e36] px-4 py-3 rounded-xl flex justify-between items-center cursor-pointer hover:bg-[#f0e4be] transition"
            >
              <div className="flex items-center gap-1">
                <span className="text-base font-bold">4.5</span>
                <div className="text-yellow-400 text-sm">★★★★★</div>
                <span className="ml-2 font-medium text-[#d49e36]">{reviews.length} yorum</span>
              </div>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-5 w-5 text-[#d49e36] transition-transform ${showReviews ? 'rotate-180' : ''}`} 
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
                  <div className="pt-4 space-y-4">
                    {reviews.map(review => (
                      <div key={review.id} className="border-b pb-4">
                        <div className="flex justify-between mb-1">
                          <span className="font-medium">{review.author}</span>
                          <span className="text-sm text-gray-500">{review.date}</span>
                        </div>
                        <div className="flex items-center mb-2">
                          {[1, 2, 3, 4, 5].map(star => (
                            <span 
                              key={star} 
                              className={star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <p className="text-gray-700 text-sm">{review.text}</p>
                      </div>
                    ))}
                    
                    <button className="text-[#1a9c95] font-medium text-sm">
                      Tüm yorumları gör
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sepete Ekle Butonu */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-[#1a9c95] text-white py-3 rounded-lg font-medium hover:bg-[#168981] transition-colors mb-8"
          >
            Sepete Ekle
          </button>

          {/* Benzer Ürünler - Daha aşağıda göster */}
          {similarProducts.length > 0 && (
            <div className="mt-12 mb-6">
              <h3 className="text-lg font-semibold mb-3">Benzer Ürünler</h3>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {similarProducts.map(item => (
                  <div 
                    key={item.id}
                    onClick={() => navigate(`/product/${item.id}`, { state: { product: item } })}
                    className="min-w-[140px] rounded-xl overflow-hidden shadow-sm bg-white border border-gray-100 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="h-20 overflow-hidden">
                      <img
                        src={item.image_url || "/uploads/guncellenecek.jpg"}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2">
                      <h4 className="font-medium text-sm text-gray-900 truncate">{item.name}</h4>
                      <p className="text-[#1a9c95] font-bold text-sm">{item.price} ₺</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
        </div>
      </div>
    </motion.div>
  )
}

export default ProductDetail