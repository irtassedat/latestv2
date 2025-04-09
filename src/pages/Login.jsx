import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext"
import CesmeHeader from "../components/CesmeHeader"
import toast from "react-hot-toast"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const { login, currentUser } = useAuth()
  const navigate = useNavigate()

  // Kullanıcı zaten giriş yapmışsa yönlendir
  useEffect(() => {
    if (currentUser) {
      navigate("/admin");
    }
  }, [currentUser, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault()
    
    if (!username || !password) {
      setError("Lütfen kullanıcı adı ve şifre girin");
      return;
    }
    
    setIsLoading(true)
    setError(null)

    try {
      // useAuth hook'undan gelen login fonksiyonunu kullan
      const user = await login(username, password);
      
      toast.success(`Hoş geldiniz, ${user.username}!`, {
        duration: 3000,
        icon: '👋',
      });
      
      // Kullanıcı rolüne göre yönlendirme
      navigate("/admin");
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
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
                Kullanıcı Adı
              </label>
              <input
                type="text"
                placeholder="Kullanıcı adınız"
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-[#B8D7DD] focus:border-[#B8D7DD] outline-none transition"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
                  className="h-4 w-4 accent-[#D98A3D]"
                  />
                <label htmlFor="remember-me" className="ml-2 text-gray-600">
                  Beni hatırla
                </label>
              </div>
              <a href="#" className="text-[#D98A3D] hover:underline">
                Şifremi unuttum
              </a>
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full bg-[#022B45] text-white py-3 rounded-lg font-medium hover:bg-[#022B45]/80 transition-colors ${
                isLoading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Giriş yapılıyor..." : "Giriş Yap"}
            </button>

            <div className="text-center text-sm text-gray-500 mt-4">
              <p>Giriş bilgilerinizi şube yetkilisinden alabilirsiniz</p>
            </div>
          </form>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate("/menu")}
            className="text-[#D98A3D] text-sm hover:underline"
            >
            ← Menüye Dön
          </button>
        </div>
      </div>
    </div>
  )
}

export default Login