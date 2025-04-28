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
  const [branchesForBrand, setBranchesForBrand] = useState([]);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState([]);
  const [applyToAll, setApplyToAll] = useState(false);
  const [applyingTheme, setApplyingTheme] = useState(false);

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
          
          // Eğer marka ise, ona ait şubeleri de getir
          try {
            const branchesResponse = await api.get(`/api/brands/${id}/branches?simple=true`);
            console.log(`Marka (ID: ${id}) şubeleri yüklendi:`, branchesResponse.data);
            
            // API response format kontrol edip şubeleri alıyoruz
            let branches = [];
            if (Array.isArray(branchesResponse.data)) {
              branches = branchesResponse.data;
            } else if (branchesResponse.data && branchesResponse.data.branches) {
              branches = branchesResponse.data.branches;
            }
            
            setBranchesForBrand(branches);
          } catch (branchErr) {
            console.error(`Marka (ID: ${id}) şubeleri yüklenirken hata:`, branchErr);
          }
          
        } else if (type === 'branch') {
          const branchResponse = await api.get(`/api/branches/${id}`);
          console.log(`Şube (ID: ${id}) bilgileri yüklendi:`, branchResponse.data);

          // Şubenin marka bilgisini kontrol et
          if (!branchResponse.data.brand_id) {
            console.warn(`Uyarı: Şube (ID: ${id}) herhangi bir markaya ait değil!`);
          } else {
            console.log(`Şube (ID: ${id}), Marka (ID: ${branchResponse.data.brand_id}) ait.`);
            
            // Markaya ait bilgileri de getir
            try {
              const brandResponse = await api.get(`/api/brands/${branchResponse.data.brand_id}`);
              branchResponse.data.brand_name = brandResponse.data.name;
            } catch (brandErr) {
              console.error("Marka bilgileri yüklenirken hata:", brandErr);
            }
          }
          entityData = branchResponse.data;
        }

        // Varlık bilgilerini state'e kaydet
        setEntityInfo(entityData);
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

  // Marka tema ayarlarını şubelere uygula
  const applyBrandThemeToSubBranches = async () => {
    if (type !== 'brand') return;
    
    try {
      setApplyingTheme(true);
      
      const response = await api.post(`/api/theme/apply-brand-theme/${id}`, {
        applyToAll: applyToAll,
        branchIds: selectedBranches
      });
      
      console.log("Tema şubelere uygulandı:", response.data);
      toast.success(`Tema ayarları ${response.data.applied_to.length} şubeye başarıyla uygulandı`);
      
      setShowApplyModal(false);
      setSelectedBranches([]);
      setApplyToAll(false);
      
    } catch (err) {
      console.error("Tema şubelere uygulanırken hata:", err);
      toast.error(err.response?.data?.error || "Tema şubelere uygulanamadı");
    } finally {
      setApplyingTheme(false);
    }
  };

  // Şubeye marka default tema ayarlarını uygula
  const applyBrandDefaultToThisBranch = async () => {
    if (type !== 'branch' || !entityInfo?.brand_id) return;
    
    try {
      const confirmResult = window.confirm(
        `Markaya ait varsayılan tema ayarları şubeye uygulanacak. Bu işlem mevcut tema ayarlarınızı kaybetmenize neden olabilir. Devam etmek istiyor musunuz?`
      );
      
      if (!confirmResult) return;
      
      const response = await api.post(`/api/theme/apply-brand-defaults/${id}`);
      
      console.log("Marka varsayılan tema şubeye uygulandı:", response.data);
      toast.success("Marka varsayılan tema ayarları başarıyla uygulandı");
      
      // Sayfayı yenile
      window.location.reload();
      
    } catch (err) {
      console.error("Marka varsayılan tema şubeye uygulanırken hata:", err);
      toast.error(err.response?.data?.error || "Tema uygulanamadı");
    }
  };

  // Şube seçimi değiştiğinde
  const handleBranchSelect = (branchId) => {
    setSelectedBranches(prev => {
      if (prev.includes(branchId)) {
        return prev.filter(id => id !== branchId);
      } else {
        return [...prev, branchId];
      }
    });
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
        <div className="flex justify-between items-center mb-4">
          <div>
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
          
          <div className="flex gap-3">
            {/* Eğer bu bir marka ise ve şubeleri varsa, tema ayarlarını şubelere uygulama butonu göster */}
            {type === 'brand' && branchesForBrand.length > 0 && (
              <button
                onClick={() => setShowApplyModal(true)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
              >
                Tema Ayarlarını Şubelere Uygula
              </button>
            )}
            
            {/* Eğer bu bir şube ise ve bir markaya aitse, markanın tema ayarlarını uygulama butonu göster */}
            {type === 'branch' && entityInfo?.brand_id && (
              <button
                onClick={applyBrandDefaultToThisBranch}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Marka Varsayılan Temasını Uygula
              </button>
            )}
          </div>
        </div>
      </div>

      <ThemeManager
        type={type}
        entityId={id}
        entityInfo={entityInfo}
      />
      
      {/* Şubelere Uygulama Modalı */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h2 className="text-xl font-bold mb-4">Tema Ayarlarını Şubelere Uygula</h2>
            <p className="text-gray-600 mb-4">
              {entityInfo?.name} markasının tema ayarlarını seçtiğiniz şubelere uygulayabilirsiniz.
            </p>
            
            <div className="mb-4">
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={applyToAll}
                  onChange={() => {
                    setApplyToAll(!applyToAll);
                    if (!applyToAll) {
                      // Tüm şubeleri otomatik seç
                      setSelectedBranches(branchesForBrand.map(branch => branch.id));
                    }
                  }}
                  className="rounded text-blue-500"
                />
                <span className="font-medium">Tüm şubelere uygula ({branchesForBrand.length} şube)</span>
              </label>
              
              {!applyToAll && (
                <div className="mt-4 max-h-60 overflow-y-auto border rounded-lg">
                  {branchesForBrand.map(branch => (
                    <label key={branch.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 border-b">
                      <input
                        type="checkbox"
                        checked={selectedBranches.includes(branch.id)}
                        onChange={() => handleBranchSelect(branch.id)}
                        className="rounded text-blue-500"
                      />
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-xs text-gray-500">{branch.address}</p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowApplyModal(false)}
                className="px-4 py-2 border rounded-lg"
                disabled={applyingTheme}
              >
                İptal
              </button>
              <button
                onClick={applyBrandThemeToSubBranches}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                disabled={applyingTheme || (!applyToAll && selectedBranches.length === 0)}
              >
                {applyingTheme ? "Uygulanıyor..." : "Uygula"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSettings;