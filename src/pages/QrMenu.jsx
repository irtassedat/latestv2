// src/pages/QrMenu.jsx - Tema desteği eklenmiş hali (orijinal UI korunarak)
import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import api from "../lib/axios"
import toast from "react-hot-toast"
import CesmeHeader from "../components/CesmeHeader"
import CustomerLogin from "../components/CustomerLogin"
import LoyaltyProfile from "../components/LoyaltyProfile"
import LoyaltyPointsModal from "../components/LoyaltyPointsModal"

const QrMenu = () => {
  const { branchId } = useParams()
  const [products, setProducts] = useState([])
  const [activeCategory, setActiveCategory] = useState(null)
  const [cart, setCart] = useState([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilterModal, setShowFilterModal] = useState(false)
  const containerRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()
  const [selectedCategory, setSelectedCategory] = useState("")
  const [minPrice, setMinPrice] = useState("")
  const [maxPrice, setMaxPrice] = useState("")
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)
  const [showCategoryHeader, setShowCategoryHeader] = useState(false)
  const [showHeader, setShowHeader] = useState(true)
  const categoryObserverRef = useRef(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [sliderContainerHeight, setSliderContainerHeight] = useState(0)
  const sliderContainerRef = useRef(null)

  // Sadakat sistemi için yeni state'ler
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [customer, setCustomer] = useState(null)
  const [showLoyaltyProfile, setShowLoyaltyProfile] = useState(false)
  const [loyaltyData, setLoyaltyData] = useState(null)
  
  // Puan kullanımı için yeni state'ler
  const [showPointsModal, setShowPointsModal] = useState(false)
  const [selectedPoints, setSelectedPoints] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  // Tema için yeni state
  const [theme, setTheme] = useState(null)
  const [loading, setLoading] = useState(true)

  // Tema ayarlarını getir
  useEffect(() => {
    const fetchTheme = async () => {
      if (!branchId) return;
      
      try {
        // Önce şube tema ayarlarını kontrol et - Public endpoint kullan
        const branchResponse = await api.get(`/api/theme/public/settings/branch/${branchId}`);
        if (Object.keys(branchResponse.data).length > 0) {
          setTheme(branchResponse.data);
        } else {
          // Şube tema ayarı yoksa marka ayarlarını kontrol et
          const branchData = await api.get(`/api/branches/${branchId}`);
          if (branchData.data.brand_id) {
            const brandResponse = await api.get(`/api/theme/public/settings/brand/${branchData.data.brand_id}`);
            if (Object.keys(brandResponse.data).length > 0) {
              setTheme(brandResponse.data);
            }
          }
        }
      } catch (err) {
        console.error("Tema ayarları yüklenirken hata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTheme();
  }, [branchId]);

  // Tema CSS'ini dinamik olarak oluştur
  useEffect(() => {
    if (!theme) {
      console.log('Tema verisi yok');
      return;
    }

    console.log('Tema uygulanıyor:', theme);

    const styleElement = document.createElement('style');
    styleElement.id = 'dynamic-theme-styles';
    
    // Sadece seçilen tema ayarlarını override et, varsayılan değerleri koru
    styleElement.textContent = `
      /* Header tema override */
      .theme-header-bg {
        background-color: ${theme.colors?.headerBg} !important;
      }
      
      .theme-header-text {
        color: ${theme.colors?.headerText} !important;
      }
      
      /* Buton tema override */
      .theme-button-override {
        background-color: ${theme.colors?.buttonBg} !important;
        color: ${theme.colors?.buttonText} !important;
      }
      
      /* Kategori tema override */
      .theme-category-override {
        background-color: ${theme.colors?.categoryBg} !important;
        color: ${theme.colors?.categoryText} !important;
      }
      
      /* Fiyat tema override */
      .theme-price-override {
        color: ${theme.colors?.priceColor} !important;
      }
    `;

    document.head.appendChild(styleElement);
    console.log('Tema CSS eklendi');

    return () => {
      const element = document.getElementById('dynamic-theme-styles');
      if (element) {
        document.head.removeChild(element);
        console.log('Tema CSS kaldırıldı');
      }
    };
  }, [theme]);

  // Sayfa yüklendiğinde müşteri kontrolü
  useEffect(() => {
    const savedCustomer = localStorage.getItem('customer_data')
    if (savedCustomer) {
      setCustomer(JSON.parse(savedCustomer))
      fetchLoyaltyData(JSON.parse(savedCustomer).id)
    }
  }, [])

  // Sadakat bilgilerini getir
  const fetchLoyaltyData = async (customerId) => {
    try {
      const token = localStorage.getItem('customer_token')
      const response = await api.get(`/api/loyalty/customer/${customerId}/data`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLoyaltyData(response.data)
    } catch (err) {
      console.error('Sadakat bilgileri alınamadı:', err)
    }
  }

  // Puan seçildiğinde çalışacak fonksiyon
  const handlePointsSelected = (pointsData) => {
    setSelectedPoints(pointsData.points)
    setDiscountAmount(pointsData.discount)
  }

  // İndirimli toplam tutarı hesaplama
  const calculateDiscountedTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
    return subtotal - discountAmount
  }

  // Promosyon slider verileri - tema ayarlarından al ama varsayılanları koru
  const promotionSlides = theme?.components?.slider?.slides || [
    {
      id: 1,
      image: "/uploads/dere-otlu-pogaca-slider.png"
    },
    {
      id: 2,
      image: "/uploads/dere-otlu-pogaca-slider.png"
    }
  ];

  // Slider boyutlarını hesapla
  useEffect(() => {
    const calculateSliderHeight = () => {
      if (!sliderContainerRef.current) return;
      const containerWidth = sliderContainerRef.current.offsetWidth;
      const calculatedHeight = containerWidth * (9 / 16);
      setSliderContainerHeight(calculatedHeight);
    }

    calculateSliderHeight();
    window.addEventListener('resize', calculateSliderHeight);

    return () => {
      window.removeEventListener('resize', calculateSliderHeight);
    }
  }, []);

  // Scroll pozisyonunu izle
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }

      const categorySection = document.getElementById('categories-section')
      if (categorySection) {
        const categorySectionTop = categorySection.getBoundingClientRect().top
        setShowCategoryHeader(categorySectionTop <= 0)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Görünen kategoriyi otomatik aktif etmek için IntersectionObserver
  useEffect(() => {
    if (categoryObserverRef.current) {
      categoryObserverRef.current.disconnect()
    }

    const options = {
      root: null,
      rootMargin: "-20% 0px -70% 0px",
      threshold: 0.1
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const categoryName = entry.target.id.replace('section-', '')
          setActiveCategory(categoryName)

          if (showCategoryHeader) {
            setTimeout(() => {
              const fixedCatButton = document.getElementById(`fixed-cat-${categoryName}`)
              if (fixedCatButton) {
                fixedCatButton.scrollIntoView({
                  behavior: "smooth",
                  block: "nearest",
                  inline: "center"
                })
              }
            }, 100)
          }
        }
      })
    }, options)

    Object.keys(groupedWithTeaFirst).forEach(category => {
      const element = document.getElementById(`section-${category}`)
      if (element) {
        observer.observe(element)
      }
    })

    categoryObserverRef.current = observer

    return () => {
      if (categoryObserverRef.current) {
        categoryObserverRef.current.disconnect()
      }
    }
  }, [products, showCategoryHeader])

  // Slider otomatik geçiş
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % promotionSlides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [promotionSlides.length])

  // Modal açıldığında body scroll'u engelle
  useEffect(() => {
    if (isCartOpen || showFilterModal || isMenuOpen) {
      document.body.classList.add("overflow-hidden")
    } else {
      document.body.classList.remove("overflow-hidden")
    }
  }, [isCartOpen, showFilterModal, isMenuOpen])

  // Şubeye ait ürünleri getir
  const fetchBranchMenu = async (branch_id) => {
    if (!branch_id) {
      console.log("Şube ID'si belirtilmedi, varsayılan şube ürünleri getiriliyor");
      try {
        const branchesResponse = await api.get("/api/branches");
        if (branchesResponse.data && branchesResponse.data.length > 0) {
          const defaultBranchId = branchesResponse.data[0].id;
          console.log(`Varsayılan şube ID'si: ${defaultBranchId}`);

          const branchResponse = await api.get(`/api/branches/${defaultBranchId}`);
          const defaultBranch = branchResponse.data;

          const productsResponse = await api.get(`/api/branches/${defaultBranchId}/menu`);

          console.log("API yanıtı:", productsResponse.data);

          if (productsResponse.data && productsResponse.data.products) {
            if (productsResponse.data.products.length > 0) {
              console.log(`${productsResponse.data.products.length} ürün başarıyla yüklendi`);
              setProducts(productsResponse.data.products);
            } else {
              console.warn("API'den dönen ürün listesi boş!");
              loadFallbackProducts();
            }
          } else {
            console.warn("API yanıtında products dizisi bulunamadı:", productsResponse.data);
            loadFallbackProducts();
          }

          navigate(`/menu/${defaultBranchId}`, { replace: true });
        }
      } catch (err) {
        console.error("Şubeler yüklenirken hata:", err.message);
        loadFallbackProducts();
      }
      return;
    }

    try {
      console.log(`${branch_id} ID'li şubenin menüsü getiriliyor...`);

      const branchResponse = await api.get(`/api/branches/${branch_id}`);
      const branch = branchResponse.data;
      console.log("Şube detayları:", branch);

      const response = await api.get(`/api/branches/${branch_id}/menu`);
      console.log("Menü API yanıtı:", response.data);

      if (response.data && response.data.products && response.data.products.length > 0) {
        console.log(`${response.data.products.length} ürün başarıyla yüklendi`);
        setProducts(response.data.products);
      } else {
        console.warn("Şube için ürün bulunamadı veya API yanıtı beklenen formatta değil:", response.data);
        if (branch.menu_template_id && branch.price_template_id) {
          console.warn(`Şablonlar doğru: Menü Şablonu=${branch.menu_template_id}, Fiyat Şablonu=${branch.price_template_id}`);
          console.warn("Ancak bu şablonlarda görünür ürün yok veya API yanıtı beklenen formatta değil");
        } else {
          console.warn("Şube için menü veya fiyat şablonu atanmamış");
        }
        loadFallbackProducts();
      }
    } catch (err) {
      console.error("Menü yüklenirken hata:", err);
      console.error("Hata detayları:", err.response?.data || err.message);
      loadFallbackProducts();
    }
  };

  const loadFallbackProducts = () => {
    setProducts([]);

    if (process.env.NODE_ENV !== 'production') {
      console.log("Örnek ürün verileri yükleniyor...");
      setProducts([
        { id: 1, name: "Türk Kahvesi", price: 35, category_name: "Kahveler" },
        { id: 2, name: "Latte", price: 40, category_name: "Kahveler" },
        { id: 3, name: "Sütlaç", price: 45, category_name: "Tatlılar" },
        { id: 4, name: "Çeşme Kumru", price: 70, category_name: "Ana Yemekler" },
        { id: 5, name: "Sade Çay", price: 15, category_name: "Çaylar" }
      ]);
    }
  };

  // Sayfa yüklendiğinde veya şube değiştiğinde menüyü getir
  useEffect(() => {
    fetchBranchMenu(branchId);
  }, [branchId, navigate]);

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = selectedCategory === "" || p.category_name === selectedCategory
    const matchesMin = minPrice === "" || p.price >= parseFloat(minPrice)
    const matchesMax = maxPrice === "" || p.price <= parseFloat(maxPrice)
    const matchesStock = !onlyInStock || p.stock_count > 0

    return matchesSearch && matchesCategory && matchesMin && matchesMax && matchesStock
  })

  const grouped = filteredProducts.reduce((acc, curr) => {
    if (!curr.category_name) return acc
    if (!acc[curr.category_name]) acc[curr.category_name] = []
    acc[curr.category_name].push(curr)
    return acc
  }, {})

  // "Çaylar"ı başa taşı
  const groupedWithTeaFirst = {
    ...(grouped["Çaylar"] ? { "Çaylar": grouped["Çaylar"] } : {}),
    ...Object.fromEntries(Object.entries(grouped).filter(([k]) => k !== "Çaylar"))
  }

  const handleCategoryClick = (categoryName) => {
    const target = document.getElementById(`section-${categoryName}`)
    if (target) {
      target.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
      setActiveCategory(categoryName)

      if (window.clarity) {
        window.clarity("event", "category_click", {
          categoryName: categoryName
        });
      }

      setTimeout(() => {
        const fixedCatButton = document.getElementById(`fixed-cat-${categoryName}`)
        const fixedNavContainer = document.getElementById('fixed-category-nav')

        if (fixedCatButton && fixedNavContainer) {
          fixedCatButton.scrollIntoView({
            behavior: "smooth",
            block: "nearest",
            inline: "center"
          })
        }
      }, 100)
    }
  }

  const addToCart = (product) => {
    const existingCart = JSON.parse(localStorage.getItem("qr_cart") || "[]")
    const existingItem = existingCart.find((item) => item.id === product.id)

    const updatedCart = existingItem
      ? existingCart.map((item) =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
      : [...existingCart, { ...product, quantity: 1, branch_id: branchId }]

    localStorage.setItem("qr_cart", JSON.stringify(updatedCart))
    setCart(updatedCart)

    toast.success(`${product.name} sepete eklendi!`, {
      duration: 3000,
      style: {
        borderRadius: '10px',
        background: '#22c55e',
        color: '#fff',
        fontWeight: 'bold',
        padding: '16px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      },
      icon: '🛒',
    })

    if (window.clarity) {
      window.clarity("event", "add_to_cart", {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: 1,
        branchId: branchId,
        cartTotal: updatedCart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      });
    }
  };

  const updateQuantity = (productId, delta) => {
    const updatedCart = cart
      .map((item) =>
        item.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      );

    setCart(updatedCart);
    localStorage.setItem("qr_cart", JSON.stringify(updatedCart));

    if (window.clarity) {
      const product = cart.find(item => item.id === productId);
      window.clarity("event", delta > 0 ? "cart_increase" : "cart_decrease", {
        productId: productId,
        productName: product?.name || "Unknown Product",
        newQuantity: Math.max(1, product.quantity + delta),
        delta: delta
      });
    }
  }

  const removeFromCart = (productId) => {
    const product = cart.find(item => item.id === productId);
    const updatedCart = cart.filter((item) => item.id !== productId);
    setCart(updatedCart);
    localStorage.setItem("qr_cart", JSON.stringify(updatedCart));

    if (window.clarity && product) {
      window.clarity("event", "remove_from_cart", {
        productId: productId,
        productName: product.name,
        quantity: product.quantity,
        price: product.price
      });
    }

    toast.success("Ürün sepetten çıkarıldı", {
      icon: '🗑️',
      style: {
        background: '#ef4444',
        color: '#fff',
      },
    });
  }

  const clearCart = () => {
    if (window.clarity && cart.length > 0) {
      window.clarity("event", "clear_cart", {
        itemCount: cart.length,
        totalValue: cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
      });
    }

    setCart([]);
    localStorage.removeItem("qr_cart");
    setIsCartOpen(false);
    toast.success("Sepet temizlendi", {
      icon: '🧹',
      style: {
        background: '#6b7280',
        color: '#fff',
      },
    });
  }

  const toSlug = (str) =>
    str
      ?.toLowerCase()
      .replace(/ç/g, "c")
      .replace(/ğ/g, "g")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ş/g, "s")
      .replace(/ü/g, "u")
      .replace(/\s+/g, "-") || "default"

  const recommendedProducts = products.filter((p) =>
    ["Çeşme Kumru", "Beyaz Peynirli Omlet"].includes(p.name)
  )

  useEffect(() => {
    const syncCart = () => {
      const stored = JSON.parse(localStorage.getItem("qr_cart") || "[]")
      setCart(stored)
    }

    window.addEventListener("focus", syncCart)
    syncCart()

    return () => window.removeEventListener("focus", syncCart)
  }, [])

  const handleImageLoad = (e) => {
    if (sliderContainerRef.current && e.target.naturalWidth) {
      const containerWidth = sliderContainerRef.current.offsetWidth;
      const calculatedHeight = containerWidth * (9 / 16);
      setSliderContainerHeight(calculatedHeight);
    }
  }

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product, branchId } });

    if (window.clarity) {
      window.clarity("set", "product_viewed", product.name);
      window.clarity("event", "product_click", {
        productId: product.id,
        productName: product.name,
        category: product.category_name || "Kategori Yok",
        price: product.price,
        branchId: branchId
      });
    }
  };

  // Sipariş tamamlama fonksiyonunu güncelle
  const handleCompleteOrder = async () => {
    try {
      const totalPrice = calculateDiscountedTotal()
      
      const orderData = {
        items: cart,
        total_price: totalPrice,
        branch_id: branchId,
        name: customer?.full_name || customer?.phone_number || "Anonim",
        phone: customer?.phone_number || "",
        table_number: "1",
        customer_profile_id: customer?.id || null,
        used_points: selectedPoints || 0,
        discount_amount: discountAmount || 0
      }

      const orderResponse = await api.post('/api/orders', orderData)

      // Puan kazanıldıysa göster
      if (orderResponse.data.points) {
        const { points_earned, new_balance, campaign_bonuses } = orderResponse.data.points
        
        // Puan kazanma bildirimi
        toast((t) => (
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-xl">🎉</span>
              </div>
              <div>
                <p className="font-bold">Tebrikler!</p>
                <p className="text-sm">{points_earned} puan kazandınız!</p>
              </div>
            </div>
            
            {campaign_bonuses && campaign_bonuses.length > 0 && (
              <div className="ml-12 text-xs text-gray-600">
                {campaign_bonuses.map((bonus, i) => (
                  <p key={i}>• {bonus.campaign_name}: +{bonus.bonus_points} puan</p>
                ))}
              </div>
            )}
            
            <div className="mt-2 ml-12 flex items-center gap-2 text-sm">
              <span>Yeni bakiye:</span>
              <span className="font-bold text-green-600">{new_balance} puan</span>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'top-center',
          style: {
            background: '#fff',
            color: '#000',
            padding: '16px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }
        })

        // Sadakat bilgilerini güncelle
        fetchLoyaltyData(customer.id)
      }

      // Sepeti temizle ve onay sayfasına yönlendir
      clearCart()
      navigate('/confirm', { state: { orderId: orderResponse.data.order.id } })
      
    } catch (err) {
      console.error('Sipariş tamamlama hatası:', err)
      toast.error('Sipariş tamamlanamadı. Lütfen tekrar deneyin.')
    }
  }

  // Sadakat kartı bileşeni
  const LoyaltyCard = () => {
    if (!customer || !loyaltyData) return null

    return (
      <div 
        onClick={() => setShowLoyaltyProfile(true)}
        className="fixed bottom-20 right-4 z-40 bg-white rounded-lg shadow-lg p-3 cursor-pointer hover:shadow-xl transition-shadow"
        style={{ width: '280px' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
              <span className="text-lg">⭐</span>
            </div>
            <div>
              <p className="font-medium text-sm">{customer.full_name || customer.phone_number}</p>
              <p className="text-xs text-gray-500">{loyaltyData.tier_level} Üye</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-amber-600">{loyaltyData.current_points || 0}</p>
            <p className="text-xs text-gray-500">Puan</p>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
          <div 
            className="bg-amber-600 h-1.5 rounded-full transition-all"
            style={{ width: `${Math.min((loyaltyData.current_points / loyaltyData.next_tier_requirement) * 100, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-gray-500 text-center">
          {loyaltyData.next_tier_requirement - loyaltyData.current_points} puan ile {loyaltyData.next_tier} seviyesine yükselebilirsiniz
        </p>
      </div>
    )
  }

  // Header'ı güncelle
  const renderHeader = () => (
    <div className="w-full">
      <CesmeHeader 
        customer={customer}
        loyaltyData={loyaltyData}
        onLoginClick={() => setShowLoginModal(true)}
        onProfileClick={() => setShowLoyaltyProfile(true)}
        onLogout={() => {
          localStorage.removeItem('customer_token');
          localStorage.removeItem('customer_data');
          setCustomer(null);
          setLoyaltyData(null);
        }}
        theme={theme}
      />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 pt-20" ref={containerRef}>
      <div
        className={`fixed top-0 left-0 w-full z-50 backdrop-blur-md ${theme ? 'theme-header-bg' : 'bg-[#1a9c95]/90'} transition-all duration-500 ease-in-out transform ${showHeader ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full'}`}
      >
        {renderHeader()}
      </div>

      {/* Müşteri giriş yapmışsa sadakat kartını göster */}
      {customer && <LoyaltyCard />}

      {/* Sabit Kategori Header */}
      {showCategoryHeader && (
        <div className="sticky top-0 z-40 bg-white shadow-md transition-all duration-300">
          <div className="overflow-x-auto px-0">
            <div id="fixed-category-nav" className="flex py-1 px-2 gap-2">
              {Object.keys(groupedWithTeaFirst).map((cat) => (
                <button
                  id={`fixed-cat-${cat}`}
                  key={cat}
                  onClick={() => handleCategoryClick(cat)}
                  className={`px-3 py-1.5 text-sm font-normal whitespace-nowrap transition-all rounded border
                    ${activeCategory === cat
                      ? 'bg-white border-white text-[#022B45]'
                      : `${theme ? 'theme-category-override' : 'bg-[#022B45] text-white border-[#022B45]'} hover:opacity-90`
                    }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {activeCategory && (
            <div className="bg-[#f4e9c7] py-1 px-4 text-[#d49e36] border-t border-[#e3d5a8] text-sm font-medium">
              Şu an görüntülenen: {activeCategory}
            </div>
          )}
        </div>
      )}

      {/* Sabit Sepet Butonu */}
      {cart.length > 0 && (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center justify-center w-12 h-12 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-full shadow-lg hover:bg-white transition-all"
          >
            <span className="text-xl">🛒</span>
            {cart.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cart.length}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="px-4 py-4">
        {/* Promosyon Slider */}
        <div className="mb-8">
          <div
            ref={sliderContainerRef}
            className="w-full overflow-hidden relative bg-transparent rounded-lg"
            style={{
              height: `${sliderContainerHeight}px`,
              backgroundColor: 'rgba(0, 0, 0, 0.05)'
            }}
          >
            {promotionSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 flex items-center justify-center ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                style={{
                  transition: 'opacity 0.5s ease-in-out'
                }}
              >
                <img
                  src={slide.image}
                  alt={`Promosyon ${index + 1}`}
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    console.error("Görsel yüklenemedi:", e);
                    e.target.src = "/uploads/placeholder.jpg";
                  }}
                />
              </div>
            ))}
          </div>

          {/* Slider Dots */}
          <div className="relative w-full flex justify-center mt-2">
            <div className="flex space-x-2">
              {promotionSlides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-all ${index === currentSlide ? 'bg-white w-4' : 'bg-white/50'}`}
                  aria-label={`Slayt ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Önerilen Ürünler */}
        {recommendedProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">⭐ Bugünün Önerileri</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {recommendedProducts.map((p) => (
                <div
                  key={p.id}
                  onClick={() => handleProductClick(p)}
                  className="cursor-pointer min-w-[200px] bg-white rounded-lg shadow p-3 flex gap-3 items-center hover:shadow-md transition"
                >
                  <div className="w-20 h-20 rounded overflow-hidden">
                    <img
                      src={p.image_url || "/uploads/guncellenecek.jpg"}
                      alt={p.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold">{p.name}</h3>
                    <p className={`font-bold text-base mb-1 ${theme ? 'theme-price-override' : 'text-[#D98A3D]'}`}>{p.price} ₺</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arama ve Filtreleme */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex items-center gap-2 bg-white shadow px-3 py-2 rounded-lg w-full">
            <span className="text-gray-500 text-lg">🔍</span>
            <input
              type="text"
              placeholder="Ürün ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 outline-none"
            />
          </div>
          <button
            className="p-2 bg-white rounded-lg shadow hover:bg-gray-100"
            onClick={() => setShowFilterModal(true)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M3 5a1 1 0 011-1h12a1 1 0 01.8 1.6l-4.2 5.6V15a1 1 0 01-.3.7l-2 2A1 1 0 019 18v-6.8L4.2 6.6A1 1 0 013 5z" />
            </svg>
          </button>
        </div>

        {/* Kategori Butonları */}
        <div id="categories-section" className="mb-10">
          <h2 className="text-lg font-semibold mb-3">Kategoriler</h2>
          <div className="flex overflow-x-auto space-x-4 pb-4 scrollbar-hide snap-x snap-mandatory">
            {Object.keys(groupedWithTeaFirst).map((cat) => (
              <div
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                className="snap-start flex flex-col items-center cursor-pointer"
              >
                <div className={`w-24 h-24 rounded-xl overflow-hidden shadow-md mb-2 ${activeCategory === cat ? "ring-2 ring-white" : ""}`}>
                  <img
                    src={`/category/${toSlug(cat)}.jpg`}
                    alt={cat}
                    onError={(e) => (e.target.src = "/category/default.jpg")}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-sm font-medium text-center">{cat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ürünler */}
        <div className="space-y-12 pb-8">
          {Object.entries(groupedWithTeaFirst).map(([category, items]) => (
            <div key={category} id={`section-${category}`} className="scroll-mt-20">
              <div className="relative mb-6 h-40 rounded-xl overflow-hidden shadow-md">
                <img
                  src={`/category/${toSlug(category)}.jpg`}
                  alt={category}
                  onError={(e) => (e.target.src = "/category/default.jpg")}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-4">
                  <h2 className="text-white text-2xl font-bold">{category}</h2>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {items.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleProductClick(p)}
                    className="w-full bg-white rounded-xl shadow-sm p-3 flex items-center gap-3 hover:shadow-md transition cursor-pointer relative group"
                  >
                    <div className="w-24 h-24 flex-shrink-0 overflow-hidden rounded-md relative transition-all duration-300 group-hover:scale-105">
                      <img
                        src={
                          p.image_url &&
                            p.image_url.trim() !== "" &&
                            !p.image_url.includes("ibb.co")
                            ? p.image_url
                            : "/uploads/guncellenecek.jpg"
                        }
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(p);
                        }}
                        className={`absolute bottom-1 right-1 ${theme ? 'theme-button-override' : 'bg-[#022B45]/80 text-white'} rounded-full p-1.5 backdrop-blur-sm hover:bg-[#022B45] transition-colors`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>

                    <div className="flex-1 pl-2 group-hover:transform group-hover:translate-y-[-2px] transition-transform duration-300">
                      <h3 className="text-base font-semibold mb-1">{p.name}</h3>
                      <p className={`font-bold text-base mb-1 ${theme ? 'theme-price-override' : 'text-[#D98A3D]'}`}>{p.price} ₺</p>

                      {p.description && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{p.description}</p>
                      )}

                      <div className="flex gap-2 mt-2">
                        {p.isGlutenFree && (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <img src="/icons/gluten-free.svg" alt="Glutensiz" className="w-4 h-4"
                              onError={(e) => { e.target.src = "/uploads/icon-placeholder.png" }} />
                          </div>
                        )}
                        {p.isVegetarian && (
                          <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <img src="/icons/vegetarian.svg" alt="Vejetaryen" className="w-4 h-4"
                              onError={(e) => { e.target.src = "/uploads/icon-placeholder.png" }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtre Modalı */}
      {showFilterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex justify-center items-center px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-lg">
            <button
              onClick={() => setShowFilterModal(false)}
              className="absolute top-2 right-2 text-gray-600 hover:text-black"
            >
              ❌
            </button>
            <h3 className="text-lg font-bold mb-4 text-[#022B45]">🔍 Filtrele</h3>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Ürün adı"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#B8D7DD] focus:border-[#B8D7DD]"
              />

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="inStock"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-[#D98A3D]"
                />
                <label htmlFor="inStock" className="text-sm text-gray-700">
                  Sadece stokta olanlar
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min fiyat"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#B8D7DD] focus:border-[#B8D7DD]"
                />
                <input
                  type="number"
                  placeholder="Max fiyat"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#B8D7DD] focus:border-[#B8D7DD]"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-[#B8D7DD] focus:border-[#B8D7DD]"
              >
                <option value="">Kategori seç</option>
                {Object.keys(groupedWithTeaFirst).map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>

              <button
                onClick={() => setShowFilterModal(false)}
                className="w-full bg-[#022B45] text-white py-2 rounded"
              >
                Uygula
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sepet Modalı */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-lg flex items-center justify-center px-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="flex justify-between items-center mb-4 border-b border-[#B8D7DD]/30 pb-3">
              <h3 className="text-xl font-bold text-[#022B45]">🛒 Sepet</h3>
              <button
                onClick={() => setIsCartOpen(false)}
                className="text-gray-500 hover:text-gray-800"
              >
                ✕
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-8 text-center">
                <div className="text-4xl mb-2">🛒</div>
                <p className="text-gray-500">Sepetiniz boş</p>
                <p className="text-sm text-gray-400 mt-1">Menüden ürün ekleyebilirsiniz</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b border-[#B8D7DD]/20 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-md overflow-hidden">
                        <img
                          src={
                            item.image_url && !item.image_url.includes("ibb.co")
                              ? item.image_url
                              : "/uploads/guncellenecek.jpg"
                          }
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className={`text-sm ${theme ? 'theme-price-override' : 'text-[#D98A3D]'}`}>{item.price} ₺</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center border rounded-full overflow-hidden border-[#B8D7DD]">
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, -1)
                          }}
                        >
                          -
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          className="w-8 h-8 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            updateQuantity(item.id, 1)
                          }}
                        >
                          +
                        </button>
                      </div>
                      <button
                        className="text-red-500 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.id);
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}

                {/* Puan kullanımı bölümü */}
                {customer && loyaltyData && loyaltyData.current_points > 0 && (
                  <div className="mt-4">
                    {selectedPoints > 0 ? (
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-green-800">Puan İndirimi</span>
                          <span className="font-bold text-green-600">-{discountAmount.toFixed(2)} ₺</span>
                        </div>
                        <div className="text-sm text-green-700">
                          {selectedPoints} puan kullanılıyor
                        </div>
                        <button
                          onClick={() => {
                            setSelectedPoints(null)
                            setDiscountAmount(0)
                          }}
                          className="text-sm text-red-600 hover:text-red-700 mt-1"
                        >
                          İptal Et
                        </button>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Kullanılabilir Puan</span>
                          <span className="font-bold text-amber-600">{loyaltyData.current_points}</span>
                        </div>
                        <button
                          className="w-full py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                          onClick={() => setShowPointsModal(true)}
                        >
                          Puan Kullan
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Toplam tutar */}
                <div className="mt-4 flex justify-between items-center py-3 border-t border-b border-[#B8D7DD]/20">
                  <span className="font-medium">Ara Toplam</span>
                  <span className="text-lg font-bold">
                    {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)} ₺
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between items-center py-3">
                    <span className="font-medium">İndirim</span>
                    <span className="text-lg font-bold text-green-600">
                      -{discountAmount.toFixed(2)} ₺
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center py-3 border-t">
                  <span className="font-medium">Toplam</span>
                  <span className={`text-lg font-bold ${theme ? 'theme-price-override' : 'text-[#D98A3D]'}`}>
                    {calculateDiscountedTotal().toFixed(2)} ₺
                  </span>
                </div>

                {/* Siparişi tamamla butonu */}
                <div className="flex flex-col gap-2 mt-6">
                  <button
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${theme ? 'theme-button-override' : 'bg-[#022B45] text-white hover:bg-[#022B45]/80'}`}
                    onClick={handleCompleteOrder}
                  >
                    Siparişi Tamamla
                  </button>
                  <button
                    className="w-full py-2 text-gray-500 hover:text-gray-700"
                    onClick={clearCart}
                  >
                    Sepeti Temizle
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLoginModal && (
        <CustomerLogin
          onSuccess={(customerData) => {
            setCustomer(customerData)
            setShowLoginModal(false)
            fetchLoyaltyData(customerData.id)
          }}
          onClose={() => setShowLoginModal(false)}
        />
      )}

      {/* Sadakat Profili Modal */}
      {showLoyaltyProfile && customer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setShowLoyaltyProfile(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-bold mb-4">Sadakat Kartlarım</h2>
            <LoyaltyProfile customer={customer} />
            
            <div className="mt-6 space-y-3">
              <h3 className="font-medium">Puan Geçmişi</h3>
              {loyaltyData?.recent_transactions?.map((transaction, index) => (
                <div key={index} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{transaction.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleDateString('tr-TR')}
                    </p>
                  </div>
                  <span className={`font-bold ${
                    transaction.transaction_type === 'earn' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.transaction_type === 'earn' ? '+' : '-'}{transaction.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Puan Kullanımı Modalı */}
      {showPointsModal && customer && (
        <LoyaltyPointsModal
          show={showPointsModal}
          onClose={() => setShowPointsModal(false)}
          customer={customer}
          brandId={branchId}
          orderTotal={cart.reduce((sum, item) => sum + item.price * item.quantity, 0)}
          onPointsSelected={handlePointsSelected}
        />
      )}
    </div>
  )
}

export default QrMenu