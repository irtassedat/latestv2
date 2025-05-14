// src/components/modals/LinkTemplateModal.jsx
import { useState } from "react";
import { FiX, FiLink, FiInfo } from "react-icons/fi";

const LinkTemplateModal = ({ 
  isOpen, 
  onClose, 
  menuTemplates, 
  onLinkUpdate,
  priceTemplate
}) => {
  const [selectedMenuTemplateId, setSelectedMenuTemplateId] = useState(
    priceTemplate?.menu_template_id || ""
  );
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Menü Şablonu Bağla</h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="mb-4 text-gray-600 text-sm">
            Bir fiyat şablonunu menü şablonuna bağlamak, menüdeki ürünleri fiyat şablonuna otomatik olarak ekler.
          </p>
          
          {menuTemplates.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start mb-4">
              <FiInfo className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" size={18} />
              <p className="text-amber-700 text-sm">
                Bağlanacak bir menü şablonu bulunmuyor. Önce bir menü şablonu oluşturmalısınız.
              </p>
            </div>
          ) : (
            <>
              <label className="block text-sm font-medium mb-1">
                Menü Şablonu
              </label>
              <select
                value={selectedMenuTemplateId}
                onChange={(e) => setSelectedMenuTemplateId(e.target.value)}
                className="w-full p-2 border rounded-lg mb-4"
              >
                <option value="">Bağlantıyı Kaldır</option>
                {menuTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start">
                <FiInfo className="text-blue-500 mt-0.5 mr-2 flex-shrink-0" size={18} />
                <p className="text-blue-700 text-sm">
                  Bağlantıyı kaldırmak için "Bağlantıyı Kaldır" seçeneğini seçin. Bu işlem fiyat şablonundaki mevcut ürünleri silmez.
                </p>
              </div>
            </>
          )}
        </div>
        
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            İptal
          </button>
          <button
            onClick={() => {
              onLinkUpdate(selectedMenuTemplateId || null);
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            disabled={menuTemplates.length === 0}
          >
            <FiLink className="mr-1" size={16} />
            <span>Bağlantıyı Güncelle</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LinkTemplateModal;