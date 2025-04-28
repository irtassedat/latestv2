// src/pages/BrandThemeSelector.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { FaPalette } from "react-icons/fa";
import toast from "react-hot-toast";

const BrandThemeSelector = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/brands?simple=true');
      
      // API yanıtının formatını kontrol et ve veriyi buna göre al
      let brandsList = [];
      if (Array.isArray(response.data)) {
        brandsList = response.data;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        brandsList = response.data.data;
      }
      
      setBrands(brandsList);
    } catch (err) {
      console.error("Markalar yüklenirken hata:", err);
      toast.error("Markalar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleBrandSelect = (brandId) => {
    navigate(`/admin/theme/brand/${brandId}`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-xl text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Marka Tema Ayarları</h1>
        <p className="text-gray-600 mt-2">
          Tema ayarlarını yönetmek istediğiniz markayı seçin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {brands.map((brand) => (
          <div
            key={brand.id}
            onClick={() => handleBrandSelect(brand.id)}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{brand.name}</h3>
                <p className="text-sm text-gray-500">{brand.address}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <FaPalette className="text-blue-500 text-xl" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {brand.is_active ? (
                  <span className="text-green-600">● Aktif</span>
                ) : (
                  <span className="text-red-600">● Pasif</span>
                )}
              </span>
              <button
                className="text-sm text-blue-600 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBrandSelect(brand.id);
                }}
              >
                Temayı Düzenle →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandThemeSelector;