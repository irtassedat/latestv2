// src/pages/ThemeSettings.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ThemeManager from "../components/ThemeManager";
import api from "../lib/axios";
import toast from "react-hot-toast";

const ThemeSettings = (props) => {
  const { id } = useParams();
  // Props'tan type değerini al veya varsayılan olarak 'branch' kullan
  const type = props.type || "branch";
  const [entityInfo, setEntityInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [themeSettings, setThemeSettings] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Önce varlık bilgilerini al (marka veya şube)
        let entityData = null;

        if (type === 'brand') {
          const brandResponse = await api.get(`/api/brands/${id}`);
          console.log(`Marka (ID: ${id}) bilgileri yüklendi:`, brandResponse.data);
          entityData = brandResponse.data;
        } else if (type === 'branch') {
          const branchResponse = await api.get(`/api/branches/${id}`);
          console.log(`Şube (ID: ${id}) bilgileri yüklendi:`, branchResponse.data);

          // Şubenin marka bilgisini kontrol et
          if (!branchResponse.data.brand_id) {
            console.warn(`Uyarı: Şube (ID: ${id}) herhangi bir markaya ait değil!`);
          } else {
            console.log(`Şube (ID: ${id}), Marka (ID: ${branchResponse.data.brand_id}) ait.`);
          }
          entityData = branchResponse.data;
        }

        // Varlık bilgilerini state'e kaydet
        setEntityInfo(entityData);

        // Ardından tema ayarlarını al
        const themeResponse = await api.get(`/api/theme/settings/${type}/${id}`);
        console.log(`${type.charAt(0).toUpperCase() + type.slice(1)} (ID: ${id}) tema ayarları yüklendi:`, themeResponse.data);
        
        // Tema ayarlarını state'e kaydet
        setThemeSettings(themeResponse.data);

      } catch (err) {
        console.error("Veri alınırken hata:", err);
        toast.error("Bilgiler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [type, id]);

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
        <h1 className="text-2xl font-bold text-gray-800">
          {type === 'brand' ? 'Marka' : 'Şube'} Tema Ayarları
        </h1>
        <p className="text-gray-600 mt-2">
          {entityInfo?.name} için tema ayarlarını düzenleyin
        </p>
        {type === 'branch' && entityInfo?.brand_id && (
          <p className="text-sm text-blue-600 mt-1">
            Bu şube, "{entityInfo.brand_name || `Marka ID: ${entityInfo.brand_id}`}" markasına aittir.
          </p>
        )}
      </div>

      <ThemeManager
        type={type}
        entityId={id}
        entityInfo={entityInfo}
        themeSettings={themeSettings}
      />
    </div>
  );
};

export default ThemeSettings;