import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { ClockIcon, CheckCircleIcon, DocumentTextIcon, ChartBarIcon, BuildingLibraryIcon, MagnifyingGlassIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

type TabType = 'pending' | 'approved' | 'all' | 'analytics';

interface Vehicle {
  id: number;
  brand: string;
  model: string;
  vin: string;
  licensePlate: string;
  submittedDate: string;
  owner: string;
  thumbnail?: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AuthorityDashboard: React.FC = () => {
  const { account } = useWallet();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Mock data
  const mockVehicles: Vehicle[] = [
    {
      id: 1,
      brand: 'Honda',
      model: 'Wave Alpha',
      vin: '1HGBH41JXMN109186',
      licensePlate: '30A-12345',
      submittedDate: '27/11/2025',
      owner: '0xeAaF...e6F3',
      status: 'pending'
    },
    {
      id: 2,
      brand: 'Yamaha',
      model: 'Exciter 155',
      vin: '2YMEX55KZMN234567',
      licensePlate: '30B-67890',
      submittedDate: '26/11/2025',
      owner: '0x1234...5678',
      status: 'pending'
    },
    {
      id: 3,
      brand: 'SYM',
      model: 'Galaxy 50',
      vin: '3SYMG50HXMN345678',
      licensePlate: '30C-11111',
      submittedDate: '25/11/2025',
      owner: '0xabcd...efgh',
      status: 'pending'
    },
  ];

  useEffect(() => {
    if (!account) {
      navigate('/');
    }
  }, [account, navigate]);

  const filteredVehicles = mockVehicles.filter(v => 
    v.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReview = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
  };

  const handleApprove = () => {
    console.log('Approved:', selectedVehicle);
    setShowDetailModal(false);
    setSelectedVehicle(null);
    // TODO: Call blockchain function to approve
  };

  const handleReject = () => {
    console.log('Rejected:', selectedVehicle);
    setShowDetailModal(false);
    setSelectedVehicle(null);
    // TODO: Call blockchain function to reject
  };

  const tabs = [
    { 
      id: 'pending' as TabType, 
      label: 'Chờ duyệt', 
      icon: ClockIcon,
      count: 12
    },
    { 
      id: 'approved' as TabType, 
      label: 'Đã duyệt', 
      icon: CheckCircleIcon,
      count: 156
    },
    { 
      id: 'all' as TabType, 
      label: 'Tất cả', 
      icon: DocumentTextIcon,
      count: 168
    },
    { 
      id: 'analytics' as TabType, 
      label: 'Thống kê', 
      icon: ChartBarIcon
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center">
            <BuildingLibraryIcon className="w-10 h-10 text-indigo-600 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">
                Authority Dashboard
              </h1>
              <p className="text-gray-600">Quản lý và phê duyệt hồ sơ đăng ký phương tiện</p>
            </div>
          </div>
        </div>

        {/* Simplified Stats Overview - Keep as overview only */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-amber-500 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveTab('pending')}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-10 h-10 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-amber-600">12</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveTab('approved')}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="w-10 h-10 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã duyệt hôm nay</p>
                <p className="text-2xl font-bold text-green-600">8</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveTab('all')}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="w-10 h-10 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng hồ sơ</p>
                <p className="text-2xl font-bold text-blue-600">168</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Từ chối</p>
                <p className="text-2xl font-bold text-red-600">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Header with Search */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${
                        activeTab === tab.id
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 mr-2" />
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                          activeTab === tab.id 
                            ? 'bg-white text-indigo-600' 
                            : 'bg-gray-200 text-gray-700'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search Bar */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Tìm theo VIN, biển số..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent w-64"
                />
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Vehicle List Content */}
          <div className="p-6">
            {activeTab === 'pending' && (
              <div className="space-y-3">
                {filteredVehicles.map((vehicle) => (
                  <div key={vehicle.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                    <div className="flex items-center gap-6">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-300">
                          {vehicle.thumbnail ? (
                            <img src={vehicle.thumbnail} alt={vehicle.model} className="w-full h-full object-cover rounded-lg" />
                          ) : (
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Vehicle Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {vehicle.brand} {vehicle.model}
                            </h3>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                Chờ duyệt
                              </span>
                              <span className="text-xs text-gray-500">
                                Gửi: {vehicle.submittedDate}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            <span className="font-medium">VIN:</span>
                            <span className="ml-1 font-mono text-xs">{vehicle.vin}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="font-medium">Biển số:</span>
                            <span className="ml-1 font-semibold">{vehicle.licensePlate}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">Chủ xe:</span>
                            <span className="ml-1 font-mono text-xs">{vehicle.owner}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleReview(vehicle)}
                          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
                        >
                          <EyeIcon className="w-5 h-5 mr-2" />
                          Kiểm tra
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredVehicles.length === 0 && (
                  <div className="text-center py-16 text-gray-500">
                    <MagnifyingGlassIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Không tìm thấy hồ sơ nào</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'approved' && (
              <div className="text-center py-16 text-gray-500">
                <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Danh sách các hồ sơ đã được phê duyệt...</p>
              </div>
            )}

            {activeTab === 'all' && (
              <div className="text-center py-16 text-gray-500">
                <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Danh sách toàn bộ hồ sơ trong hệ thống...</p>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <ChartBarIcon className="w-5 h-5 mr-2 text-indigo-600" />
                      Xu hướng đăng ký
                    </h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <p className="text-gray-500">Biểu đồ xu hướng</p>
                    </div>
                  </div>
                  <div className="border border-gray-200 rounded-lg p-6">
                    <h3 className="font-semibold text-lg mb-4 flex items-center">
                      <ChartBarIcon className="w-5 h-5 mr-2 text-indigo-600" />
                      Phân loại phương tiện
                    </h3>
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                      <p className="text-gray-500">Biểu đồ phân loại</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showDetailModal && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center text-white">
                  <EyeIcon className="w-6 h-6 mr-3" />
                  <h2 className="text-xl font-bold">
                    Kiểm tra hồ sơ - {selectedVehicle.brand} {selectedVehicle.model}
                  </h2>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="grid md:grid-cols-2 gap-6 p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                {/* Left: Vehicle Information */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Thông tin phương tiện</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Nhãn hiệu:</span>
                        <span className="font-semibold">{selectedVehicle.brand}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Mẫu xe:</span>
                        <span className="font-semibold">{selectedVehicle.model}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Số khung (VIN):</span>
                        <span className="font-mono text-sm font-semibold">{selectedVehicle.vin}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Biển số:</span>
                        <span className="font-bold text-lg">{selectedVehicle.licensePlate}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Chủ sở hữu:</span>
                        <span className="font-mono text-sm">{selectedVehicle.owner}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 font-medium">Ngày gửi:</span>
                        <span className="font-semibold">{selectedVehicle.submittedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                    <p className="text-sm text-blue-800">
                      <strong>Lưu ý:</strong> Vui lòng kiểm tra kỹ ảnh và giấy tờ bên phải để đảm bảo thông tin khớp với số VIN và biển số.
                    </p>
                  </div>
                </div>

                {/* Right: Images & Documents */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Hình ảnh phương tiện</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {['Mặt trước', 'Mặt sau', 'Bên trái', 'Bên phải'].map((label) => (
                        <div key={label} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                          <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded mb-2 flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <p className="text-xs text-center text-gray-600">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Giấy tờ pháp lý</h3>
                    <div className="border border-gray-300 rounded-lg p-6 bg-gray-50 text-center">
                      <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm text-gray-600 mb-2">Giấy chứng nhận nguồn gốc</p>
                      <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                        Xem trên IPFS →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer - Action Buttons */}
              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Đóng
                </button>
                <button
                  onClick={handleReject}
                  className="flex items-center px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Từ chối
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-medium"
                >
                  <CheckCircleIcon className="w-5 h-5 mr-2" />
                  Phê duyệt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthorityDashboard;
