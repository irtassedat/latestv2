import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../lib/axios"

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
      console.log("API'den gelen ürünler:", res.data) // 🔍 Debug log 1
      setProducts(res.data) // Test için filtreleme olmadan direkt veriyi göster
    } catch (err) {
      console.error("Ürünler yüklenirken hata:", err.message)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [selectedBranchId])

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category_name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "" || p.category_name === selectedCategory
    const matchesMin = minPrice === "" || p.price >= parseFloat(minPrice)
    const matchesMax = maxPrice === "" || p.price <= parseFloat(maxPrice)
    const matchesStock = !onlyInStock || p.stock_count > 0

    return matchesSearch && matchesCategory && matchesMin && matchesMax && matchesStock
  })

  const grouped = filteredProducts.reduce((acc, curr) => {
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
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      } else {
        return [...prev, { ...product, quantity: 1 }]
      }
    })
  }

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId
            ? { ...item, quantity: item.quantity + delta }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.id !== productId))
  }

  const toSlug = (str) =>
    str
      .toLowerCase()
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/\s+/g, "-")
    

  // Önerilen ürünleri filtrele
  const recommendedProducts = products.filter((p) =>
    ["Çeşme Kumru", "Beyaz Peynirli Omlet"].includes(p.name)
  )

  return (
    <div className="min-h-screen bg-gray-100 p-4" ref={containerRef}>
      {/* Sabitlenen Başlık ve Sepet Butonu */}
      <div className="sticky top-0 z-50 bg-white shadow-md flex justify-between items-center p-4">
        <h1 className="text-2xl font-bold">📱 QR Menü</h1>
        <button
          onClick={() => setIsCartOpen(true)}
          className="relative p-2 bg-green-600 text-white rounded-full"
        >
          🛒
          {cart.length > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-xs rounded-full px-1">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* Promosyon Slider Görseli */}
      <div className="relative w-full h-48 md:h-64 rounded-2xl overflow-hidden shadow-lg mb-8">
        <img
          src="/uploads/dere-otlu-pogaca-slider.png"
          alt="Promosyon"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Önerilen Ürünler */}
      {recommendedProducts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-3">⭐ Bugünün Önerileri</h2>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide">
            {recommendedProducts.map((p) => (
              <div key={p.id} className="min-w-[200px] bg-white rounded-lg shadow p-3 flex gap-3 items-center">
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
                  <button
                    onClick={() => addToCart(p)}
                    className="mt-1 text-green-700 border border-green-600 px-2 py-0.5 rounded-md text-xs hover:bg-green-100"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Arama ve Filtreleme */}
      <div className="flex items-center gap-2 mb-6">
        <div className="flex items-center gap-2 bg-white shadow px-3 py-2 rounded w-full">
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
      <div className="flex overflow-x-auto space-x-3 pb-6 mb-10 scrollbar-hide snap-x snap-mandatory">
        {Object.keys(groupedWithTeaFirst).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`snap-start shrink-0 w-32 h-24 rounded-xl relative overflow-hidden shadow-md transition-all ${
              activeCategory === cat ? "ring-2 ring-black" : ""
            }`}
          >
            <img
              src={`/category/${toSlug(cat)}.jpg`}
              alt={cat}
              onError={(e) => (e.target.src = "/category/default.jpg")}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <span className="relative z-10 text-white font-semibold text-center w-full h-full flex items-center justify-center text-sm">
              {cat}
            </span>
          </button>
        ))}
      </div>

      {/* Ürünler */}
      <div className="space-y-12">
        {Object.entries(groupedWithTeaFirst).map(([category, items]) => (
          <div key={category} id={`section-${category}`} className="scroll-mt-24">
            <div className="relative mb-6 h-32 rounded-xl overflow-hidden shadow-md">
              <img
                src={`/category/${toSlug(category)}.jpg`}
                alt={category}
                onError={(e) => (e.target.src = "/category/default.jpg")}
                className="w-full h-full object-cover brightness-75"
              />
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
                <h2 className="text-white text-2xl font-bold">{category}</h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="w-full flex bg-white rounded-xl shadow-sm p-3 items-center gap-3 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/product/${p.id}`, { state: { product: p } })}
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
                    <h3 className="text-base font-semibold">{p.name}</h3>
                    {p.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{p.description}</p>
                    )}
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-orange-600 font-bold">{p.price} ₺</span>
                      <button
                        className="text-green-700 border border-green-600 px-2 py-0.5 rounded-md text-sm hover:bg-green-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart(p)
                        }}
                      >
                        +
                      </button>
                    </div>
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
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-4 relative">
            <h3 className="text-xl font-bold mb-4">🛒 Sepet</h3>
            
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center border-b py-2">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.price} ₺ x {item.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="px-2 py-1 bg-gray-200 rounded"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateQuantity(item.id, -1)
                    }}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="px-2 py-1 bg-gray-200 rounded"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateQuantity(item.id, 1)
                    }}
                  >
                    +
                  </button>
                  <button
                    className="text-red-600 ml-2"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFromCart(item.id)
                    }}
                  >
                    ❌
                  </button>
                </div>
              </div>
            ))}

            <div className="mt-4 font-semibold text-right">
              Toplam: {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} ₺
            </div>

            <div className="mt-4 text-right">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={() => navigate("/confirm", { state: { cart } })}
              >
                Siparişi Tamamla
              </button>
              <button
                className="ml-2 text-sm text-gray-500 underline"
                onClick={() => setIsCartOpen(false)}
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default QrMenu
