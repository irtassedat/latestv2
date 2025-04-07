import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const CesmeHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isMenuOpen) {
      // Menü açıkken sayfanın scrollunu engelle
      document.body.style.overflow = "hidden";
    } else {
      // Menü kapalıyken scrollu serbest bırak
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const handleLogin = () => {
    navigate("/login");
    closeMenu();
  };

  const handleFeedback = () => {
    navigate("/feedback");
    closeMenu();
  };

  return (
    <>
      {/* Header */}
      <header className="text-white p-4 shadow-md flex justify-between items-center bg-[#1a9c95] relative z-10">
        <div className="flex items-center">
          <button onClick={() => navigate("/menu")} className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-medium">Çeşme Kahve</h1>
        </div>
        <button onClick={toggleMenu} className="p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Menü Overlay ve İçerik */}
      {isMenuOpen && (
        <div className="fixed inset-0 flex z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          {/* Sol Menü - Tamamen opak ve tam ekran yüksekliği */}
          <div
            className="w-[80%] h-full bg-white flex flex-col shadow-xl animate-slideInLeft"
            style={{
              backgroundColor: "#fff",
              boxShadow: "4px 0 10px rgba(0, 0, 0, 0.2)"
            }}
          >
            {/* Menü Başlığı */}
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
              <span className="text-gray-800 font-medium text-xl">Menü</span>
              <button onClick={closeMenu} className="text-gray-600 p-2 rounded-full hover:bg-gray-100">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menü İçerik */}
            <div className="p-6 flex-1 bg-white">
              <div className="flex flex-col space-y-5">
                <div className="text-gray-800 hover:bg-gray-100 cursor-pointer p-4 rounded-lg font-medium flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2" />
                  </svg>
                  Dil (TR)
                </div>

                <div
                  className="text-gray-800 hover:bg-gray-100 cursor-pointer p-4 rounded-lg font-medium flex items-center"
                  onClick={handleFeedback}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  Geri Bildirim Ver
                </div>

                <button
                  onClick={handleLogin}
                  className="flex items-center justify-center w-full bg-[#1a9c95] text-white py-4 px-4 rounded-lg hover:bg-[#188a84] mt-4 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Giriş yap
                </button>
              </div>
            </div>

            {/* Alt Bilgi - Sayfanın en altına yapıştırılmış */}
            <div className="p-5 border-t border-gray-200 text-center text-xs text-gray-500 bg-white">
              © 2025 Çeşme Kahve<br />
              Tüm Hakları Saklıdır
            </div>
          </div>

          {/* Sağ taraftaki kapatma alanı */}
          <div className="flex-1" onClick={closeMenu}></div>
        </div>
      )}

      {/* Slide in animasyonu */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.3s ease forwards;
        }
      `}} />
    </>
  );
};

export default CesmeHeader;