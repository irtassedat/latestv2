import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaTimes } from "react-icons/fa";

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (window.clarity) {
      window.clarity("event", isMenuOpen ? "menu_close" : "menu_open");
    }
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    if (window.clarity) {
      window.clarity("event", "menu_close");
    }
  };

  const handleLogin = () => {
    navigate("/login");
    closeMenu();
    if (window.clarity) {
      window.clarity("event", "login_click", { fromHeader: true });
    }
  };

  const handleFeedback = () => {
    navigate("/feedback");
    closeMenu();
    if (window.clarity) {
      window.clarity("event", "feedback_click", { fromHeader: true });
    }
  };

  return (
    <>
      {/* Üst Header - Yüksekliği arttırıldı */}
      <header className="text-white p-6 shadow-md flex justify-between items-center bg-[#022B45] relative z-10">
        <div className="flex items-center">
          <button onClick={() => navigate("/menu")} className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-medium">Çeşme Kahve</h1>
        </div>
        <button onClick={toggleMenu} className="p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Menü Portal - React Portal kullanmadan benzer bir etki yaratıyoruz */}
      {isMenuOpen && createPortal()}
    </>
  );

  // Menü portalı oluşturan fonksiyon
  function createPortal() {
    return (
      <div 
        id="cesme-menu-portal" 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1000000,
          pointerEvents: 'auto',
        }}
      >
        {/* Tüm Ekran Arkaplan - Blur ve Karartma */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(5px)',
          }}
        />
        
        {/* Menü Çerçevesi */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
          }}
        >
          {/* Sol Menü Paneli - Düzeltme: max-width ekledik, fazla yükseklik almayacak ve içerik sığacak */}
          <div 
            style={{
              width: '80%',
              height: '100%',
              maxWidth: '350px',
              backgroundColor: 'white',
              boxShadow: '0px 0px 15px rgba(0, 0, 0, 0.2)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              animation: 'slideIn 0.3s ease-out forwards',
              overflowY: 'auto', // Mobil cihazlarda scroll olması için
            }}
          >
            {/* Menü İçeriği - İçeriği daha kompakt hale getirelim */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Kapat Butonu */}
              <button
                onClick={closeMenu}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#555',
                  zIndex: 10,
                }}
              >
                <FaTimes style={{ width: '20px', height: '20px' }} />
              </button>
              
              {/* Sosyal Medya - padding azaltıldı */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '24px',
                marginTop: '16px',
                marginBottom: '20px',
                color: '#022B45',
                fontSize: '24px',
              }}>
                <FaInstagram style={{ cursor: 'pointer' }} />
                <FaFacebookF style={{ cursor: 'pointer' }} />
                <FaTwitter style={{ cursor: 'pointer' }} />
                <FaYoutube style={{ cursor: 'pointer' }} />
              </div>
              
              {/* Menü Öğeleri - gap küçültüldü */}
              <div style={{ flexGrow: 0 }}>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '16px',
                  color: '#022B45',
                  fontSize: '18px',
                  fontWeight: '500',
                }}>
                  <button 
                    onClick={() => { navigate("/dil"); closeMenu(); }}
                    style={{ textAlign: 'left', padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    🌐 Dil (TR)
                  </button>
                  <button 
                    onClick={() => { navigate("/rezervasyon"); closeMenu(); }}
                    style={{ textAlign: 'left', padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    📅 Rezervasyon Oluştur
                  </button>
                  <button 
                    onClick={handleFeedback}
                    style={{ textAlign: 'left', padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    💬 Geri Bildirim Ver
                  </button>
                </div>
              </div>
              
              {/* Login Butonu - Marginler azaltıldı */}
              <div style={{ 
                marginTop: 'auto', 
                paddingTop: '16px', 
                borderTop: '1px solid #eee',
              }}>
                <button
                  onClick={handleLogin}
                  style={{
                    width: '100%',
                    backgroundColor: '#022B45',
                    color: 'white',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '500',
                    marginTop: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <svg style={{ width: '20px', height: '20px' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Giriş yap
                </button>
              </div>
              
              {/* Telif Hakkı - Margin azaltıldı */}
              <div style={{
                marginTop: '4px',
                marginBottom: '8px',
                textAlign: 'center',
                fontSize: '12px',
                color: '#888',
              }}>
                © 2025 Çeşme Kahve<br />
                Tüm Hakları Saklıdır
              </div>
            </div>
          </div>
          
          {/* Sağ Kapama Alanı */}
          <div 
            style={{ flex: 1 }}
            onClick={closeMenu}
          />
        </div>
      </div>
    );
  }
};

// CSS Animasyonu
document.head.insertAdjacentHTML('beforeend', `
  <style>
    @keyframes slideIn {
      0% { transform: translateX(-100%); opacity: 0; }
      100% { transform: translateX(0); opacity: 1; }
    }
  </style>
`);

export default CesmeHeader;