import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import CesmeHeader from "../components/CesmeHeader";

const FeedbackForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstVisit: null,
    generalSatisfaction: 0,
    hygiene: 0,
    taste: 0,
    willVisitAgain: null,
    comments: "",
    name: "",
    email: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRadioChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRatingChange = (name, rating) => {
    setFormData({
      ...formData,
      [name]: rating
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Basit validasyon
    if (!formData.name || !formData.email) {
      toast.error("Lütfen isim ve e-posta adresinizi girin.");
      setIsSubmitting(false);
      return;
    }
    
    // Mock API çağrısı (gerçekte API'ye gönderilir)
    setTimeout(() => {
      toast.success("Geri bildiriminiz için teşekkür ederiz!", {
        duration: 3000,
        style: {
          background: '#1a9c95',
          color: '#fff',
          fontWeight: 'bold',
        },
      });
      setIsSubmitting(false);
      setTimeout(() => navigate("/menu"), 1500);
    }, 1000);
  };

  const StarRating = ({ name, value, onChange }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(name, star)}
            className={`text-2xl ${
              star <= value ? "text-[#d49e36]" : "text-gray-300"
            }`}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CesmeHeader />
      
      <div className="max-w-md mx-auto p-4 pt-6">
        <h1 className="text-xl font-semibold text-center text-gray-800 mb-6">
          Geri Bildirim Formu
        </h1>
        
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6 space-y-6">
          <div>
            <p className="mb-3 font-medium text-gray-700">
              İşletmemizi ilk defa mı ziyaret ediyorsunuz?
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleRadioChange("firstVisit", "Evet")}
                className={`flex-1 py-2 border rounded-full transition ${
                  formData.firstVisit === "Evet"
                    ? "bg-[#1a9c95] text-white border-[#1a9c95]"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                Evet
              </button>
              <button
                type="button"
                onClick={() => handleRadioChange("firstVisit", "Hayır")}
                className={`flex-1 py-2 border rounded-full transition ${
                  formData.firstVisit === "Hayır"
                    ? "bg-[#1a9c95] text-white border-[#1a9c95]"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                Hayır
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-700">
              Genel memnuniyetiniz nasıl?*
            </p>
            <StarRating
              name="generalSatisfaction"
              value={formData.generalSatisfaction}
              onChange={handleRatingChange}
            />
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-700">
              Hijyeni nasıl değerlendirirsiniz?
            </p>
            <StarRating
              name="hygiene"
              value={formData.hygiene}
              onChange={handleRatingChange}
            />
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-700">
              Yemeklerimizin lezzetini nasıl değerlendirirsiniz?
            </p>
            <StarRating
              name="taste"
              value={formData.taste}
              onChange={handleRatingChange}
            />
          </div>

          <div>
            <p className="mb-3 font-medium text-gray-700">
              Tekrar ziyaret etmeyi düşünür müsünüz?
            </p>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => handleRadioChange("willVisitAgain", "Evet")}
                className={`flex-1 py-2 border rounded-full transition ${
                  formData.willVisitAgain === "Evet"
                    ? "bg-[#1a9c95] text-white border-[#1a9c95]"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                Evet
              </button>
              <button
                type="button"
                onClick={() => handleRadioChange("willVisitAgain", "Hayır")}
                className={`flex-1 py-2 border rounded-full transition ${
                  formData.willVisitAgain === "Hayır"
                    ? "bg-[#1a9c95] text-white border-[#1a9c95]"
                    : "border-gray-300 text-gray-700"
                }`}
              >
                Hayır
              </button>
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-700">
              Bizimle paylaşmak istediğiniz başka bir konu var mı?
            </p>
            <textarea
              name="comments"
              value={formData.comments}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1a9c95] focus:border-[#1a9c95]"
              rows="4"
            ></textarea>
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-2">
              İsminiz*
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1a9c95] focus:border-[#1a9c95]"
              required
            />
          </div>

          <div>
            <label className="block font-medium text-gray-700 mb-2">
              E-posta adresiniz*
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#1a9c95] focus:border-[#1a9c95]"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#1a9c95] text-white py-3 rounded-lg font-medium hover:bg-[#168981] transition-colors disabled:opacity-70"
          >
            {isSubmitting ? "Gönderiliyor..." : "GÖNDER"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default FeedbackForm;