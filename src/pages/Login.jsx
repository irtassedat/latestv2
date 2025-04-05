import { useState } from "react"
import { useNavigate } from "react-router-dom"
import CesmeHeader from "../components/CesmeHeader"

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Mock authentication
    setTimeout(() => {
      if (email === "admin@admin.com" && password === "123123") {
        localStorage.setItem("token", "mock-token-123")
        navigate("/admin") // Admin paneline yönlendir
      } else {
        setError("Geçersiz giriş bilgileri!")
        setIsLoading(false)
      }
    }, 800)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <CesmeHeader />

      <div className="max-w-md mx-auto p-4 pt-6">
        <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Yönetici Girişi</h2>
            <p className="text-sm text-gray-500 mt-1">
              Çeşme Kahvecisi panel yönetimi için giriş yapın
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-posta
              </label>
              <input
                type="email"
                placeholder="admin@admin.com"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#1a9c95] focus:border-[#1a9c95] outline-none transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Şifre
              </label>
              <input
                type="password"
                placeholder="••••••"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#1a9c95] focus:border-[#1a9c95] outline-none transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 accent-[#1a9c95]"
                />
                <label htmlFor="remember-me" className="ml-2 text-gray-600">
                  Beni hatırla
                </label>
              </div>
              <a href="#" className="text-[#1a9c95] hover:underline">
                Şifremi unuttum
              </a>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#1a9c95] text-white py-3 rounded-lg font-medium hover:bg-[#168981] transition-colors ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Demo Giriş Bilgileri:</p>
              <p>E-posta: admin@admin.com</p>
              <p>Şifre: 123123</p>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/menu")}
            className="text-[#1a9c95] text-sm hover:underline"
          >
            ← Menüye Dön
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login