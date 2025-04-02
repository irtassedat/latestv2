import { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import ReactPaginate from "react-paginate"

const categoryColors = {
  "Tatlılar": "bg-pink-100 text-pink-800",
  "Kahveler": "bg-amber-100 text-amber-800",
  "Soğuk İçecekler": "bg-blue-100 text-blue-800",
  "Sıcak İçecekler": "bg-orange-100 text-orange-800",
  "Ana Yemekler": "bg-green-100 text-green-800",
  "Başlangıçlar": "bg-purple-100 text-purple-800",
  "Tatlılar": "bg-pink-100 text-pink-800",
  "İçecekler": "bg-cyan-100 text-cyan-800",
  "Atıştırmalıklar": "bg-yellow-100 text-yellow-800",
  "Salatalar": "bg-emerald-100 text-emerald-800",
}

const ProductTable = ({ products, onEdit, onDelete, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(0)
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
  })

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
            <button
              onClick={handleExportExcel}
              className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
            >
              Excel'e Aktar
            </button>
            <button
              onClick={handlePrint}
              className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-800 text-sm"
            >
              Yazdır
            </button>
            <button
              onClick={onAdd}
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
        <div ref={printRef} className="overflow-x-auto">
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
                      src={product.image_url || "https://placehold.co/40"}
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
                        categoryColors[product.category_name] ||
                        "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {product.category_name}
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
                        onClick={() => onEdit(product)}
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
        <div className="p-4 border-t">
          <ReactPaginate
            pageCount={Math.ceil(filteredProducts.length / itemsPerPage)}
            onPageChange={(e) => setPage(e.selected)}
            containerClassName="flex justify-center gap-2"
            activeClassName="font-bold text-blue-600"
            previousClassName="px-3 py-1 rounded hover:bg-gray-100"
            nextClassName="px-3 py-1 rounded hover:bg-gray-100"
            pageClassName="px-3 py-1 rounded hover:bg-gray-100"
            breakClassName="px-3 py-1"
          />
        </div>
      )}
    </div>
  )
}

export default ProductTable 