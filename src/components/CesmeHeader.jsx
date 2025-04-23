// src/components/CesmeHeader.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaFacebookF, FaInstagram, FaTwitter, FaYoutube, FaTimes, FaUser, FaGift } from "react-icons/fa";

const CesmeHeader = ({ customer, onLoginClick, onProfileClick, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
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

  const handleFeedback = () => {
    navigate("/feedback");
    closeMenu();
    if (window.clarity) {
      window.clarity("event", "feedback_click", { fromHeader: true });
    }
  };

  const handleCustomerLogin = () => {
    onLoginClick();
    closeMenu();
    if (window.clarity) {
      window.clarity("event", "customer_login_click", { fromHeader: true });
    }
  };

  const handleProfileView = () => {
    onProfileClick();
    closeMenu();
    if (window.clarity) {
      window.clarity("event", "loyalty_profile_click", { fromHeader: true });
    }
  };

  const handleLogout = () => {
    onLogout();
    closeMenu();
    if (window.clarity) {
      window.clarity("event", "customer_logout", { fromHeader: true });
    }
  };

  return (
    <>
      {/* Üst Header */}
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

      {/* Menü Portal */}
      {isMenuOpen && (
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
          {/* Arkaplan */}
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
          
          {/* Menü Container */}
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
            {/* Sol Menü Paneli */}
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
                overflowY: 'auto',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {/* Menü İçeriği */}
              <div style={{ 
                padding: '16px', 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: '100%',
                paddingBottom: '16px',
              }}>
                
                {/* Kapat Butonu */}
                <button
                  onClick={closeMenu}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#555',
                    zIndex: 10,
                  }}
                >
                  <FaTimes style={{ width: '20px', height: '20px' }} />
                </button>
                
                {/* Logo Alanı */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginTop: '20px',
                  marginBottom: '20px',
                }}>
                  <div style={{
                    width: '120px',
                    height: '60px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    border: '1px solid #e2e8f0',
                    padding: '8px',
                  }}>
                    <img 
                      src="/logos/restlogo.png" 
                      alt="Çeşme Kahve Logo" 
                      style={{ 
                        maxWidth: '100%', 
                        maxHeight: '100%',
                        objectFit: 'contain'
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.style.backgroundColor = '#022B45';
                        e.target.parentElement.style.color = 'white';
                        e.target.parentElement.innerHTML = 'ÇEŞME KAHVE';
                      }}
                    />
                  </div>
                </div>
                
                {/* Sosyal Medya */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px',
                  marginTop: '10px',
                  marginBottom: '30px',
                  color: '#022B45',
                  fontSize: '24px',
                }}>
                  <FaInstagram style={{ cursor: 'pointer' }} />
                  <FaFacebookF style={{ cursor: 'pointer' }} />
                  <FaTwitter style={{ cursor: 'pointer' }} />
                  <FaYoutube style={{ cursor: 'pointer' }} />
                </div>
                
                {/* Menü Öğeleri */}
                <div style={{ 
                  marginTop: '20px',
                  marginBottom: '40px',
                  paddingLeft: '15px',
                  paddingRight: '15px'
                }}>
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
                      style={{ 
                        textAlign: 'left', 
                        padding: '12px 10px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        width: '100%',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      🌐 Dil (TR)
                    </button>
                    <button 
                      onClick={() => { navigate("/rezervasyon"); closeMenu(); }}
                      style={{ 
                        textAlign: 'left', 
                        padding: '12px 10px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        width: '100%',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      📅 Rezervasyon Oluştur
                    </button>
                    <button 
                      onClick={handleFeedback}
                      style={{ 
                        textAlign: 'left', 
                        padding: '12px 10px', 
                        background: 'none', 
                        border: 'none', 
                        cursor: 'pointer',
                        width: '100%',
                        borderRadius: '8px',
                        transition: 'background-color 0.2s',
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      💬 Geri Bildirim Ver
                    </button>
                  </div>
                </div>
                
                {/* Spacer */}
                <div style={{ flexGrow: 1 }}></div>
                
                {/* Müşteri Girişi/Profili */}
                <div style={{ 
                  marginTop: 'auto',
                  paddingTop: '20px',
                  borderTop: '1px solid #eee',
                  marginBottom: '100px', // Artırıldı
                }}>
                  {customer ? (
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '10px',
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '12px',
                        backgroundColor: '#f8fafc',
                        borderRadius: '8px',
                        padding: '10px',
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#022B45',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px',
                          fontWeight: 'bold'
                        }}>
                          {customer.full_name?.charAt(0) || customer.phone_number.charAt(0)}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600', color: '#1a1a1a' }}>
                            {customer.full_name || 'Müşteri'}
                          </div>
                          <div style={{ fontSize: '14px', color: '#666' }}>
                            {customer.phone_number}
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleProfileView}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px',
                          backgroundColor: '#022B45',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '15px',
                        }}
                      >
                        <FaGift />
                        Sadakat Kartlarım
                      </button>
                      
                      <button
                        onClick={handleLogout}
                        style={{
                          padding: '10px',
                          backgroundColor: '#fff',
                          color: '#dc2626',
                          border: '1px solid #dc2626',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '15px',
                        }}
                      >
                        Çıkış Yap
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleCustomerLogin}
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
                      Giriş Yap / Puan Kazan
                    </button>
                  )}
                </div>
                
                {/* Telif Hakkı */}
                <div style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#888',
                  padding: '16px',
                  backgroundColor: 'white',
                  borderTop: '1px solid #eee',
                  paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
                  maxWidth: '350px',
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
      )}
    </>
  );
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