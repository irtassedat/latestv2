import { useEffect, useState } from "react"
import api from "../lib/axios"

const AdminOrders = () => {
  const [orders, setOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedDate, setSelectedDate] = useState("")

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await api.get("/orders")
      setOrders(res.data)
    }
    fetchOrders()
  }, [])

  // filtrelenmiş siparişler
  const filteredOrders = orders
    .filter(order =>
      order.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter(order =>
      selectedDate
        ? new Date(order.created_at).toISOString().slice(0, 10) === selectedDate
        : true
    )

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h2 className="text-2xl font-bold mb-6">📋 Tüm Siparişler</h2>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Müşteri adına göre ara..."
          className="w-full max-w-md border px-4 py-2 rounded shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

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
            <div className="text-lg font-bold text-green-700">{order.total_price} ₺</div>
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
    </div>
  )
}

export default AdminOrders 