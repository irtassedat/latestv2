import { useEffect, useState } from "react"
import api from "../lib/axios"

const AdminOrders = () => {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await api.get("/orders")
      setOrders(res.data)
    }
    fetchOrders()
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h2 className="text-2xl font-bold mb-6">📋 Sipariş Listesi</h2>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-4 rounded shadow">
            <p><strong>Ad:</strong> {order.name}</p>
            <p><strong>Masa:</strong> {order.table_number}</p>
            <p><strong>Tutar:</strong> ₺{order.total_price}</p>
            <p><strong>Tarih:</strong> {new Date(order.created_at).toLocaleString()}</p>

            {/* Eğer sipariş detayları (ürünler) varsa burada listeleyebilirsin */}
            {order.items?.length > 0 && (
              <div className="mt-2">
                <p className="font-semibold">Ürünler:</p>
                <ul className="list-disc list-inside text-sm">
                  {order.items.map((item, index) => (
                    <li key={index}>
                      {item.name} x {item.quantity} – ₺{item.price}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminOrders 