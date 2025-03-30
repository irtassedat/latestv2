import { useEffect, useState } from "react"
import api from "../lib/axios"

const BranchProducts = () => {
  const [branches, setBranches] = useState([])
  const [selectedBranchId, setSelectedBranchId] = useState("")
  const [products, setProducts] = useState([])

  // Şubeleri getir
  const fetchBranches = async () => {
    const res = await api.get("/branches")
    setBranches(res.data)
  }

  // Şubeye ait ürünleri getir
  const fetchBranchProducts = async (id) => {
    const res = await api.get(`/branches/${id}/products`)
    setProducts(res.data)
  }

  // Ürün güncelleme için input/checkbox değişikliklerini yakala
  const handleToggle = (id, key, value) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [key]: value } : p))
    )
  }

  // Güncelleme işlemi (PATCH)
  const handleUpdate = async (product) => {
    try {
      await api.patch(`/branches/${selectedBranchId}/products/${product.id}`, {
        is_visible: product.is_visible,
        stock_count: product.stock_count,
      })
      alert("Güncelleme başarılı ✅")
    } catch (err) {
      console.error("Güncelleme hatası:", err.message)
      alert("Güncelleme başarısız ❌")
    }
  }

  // Sayfa yüklendiğinde şubeleri getir
  useEffect(() => {
    fetchBranches()
  }, [])

  // Şube seçildiğinde ürünleri getir
  useEffect(() => {
    if (selectedBranchId) {
      fetchBranchProducts(selectedBranchId)
    }
  }, [selectedBranchId])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🏪 Şube Ürünleri</h1>

      {/* Şube Seçimi */}
      <select
        value={selectedBranchId}
        onChange={(e) => setSelectedBranchId(e.target.value)}
        className="mb-6 border p-2 rounded"
      >
        <option value="">🔻 Şube Seç</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      {/* Ürün Listesi */}
      {selectedBranchId && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border p-4 rounded shadow bg-white">
              <h2 className="font-bold">{product.name}</h2>
              <p className="text-sm text-gray-600">{product.category_name}</p>

              {/* Görünürlük Toggle */}
              <label className="flex items-center mt-2 gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={product.is_visible ?? true}
                  onChange={(e) =>
                    handleToggle(product.id, "is_visible", e.target.checked)
                  }
                />
                Görünür mü?
              </label>

              {/* Stok Sayısı */}
              <input
                type="number"
                value={product.stock_count ?? 0}
                onChange={(e) =>
                  handleToggle(product.id, "stock_count", parseInt(e.target.value))
                }
                className="mt-2 p-1 border rounded w-full"
                placeholder="Stok Adedi"
              />

              {/* Kaydet Butonu */}
              <button
                onClick={() => handleUpdate(product)}
                className="mt-3 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
              >
                Kaydet
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default BranchProducts
