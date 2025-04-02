import { useLocation, useNavigate } from "react-router-dom"
import api from "../lib/axios"

const ConfirmOrder = () => {
  const location = useLocation()
  const cart = location.state?.cart || []
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const masaNo = params.get("table")

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target
    const name = form.name.value
    const tableNumber = form.tableNumber.value

    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

    try {
      const res = await api.post("/orders", {
        name,
        tableNumber,
        totalPrice,
        items: cart, // Burada ürünlerin tamamı gönderilir
      })

      alert("Sipariş başarıyla gönderildi!")
      navigate("/") // Anasayfaya dön
    } catch (err) {
      console.error("Sipariş gönderilirken hata oluştu:", err)
      alert("Sipariş gönderilemedi.")
    }
  }

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <h2 className="text-2xl font-bold mb-4">📦 Sipariş Detayları</h2>

      {cart.map((item) => (
        <div key={item.id} className="flex justify-between border-b py-2 text-sm">
          <span>{item.name} x {item.quantity}</span>
          <span>{item.price * item.quantity} ₺</span>
        </div>
      ))}

      <div className="text-right font-bold mt-2">Toplam: {total} ₺</div>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
        <input
          name="name"
          type="text"
          placeholder="Adınız"
          className="w-full border px-4 py-2 rounded"
          required
        />
        <input
          name="tableNumber"
          type="text"
          placeholder="Masa Numarası"
          className="w-full border px-4 py-2 rounded"
          required
          defaultValue={masaNo}
        />
        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Siparişi Gönder
        </button>
      </form>
    </div>
  )
}

export default ConfirmOrder 