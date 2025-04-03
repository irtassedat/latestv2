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
  const containerRef = useRef(null)
  const navigate = useNavigate()

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

  const grouped = products.reduce((acc, curr) => {
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
    

  return (
    <div className="min-h-screen bg-gray-100 p-4" ref={containerRef}>
      <h1 className="text-center text-2xl font-bold mb-6">📱 QR Menü</h1>

      {/* Kategori Butonları */}
      <div className="flex overflow-x-auto space-x-3 pb-4 mb-6 scrollbar-hide snap-x snap-mandatory">
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
                  className="w-full flex bg-white rounded-xl shadow-sm p-3 items-center gap-3 hover:shadow-md transition"
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
                        onClick={() => addToCart(p)}
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

      {/* Sepet Özeti */}
      {cart.length > 0 && (
        <div
          className="fixed bottom-4 right-4 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-sm font-medium cursor-pointer hover:bg-gray-100 transition"
          onClick={() => setIsCartOpen(true)}
        >
          🛒 {cart.reduce((sum, item) => sum + item.quantity, 0)} ürün – 
          {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} ₺
        </div>
      )}

      {/* Sepet Modalı */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center">
          <div className="bg-white w-[90%] max-w-md rounded-xl shadow-lg p-6 relative">
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
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    className="px-2 py-1 bg-gray-200 rounded"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    +
                  </button>
                  <button
                    className="text-red-600 ml-2"
                    onClick={() => removeFromCart(item.id)}
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
