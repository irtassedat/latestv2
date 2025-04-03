import { useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

const ProductDetail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { product } = location.state || {}

  const [quantity, setQuantity] = useState(1)

  if (!product) {
    return (
      <div className="p-4 text-center">
        <p>Ürün bulunamadı.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline">
          Geri Dön
        </button>
      </div>
    )
  }

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem("qr_cart") || "[]")
    const existingItem = existingCart.find((item) => item.id === product.id)

    let updatedCart
    if (existingItem) {
      updatedCart = existingCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      )
    } else {
      updatedCart = [...existingCart, { ...product, quantity }]
    }

    localStorage.setItem("qr_cart", JSON.stringify(updatedCart))
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Üstte büyük görsel */}
      <div className="relative h-64 w-full overflow-hidden">
        <Zoom>
          <img
            src={
              product.image_url && !product.image_url.includes("ibb.co")
                ? product.image_url
                : "/uploads/guncellenecek.jpg"
            }
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </Zoom>
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-white bg-black/50 px-3 py-1 rounded"
        >
          ← Geri
        </button>
      </div>

      {/* Bilgiler */}
      <div className="p-4 space-y-3">
        <h2 className="text-2xl font-bold">{product.name}</h2>
        {product.description && <p className="text-gray-700">{product.description}</p>}
        <p className="text-orange-600 text-xl font-bold">{product.price} ₺</p>

        {/* Adet seçici */}
        <div className="flex items-center gap-3 mt-2">
          <button
            className="px-3 py-1 bg-gray-200 rounded text-lg"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            -
          </button>
          <span>{quantity}</span>
          <button
            className="px-3 py-1 bg-gray-200 rounded text-lg"
            onClick={() => setQuantity((q) => q + 1)}
          >
            +
          </button>
        </div>

        <button
          onClick={handleAddToCart}
          className="mt-6 w-full bg-green-600 text-white py-3 rounded text-lg font-semibold"
        >
          Sepete Ekle
        </button>
      </div>
    </div>
  )
}

export default ProductDetail
