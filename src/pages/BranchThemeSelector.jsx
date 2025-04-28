// src/pages/BranchThemeSelector.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/axios";
import { FaPalette } from "react-icons/fa";
import toast from "react-hot-toast";

const BranchThemeSelector = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/api/branches');
      setBranches(response.data);
    } catch (err) {
      console.error("Şubeler yüklenirken hata:", err);
      toast.error("Şubeler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const handleBranchSelect = (branchId) => {
    navigate(`/admin/theme/branch/${branchId}`);
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
        <h1 className="text-2xl font-bold text-gray-800">Şube Tema Ayarları</h1>
        <p className="text-gray-600 mt-2">
          Tema ayarlarını yönetmek istediğiniz şubeyi seçin
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {branches.map((branch) => (
          <div
            key={branch.id}
            onClick={() => handleBranchSelect(branch.id)}
            className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{branch.name}</h3>
                <p className="text-sm text-gray-500">{branch.address}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
                <FaPalette className="text-blue-500 text-xl" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {branch.is_active ? (
                  <span className="text-green-600">● Aktif</span>
                ) : (
                  <span className="text-red-600">● Pasif</span>
                )}
              </span>
              <button
                className="text-sm text-blue-600 hover:text-blue-700"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBranchSelect(branch.id);
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

export default BranchThemeSelector;