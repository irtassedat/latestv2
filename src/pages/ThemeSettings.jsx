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
          setEntityInfo(response.data);
        } else if (type === 'branch') {
          const response = await api.get(`/api/branches/${id}`);
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
      </div>

      <ThemeManager 
        type={type} 
        id={id} 
        brandId={type === 'branch' ? entityInfo?.brand_id : id}
      />
    </div>
  );
};

export default ThemeSettings;