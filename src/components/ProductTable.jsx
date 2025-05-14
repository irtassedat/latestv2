import { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import ReactPaginate from "react-paginate"
import api from "../lib/axios";

const categoryColors = {
  "Tatlılar": "bg-pink-100 text-pink-800",
  "Kahveler": "bg-amber-100 text-amber-800",
  "Soğuk İçecekler": "bg-blue-100 text-blue-800",
  "Sıcak İçecekler": "bg-orange-100 text-orange-800",
  "Ana Yemekler": "bg-green-100 text-green-800",
  "Başlangıçlar": "bg-purple-100 text-purple-800",
  "İçecekler": "bg-cyan-100 text-cyan-800",
  "Atıştırmalıklar": "bg-yellow-100 text-yellow-800",
  "Salatalar": "bg-emerald-100 text-emerald-800",
}

const ProductTable = ({ products = [], categories = [], onEdit, onDelete, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    image_url: "",
    price: "",
    category_id: "",
  })
  const printRef = useRef()
  const itemsPerPage = 10

  const handleExportExcel = () => {
    const exportData = products.map((product) => ({
      Ürün: product.name,
      Kategori: product.category_name,
      Fiyat: product.price,
      Stok: product.stock,
      Açıklama: product.description,
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Ürünler")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/octet-stream" })
    saveAs(data, "urunler.xlsx")
  }

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: "Ürün Listesi",
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editProduct) {
      onEdit({ ...editProduct, ...form })
    } else {
      onAdd(form)
    }
    setShowModal(false)
    setForm({
      name: "",
      description: "",
      image_url: "",
      price: "",
      category_id: "",
    })
    setEditProduct(null)
  }

  const handleEditClick = (product) => {
    setEditProduct(product)
    setForm({
      name: product.name,
      description: product.description || "",
      image_url: product.image_url || "",
      price: product.price,
      category_id: product.category_id,
    })
    setShowModal(true)
  }

  const handleExcelUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet)

    // Veriyi backend'e POST et
    try {
      const res = await api.post("/products/bulk", json)
      alert(`✅ ${res.data.insertedProducts.length} ürün başarıyla eklendi!`)
      window.location.reload()
    } catch (err) {
      console.error("Excel import hatası:", err.message)
      alert("❌ Excel'den ürün yüklenemedi.")
    }
  }

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const paginatedProducts = filteredProducts.slice(
    page * itemsPerPage,
    (page + 1) * itemsPerPage
  )

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <input
            type="text"
            placeholder="Ürün veya kategori ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 border px-3 py-2 rounded"
          />
          <div className="flex gap-2">
            <input
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              id="excel-upload"
              onChange={handleExcelUpload}
            />
            <label
              htmlFor="excel-upload"
              className="bg-purple-600 text-white px-3 py-2 rounded hover:bg-purple-700 text-sm cursor-pointer"
            >
              Excel Yükle
            </label>
            <button
              onClick={handleExportExcel}
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Excel'e Aktar
            </button>
            <button
              onClick={() => {
                if (filteredProducts.length === 0) {
                  alert("Yazdırılacak ürün yok.")
                } else {
                  handlePrint()
                }
              }}
              className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-800 text-sm"
            >
              Yazdır
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700 text-sm"
            >
              + Yeni Ürün
            </button>
          </div>
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="p-6 text-center text-gray-500">Hiç ürün bulunamadı.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-3 text-left">Görsel</th>
                <th className="p-3 text-left">Ürün</th>
                <th className="p-3 text-left">Kategori</th>
                <th className="p-3 text-right">Fiyat</th>
                <th className="p-3 text-right">Stok</th>
                <th className="p-3 text-left hidden md:table-cell">Açıklama</th>
                <th className="p-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <img
                      src={
                        product.image_url &&
                        product.image_url.trim() !== "" &&
                        !product.image_url.includes("ibb.co")
                          ? product.image_url
                          : "/uploads/guncellenecek.jpg"
                      }
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  </td>
                  <td className="p-3 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                    {product.name}
                  </td>
                  <td className="p-3">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        categoryColors[product.category_name || ""] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.category_name || "Kategori Yok"}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {product.price} ₺
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    {product.stock}
                  </td>
                  <td className="p-3 hidden md:table-cell max-w-xs truncate">
                    {product.description}
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(product)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDelete(product.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredProducts.length > 0 && (
        <div className="overflow-x-auto px-4 pb-4">
          <ReactPaginate
            pageCount={Math.ceil(filteredProducts.length / itemsPerPage)}
            onPageChange={(e) => setPage(e.selected)}
            containerClassName="flex justify-center gap-2 flex-wrap"
            activeClassName="font-bold text-blue-600"
            previousClassName="px-3 py-1 rounded hover:bg-gray-100"
            nextClassName="px-3 py-1 rounded hover:bg-gray-100"
            pageClassName="px-3 py-1 rounded hover:bg-gray-100"
            breakClassName="px-3 py-1"
          />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
              onClick={() => setShowModal(false)}
            >
              ❌
            </button>
            <h2 className="text-xl font-bold mb-4">➕ Yeni Ürün</h2>
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
                {Array.isArray(categories) && categories.map((cat) => (
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
      )}

      {/* Yazdırılacak tüm ürünlerin bulunduğu görünmeyen tablo */}
      <div style={{ display: "none" }}>
        <div ref={printRef} className="p-4">
          <h2 className="text-xl font-bold mb-4 text-center">Ürün Listesi</h2>
          <table className="w-full text-sm border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border">Ürün</th>
                <th className="p-2 border">Kategori</th>
                <th className="p-2 border">Fiyat</th>
                <th className="p-2 border">Stok</th>
                <th className="p-2 border">Açıklama</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 border">{p.name}</td>
                  <td className="p-2 border">{p.category_name}</td>
                  <td className="p-2 border">{p.price} ₺</td>
                  <td className="p-2 border">{p.stock}</td>
                  <td className="p-2 border">{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ProductTable