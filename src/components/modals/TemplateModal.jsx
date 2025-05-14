// src/components/modals/TemplateModal.jsx
import { useState, useEffect } from "react";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { FiX } from "react-icons/fi";

// Tema renkleri - ana dosyadan alındı
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

// Şablon türleri
const templateTypes = {
  MENU: "menu",
  PRICE: "price",
  INTEGRATION: "integration"
};

const TemplateModal = ({ 
  isOpen, 
  onClose, 
  template = null, 
  type = templateTypes.MENU,
  templates = {},
  onTemplateAdded 
}) => {
  const [loading, setLoading] = useState(false);
  
  // Menü şablonu için form state
  const [menuForm, setMenuForm] = useState({
    name: "",
    description: "",
    is_active: true,
    import_products: false // Varsayılan olarak ürünleri içe aktarma
  });

  // Fiyat şablonu için form state
  const [priceForm, setPriceForm] = useState({
    name: "",
    description: "",
    is_active: true,
    year: new Date().getFullYear(),
    menu_template_id: "",
    import_products: false // Varsayılan olarak ürünleri içe aktarma
  });
  
  // Entegrasyon şablonu için form state
  const [integrationForm, setIntegrationForm] = useState({
    name: "",
    type: "delivery",
    description: "",
    is_active: true,
    config: {
      api_key: "",
      endpoint: "",
      options: {}
    }
  });

  // Şablon değiştiğinde formu güncelle
  useEffect(() => {
    if (template) {
      if (type === templateTypes.MENU) {
        setMenuForm({
          name: template.name || "",
          description: template.description || "",
          is_active: template.is_active !== undefined ? template.is_active : true,
          import_products: template.import_products !== undefined ? template.import_products : false
        });
      } else if (type === templateTypes.PRICE) {
        setPriceForm({
          name: template.name || "",
          description: template.description || "",
          is_active: template.is_active !== undefined ? template.is_active : true,
          year: template.year || new Date().getFullYear(),
          menu_template_id: template.menu_template_id || "",
          import_products: template.import_products !== undefined ? template.import_products : false
        });
      } else if (type === templateTypes.INTEGRATION) {
        setIntegrationForm({
          name: template.name || "",
          type: template.type || "delivery",
          description: template.description || "",
          is_active: template.is_active !== undefined ? template.is_active : true,
          config: template.config || {
            api_key: "",
            endpoint: "",
            options: {}
          }
        });
      }
    } else {
      // Yeni şablon ekleme durumunda formları sıfırla
      setMenuForm({
        name: "",
        description: "",
        is_active: true,
        import_products: false
      });

      setPriceForm({
        name: "",
        description: "",
        is_active: true,
        year: new Date().getFullYear(),
        menu_template_id: "",
        import_products: false
      });
      
      setIntegrationForm({
        name: "",
        type: "delivery",
        description: "",
        is_active: true,
        config: {
          api_key: "",
          endpoint: "",
          options: {}
        }
      });
    }
  }, [template, type]);

  // Form değişikliklerini işleme
  const handleMenuFormChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    const inputValue = inputType === 'checkbox' ? checked : value;
    setMenuForm({ ...menuForm, [name]: inputValue });
  };
  
  const handlePriceFormChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    const inputValue = inputType === 'checkbox' ? checked : value;
    setPriceForm({ ...priceForm, [name]: inputValue });
  };
  
  const handleIntegrationFormChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    const inputValue = inputType === 'checkbox' ? checked : value;
    
    if (name.startsWith('config.')) {
      const configKey = name.split('.')[1];
      setIntegrationForm({
        ...integrationForm,
        config: {
          ...integrationForm.config,
          [configKey]: value
        }
      });
    } else {
      setIntegrationForm({ ...integrationForm, [name]: inputValue });
    }
  };

  // Form gönderimi
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;

      if (type === templateTypes.MENU) {
        if (template) {
          response = await api.put(`/api/templates/menu/${template.id}`, menuForm);
          toast.success("Menü şablonu güncellendi");
        } else {
          // Kullanıcının seçimine göre ürünleri içe aktar veya boş şablon oluştur
          response = await api.post("/api/templates/menu", menuForm);

          if (menuForm.import_products) {
            toast.success("Yeni menü şablonu oluşturuldu (tüm ürünler ekleniyor)");
          } else {
            toast.success("Yeni boş menü şablonu oluşturuldu");
          }
        }
      } else if (type === templateTypes.PRICE) {
        if (template) {
          response = await api.put(`/api/templates/price/${template.id}`, priceForm);
          toast.success("Fiyat şablonu güncellendi");
        } else {
          // Kullanıcının seçimine göre ürünleri içe aktar veya boş şablon oluştur
          response = await api.post("/api/templates/price", priceForm);

          if (priceForm.import_products) {
            toast.success("Yeni fiyat şablonu oluşturuldu (tüm ürünler ekleniyor)");
          } else {
            toast.success("Yeni boş fiyat şablonu oluşturuldu");
          }
        }
      } else if (type === templateTypes.INTEGRATION) {
        if (template) {
          response = await api.put(`/api/integrations/${template.id}`, integrationForm);
          toast.success("Entegrasyon şablonu güncellendi");
        } else {
          response = await api.post("/api/integrations", integrationForm);
          toast.success("Yeni entegrasyon şablonu oluşturuldu");
        }
      }

      if (onTemplateAdded) {
        onTemplateAdded(response.data);
      }

      onClose();
    } catch (error) {
      console.error("Şablon kaydedilirken hata:", error);
      toast.error("Şablon kaydedilemedi!");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Şablon tipine göre form oluştur
  const renderForm = () => {
    if (type === templateTypes.MENU) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
              Şablon Adı *
            </label>
            <input
              type="text"
              name="name"
              value={menuForm.name}
              onChange={handleMenuFormChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              style={{ borderColor: theme.secondary }}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
              Açıklama
            </label>
            <textarea
              name="description"
              value={menuForm.description}
              onChange={handleMenuFormChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              style={{ borderColor: theme.secondary }}
              rows="3"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                id="menu_is_active"
                checked={menuForm.is_active}
                onChange={handleMenuFormChange}
                className="h-4 w-4 rounded focus:ring-0 border-2"
                style={{
                  borderColor: theme.secondary,
                  accentColor: theme.accent
                }}
              />
              <label
                htmlFor="menu_is_active"
                className="ml-2 text-sm font-medium"
                style={{ color: theme.primary }}
              >
                Aktif
              </label>
            </div>

            <div className="flex items-center bg-yellow-50 p-2 rounded-lg">
              <input
                type="checkbox"
                name="import_products"
                id="menu_import_products"
                checked={menuForm.import_products}
                onChange={handleMenuFormChange}
                className="h-4 w-4 rounded focus:ring-0 border-2"
                style={{
                  borderColor: theme.secondary,
                  accentColor: theme.accent
                }}
              />
              <label
                htmlFor="menu_import_products"
                className="ml-2 text-sm font-medium"
                style={{ color: theme.primary }}
              >
                Sistemdeki tüm ürünleri bu şablona ekle
              </label>
            </div>
          </div>
        </div>
      );
    } else if (type === templateTypes.PRICE) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
              Fiyat Şablonu Adı *
            </label>
            <input
              type="text"
              name="name"
              value={priceForm.name}
              onChange={handlePriceFormChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              style={{ borderColor: theme.secondary }}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
              Açıklama
            </label>
            <textarea
              name="description"
              value={priceForm.description}
              onChange={handlePriceFormChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              style={{ borderColor: theme.secondary }}
              rows="3"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
              Yıl
            </label>
            <input
              type="number"
              name="year"
              value={priceForm.year}
              onChange={handlePriceFormChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              style={{ borderColor: theme.secondary }}
              min="2020"
              max="2100"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
              Bağlı Menü Şablonu
            </label>
            <select
              name="menu_template_id"
              value={priceForm.menu_template_id}
              onChange={handlePriceFormChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              style={{ borderColor: theme.secondary }}
            >
              <option value="">Menü Şablonu Seçin (İsteğe Bağlı)</option>
              {templates[templateTypes.MENU]?.map(menuTemplate => (
                <option key={menuTemplate.id} value={menuTemplate.id}>
                  {menuTemplate.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                id="price_is_active"
                checked={priceForm.is_active}
                onChange={handlePriceFormChange}
                className="h-4 w-4 rounded focus:ring-0 border-2"
                style={{
                  borderColor: theme.secondary,
                  accentColor: theme.accent
                }}
              />
              <label
                htmlFor="price_is_active"
                className="ml-2 text-sm font-medium"
                style={{ color: theme.primary }}
              >
                Aktif
              </label>
            </div>

            <div className="flex items-center bg-yellow-50 p-2 rounded-lg">
              <input
                type="checkbox"
                name="import_products"
                id="price_import_products"
                checked={priceForm.import_products}
                onChange={handlePriceFormChange}
                className="h-4 w-4 rounded focus:ring-0 border-2"
                style={{
                  borderColor: theme.secondary,
                  accentColor: theme.accent
                }}
              />
              <label
                htmlFor="price_import_products"
                className="ml-2 text-sm font-medium"
                style={{ color: theme.primary }}
              >
                Sistemdeki tüm ürünleri bu fiyat şablonuna ekle
              </label>
            </div>
          </div>
        </div>
      );
    } else if (type === templateTypes.INTEGRATION) {
      return (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
              Entegrasyon Adı *
            </label>
            <input
              type="text"
              name="name"
              value={integrationForm.name}
              onChange={handleIntegrationFormChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              style={{ borderColor: theme.secondary }}
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
              Entegrasyon Tipi
            </label>
            <select
              name="type"
              value={integrationForm.type}
              onChange={handleIntegrationFormChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              style={{ borderColor: theme.secondary }}
            >
              <option value="delivery">Teslimat</option>
              <option value="payment">Ödeme</option>
              <option value="order">Sipariş</option>
              <option value="menu">Menü</option>
              <option value="other">Diğer</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
              Açıklama
            </label>
            <textarea
              name="description"
              value={integrationForm.description}
              onChange={handleIntegrationFormChange}
              className="w-full p-2 border rounded-lg focus:outline-none"
              style={{ borderColor: theme.secondary }}
              rows="3"
            />
          </div>
          
          <div className="p-3 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium mb-2" style={{ color: theme.primary }}>
              API Konfigürasyonu
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
                  API Anahtarı
                </label>
                <input
                  type="text"
                  name="config.api_key"
                  value={integrationForm.config.api_key}
                  onChange={handleIntegrationFormChange}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  style={{ borderColor: theme.secondary }}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: theme.primary }}>
                  Endpoint URL
                </label>
                <input
                  type="text"
                  name="config.endpoint"
                  value={integrationForm.config.endpoint}
                  onChange={handleIntegrationFormChange}
                  className="w-full p-2 border rounded-lg focus:outline-none"
                  style={{ borderColor: theme.secondary }}
                />
              </div>
            </div>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              id="integration_is_active"
              checked={integrationForm.is_active}
              onChange={handleIntegrationFormChange}
              className="h-4 w-4 rounded focus:ring-0 border-2"
              style={{
                borderColor: theme.secondary,
                accentColor: theme.accent
              }}
            />
            <label 
              htmlFor="integration_is_active" 
              className="ml-2 text-sm font-medium"
              style={{ color: theme.primary }}
            >
              Aktif
            </label>
          </div>
        </div>
      );
    }
    
    return null;
  };

  // Başlık metni oluştur
  const getTitle = () => {
    const action = template ? "Düzenle" : "Ekle";
    
    if (type === templateTypes.MENU) return `Menü Şablonu ${action}`;
    if (type === templateTypes.PRICE) return `Fiyat Şablonu ${action}`;
    if (type === templateTypes.INTEGRATION) return `Entegrasyon ${action}`;
    
    return "Şablon";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div 
          className="flex justify-between items-center p-4"
          style={{ borderBottom: `1px solid ${theme.secondary}`, backgroundColor: '#EFF6FF' }}
        >
          <h2 
            className="text-xl font-bold"
            style={{ color: theme.primary }}
          >
            {getTitle()}
          </h2>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {renderForm()}
          
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
              style={{
                borderColor: theme.secondary,
                color: theme.primary,
                fontWeight: 600
              }}
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{
                backgroundColor: theme.accent,
                fontWeight: 600,
                boxShadow: "0 2px 4px rgba(217, 138, 61, 0.3)"
              }}
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>{template ? "Güncelleniyor..." : "Oluşturuluyor..."}</span>
                </div>
              ) : (
                template ? "Güncelle" : "Oluştur"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TemplateModal;