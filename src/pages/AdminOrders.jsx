import { useEffect, useState } from "react"
import api from "../lib/axios"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"
import jsPDF from "jspdf"
import "jspdf-autotable"

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("")
  const [editingOrder, setEditingOrder] = useState(null)

  const fetchOrders = async () => {
    const res = await api.get("/orders")
    setOrders(res.data)
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleDelete = async (id) => {
    const confirm = window.confirm("Bu siparişi silmek istediğinizden emin misiniz?")
    if (!confirm) return

    try {
      await api.delete(`/orders/${id}`)
      setOrders((prev) => prev.filter((order) => order.id !== id))
      alert("Sipariş silindi.")
    } catch (err) {
      console.error("Silme hatası:", err)
      alert("Sipariş silinemedi.")
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(`/orders/${editingOrder.id}`, {
        name: editingOrder.name,
        table_number: editingOrder.table_number,
      })
      alert("Güncellendi!")
      setEditingOrder(null)
      fetchOrders()
    } catch (err) {
      console.error("Güncelleme hatası:", err)
    }
  }

  const handleExportExcel = () => {
    const exportData = orders.map((order) => ({
      Ad: order.name,
      Masa: order.table_number,
      Tutar: `${order.total_price} ₺`,
      Ürünler: order.items?.map((i) => `${i.name} x${i.quantity}`).join(", "),
      Tarih: new Date(order.created_at).toLocaleString(),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Siparişler")

    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const data = new Blob([excelBuffer], { type: "application/octet-stream" })
    saveAs(data, "siparisler.xlsx")
  }

  const handleExportPDF = () => {
    const doc = new jsPDF()
    doc.text("Sipariş Listesi", 14, 10)

    const tableData = orders.map((order) => [
      order.name,
      order.table_number,
      `${order.total_price} ₺`,
      order.items?.map((i) => `${i.name} x${i.quantity}`).join(", "),
      new Date(order.created_at).toLocaleString(),
    ])

    doc.autoTable({
      head: [["Ad", "Masa", "Tutar", "Ürünler", "Tarih"]],
      body: tableData,
      startY: 20,
    })

    doc.save("siparisler.pdf")
  }

  const handlePrint = () => {
    const printContent = document.getElementById("print-section")
    const WinPrint = window.open("", "", "width=900,height=650")
    WinPrint.document.write(`
      <html>
        <head>
          <title>Siparişler</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `)
    WinPrint.document.close()
    WinPrint.focus()
    WinPrint.print()
    WinPrint.close()
  }

  // filtrelenmiş siparişler
  const filteredOrders = orders.filter(order =>
    order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.table_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-6">📋 Tüm Siparişler</h2>

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleExportExcel}
          className="bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 text-sm"
        >
          Excel'e Aktar
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 text-sm"
        >
          PDF'ye Aktar
        </button>
        <button
          onClick={handlePrint}
          className="bg-gray-700 text-white px-3 py-2 rounded hover:bg-gray-800 text-sm"
        >
          Yazdır
        </button>
      </div>

      <input
        type="text"
        placeholder="İsim veya masa numarası ara..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full border px-3 py-2 rounded mb-4"
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Tarihe göre filtrele</label>
        <input
          type="date"
          className="border px-3 py-2 rounded shadow-sm"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
      </div>

      {filteredOrders.length === 0 && (
        <p className="text-gray-500 mt-4">Aramanıza uygun sipariş bulunamadı.</p>
      )}

      <div id="print-section">
        <table className="w-full text-sm mt-4">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Ad</th>
              <th className="p-2">Masa</th>
              <th className="p-2">Tutar</th>
              <th className="p-2">Ürünler</th>
              <th className="p-2">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id}>
                <td className="p-2">{order.name}</td>
                <td className="p-2">{order.table_number}</td>
                <td className="p-2">{order.total_price} ₺</td>
                <td className="p-2">
                  {order.items?.map((i) => `${i.name} x${i.quantity}`).join(", ")}
                </td>
                <td className="p-2">
                  {new Date(order.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.map((order) => (
        <div
          key={order.id}
          className="bg-white rounded shadow p-4 mb-6 border-l-4 border-green-600"
        >
          <div className="flex justify-between items-center mb-2">
            <div>
              <p className="font-semibold">👤 {order.name}</p>
              <p className="text-sm text-gray-600">🪑 Masa: {order.table_number}</p>
              <p className="text-sm text-gray-500">🕒 {new Date(order.created_at).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditingOrder(order)}
                className="text-blue-600 text-sm underline"
              >
                ✏️ Düzenle
              </button>
              <div className="text-lg font-bold text-green-700 mr-4">{order.total_price} ₺</div>
              <button
                className="text-red-500 text-sm hover:underline"
                onClick={() => handleDelete(order.id)}
              >
                Sil
              </button>
            </div>
          </div>

          {order.items?.length > 0 && (
            <ul className="text-sm text-gray-700 mt-2 space-y-1">
              {order.items.map((item, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    • {item.name} x {item.quantity}
                  </span>
                  <span>{item.price * item.quantity} ₺</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {editingOrder && (
        <form
          onSubmit={handleUpdate}
          className="fixed top-0 left-0 w-full h-full bg-black/50 flex justify-center items-center z-50"
        >
          <div className="bg-white p-6 rounded shadow-lg w-[90%] max-w-md">
            <h2 className="text-lg font-bold mb-4">📝 Siparişi Düzenle</h2>
            <input
              className="w-full border px-3 py-2 rounded mb-3"
              value={editingOrder.name}
              onChange={(e) =>
                setEditingOrder({ ...editingOrder, name: e.target.value })
              }
              placeholder="Ad Soyad"
              required
            />
            <input
              className="w-full border px-3 py-2 rounded mb-3"
              value={editingOrder.table_number}
              onChange={(e) =>
                setEditingOrder({ ...editingOrder, table_number: e.target.value })
              }
              placeholder="Masa No"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingOrder(null)}
                className="text-gray-600 underline"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Kaydet
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  )
}

export default AdminOrders 