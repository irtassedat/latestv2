// src/pages/NotFound.jsx
import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Sayfa Bulunamadı</h2>
        <p className="text-gray-600 mb-6">
          Aradığınız sayfa bulunamadı veya taşınmış olabilir.
        </p>
        <div className="flex flex-col space-y-3">
          <Link 
            to="/admin" 
            className="bg-[#022B45] text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-300"
          >
            Yönetim Paneline Dön
          </Link>
          <Link 
            to="/menu" 
            className="bg-[#D98A3D] text-white py-2 px-4 rounded hover:bg-yellow-600 transition duration-300"
          >
            QR Menüye Git
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;