import { useEffect, useState } from "react"
import api from "../lib/axios"
import ProductTable from "../components/ProductTable"

const Products = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [editProduct, setEditProduct] = useState(null)

  const [formOpen, setFormOpen] = useState(false)

  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    price: "",
    stock: "",
    category_id: "",
  })

  const [loading, setLoading] = useState(true)

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products")
      setProducts(response.data)
    } catch (err) {
      console.error("Ürünler yüklenirken hata:", err.message)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories")
      setCategories(response.data)
    } catch (err) {
      console.error("Kategoriler yüklenirken hata:", err.message)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return

    try {
      await api.delete(`/products/${id}`)
      fetchProducts()
    } catch (err) {
      console.error("Ürün silinirken hata:", err.message)
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, form)
      } else {
        await api.post("/products", form)
      }
      resetForm()
      fetchProducts()
    } catch (err) {
      console.error("İşlem sırasında hata oluştu:", err.message)
    }
  }

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      image_url: "",
      price: "",
      stock: "",
      category_id: "",
    })
    setEditProduct(null)
    setFormOpen(false)
  }

  const handleEdit = (product) => {
    setEditProduct(product)
    setForm({
      name: product.name,
      description: product.description || "",
      image_url: product.image_url || "",
      price: product.price,
      stock: product.stock || 0,
      category_id: product.category_id,
    })
    setFormOpen(true)
  }

  const handleAdd = async (formData) => {
    try {
      await api.post("/products", formData)
      fetchProducts()
    } catch (err) {
      console.error("Ürün eklenirken hata oluştu:", err.message)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">�� Ürün Yönetimi</h1>

      <ProductTable
        products={products}
        categories={categories}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
      />

      {formOpen && (
        <div className="bg-white shadow p-6 rounded max-w-xl">
          <h2 className="text-xl font-semibold mb-4">
            {editProduct ? "✏️ Ürünü Güncelle" : "➕ Yeni Ürün Ekle"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ürün Adı"
              className="w-full p-2 border rounded"
              required
            />
            <textarea
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
            <div className="grid grid-cols-2 gap-4">
              <input
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="Fiyat"
                type="number"
                className="w-full p-2 border rounded"
                required
              />
              <input
                name="stock"
                value={form.stock}
                onChange={handleChange}
                placeholder="Stok"
                type="number"
                className="w-full p-2 border rounded"
              />
            </div>
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
            <div className="flex justify-between">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {editProduct ? "Güncelle" : "Ekle"}
              </button>
              <button
                type="button"
                className="text-sm text-gray-500 underline"
                onClick={resetForm}
              >
                İptal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

export default Products
