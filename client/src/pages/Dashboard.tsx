import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { TruckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAllVehiclesForAuthority } from '../services/blockchain';
import type { Vehicle } from '../types';
import MyGarage from './citizen/MyGarage';
import RegisterVehicle from './citizen/RegisterVehicle';

type TabType = 'garage' | 'search';

const Dashboard: React.FC = () => {
  const { account } = useWallet();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('garage');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [editingVin, setEditingVin] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [searchResult, setSearchResult] = useState<Vehicle | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!account) {
      navigate('/');
    }
  }, [account, navigate]);

  const tabs = [
    { 
      id: 'garage' as TabType, 
      label: 'Xe của tôi', 
      icon: TruckIcon,
      description: 'Danh sách phương tiện' 
    },
    { 
      id: 'search' as TabType, 
      label: 'Tra cứu', 
      icon: MagnifyingGlassIcon,
      description: 'Tìm kiếm thông tin' 
    },
  ];

  const handleOpenRegister = (vinToEdit?: string) => {
    setEditingVin(vinToEdit);
    setShowRegisterForm(true);
  };

  const handleSearch = async () => {
    if (!searchText.trim()) {
      setSearchError('Vui lòng nhập VIN hoặc biển số');
      setSearchResult(null);
      return;
    }
    setSearchLoading(true);
    setSearchError(null);
    setSearchResult(null);
    try {
      const all = await getAllVehiclesForAuthority();
      const q = searchText.trim().toLowerCase().replace(/[\s-]/g, '');
      const found = all.find(v =>
        v.vin.toLowerCase() === q ||
        v.licensePlate.toLowerCase().replace(/[\s-]/g, '') === q
      );
      if (!found) {
        setSearchError('Không tìm thấy phương tiện phù hợp');
      }
      setSearchResult(found || null);
    } catch (e: any) {
      setSearchError(e.message || 'Lỗi tra cứu. Vui lòng thử lại.');
    } finally {
      setSearchLoading(false);
    }
  };

  if (showRegisterForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <button
            onClick={() => setShowRegisterForm(false)}
            className="mb-6 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Quay lại Dashboard
          </button>
          <RegisterVehicle editVin={editingVin} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header with CTA Button */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Quản lý phương tiện của bạn</p>
          </div>
          
          {/* Primary CTA - Register Button */}
          <button
            onClick={() => setShowRegisterForm(true)}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all font-medium"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Đăng ký xe mới
          </button>
        </div>

        {/* Tab Navigation - Simplified */}
        <div className="bg-white rounded-xl shadow-md mb-8 overflow-hidden">
          {/* Mobile Tab Navigation */}
          <div className="md:hidden">
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as TabType)}
              className="w-full px-4 py-4 text-lg font-medium border-none focus:ring-2 focus:ring-blue-500"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop Tab Navigation */}
          <div className="hidden md:flex border-b border-gray-200">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-8 py-4 font-medium transition-all relative ${
                    activeTab === tab.id
                      ? 'text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  <div className="text-left">
                    <div className="font-semibold">{tab.label}</div>
                    <div className="text-xs text-gray-500">{tab.description}</div>
                  </div>
                  
                  {/* Active indicator */}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300 ease-in-out">
          {activeTab === 'garage' && (
            <div className="animate-fade-in">
              <MyGarage onRegisterClick={handleOpenRegister} />
            </div>
          )}
          {activeTab === 'search' && (
            <div className="animate-fade-in">
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="max-w-md mx-auto">
                  <MagnifyingGlassIcon className="w-20 h-20 mx-auto mb-6 text-blue-600" />
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">
                    Tra cứu công khai
                  </h2>
                  <p className="text-gray-600 mb-8">
                    Tra cứu lịch sử phương tiện theo VIN hoặc biển số xe
                  </p>
                  
                  <div className="space-y-4">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nhập VIN hoặc biển số xe..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <button
                      onClick={handleSearch}
                      disabled={searchLoading}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {searchLoading ? 'Đang tra cứu...' : 'Tìm kiếm'}
                    </button>
                  </div>

                  {searchError && (
                    <p className="mt-4 text-sm text-red-600">{searchError}</p>
                  )}

                  {searchResult && (
                    <div className="mt-8 text-left bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h3 className="text-lg font-semibold mb-2">
                        Kết quả tra cứu
                      </h3>
                      <p className="text-sm text-gray-600 mb-1">
                        Loại hồ sơ:{' '}
                        <span className="font-medium">
                          {searchResult.applicationType === 'TRANSFER'
                            ? 'Chuyển nhượng'
                            : 'Đăng ký mới'}
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Biển số: <span className="font-semibold">{searchResult.licensePlate}</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        VIN: <span className="font-mono text-xs">{searchResult.vin}</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-1">
                        Trạng thái:{' '}
                        <span className="font-medium">
                          {searchResult.status === 'ACTIVE'
                            ? 'Đã duyệt'
                            : searchResult.status === 'PENDING'
                            ? 'Chờ duyệt'
                            : searchResult.status === 'TRANSFERRING'
                            ? 'Chờ duyệt chuyển nhượng'
                            : 'Bị từ chối'}
                        </span>
                      </p>
                    </div>
                  )}

                  <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Gợi ý:</strong> Nhập số VIN hoặc biển số để xem trạng thái và loại hồ sơ của phương tiện trên blockchain
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
