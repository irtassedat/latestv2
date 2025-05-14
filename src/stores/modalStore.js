// src/stores/modalStore.js
import { create } from 'zustand';

// Şablon türleri
const templateTypes = {
  MENU: "menu",
  PRICE: "price",
  INTEGRATION: "integration"
};

// Modal durumlarını yönetmek için store
const useModalStore = create((set) => ({
  // Modal görünürlük durumları
  modals: {
    templateModal: false,
    productModal: false,
    productsModal: false,
    priceProductsModal: false,
    productsListModal: false,
    integrationModal: false,
    confirmModal: false,
    copyModal: false,
    linkTemplateModal: false,
  },
  
  // Güncel bağlam bilgileri
  currentTemplateId: null,
  currentTemplate: null,
  currentTemplateType: templateTypes.MENU,
  editingProduct: null,
  confirmAction: null,
  copyDetails: null,
  
  // Bir modalı aç
  openModal: (modalName, data = {}) => set((state) => ({
    modals: {
      ...state.modals,
      [modalName]: true
    },
    ...(data.templateId && { currentTemplateId: data.templateId }),
    ...(data.template && { currentTemplate: data.template }),
    ...(data.templateType && { currentTemplateType: data.templateType }),
    ...(data.editingProduct && { editingProduct: data.editingProduct }),
    ...(data.confirmAction && { confirmAction: data.confirmAction }),
    ...(data.copyDetails && { copyDetails: data.copyDetails }),
  })),
  
  // Bir modalı kapat
  closeModal: (modalName) => set((state) => ({
    modals: {
      ...state.modals,
      [modalName]: false
    },
    // Eğer bir ürün düzenleme modalı kapatılıyorsa, düzenlenen ürünü temizle
    ...(modalName === 'productModal' ? { editingProduct: null } : {}),
    // Eğer bir şablon modalı kapatılıyorsa, düzenlenen şablonu temizle
    ...(modalName === 'templateModal' || modalName === 'integrationModal' 
      ? { currentTemplate: null } 
      : {})
  })),
  
  // Tüm modalları sıfırla
  resetModals: () => set({
    modals: {
      templateModal: false,
      productModal: false,
      productsModal: false,
      priceProductsModal: false,
      productsListModal: false,
      integrationModal: false,
      confirmModal: false,
      copyModal: false,
      linkTemplateModal: false,
    },
    currentTemplateId: null,
    currentTemplate: null,
    currentTemplateType: templateTypes.MENU,
    editingProduct: null,
    confirmAction: null,
    copyDetails: null,
  }),
  
  // Modal durumlarını güncelle
  setModalState: (updates) => set((state) => ({
    ...state,
    ...updates
  })),
}));

export default useModalStore;