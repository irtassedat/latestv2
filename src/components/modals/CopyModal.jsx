// src/components/modals/CopyModal.jsx
import { useState, useEffect } from "react";
import { FiX, FiCheck, FiCopy } from "react-icons/fi";

// Tema renkleri
const theme = {
  primary: "#022B45",
  secondary: "#B8D7DD",
  accent: "#D98A3D",
  light: "#F4F7F8",
  dark: "#343a40",
  success: "#28a745",
  danger: "#dc3545",
  warning: "#ffc107",
  info: "#17a2b8",
  white: "#ffffff",
  textPrimary: "#495057",
  textSecondary: "#6c757d"
};

const CopyModal = ({ 
  isOpen, 
  onClose,
  copyingTemplate,
  copyDetails,
  copyStep,
  setCopyStep,
  copyName,
  setCopyName,
  copyLoading,
  executeTemplateCopy,
  copyResults,
  newTemplateInfo
}) => {
  const [keepMenuLink, setKeepMenuLink] = useState(true);

  useEffect(() => {
    if (copyDetails?.keepMenuLink !== undefined) {
      setKeepMenuLink(copyDetails.keepMenuLink);
    } else {
      setKeepMenuLink(true);
    }
  }, [copyDetails]);

  useEffect(() => {
    if (copyDetails && keepMenuLink !== copyDetails.keepMenuLink) {
      copyDetails.keepMenuLink = keepMenuLink;
    }
  }, [keepMenuLink, copyDetails]);

  if (!isOpen) return null;

  // İlk adım - Kopyalama ayarları
  const renderStep0 = () => (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-4">
        "{copyingTemplate?.name}" şablonunu kopyala
      </h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1">
          Yeni Şablon Adı
        </label>
        <input
          type="text"
          value={copyName}
          onChange={(e) => setCopyName(e.target.value)}
          className="w-full p-2 border rounded-lg"
          placeholder="Şablon adı girin"
          autoFocus
        />
      </div>
      
      {copyDetails && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <div className="text-sm text-blue-800 mb-2 font-medium">
            Kopyalanacak İçerik Özeti
          </div>
          <ul className="space-y-1 text-sm text-blue-700">
            {copyDetails.items > 0 && (
              <li>• {copyDetails.items} ürün/veri öğesi</li>
            )}
            
            {copyDetails.categories && copyDetails.categories.size > 0 && (
              <li>• {copyDetails.categories.size} farklı kategori</li>
            )}
            
            {copyDetails.customPrices > 0 && (
              <li>• {copyDetails.customPrices} özel fiyat ayarı</li>
            )}
            
            {copyDetails.linkedMenu && (
              <>
                <li>• "{copyDetails.linkedMenu}" menü şablonuna bağlı</li>
                <div className="mt-2 flex items-center">
                  <input
                    type="checkbox"
                    id="keepMenuLink"
                    checked={keepMenuLink}
                    onChange={(e) => setKeepMenuLink(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="keepMenuLink" className="text-sm">
                    Menü şablonu bağlantısını koru
                  </label>
                </div>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  // İkinci adım - Onay ya da kopyalama sırasında
  const renderStep1 = () => (
    <div className="p-6">
      <h3 className="text-lg font-bold mb-4">Kopyalama Onayı</h3>
      <p className="mb-4">
        "{copyingTemplate?.name}" şablonunu "{copyName}" adıyla kopyalamak istediğinize emin misiniz?
      </p>
      {copyDetails && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
          <ul className="space-y-1">
            {copyDetails.items > 0 && (
              <li>• {copyDetails.items} öğe kopyalanacak</li>
            )}
            {copyDetails.customPrices > 0 && (
              <li>• {copyDetails.customPrices} özel fiyat ayarı</li>
            )}
            {copyDetails.keepMenuLink && copyDetails.linkedMenu && (
              <li>• "{copyDetails.linkedMenu}" menü şablonu bağlantısı korunacak</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  // Üçüncü adım - Sonuç
  const renderStep2 = () => (
    <div className="p-6">
      <div className="flex items-center mb-4">
        <div className="bg-green-100 rounded-full p-2 mr-3">
          <FiCheck className="text-green-600" size={20} />
        </div>
        <h3 className="text-lg font-bold">
          Kopyalama Tamamlandı
        </h3>
      </div>
      
      {copyResults && copyResults.success && (
        <div className="mb-4">
          <p className="mb-2">
            <span className="font-semibold">{copyingTemplate?.name}</span> şablonu başarıyla kopyalandı.
            Yeni şablon: <span className="font-semibold">{copyName}</span>
          </p>
          
          <div className="mt-4 bg-blue-50 p-4 rounded-lg">
            <div className="font-medium mb-2">Kopyalama Özeti</div>
            <ul className="space-y-1 text-sm">
              {copyResults.details?.map((detail, index) => (
                <li key={index}>• {detail}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );

  // Aktif adıma göre içerik oluştur
  const renderStepContent = () => {
    switch (copyStep) {
      case 0:
        return renderStep0();
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      default:
        return renderStep0();
    }
  };

  // Aktif adıma göre butonları oluştur
  const renderButtons = () => {
    if (copyStep === 0) {
      return (
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={() => setCopyStep(1)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={!copyName.trim()}
          >
            Devam Et
          </button>
        </>
      );
    } else if (copyStep === 1) {
      return (
        <>
          <button
            type="button"
            onClick={() => setCopyStep(0)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={copyLoading}
          >
            Geri
          </button>
          <button
            type="button"
            onClick={executeTemplateCopy}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1"
            disabled={copyLoading}
          >
            {copyLoading ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Kopyalanıyor...</span>
              </>
            ) : (
              <>
                <FiCopy size={18} />
                <span>Şimdi Kopyala</span>
              </>
            )}
          </button>
        </>
      );
    } else {
      return (
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Kapat
        </button>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-bold">
            Şablon Kopyalama
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        {renderStepContent()}
        
        <div className="p-4 border-t flex justify-end gap-2">
          {renderButtons()}
        </div>
      </div>
    </div>
  );
};

export default CopyModal;