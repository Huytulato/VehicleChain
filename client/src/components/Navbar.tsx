import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import Spinner from './Spinner';
import { HomeIcon, ChartBarIcon, BuildingOfficeIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ShieldCheckIcon } from '@heroicons/react/24/solid';

const Navbar: React.FC = () => {
  const { account, user, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleConnect = async () => {
    await connectWallet();
    navigate('/dashboard');
  };

  // Check if user is authority (you can customize this logic)
  const isAuthority = user?.role === 'AUTHORITY' || false;

  const navLinks = [
    { path: '/', label: 'Trang chủ', icon: HomeIcon },
    { path: '/dashboard', label: 'Dashboard', icon: ChartBarIcon, requireAuth: true, citizenOnly: true },
    { path: '/authority', label: 'Cơ quan', icon: BuildingOfficeIcon, requireAuth: true, authorityOnly: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-md">
              <ShieldCheckIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">VehicleChain</h1>
              <p className="text-xs text-gray-500">Cổng Dịch vụ công Quốc gia</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {account && (
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                // Skip if requires auth and user not connected
                if (link.requireAuth && !account) return null;
                // Skip if authority only and user is not authority
                if (link.authorityOnly && !isAuthority) return null;
                // Skip if citizen only and user is authority
                if (link.citizenOnly && isAuthority) return null;
                
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all relative ${
                      isActive(link.path)
                        ? 'text-blue-700 bg-blue-50'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-2" />
                    {link.label}
                    {isActive(link.path) && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                    )}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Wallet Connection */}
          <div className="flex items-center space-x-4">
            {account ? (
              <div className="flex items-center space-x-3">
                {/* User Info */}
                {user?.fullName && (
                  <div className="hidden lg:block text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {/* Nếu fullName bị mã hóa (dài > 50 ký tự), hiển thị "Người dùng" */}
                      {user.fullName.length > 50 ? 'Người dùng' : user.fullName}
                    </p>
                    {user.isKYCVerified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        ĐÃ XÁC THỰC
                      </span>
                    )}
                  </div>
                )}

                {/* Account Address */}
                <div className="hidden sm:flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-mono text-gray-600">
                    {account.slice(0, 4)}...{account.slice(-4)}
                  </span>
                </div>

                {/* History Button - QUAN TRỌNG */}
                {account && !isAuthority && (
                 <button
                   onClick={() => navigate('/account-history')}
                   className="hidden md:flex items-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                   title="Lịch sử hoạt động"
                 >
                   <ClockIcon className="w-5 h-5" />
                 </button>
                )}
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {mobileMenuOpen ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    )}
                  </svg>
                </button>

                {/* Disconnect Button */}
                <button
                  onClick={disconnectWallet}
                  className="hidden md:block p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Ngắt kết nối"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                </button>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md hover:shadow-lg transition-all font-medium"
              >
                {isConnecting ? (
                  <>
                    <Spinner size="sm" />
                    <span className="hidden sm:inline ml-2">Đang kết nối...</span>
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M3 9h18v10a2 2 0 01-2 2H5a2 2 0 01-2-2V9zm16-4a2 2 0 012 2v1H3V7a2 2 0 012-2h14z" />
                    </svg>
                    <span className="hidden sm:inline ml-2">Kết nối Ví</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && account && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="space-y-2">
              {navLinks.map((link) => {
                if (link.requireAuth && !account) return null;
                if (link.authorityOnly && !isAuthority) return null;
                if (link.citizenOnly && isAuthority) return null;
                
                const IconComponent = link.icon;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-4 py-3 rounded-lg font-medium transition-all ${
                      isActive(link.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mr-3" />
                    {link.label}
                  </Link>
                );
              })}
              
              {/* Mobile History Link */}
              {!isAuthority && (
               <button
                 onClick={() => {
                  navigate('/account-history');
                  setMobileMenuOpen(false);
                }}
               className="w-full flex items-center px-4 py-3 text-left text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
                >
               <ClockIcon className="w-5 h-5 mr-3" />
               Lịch sử hoạt động
               </button>
              )}

              
              {/* Mobile User Info */}
              <div className="px-4 py-3 bg-gray-50 rounded-lg mt-4">
                {user?.fullName && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-900">
                      {/* Nếu fullName bị mã hóa (dài > 50 ký tự), hiển thị "Người dùng" */}
                      {user.fullName.length > 50 ? 'Người dùng' : user.fullName}
                    </p>
                    {user.isKYCVerified && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                        <CheckCircleIcon className="w-3 h-3 mr-1" />
                        ĐÃ XÁC THỰC
                      </span>
                    )}
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs font-mono text-gray-600">
                    {account.slice(0, 4)}...{account.slice(-4)}
                  </span>
                </div>
              </div>

              {/* Mobile Disconnect Button */}
              <button
                onClick={() => {
                  disconnectWallet();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg font-medium"
              >
                <svg
                  className="w-5 h-5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Ngắt kết nối
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
