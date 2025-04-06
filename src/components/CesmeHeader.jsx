import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const CesmeHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

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
      {/* Üst Header */}
      <header className="sticky top-0 z-50 bg-[#1a9c95] text-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={() => navigate("/menu")} className="mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-medium ">Çeşme Kahvecisi</h1>
        </div>
        <button onClick={toggleMenu} className="p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </header>

      {/* Yan Menü */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Overlay - Daha fazla blur */}
          <div 
            className="bg-black/50 flex-1 backdrop-blur-lg" 
            onClick={closeMenu}
          ></div>
          
          {/* Menü Paneli - Alaçatı Renkleri */}
          <div className="bg-white w-64 shadow-xl flex flex-col h-full">
            <div className="p-4 border-b border-[#1a9c95]/20 bg-[#1a9c95] flex justify-between items-center">
              <span className="text-white font-medium">Menü</span>
              <button onClick={closeMenu} className="text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-4">
              <div className="flex flex-col space-y-3">
                <div className="text-[#1a9c95] hover:bg-[#f4e9c7] cursor-pointer p-3 rounded-lg font-medium">
                  Dil (TR)
                </div>
                <div 
                  className="text-[#1a9c95] hover:bg-[#f4e9c7] cursor-pointer p-3 rounded-lg font-medium"
                  onClick={handleFeedback}
                >
                  Geri Bildirim Ver
                </div>
                <button 
                  onClick={handleLogin}
                  className="flex items-center justify-center w-full bg-[#1a9c95] text-[#f4e9c7] py-3 px-4 rounded-lg hover:bg-[#168981] transition mt-2 font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Giriş yap
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CesmeHeader;