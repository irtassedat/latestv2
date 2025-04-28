// src/components/ThemeManager.jsx
import { useState, useEffect } from "react";
import { FaPalette, FaImages, FaSave, FaUndo, FaImage, FaToggleOn, FaToggleOff } from "react-icons/fa";
import { ChromePicker } from "react-color";
import api from "../lib/axios";
import toast from "react-hot-toast";

const ThemeManager = ({ type, entityId, entityInfo }) => {
  const [themeSettings, setThemeSettings] = useState({
    colors: {
      primary: "#022B45",
      secondary: "#D98A3D",
      accent: "#1a9c95",
      background: "#f3f4f6",
      text: "#1f2937",
      headerBg: "#022B45",
      headerText: "#ffffff",
      buttonBg: "#D98A3D",
      buttonText: "#ffffff",
      categoryBg: "#022B45",
      categoryText: "#ffffff",
      priceColor: "#D98A3D",
    },
    components: {
      logo: {
        url: "/logos/default-logo.png",
        height: "60px",
        width: "auto",
      },
      slider: {
        enabled: true,
        autoPlaySpeed: 5000,
        slides: [],
      },
      header: {
        showSocialMedia: true,
        socialLinks: {
          facebook: "https://facebook.com",
          instagram: "https://instagram.com",
          twitter: "https://twitter.com",
          youtube: "https://youtube.com",
        },
      },
      categories: {
        layout: "carousel", // carousel, grid
        showImages: true,
        imageStyle: "rounded", // rounded, square, circle
      },
      products: {
        layout: "list", // list, grid
        showDescription: true,
        showIcons: true,
        imageStyle: "rounded", // rounded, square
      },
    },
    fonts: {
      primary: "Inter",
      secondary: "Roboto",
      sizes: {
        small: "12px",
        regular: "14px",
        medium: "16px",
        large: "18px",
        xlarge: "24px",
      },
    },
  });

  const [activeTab, setActiveTab] = useState("colors");
  const [colorPickerOpen, setColorPickerOpen] = useState(null);
  const [loading, setLoading] = useState(false);
  const [originalSettings, setOriginalSettings] = useState(null);

  useEffect(() => {
    fetchThemeSettings();
  }, [type, entityId, entityInfo]);

  const fetchThemeSettings = async () => {
    try {
      setLoading(true);
      
      console.log("Tema ayarları alınıyor:", {
        type: type,
        entityId: entityId,
        entityInfo: entityInfo
      });
      
      if (!type || !entityId) {
        toast.error('Tema tipi veya ID eksik');
        setLoading(false);
        return;
      }
      
      const response = await api.get(`/api/theme/settings/${type}/${entityId}`);
      
      console.log(`${type.toUpperCase()} (ID: ${entityId}) tema ayarları alındı:`, response.data);
      
      if (Object.keys(response.data).length > 0) {
        setThemeSettings(response.data);
        setOriginalSettings(response.data);
      } else {
        // Varsayılan ayarları kullan
        setOriginalSettings(themeSettings);
      }
    } catch (err) {
      console.error("Tema ayarları alınırken hata:", err);
      toast.error("Tema ayarları yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (colorKey, color) => {
    setThemeSettings(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        [colorKey]: color.hex,
      },
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      console.log('Tema kaydetme bilgileri:', { 
        type: type, 
        entityId: entityId,
        entityInfo: entityInfo,
        settings: themeSettings 
      });
      
      if (!type || !entityId) {
        toast.error('Tema tipi veya ID eksik');
        setLoading(false);
        return;
      }
      
      // API çağrısı
      const response = await api.put(`/api/theme/settings/${type}/${entityId}`, {
        settings: themeSettings,
      });
      
      console.log(`${type.toUpperCase()} (ID: ${entityId}) tema ayarları kaydedildi:`, response.data);
      
      toast.success("Tema ayarları başarıyla kaydedildi");
      setOriginalSettings(themeSettings);
    } catch (err) {
      console.error("Tema ayarları kaydedilirken hata:", err);
      toast.error("Tema ayarları kaydedilemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    if (originalSettings) {
      setThemeSettings(originalSettings);
      toast.success("Tema ayarları sıfırlandı");
    }
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("logo", file);

    try {
      const response = await api.post("/api/upload", formData);
      
      setThemeSettings(prev => ({
        ...prev,
        components: {
          ...prev.components,
          logo: {
            ...prev.components.logo,
            url: response.data.url,
          },
        },
      }));
      
      toast.success("Logo yüklendi");
    } catch (err) {
      console.error("Logo yüklenirken hata:", err);
      toast.error("Logo yüklenemedi");
    }
  };

  const handleSliderImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await api.post("/api/upload", formData);
      
      setThemeSettings(prev => ({
        ...prev,
        components: {
          ...prev.components,
          slider: {
            ...prev.components.slider,
            slides: [
              ...prev.components.slider.slides,
              {
                id: Date.now(),
                image: response.data.url,
                title: "",
                description: "",
              },
            ],
          },
        },
      }));
      
      toast.success("Slider görseli eklendi");
    } catch (err) {
      console.error("Slider görseli yüklenirken hata:", err);
      toast.error("Slider görseli yüklenemedi");
    }
  };

  const renderColorPicker = (colorKey, label) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded border cursor-pointer"
          style={{ backgroundColor: themeSettings.colors[colorKey] }}
          onClick={() => setColorPickerOpen(colorPickerOpen === colorKey ? null : colorKey)}
        />
        <span className="text-sm font-medium">{label}</span>
      </div>
      
      <span className="text-xs text-gray-500">{themeSettings.colors[colorKey]}</span>
      
      {colorPickerOpen === colorKey && (
        <div className="absolute z-10 mt-8">
          <div
            className="fixed inset-0"
            onClick={() => setColorPickerOpen(null)}
          />
          <ChromePicker
            color={themeSettings.colors[colorKey]}
            onChange={(color) => handleColorChange(colorKey, color)}
          />
        </div>
      )}
    </div>
  );

  const renderColors = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Renk Ayarları</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderColorPicker("primary", "Ana Renk")}
        {renderColorPicker("secondary", "İkincil Renk")}
        {renderColorPicker("accent", "Vurgu Rengi")}
        {renderColorPicker("background", "Arkaplan Rengi")}
        {renderColorPicker("text", "Metin Rengi")}
        {renderColorPicker("headerBg", "Header Arkaplan")}
        {renderColorPicker("headerText", "Header Metin")}
        {renderColorPicker("buttonBg", "Buton Arkaplan")}
        {renderColorPicker("buttonText", "Buton Metin")}
        {renderColorPicker("categoryBg", "Kategori Arkaplan")}
        {renderColorPicker("categoryText", "Kategori Metin")}
        {renderColorPicker("priceColor", "Fiyat Rengi")}
      </div>
    </div>
  );

  const renderComponents = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Bileşen Ayarları</h3>
      
      {/* Logo Ayarları */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Logo</h4>
        <div className="flex items-center gap-4">
          <img
            src={themeSettings.components.logo.url}
            alt="Logo"
            className="h-16 object-contain bg-white p-2 rounded"
          />
          <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600">
            <FaImage />
            Logo Yükle
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </label>
        </div>
      </div>
      
      {/* Slider Ayarları */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-3">
          <h4 className="font-medium">Promosyon Slider</h4>
          <button
            onClick={() => {
              setThemeSettings(prev => ({
                ...prev,
                components: {
                  ...prev.components,
                  slider: {
                    ...prev.components.slider,
                    enabled: !prev.components.slider.enabled,
                  },
                },
              }));
            }}
            className={`p-2 rounded-lg ${
              themeSettings.components.slider.enabled ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            {themeSettings.components.slider.enabled ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
          </button>
        </div>
        
        {themeSettings.components.slider.enabled && (
          <>
            <div className="flex items-center gap-4 mb-4">
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer hover:bg-blue-600">
                <FaImages />
                Slide Ekle
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleSliderImageUpload}
                />
              </label>
              
              <div className="flex items-center gap-2">
                <label className="text-sm">Geçiş Süresi (ms):</label>
                <input
                  type="number"
                  value={themeSettings.components.slider.autoPlaySpeed}
                  onChange={(e) => {
                    setThemeSettings(prev => ({
                      ...prev,
                      components: {
                        ...prev.components,
                        slider: {
                          ...prev.components.slider,
                          autoPlaySpeed: parseInt(e.target.value),
                        },
                      },
                    }));
                  }}
                  className="w-20 p-1 border rounded"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {themeSettings.components.slider.slides.map((slide, index) => (
                <div key={slide.id} className="relative group">
                  <img
                    src={slide.image}
                    alt={`Slide ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => {
                      setThemeSettings(prev => ({
                        ...prev,
                        components: {
                          ...prev.components,
                          slider: {
                            ...prev.components.slider,
                            slides: prev.components.slider.slides.filter(s => s.id !== slide.id),
                          },
                        },
                      }));
                    }}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Kategori Ayarları */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Kategori Görünümü</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Yerleşim</label>
            <select
              value={themeSettings.components.categories.layout}
              onChange={(e) => {
                setThemeSettings(prev => ({
                  ...prev,
                  components: {
                    ...prev.components,
                    categories: {
                      ...prev.components.categories,
                      layout: e.target.value,
                    },
                  },
                }));
              }}
              className="w-full p-2 border rounded"
            >
              <option value="carousel">Carousel</option>
              <option value="grid">Grid</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Görsel Stili</label>
            <select
              value={themeSettings.components.categories.imageStyle}
              onChange={(e) => {
                setThemeSettings(prev => ({
                  ...prev,
                  components: {
                    ...prev.components,
                    categories: {
                      ...prev.components.categories,
                      imageStyle: e.target.value,
                    },
                  },
                }));
              }}
              className="w-full p-2 border rounded"
            >
              <option value="rounded">Yuvarlatılmış</option>
              <option value="square">Kare</option>
              <option value="circle">Daire</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Ürün Ayarları */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Ürün Görünümü</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">Yerleşim</label>
            <select
              value={themeSettings.components.products.layout}
              onChange={(e) => {
                setThemeSettings(prev => ({
                  ...prev,
                  components: {
                    ...prev.components,
                    products: {
                      ...prev.components.products,
                      layout: e.target.value,
                    },
                  },
                }));
              }}
              className="w-full p-2 border rounded"
            >
              <option value="list">Liste</option>
              <option value="grid">Grid</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm mb-1">Görsel Stili</label>
            <select
              value={themeSettings.components.products.imageStyle}
              onChange={(e) => {
                setThemeSettings(prev => ({
                  ...prev,
                  components: {
                    ...prev.components,
                    products: {
                      ...prev.components.products,
                      imageStyle: e.target.value,
                    },
                  },
                }));
              }}
              className="w-full p-2 border rounded"
            >
              <option value="rounded">Yuvarlatılmış</option>
              <option value="square">Kare</option>
            </select>
          </div>
        </div>
        
        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={themeSettings.components.products.showDescription}
              onChange={(e) => {
                setThemeSettings(prev => ({
                  ...prev,
                  components: {
                    ...prev.components,
                    products: {
                      ...prev.components.products,
                      showDescription: e.target.checked,
                    },
                  },
                }));
              }}
              className="rounded"
            />
            <span className="text-sm">Açıklama Göster</span>
          </label>
          
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={themeSettings.components.products.showIcons}
              onChange={(e) => {
                setThemeSettings(prev => ({
                  ...prev,
                  components: {
                    ...prev.components,
                    products: {
                      ...prev.components.products,
                      showIcons: e.target.checked,
                    },
                  },
                }));
              }}
              className="rounded"
            />
            <span className="text-sm">İkonları Göster</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderTypography = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Tipografi Ayarları</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm mb-1">Ana Font</label>
          <select
            value={themeSettings.fonts.primary}
            onChange={(e) => {
              setThemeSettings(prev => ({
                ...prev,
                fonts: {
                  ...prev.fonts,
                  primary: e.target.value,
                },
              }));
            }}
            className="w-full p-2 border rounded"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Poppins">Poppins</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm mb-1">İkincil Font</label>
          <select
            value={themeSettings.fonts.secondary}
            onChange={(e) => {
              setThemeSettings(prev => ({
                ...prev,
                fonts: {
                  ...prev.fonts,
                  secondary: e.target.value,
                },
              }));
            }}
            className="w-full p-2 border rounded"
          >
            <option value="Inter">Inter</option>
            <option value="Roboto">Roboto</option>
            <option value="Open Sans">Open Sans</option>
            <option value="Montserrat">Montserrat</option>
            <option value="Poppins">Poppins</option>
          </select>
        </div>
      </div>
      
      <div className="space-y-4">
        <h4 className="font-medium">Font Boyutları</h4>
        {Object.entries(themeSettings.fonts.sizes).map(([size, value]) => (
          <div key={size} className="flex items-center gap-4">
            <label className="w-24 text-sm capitalize">{size}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setThemeSettings(prev => ({
                  ...prev,
                  fonts: {
                    ...prev.fonts,
                    sizes: {
                      ...prev.fonts.sizes,
                      [size]: e.target.value,
                    },
                  },
                }));
              }}
              className="w-24 p-2 border rounded"
            />
            <span
              style={{ fontSize: value }}
              className="text-gray-600"
            >
              Örnek Metin
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  // Ayarları görüntüleme bilgisi ekle
  const getEntityInfo = () => {
    if (type === 'branch') {
      return `Şube (ID: ${entityId})${entityInfo?.brand_id ? ` - ${entityInfo.brand_name || `Marka ID: ${entityInfo.brand_id}`}` : ''}`;
    } else if (type === 'brand') {
      return `Marka (ID: ${entityId})`;
    }
    return "Bilinmeyen";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg">
      <div className="p-6 border-b">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Tema Yönetimi</h2>
            <div className="text-sm text-gray-500 mt-1">
              {getEntityInfo()} için tema ayarları
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
              disabled={loading}
            >
              <FaUndo />
              Sıfırla
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              disabled={loading}
            >
              <FaSave />
              {loading ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("colors")}
          className={`px-6 py-3 font-medium ${
            activeTab === "colors"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Renkler
        </button>
        <button
          onClick={() => setActiveTab("components")}
          className={`px-6 py-3 font-medium ${
            activeTab === "components"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Bileşenler
        </button>
        <button
          onClick={() => setActiveTab("typography")}
          className={`px-6 py-3 font-medium ${
            activeTab === "typography"
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Tipografi
        </button>
      </div>
      
      <div className="p-6">
        {activeTab === "colors" && renderColors()}
        {activeTab === "components" && renderComponents()}
        {activeTab === "typography" && renderTypography()}
      </div>
    </div>
  );
};

export default ThemeManager;