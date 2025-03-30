import { useEffect, useRef, useState } from "react"
import api from "../lib/axios"

const QrMenu = () => {
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState(1)
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const containerRef = useRef(null)

  const fetchProducts = async () => {
    const res = await api.get(`/branches/${selectedBranchId}/products`)
    const visibleProducts = res.data.filter((p) => p.is_visible)
    setProducts(visibleProducts)
  }

  useEffect(() => {
    fetchProducts()
  }, [selectedBranchId])

  const grouped = products.reduce((acc, curr) => {
    if (!acc[curr.category_name]) acc[curr.category_name] = []
    acc[curr.category_name].push(curr)
    return acc
  }, {})

  const handleCategoryClick = (categoryName) => {
    const target = document.getElementById(`section-${categoryName}`)
    if (target && containerRef.current) {
      containerRef.current.scrollTo({
        top: target.offsetTop - 80,
        behavior: "smooth",
      })
    }
    setActiveCategory(categoryName)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4" ref={containerRef}>
      <h1 className="text-center text-2xl font-bold mb-6">📱 QR Menü</h1>

      {/* Kategoriler */}
      <div className="flex space-x-3 overflow-x-auto px-2 py-2 mb-6 scrollbar-hide">
        {Object.keys(grouped).map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`shrink-0 w-32 h-24 rounded-xl shadow-md relative transition transform hover:scale-105 overflow-hidden ${
              activeCategory === cat ? "ring-2 ring-black" : ""
            }`}
          >
            <img
              src={`https://source.unsplash.com/200x100/?${cat}`}
              alt={cat}
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <span className="relative z-10 text-white font-semibold text-sm text-center w-full h-full flex items-center justify-center">
              {cat}
            </span>
          </button>
        ))}
      </div>

      {/* Ürünler */}
      <div className="space-y-12">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} id={`section-${category}`}>
            <h2 className="text-xl font-bold mb-4 px-1">🍽️ {category}</h2>
            <div className="grid grid-cols-1 gap-4">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="w-full bg-white rounded-lg shadow p-4 hover:scale-[101%] transition"
                >
                  <img
                    src={p.image_url || "https://placehold.co/100x100"}
                    alt={p.name}
                    onError={(e) => (e.target.src = "https://placehold.co/100x100")}
                    className="w-full h-40 object-cover rounded"
                  />
                  <h3 className="font-semibold text-lg mt-2">{p.name}</h3>
                  <p className="text-sm text-gray-500">{p.price} ₺</p>
                  <p className="text-xs text-gray-400">Stok: {p.stock_count}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default QrMenu
