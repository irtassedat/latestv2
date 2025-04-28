// src/pages/ThemeSettings.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import ThemeManager from "../components/ThemeManager";
import api from "../lib/axios";
import toast from "react-hot-toast";

const ThemeSettings = () => {
  const { type, id } = useParams(); // type: 'brand' veya 'branch'
  const [entityInfo, setEntityInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntityInfo = async () => {
      try {
        setLoading(true);
        
        if (type === 'brand') {
          const response = await api.get(`/api/brands/${id}`);
          console.log(`Marka (ID: ${id}) bilgileri yüklendi:`, response.data);
          setEntityInfo(response.data);
        } else if (type === 'branch') {
          const response = await api.get(`/api/branches/${id}`);
          console.log(`Şube (ID: ${id}) bilgileri yüklendi:`, response.data);
          // Şubenin marka bilgisini kontrol et
          if (!response.data.brand_id) {
            console.warn(`Uyarı: Şube (ID: ${id}) herhangi bir markaya ait değil!`);
          } else {
            console.log(`Şube (ID: ${id}), Marka (ID: ${response.data.brand_id}) ait.`);
          }
          setEntityInfo(response.data);
        }
      } catch (err) {
        console.error("Bilgi alınırken hata:", err);
        toast.error("Bilgiler yüklenemedi");
      } finally {
        setLoading(false);
      }
    };

    fetchEntityInfo();
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
      />
    </div>
  );
};

export default ThemeSettings;