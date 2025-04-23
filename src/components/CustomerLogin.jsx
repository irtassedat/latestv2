import { useState } from 'react';
import { FiPhone, FiLock } from 'react-icons/fi';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const CustomerLogin = ({ onSuccess, onClose }) => {
  const [step, setStep] = useState('phone'); // phone, otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhoneNumber = (value) => {
    // Sadece rakamları al
    const numbers = value.replace(/\D/g, '');
    
    // 10 haneden fazla girişe izin verme
    if (numbers.length > 10) return phone;
    
    // Format: (5XX) XXX XX XX
    if (numbers.length >= 3) {
      let formatted = `(${numbers.slice(0, 3)}) `;
      if (numbers.length > 3) {
        formatted += numbers.slice(3, 6);
        if (numbers.length > 6) {
          formatted += ` ${numbers.slice(6, 8)}`;
          if (numbers.length > 8) {
            formatted += ` ${numbers.slice(8, 10)}`;
          }
        }
      }
      return formatted;
    }
    return numbers;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    
    // Telefon numarası kontrolü
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Geçerli bir telefon numarası giriniz');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/customer-auth/send-otp', {
        phone_number: cleanPhone,
        otp_type: 'login'
      });
      
      toast.success('Doğrulama kodu gönderildi');
      setStep('otp');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Kod gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (otp.length !== 6) {
      toast.error('6 haneli doğrulama kodunu giriniz');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/customer-auth/verify-otp', {
        phone_number: phone.replace(/\D/g, ''),
        otp_code: otp
      });

      const { token, customer } = response.data;
      
      // Token'ı sakla
      localStorage.setItem('customer_token', token);
      localStorage.setItem('customer_data', JSON.stringify(customer));
      
      toast.success('Giriş başarılı');
      onSuccess(customer);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Doğrulama başarısız');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Hoş Geldiniz</h2>
          <p className="text-gray-500 mt-2">
            {step === 'phone' 
              ? 'Telefon numaranızı girerek devam edin'
              : 'Telefonunuza gelen 6 haneli kodu girin'}
          </p>
        </div>

        {step === 'phone' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Telefon Numarası
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiPhone className="text-gray-400" />
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="(5XX) XXX XX XX"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Doğrulama Kodu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="• • • • • •"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-blue-600 hover:text-blue-700"
              >
                Telefonu Değiştir
              </button>
              <button
                type="button"
                onClick={handleSendOTP}
                className="text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                Tekrar Gönder
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula ve Giriş Yap'}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Devam ederek <span className="text-blue-600">Gizlilik Politikası</span> ve{' '}
            <span className="text-blue-600">Kullanım Koşulları</span>'nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerLogin;