import { useLocation, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import api from "../lib/axios"
import toast from "react-hot-toast"

const ConfirmOrder = () => {
  const location = useLocation()
  const cart = location.state?.cart || []
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const masaNo = params.get("table")
  const [formData, setFormData] = useState({
    name: "",
    tableNumber: masaNo || ""
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form değişikliklerini izle
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  useEffect(() => {
    // Eğer sepet boşsa ana sayfaya yönlendir
    if (cart.length === 0) {
      toast.error("Sepetinizde ürün bulunmuyor", {
        duration: 3000,
        icon: '🛒'
      })
      navigate('/menu')
    }
  }, [cart, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    const { name, tableNumber } = formData;
    const totalPrice = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    try {
      const response = await api.post("/orders", {
        name,
        tableNumber,
        totalPrice,
        items: cart
      });

      // Clarity olay izleme - sipariş tamamlandı
      if (window.clarity) {
        window.clarity("event", "order_complete", {
          orderId: response?.data?.id || "unknown", // API'den ID gelmezse "unknown" kullan
          customerName: name,
          tableNumber: tableNumber,
          totalAmount: totalPrice,
          itemCount: cart.length,
          products: cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
          }))
        });
        
        console.log("Clarity: Sipariş tamamlanma izlendi", {
          total: totalPrice,
          items: cart.length
        });
      }

      // Sepeti temizle (localStorage'dan da)
      localStorage.removeItem("qr_cart");
      
      // Başarı bildirimi
      toast.success("Siparişiniz başarıyla alındı!", {
        duration: 4000,
        icon: '✅',
        style: {
          background: '#22c55e',
          color: '#fff',
          fontWeight: 'bold',
          padding: '16px',
        }
      });
      
      // Kısa bir süre sonra ana sayfaya yönlendir
      setTimeout(() => {
        navigate("/menu");
      }, 2000);
    } catch (err) {
      console.error("Sipariş gönderilirken hata oluştu:", err);
      
      // Clarity hata izleme
      if (window.clarity) {
        window.clarity("event", "order_error", {
          error: err.message || "Unknown error",
          customerName: formData.name,
          tableNumber: formData.tableNumber
        });
      }
      
      toast.error("Sipariş gönderilirken bir hata oluştu. Lütfen tekrar deneyin.", {
        duration: 3000,
        icon: '❌'
      });
      setIsSubmitting(false);
    }
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">📦 Sipariş Onayı</h2>
          <button
            onClick={() => navigate(-1)}
            className="text-gray-600 hover:text-gray-800"
          >
            ← Geri
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-5 mb-6">
          <h3 className="font-semibold text-lg mb-4">Sipariş Detayları</h3>
          
          {cart.map((item) => (
            <div key={item.id} className="flex justify-between items-center border-b py-3">
              <div className="flex gap-3">
                <div className="w-12 h-12 rounded-md overflow-hidden">
                  <img 
                    src={
                      item.image_url && !item.image_url.includes("ibb.co")
                        ? item.image_url
                        : "/uploads/guncellenecek.jpg"
                    } 
                    alt={item.name}
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">{item.price} ₺ × {item.quantity}</p>
                </div>
              </div>
              <span className="font-semibold">{(item.price * item.quantity).toFixed(2)} ₺</span>
            </div>
          ))}
          
          <div className="flex justify-between items-center pt-4 mt-2">
            <span className="font-medium">Toplam Tutar</span>
            <span className="text-xl font-bold text-[#D98A3D]">{total.toFixed(2)} ₺</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-5">
          <h3 className="font-semibold text-lg mb-4">İletişim Bilgileri</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adınız
              </label>
              <input
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="Adınız Soyadınız"
                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-[#B8D7DD] focus:border-[#B8D7DD] outline-none transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Masa Numarası
              </label>
              <input
                name="tableNumber"
                type="text"
                value={formData.tableNumber}
                onChange={handleChange}
                placeholder="Masa Numarası"
                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full bg-[#022B45] text-white py-3 px-6 rounded-xl font-medium hover:bg-[#022B45]/80 transition mt-4
                ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              {isSubmitting ? 'Sipariş Gönderiliyor...' : 'Siparişi Gönder'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ConfirmOrder