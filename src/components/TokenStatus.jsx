import React, { useState, useEffect } from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const TokenStatus = () => {
  const [tokenStatus, setTokenStatus] = useState({
    accessToken: false,
    refreshToken: false,
    lastRefresh: null
  });

  useEffect(() => {
    const checkTokenStatus = () => {
      const cookies = document.cookie.split(';');
      const accessToken = cookies.find(cookie => cookie.trim().startsWith('x-access-token='));
      const refreshToken = cookies.find(cookie => cookie.trim().startsWith('x-refresh-token='));

      setTokenStatus({
        accessToken: !!accessToken,
        refreshToken: !!refreshToken,
        lastRefresh: new Date().toLocaleTimeString()
      });
    };

    // ตรวจสอบสถานะ token ทุก 30 วินาที
    checkTokenStatus();
    const interval = setInterval(checkTokenStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!tokenStatus.accessToken && !tokenStatus.refreshToken) {
    return null; // ไม่แสดงถ้าไม่มี token
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 max-w-xs">
      <div className="flex items-center space-x-2 mb-2">
        <FaShieldAlt className="text-blue-500" />
        <span className="text-sm font-medium text-gray-700">สถานะ Token</span>
      </div>
      
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Access Token:</span>
          <div className="flex items-center space-x-1">
            {tokenStatus.accessToken ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaExclamationTriangle className="text-yellow-500" />
            )}
            <span className={tokenStatus.accessToken ? 'text-green-600' : 'text-yellow-600'}>
              {tokenStatus.accessToken ? 'ใช้งานได้' : 'หมดอายุ'}
            </span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Refresh Token:</span>
          <div className="flex items-center space-x-1">
            {tokenStatus.refreshToken ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaExclamationTriangle className="text-red-500" />
            )}
            <span className={tokenStatus.refreshToken ? 'text-green-600' : 'text-red-600'}>
              {tokenStatus.refreshToken ? 'พร้อมใช้งาน' : 'ไม่พร้อม'}
            </span>
          </div>
        </div>
        
        {tokenStatus.lastRefresh && (
          <div className="text-xs text-gray-500 text-center pt-1 border-t border-gray-100">
            อัพเดทล่าสุด: {tokenStatus.lastRefresh}
          </div>
        )}
      </div>
    </div>
  );
};

export default TokenStatus;
