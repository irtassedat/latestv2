import { useState, useRef } from "react"
import { useReactToPrint } from "react-to-print"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

const ProductTable = ({ products, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState("")
  const printRef = useRef()

  const handleExportExcel = () => {
    const exportData = products.map((product) => ({
      Ürün: product.name,
      Kategori: product.category_name,
      Fiyat: `${product.price} ₺`,
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
          </div>
        </div>
      </div>

      <div ref={printRef} className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="p-3 text-left">Ürün</th>
              <th className="p-3 text-left">Kategori</th>
              <th className="p-3 text-left">Fiyat</th>
              <th className="p-3 text-left">Stok</th>
              <th className="p-3 text-left">Açıklama</th>
              <th className="p-3 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{product.name}</td>
                <td className="p-3">{product.category_name}</td>
                <td className="p-3">{product.price} ₺</td>
                <td className="p-3">{product.stock}</td>
                <td className="p-3 max-w-xs truncate">{product.description}</td>
                <td className="p-3 text-right">
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

      {filteredProducts.length === 0 && (
        <div className="p-4 text-center text-gray-500">
          Ürün bulunamadı.
        </div>
      )}
    </div>
  )
}

export default ProductTable 