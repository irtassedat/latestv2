import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../lib/axios"
import toast from "react-hot-toast"

const QrMenu = () => {
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState(1)
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showCategoryHeader, setShowCategoryHeader] = useState(false)

  // Promosyon slider verileri
  const promotionSlides = [
    {
      id: 1,
      image: "/uploads/dere-otlu-pogaca-slider.png"
    },
    {
      id: 2,
      image: "/uploads/dere-otlu-pogaca-slider.png"
    }
    // Buraya daha fazla promosyon eklenebilir
  ]

  // Scroll pozisyonunu izle
  useEffect(() => {
    const handleScroll = () => {
      // Kategori başlığının y-pozisyonuna göre sabit başlığı göster/gizle
      const categorySection = document.getElementById('categories-section')
      if (categorySection) {
        const categorySectionTop = categorySection.getBoundingClientRect().top
        setShowCategoryHeader(categorySectionTop < 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Slider otomatik geçiş
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % promotionSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [promotionSlides.length])

  // Modal açıldığında body scroll'u engelle
  useEffect(() => {
    if (isCartOpen || showFilterModal) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
  }, [isCartOpen, showFilterModal])

  const fetchProducts = async () => {
    try {
      const res = await api.get(`/branches/${selectedBranchId}/products`)
      setProducts(res.data)
    } catch (err) {
      console.error("Ürünler yüklenirken hata:", err.message)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [selectedBranchId])

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "" || p.category_name === selectedCategory
    const matchesMin = minPrice === "" || p.price >= parseFloat(minPrice)
    const matchesMax = maxPrice === "" || p.price <= parseFloat(maxPrice)
    const matchesStock = !onlyInStock || p.stock_count > 0

    return matchesSearch && matchesCategory && matchesMin && matchesMax && matchesStock
  })

  const grouped = filteredProducts.reduce((acc, curr) => {
    if (!curr.category_name) return acc
    if (!acc[curr.category_name]) acc[curr.category_name] = []
    acc[curr.category_name].push(curr)
    return acc
  }, {})

  // "Çaylar"ı başa taşı
  const groupedWithTeaFirst = {
    ...(grouped["Çaylar"] ? { "Çaylar": grouped["Çaylar"] } : {}),
    ...Object.fromEntries(Object.entries(grouped).filter(([k]) => k !== "Çaylar"))
  }

  const handleCategoryClick = (categoryName) => {
    const target = document.getElementById(`section-${categoryName}`)
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
      setActiveCategory(categoryName)
    }
  }

  const addToCart = (product) => {
    const storedCart = JSON.parse(localStorage.getItem("qr_cart") || "[]")
    const existingItem = storedCart.find((item) => item.id === product.id)

    let updatedCart
    if (existingItem) {
      updatedCart = storedCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    } else {
      updatedCart = [...storedCart, { ...product, quantity: 1 }]
    }

    localStorage.setItem("qr_cart", JSON.stringify(updatedCart))
    setCart(updatedCart)
    toast.success(`${product.name} sepete eklendi!`, {
      duration: 2000,
      style: {
        background: '#22c55e',
        color: '#fff',
        fontWeight: 'bold',
      },
    })
  }

  const updateQuantity = (productId, delta) => {
    const updatedCart = cart
      .map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );
      
    setCart(updatedCart);
    localStorage.setItem("qr_cart", JSON.stringify(updatedCart));
  }

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem("qr_cart", JSON.stringify(updatedCart));
    toast.success("Ürün sepetten çıkarıldı", {
      icon: '🗑️',
      style: {
        background: '#ef4444',
        color: '#fff',
      },
    });
  }

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem("qr_cart");
    setIsCartOpen(false);
    toast.success("Sepet temizlendi", {
      icon: '🧹',
      style: {
        background: '#6b7280',
        color: '#fff',
      },
    });
  }

  const toSlug = (str) =>
    str
      ?.toLowerCase()
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/\s+/g, "-") || "default"
    
  // Önerilen ürünleri filtrele
  const recommendedProducts = products.filter((p) =>
    ["Çeşme Kumru", "Beyaz Peynirli Omlet"].includes(p.name)
  )

  useEffect(() => {
    const syncCart = () => {
      const stored = JSON.parse(localStorage.getItem("qr_cart") || "[]")
      setCart(stored)
    }

    // Sync cart when the window gains focus or component mounts
    window.addEventListener("focus", syncCart)
    syncCart()

    return () => window.removeEventListener("focus", syncCart)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100" ref={containerRef}>
      {/* Ana Başlık */}
      <div className="bg-white shadow-md flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">📱 QR Menü</h1>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-full shadow hover:bg-gray-50 transition"
        >
          🛒
          <span className="text-sm font-semibold text-gray-800">Sepetim</span>
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Sabit Kategori Header (scroll edildiğinde görünür) */}
      {showCategoryHeader && (
        <div className="sticky top-0 z-40 bg-white shadow-md p-2 transition-all duration-300">
          <div className="overflow-x-auto">
            <div className="flex space-x-4 py-1">
              {Object.keys(groupedWithTeaFirst).map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-3 py-1 text-sm whitespace-nowrap rounded-full
                    ${activeCategory === cat 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sabit Sepet Butonu */}
      {showCategoryHeader && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center justify-center w-12 h-12 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white transition-all"
          >
            <span className="text-xl">🛒</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="px-4 py-8">
        {/* Promosyon Slider */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-8 mt-4">
          <div className="relative w-full h-48 md:h-52">
            {/* Slider Items */}
            <div className="relative w-full h-full">
              {promotionSlides.map((slide, index) => (
                <div 
                  key={slide.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out transform ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.image}
                    alt={`Promosyon ${index + 1}`}
                    className="w-full h-full object-fill"
                  />
                </div>
              ))}
            </div>
            
            {/* Slider Dots */}
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {promotionSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentSlide ? 'bg-white w-4' : 'bg-white/50'
                  }`}
                  aria-label={`Slayt ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Önerilen Ürünler */}
        {recommendedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">⭐ Bugünün Önerileri</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {recommendedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                  className="cursor-pointer min-w-[200px] bg-white rounded-lg shadow p-3 flex gap-3 items-center hover:shadow-md transition"
                >
                  <div className="w-20 h-20 rounded overflow-hidden">
                    <img
                      src={p.image_url || "/uploads/guncellenecek.jpg"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className="text-orange-600 font-bold text-sm">{p.price} ₺</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arama ve Filtreleme */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2 bg-white shadow px-3 py-2 rounded-lg w-full">
            <span className="text-gray-500 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <button
            className="p-2 bg-white rounded-lg shadow hover:bg-gray-100"
            onClick={() => setShowFilterModal(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M3 5a1 1 0 011-1h12a1 1 0 01.8 1.6l-4.2 5.6V15a1 1 0 01-.3.7l-2 2A1 1 0 019 18v-6.8L4.2 6.6A1 1 0 013 5z" />
            </svg>
          </button>
        </div>

        {/* Kategori Butonları */}
        <div id="categories-section" className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Kategoriler</h2>
          <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide snap-x snap-mandatory">
            {Object.keys(groupedWithTeaFirst).map((cat) => (
              <div
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className="snap-start flex flex-col items-center cursor-pointer"
              >
                <div className={`w-24 h-24 rounded-xl overflow-hidden shadow-md mb-2 ${
                  activeCategory === cat ? "ring-2 ring-blue-500" : ""
                }`}>
                  <img
                    src={`/category/${toSlug(cat)}.jpg`}
                    alt={cat}
                    onError={(e) => (e.target.src = "/category/default.jpg")}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-center">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ürünler */}
        <div className="space-y-12 pb-8">
          {Object.entries(groupedWithTeaFirst).map(([category, items]) => (
            <div key={category} id={`section-${category}`} className="scroll-mt-20">
              <div className="relative mb-6 h-40 rounded-xl overflow-hidden shadow-md">
                <img
                  src={`/category/${toSlug(category)}.jpg`}
                  alt={category}
                  onError={(e) => (e.target.src = "/category/default.jpg")}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-4">
                  <h2 className="text-white text-2xl font-bold">{category}</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {items.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/product/${p.id}`, { state: { product: p } })}
                    className="w-full flex bg-white rounded-xl shadow-sm p-3 items-center gap-3 hover:shadow-md transition cursor-pointer"
                  >
                    {/* Görsel */}
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md">
                      <img
                        src={
                          p.image_url &&
                          p.image_url.trim() !== "" &&
                          !p.image_url.includes("ibb.co")
                            ? p.image_url
                            : "/uploads/guncellenecek.jpg"
                        }
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Sağ taraf */}
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="text-base font-semibold">{p.name}</h3>
                        <span className="font-bold text-green-600">{p.price} ₺</span>
                      </div>
                      {p.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mt-1">{p.description}</p>
                      )}
                      {p.stock_count !== null && (
                        <p className="text-xs text-gray-400 mt-1">Stok: {p.stock_count}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtre Modalı */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-center items-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-lg">
            <button
              onClick={() => setShowFilterModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ❌
            </button>
            <h3 className="text-lg font-bold mb-4">🔍 Filtrele</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Ürün adı"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border p-2 rounded"
              />

              {/* Stokta olanları göster */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-green-600"
                />
                <label htmlFor="inStock" className="text-sm text-gray-700">
                  Sadece stokta olanlar
                </label>
              </div>

              {/* Fiyat aralığı filtrelemesi */}
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min fiyat"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Max fiyat"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </div>

              {/* Kategori bazlı filtreleme */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border p-2 rounded"
              >
                <option value="">Kategori seç</option>
                {Object.keys(groupedWithTeaFirst).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilterModal(false)}
                className="w-full bg-green-600 text-white py-2 rounded"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sepet Modalı */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">🛒 Sepet</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>
            
            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-gray-500">Sepetiniz boş</p>
                <p className="text-sm text-gray-400 mt-1">Menüden ürün ekleyebilirsiniz</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <img 
                          src={
                            item.image_url && !item.image_url.includes("ibb.co")
                              ? item.image_url
                              : "/uploads/guncellenecek.jpg"
                          } 
                          alt={item.name}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-gray-500">{item.price} ₺</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-full overflow-hidden">
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, -1)
                          }}
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, 1)
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFromCart(item.id)
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                <div className="mt-4 flex justify-between items-center py-2 border-t border-b">
                  <span className="font-medium">Toplam</span>
                  <span className="text-lg font-bold text-green-600">
                    {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} ₺
                  </span>
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <button
                    className="w-full bg-green-600 text-white py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
                    onClick={() => {
                      const currentCart = [...cart];
                      navigate("/confirm", { 
                        state: { cart: currentCart },
                        search: location.search 
                      });
                    }}
                  >
                    Siparişi Tamamla
                  </button>
                  <button
                    className="w-full py-2 text-gray-500 hover:text-gray-700"
                    onClick={clearCart}
                  >
                    Sepeti Temizle
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default QrMenu