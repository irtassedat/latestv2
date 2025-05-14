// src/components/modals/ConfirmModal.jsx
import { FiX, FiAlertTriangle } from "react-icons/fi";

const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Onay", 
  message, 
  confirmText = "Evet", 
  cancelText = "İptal",
  type = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;
  
  // Modal türüne göre renk ve simge belirle
  const getTheme = () => {
    switch (type) {
      case "danger":
        return {
          icon: <FiAlertTriangle size={24} className="text-red-500" />,
          headerBg: "bg-red-100",
          confirmBg: "bg-red-600 hover:bg-red-700",
          borderColor: "border-red-200"
        };
      case "warning":
        return {
          icon: <FiAlertTriangle size={24} className="text-amber-500" />,
          headerBg: "bg-amber-100",
          confirmBg: "bg-amber-600 hover:bg-amber-700",
          borderColor: "border-amber-200"
        };
      case "info":
        return {
          icon: <FiAlertTriangle size={24} className="text-blue-500" />,
          headerBg: "bg-blue-100",
          confirmBg: "bg-blue-600 hover:bg-blue-700",
          borderColor: "border-blue-200"
        };
      default:
        return {
          icon: <FiAlertTriangle size={24} className="text-red-500" />,
          headerBg: "bg-red-100",
          confirmBg: "bg-red-600 hover:bg-red-700",
          borderColor: "border-red-200"
        };
    }
  };
  
  const theme = getTheme();
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-lg overflow-hidden">
        <div className={`p-4 flex items-center ${theme.headerBg} ${theme.borderColor} border-b`}>
          {theme.icon}
          <h2 className="text-lg font-bold ml-2">{title}</h2>
          <button 
            onClick={onClose} 
            className="ml-auto p-1 rounded-full hover:bg-white hover:bg-opacity-25 transition-colors"
          >
            <FiX size={20} />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-700">{message}</p>
        </div>
        
        <div className="p-4 bg-gray-50 border-t flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-white rounded-lg transition-colors ${theme.confirmBg}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;