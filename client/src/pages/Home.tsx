import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import Spinner from '../components/Spinner';

const Home: React.FC = () => {
  const { account, user, isConnecting, connectWallet } = useWallet();
  const navigate = useNavigate();

  // Redirect if already connected
  useEffect(() => {
    if (account && user) {
      // Redirect authority/admin to authority dashboard
      if (user.role === 'AUTHORITY') {
        navigate('/authority');
      } else {
        navigate('/dashboard');
      }
    }
  }, [account, user, navigate]);

  const handleConnect = async () => {
    await connectWallet();
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="max-w-2xl mx-auto text-center space-y-8 animate-fade-in">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-xl">
            <svg
              className="w-14 h-14 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-bold text-gray-900">VehicleChain</h1>
          <p className="text-xl text-blue-600 font-medium">
            Cổng Dịch vụ công Quốc gia (Blockchain)
          </p>
        </div>

        {/* Headline */}
        <div className="space-y-3">
          <h2 className="text-2xl text-gray-700 font-medium">
            Quản lý và Xác thực quyền sở hữu phương tiện minh bạch
          </h2>
          <p className="text-gray-600">
            Hệ thống phi tập trung sử dụng công nghệ Blockchain để đảm bảo<br />
            dữ liệu được lưu trữ vĩnh viễn, minh bạch và an toàn tuyệt đối
          </p>
        </div>

        {/* Connect Button */}
        <div className="pt-8">
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="btn btn-secondary text-lg px-8 py-4 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
          >
            {isConnecting ? (
              <div className="flex items-center space-x-3">
                <Spinner size="sm" />
                <span>Đang kết nối...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm16-4a2 2 0 012 2v1H3V7a2 2 0 012-2h14z" />
                </svg>
                <span>Kết nối Ví Metamask</span>
              </div>
            )}
          </button>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6 pt-12">
          <div className="card text-center">
            <div className="text-4xl mb-3">🔒</div>
            <h3 className="font-semibold text-gray-900 mb-2">Bảo mật tuyệt đối</h3>
            <p className="text-sm text-gray-600">Dữ liệu lưu trữ trên Blockchain không thể làm giả</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Nhanh chóng</h3>
            <p className="text-sm text-gray-600">Đăng ký và sang tên chỉ trong vài phút</p>
          </div>
          <div className="card text-center">
            <div className="text-4xl mb-3">👁️</div>
            <h3 className="font-semibold text-gray-900 mb-2">Minh bạch</h3>
            <p className="text-sm text-gray-600">Tra cứu lịch sử chủ sở hữu công khai</p>
          </div>
        </div>

        {/* Footer */}
        <footer className="pt-12 text-sm text-gray-500">
          <p>© 2025 VehicleChain - Bộ Giao thông Vận tải</p>
          <p className="mt-2">Hotline hỗ trợ: 1900-xxxx</p>
        </footer>
      </div>
    </div>
  );
};

export default Home;
