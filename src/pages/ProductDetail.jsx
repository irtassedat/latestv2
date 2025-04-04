import { useLocation, useNavigate } from "react-router-dom"
import { useState } from "react"
import toast from "react-hot-toast"
import Zoom from 'react-medium-image-zoom'
import 'react-medium-image-zoom/dist/styles.css'

const ProductDetail = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { product } = location.state || {}

  const handleAddToCart = () => {
    const existingCart = JSON.parse(localStorage.getItem("qr_cart") || "[]")
    const existingItem = existingCart.find((item) => item.id === product.id)

    const updatedCart = existingItem
      ? existingCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      : [...existingCart, { ...product, quantity: 1 }]

    localStorage.setItem("qr_cart", JSON.stringify(updatedCart))
    toast('🛒 Sepete eklendi', {
      style: {
        border: '1px solid #e5e7eb',
        background: '#fff',
        padding: '8px 12px',
        fontSize: '14px',
        color: '#111',
      },
    })
  }

  if (!product) {
    return (
      <div className="p-4 text-center">
        <p>Ürün bulunamadı.</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline">Geri Dön</button>
      </div>
    )
  }

  return (
    <div className="bg-gray-100 min-h-screen flex justify-center px-4 py-5">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">

        {/* GÖRSEL */}
        <div className="relative">
          <Zoom>
            <img
              src={
                product.image_url && !product.image_url.includes("ibb.co")
                  ? product.image_url
                  : "/uploads/guncellenecek.jpg"
              }
              alt={product.name}
              className="w-full h-[240px] object-cover"
            />
          </Zoom>

          <button
            onClick={() => navigate(-1)}
            className="absolute top-3 left-3 bg-black/50 text-white text-sm px-3 py-1 rounded-full"
          >
            ← Geri
          </button>

          {/* Sepete Ekle Butonu */}
          <button
            onClick={handleAddToCart}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center hover:bg-green-700 shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* İÇERİK */}
        <div className="px-6 pt-6 pb-8">
          <h1 className="text-xl font-bold mb-3">{product.name}</h1>
          {product.description && (
            <p className="text-gray-700 text-sm leading-relaxed mb-6">
              {product.description}
            </p>
          )}

          {/* YORUM KARTI */}
          <div
            onClick={() => navigate('/comments')} // yorum detay sayfası olacak
            className="bg-[#72A8B3] text-white px-4 py-3 rounded-lg flex justify-between items-center cursor-pointer hover:opacity-90 transition mb-4"
          >
            <div className="flex items-center gap-1 text-sm">
              <span className="text-base font-bold">5.0</span>
              <span className="text-xs">★★★★★</span>
              <span className="ml-2 font-semibold">1 yorum ›</span>
            </div>
            <p className="italic text-xs">“Çok güzeldi, öneriyorum”</p>
          </div>

          {/* FİYAT */}
          <div className="text-sm text-blue-600 font-medium text-right mb-2">
            {product.price} ₺
          </div>

          {/* (Gelecek Özellikler için yer) */}
          {/* 
            <div className="flex gap-2 mt-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <img src="/icons/vegetarian.svg" className="w-4 h-4" />
                Vejetaryen
              </div>
              <div className="flex items-center gap-1">
                <img src="/icons/gluten.svg" className="w-4 h-4" />
                Glutensiz
              </div>
            </div>
          */}
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
