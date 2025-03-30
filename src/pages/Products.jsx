import { useEffect, useState } from "react"
import api from "../lib/axios"

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [editProduct, setEditProduct] = useState(null)

  // Form verisi
  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    price: "",
    category_id: "",
  })

  // Ürünleri çek
  const fetchProducts = async () => {
    try {
      const res = await api.get("/products")
      setProducts(res.data)
    } catch (err) {
      console.error("Ürünler alınamadı:", err.message)
    }
  }

  // Kategorileri çek
  const fetchCategories = async () => {
    try {
      const res = await api.get("/categories")
      setCategories(res.data)
    } catch (err) {
      console.error("Kategoriler alınamadı:", err.message)
    }
  }

  // Ürün silme fonksiyonu
  const handleDelete = async (id) => {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return
    try {
      await api.delete(`/products/${id}`)
      fetchProducts() // Listeyi yeniden çek
    } catch (err) {
      console.error("Ürün silinemedi:", err.message)
    }
  }  

  // Form inputlarını yakala
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // Form gönderilince ürün ekle
  const handleSubmit = async (e) => {
    e.preventDefault()
  
    try {
      if (editProduct) {
        // ✅ GÜNCELLEME
        await api.put(`/products/${editProduct.id}`, form)
      } else {
        // ✅ YENİ EKLEME
        await api.post("/products", form)
      }
  
      setForm({
        name: "",
        description: "",
        image_url: "",
        price: "",
        category_id: "",
      })
      setEditProduct(null)
      fetchProducts()
    } catch (err) {
      console.error("İşlem sırasında hata oluştu:", err.message)
    }
  }
  

  // Ürün düzenleme fonksiyonu
  const handleEdit = (product) => {
    setEditProduct(product)
    setForm({
      name: product.name,
      description: product.description || "",
      image_url: product.image_url || "",
      price: product.price,
      category_id: product.category_id,
    })
  }
  

  // İlk açıldığında ürünleri ve kategorileri getir
  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  return (
    <div className="p-4">
      {/* Ürün Listesi */}
      <h1 className="text-2xl font-bold mb-6">🛒 Ürün Listesi</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <div key={product.id} className="border p-4 rounded shadow bg-white">
            <img
              src={product.image_url || "https://placehold.co/30x30"}
              alt={product.name}
              onError={(e) => (e.target.src = "https://placehold.co/30x30")}
              className="w-full h-32 object-cover rounded mb-2"
            />
            <h2 className="font-bold text-lg">{product.name}</h2>
            <p className="text-sm text-gray-600">{product.price} ₺</p>
            <p className="text-xs italic text-gray-500">{product.category_name}</p>

            <div className="flex gap-2 mt-2">
              {/* Düzenle Butonu */}
              <button
                onClick={() => handleEdit(product)}
                className="text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Düzenle
              </button>

              {/* Silme Butonu */}
              <button
                onClick={() => handleDelete(product.id)}
                className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                Sil
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Ürün Ekleme Formu */}
      <div className="mt-12 p-6 bg-white shadow rounded max-w-md">
        <h2 className="text-xl font-bold mb-4">➕ Yeni Ürün Ekle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Ürün Adı"
            className="w-full p-2 border rounded"
            required
          />
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Açıklama"
            className="w-full p-2 border rounded"
          />
          <input
            name="image_url"
            value={form.image_url}
            onChange={handleChange}
            placeholder="Görsel URL"
            className="w-full p-2 border rounded"
          />
          <input
            name="price"
            value={form.price}
            onChange={handleChange}
            placeholder="Fiyat"
            type="number"
            className="w-full p-2 border rounded"
            required
          />
          <select
            name="category_id"
            value={form.category_id}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Kategori Seç</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            {editProduct ? "Güncelle" : "Ekle"}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Products
