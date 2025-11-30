import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { ClockIcon, CheckCircleIcon, DocumentTextIcon, BuildingLibraryIcon, MagnifyingGlassIcon, EyeIcon, XMarkIcon, XCircleIcon, ArrowPathRoundedSquareIcon, DocumentMagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { getAllVehiclesForAuthority, approveVehicle, approveTransfer, rejectVehicle } from '../../services/blockchain';
import { getIPFSUrl } from '../../services/ipfs';
import type { Vehicle } from '../../types';
import { decryptData } from '../../utils/encryption';

type TabType = 'pending' | 'approved' | 'rejected' | 'all';

const AuthorityDashboard: React.FC = () => {
  const { account, user } = useWallet();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!account) {
      navigate('/');
    } else if (user && user.role !== 'AUTHORITY') {
      // Redirect non-authority users to citizen dashboard
      navigate('/dashboard');
    } else {
      loadAllVehicles();
    }
  }, [account, user, navigate]);

  const loadAllVehicles = async () => {
    setLoading(true);
    try {
      const allVehicles = await getAllVehiclesForAuthority();
      setVehicles(allVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v =>
    v.vin.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleReview = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailModal(true);
    // Fetch owner info
    try {
      const { getUserKYC } = await import('../../services/blockchain');
      const info = await getUserKYC(vehicle.owner);
      setOwnerInfo(info);
    } catch (e) {
      console.error('Error fetching owner info:', e);
      setOwnerInfo(null);
    }
  };

  const handleApprove = async () => {
    if (!selectedVehicle) return;

    try {
      if (selectedVehicle.status === 'TRANSFERRING') {
        await approveTransfer(selectedVehicle.vin);
        alert('✅ Đã duyệt chuyển nhượng thành công!');
      } else {
        await approveVehicle(selectedVehicle.vin);
        alert('✅ Đã duyệt hồ sơ đăng ký thành công!');
      }
      setShowDetailModal(false);
      setSelectedVehicle(null);
      await loadAllVehicles();
    } catch (error) {
      console.error('Error approving vehicle:', error);
      alert('❌ Lỗi khi duyệt hồ sơ: ' + (error as Error).message);
    }
  };

  const handleReject = async () => {
    if (!selectedVehicle) return;

    const reason = prompt('Nhập lý do từ chối (bắt buộc):', 'Giấy tờ không hợp lệ');
    if (!reason || !reason.trim()) {
      alert('⚠️ Vui lòng nhập lý do từ chối');
      return;
    }

    try {
      await rejectVehicle(selectedVehicle.vin, reason);
      alert('❌ Đã từ chối hồ sơ');
      setShowDetailModal(false);
      setSelectedVehicle(null);
      loadAllVehicles();
    } catch (error) {
      console.error('Error rejecting vehicle:', error);
      alert('❌ Lỗi khi từ chối hồ sơ: ' + (error as Error).message);
    }
  };

  const tabs = [
    {
      id: 'pending' as TabType,
      label: 'Chờ duyệt',
      icon: ClockIcon,
      count: vehicles.filter(v => v.status === 'PENDING' || v.status === 'TRANSFERRING').length
    },
    {
      id: 'approved' as TabType,
      label: 'Đã duyệt',
      icon: CheckCircleIcon,
      count: vehicles.filter(v => v.status === 'ACTIVE').length
    },
    {
      id: 'rejected' as TabType,
      label: 'Từ chối',
      icon: XCircleIcon,
      count: vehicles.filter(v => v.status === 'REJECTED').length
    },
    {
      id: 'all' as TabType,
      label: 'Tất cả',
      icon: DocumentTextIcon,
      count: vehicles.length
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
          
          {/* Search Vehicle Button */}
          <button
            onClick={() => navigate('/authority/search')}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-lg hover:shadow-xl transition-all font-medium"
          >
            <DocumentMagnifyingGlassIcon className="w-5 h-5 mr-2" />
            Tra cứu phương tiện
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-amber-500 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setActiveTab('pending')}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ClockIcon className="w-10 h-10 text-amber-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
                <p className="text-2xl font-bold text-amber-600">{vehicles.filter(v => v.status === 'PENDING' || v.status === 'TRANSFERRING').length}</p>
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
                <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
                <p className="text-2xl font-bold text-green-600">{vehicles.filter(v => v.status === 'ACTIVE').length}</p>
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
                <p className="text-2xl font-bold text-blue-600">{vehicles.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500 hover:shadow-lg transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="w-10 h-10 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Từ chối</p>
                <p className="text-2xl font-bold text-red-600">{vehicles.filter(v => v.status === 'REJECTED').length}</p>
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
                      className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all ${activeTab === tab.id
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <IconComponent className="w-5 h-5 mr-2" />
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
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
            {loading ? (
              <div className="text-center py-16 text-gray-500">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p>Đang tải danh sách...</p>
              </div>
            ) : (
              <>
                {activeTab === 'pending' && (
                  <div className="space-y-3">
                    {filteredVehicles
                      .filter(v => v.status === 'PENDING' || v.status === 'TRANSFERRING')
                      .map((vehicle) => (
                        <div key={vehicle.vin} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center gap-6">
                            <div className="flex-shrink-0">
                              <div className={`w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-300 ${vehicle.applicationType === 'TRANSFER' ? 'bg-purple-100' : ''
                                }`}>
                                {vehicle.photoIpfsHash ? (
                                  <img src={`https://ipfs.io/ipfs/${vehicle.photoIpfsHash}`} alt={vehicle.brand} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  vehicle.applicationType === 'TRANSFER' ? (
                                    <ArrowPathRoundedSquareIcon className="w-10 h-10 text-purple-600" />
                                  ) : (
                                    <DocumentTextIcon className="w-10 h-10 text-gray-400" />
                                  )
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {vehicle.brand}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 text-xs rounded-full font-medium ${vehicle.applicationType === 'TRANSFER'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                      }`}>
                                      {vehicle.applicationType === 'TRANSFER' ? '🔄 Chuyển nhượng' : '📝 Đăng ký mới'}
                                    </span>
                                    <span className="px-3 py-1 bg-amber-100 text-amber-700 text-xs rounded-full font-medium">
                                      {vehicle.status === 'TRANSFERRING' ? 'Chờ duyệt chuyển nhượng' : 'Chờ duyệt đăng ký'}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {vehicle.registrationDate ? new Date(vehicle.registrationDate * 1000).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">VIN:</span>
                                  <span className="ml-1 font-mono text-xs">{vehicle.vin}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">Biển số:</span>
                                  <span className="ml-1 font-semibold">{vehicle.licensePlate}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">Chủ xe:</span>
                                  <span className="ml-1 font-mono text-xs">{vehicle.owner}</span>
                                </div>
                                {vehicle.applicationType === 'TRANSFER' && vehicle.pendingBuyer && (
                                  <div className="col-span-3 flex items-center text-gray-600">
                                    <span className="font-medium">Đến ví:</span>
                                    <span className="ml-1 font-mono text-xs">{vehicle.pendingBuyer}</span>
                                  </div>
                                )}
                              </div>
                            </div>

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

                    {filteredVehicles.filter(v => v.status === 'PENDING' || v.status === 'TRANSFERRING').length === 0 && (
                      <div className="text-center py-16 text-gray-500">
                        <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Không có hồ sơ nào đang chờ duyệt</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'approved' && (
                  <div className="space-y-3">
                    {filteredVehicles
                      .filter(v => v.status === 'ACTIVE')
                      .map((vehicle) => (
                        <div key={vehicle.vin} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center gap-6">
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center border-2 border-green-300">
                                {vehicle.photoIpfsHash ? (
                                  <img src={`https://ipfs.io/ipfs/${vehicle.photoIpfsHash}`} alt={vehicle.brand} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <CheckCircleIcon className="w-10 h-10 text-green-600" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {vehicle.brand}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                      Đã duyệt
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {vehicle.registrationDate ? new Date(vehicle.registrationDate * 1000).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">VIN:</span>
                                  <span className="ml-1 font-mono text-xs">{vehicle.vin}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">Biển số:</span>
                                  <span className="ml-1 font-semibold">{vehicle.licensePlate}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">Chủ xe:</span>
                                  <span className="ml-1 font-mono text-xs">{vehicle.owner}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <button
                                onClick={() => handleReview(vehicle)}
                                className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md hover:shadow-lg font-medium"
                              >
                                <EyeIcon className="w-5 h-5 mr-2" />
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {filteredVehicles.filter(v => v.status === 'ACTIVE').length === 0 && (
                      <div className="text-center py-16 text-gray-500">
                        <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Chưa có hồ sơ nào được duyệt</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'rejected' && (
                  <div className="space-y-3">
                    {filteredVehicles
                      .filter(v => v.status === 'REJECTED')
                      .map((vehicle) => (
                        <div key={vehicle.vin} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center gap-6">
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center border-2 border-red-300">
                                {vehicle.photoIpfsHash ? (
                                  <img src={`https://ipfs.io/ipfs/${vehicle.photoIpfsHash}`} alt={vehicle.brand} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <XCircleIcon className="w-10 h-10 text-red-600" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {vehicle.brand}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <span className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                      Từ chối
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {vehicle.registrationDate ? new Date(vehicle.registrationDate * 1000).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">VIN:</span>
                                  <span className="ml-1 font-mono text-xs">{vehicle.vin}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">Biển số:</span>
                                  <span className="ml-1 font-semibold">{vehicle.licensePlate}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">Chủ xe:</span>
                                  <span className="ml-1 font-mono text-xs">{vehicle.owner}</span>
                                </div>
                                {vehicle.rejectReason && (
                                  <div className="col-span-3 flex items-start text-red-600">
                                    <span className="font-medium">Lý do từ chối:</span>
                                    <span className="ml-1 text-xs">{vehicle.rejectReason}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <button
                                onClick={() => handleReview(vehicle)}
                                className="flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-md hover:shadow-lg font-medium"
                              >
                                <EyeIcon className="w-5 h-5 mr-2" />
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                    {filteredVehicles.filter(v => v.status === 'REJECTED').length === 0 && (
                      <div className="text-center py-16 text-gray-500">
                        <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Không có hồ sơ bị từ chối</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'all' && (
                  <div className="space-y-3">
                    {filteredVehicles.map((vehicle) => {
                      const statusConfig = {
                        ACTIVE: { bg: 'bg-green-100', text: 'text-green-700', label: 'Đã duyệt', icon: CheckCircleIcon },
                        PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Chờ duyệt đăng ký', icon: ClockIcon },
                        TRANSFERRING: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Chờ duyệt chuyển nhượng', icon: ArrowPathRoundedSquareIcon },
                        REJECTED: { bg: 'bg-red-100', text: 'text-red-700', label: 'Từ chối', icon: XCircleIcon }
                      };
                      const config = statusConfig[vehicle.status] || statusConfig.PENDING;
                      const StatusIcon = config.icon;

                      return (
                        <div key={vehicle.vin} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white">
                          <div className="flex items-center gap-6">
                            <div className="flex-shrink-0">
                              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-300">
                                {vehicle.photoIpfsHash ? (
                                  <img src={`https://ipfs.io/ipfs/${vehicle.photoIpfsHash}`} alt={vehicle.brand} className="w-full h-full object-cover rounded-lg" />
                                ) : (
                                  <StatusIcon className="w-10 h-10 text-gray-400" />
                                )}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                    {vehicle.brand}
                                  </h3>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 ${config.bg} ${config.text} text-xs rounded-full font-medium`}>
                                      {config.label}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {vehicle.registrationDate ? new Date(vehicle.registrationDate * 1000).toLocaleDateString('vi-VN') : 'Chưa rõ'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">VIN:</span>
                                  <span className="ml-1 font-mono text-xs">{vehicle.vin}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">Biển số:</span>
                                  <span className="ml-1 font-semibold">{vehicle.licensePlate}</span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                  <span className="font-medium">Chủ xe:</span>
                                  <span className="ml-1 font-mono text-xs">{vehicle.owner}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex-shrink-0">
                              <button
                                onClick={() => handleReview(vehicle)}
                                className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg font-medium"
                              >
                                <EyeIcon className="w-5 h-5 mr-2" />
                                Xem chi tiết
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {filteredVehicles.length === 0 && (
                      <div className="text-center py-16 text-gray-500">
                        <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>Không có hồ sơ nào trong hệ thống</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {showDetailModal && selectedVehicle && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center text-white">
                  <EyeIcon className="w-6 h-6 mr-3" />
                  <h2 className="text-xl font-bold">
                    Kiểm tra hồ sơ - {selectedVehicle.brand}
                  </h2>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6 p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Thông tin phương tiện</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Nhãn hiệu:</span>
                        <span className="font-semibold">{selectedVehicle.brand}</span>
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
                      {ownerInfo && (
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600 font-medium">Họ tên (KYC):</span>
                          <span className="font-semibold text-blue-700">
                            {decryptData(ownerInfo.fullName)}
                          </span>
                        </div>
                      )}
                      {selectedVehicle.applicationType === 'TRANSFER' && selectedVehicle.pendingBuyer && (
                        <div className="flex justify-between py-2 border-b border-gray-200">
                          <span className="text-gray-600 font-medium">Đến ví:</span>
                          <span className="font-mono text-sm">{selectedVehicle.pendingBuyer}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 font-medium">Ngày gửi:</span>
                        <span className="font-semibold">{selectedVehicle.registrationDate ? new Date(selectedVehicle.registrationDate * 1000).toLocaleDateString('vi-VN') : 'Chưa rõ'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4 text-gray-900">Hình ảnh phương tiện</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {(() => {
                        try {
                          const photoHashes = JSON.parse(selectedVehicle.photoIpfsHash || '{}');
                          const positions = [
                            { key: 'front', label: 'Mặt trước' },
                            { key: 'back', label: 'Mặt sau' },
                            { key: 'left', label: 'Bên trái' },
                            { key: 'right', label: 'Bên phải' }
                          ];

                          return positions.map(({ key, label }) => (
                            <div key={key} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                              <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded mb-2 flex items-center justify-center overflow-hidden">
                                {photoHashes[key] ? (
                                  <img
                                    src={getIPFSUrl(photoHashes[key])}
                                    alt={label}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                )}
                              </div>
                              <p className="text-xs text-center text-gray-600">{label}</p>
                            </div>
                          ));
                        } catch {
                          return null;
                        }
                      })()}
                    </div>

                    {/* Legal Documents */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-gray-900">Hồ sơ pháp lý</h3>
                      <div className="space-y-2">
                        {(() => {
                          try {
                            const data = JSON.parse(selectedVehicle.photoIpfsHash || '{}');
                            const documents = data.documents || [];

                            if (!documents || documents.length === 0) {
                              return (
                                <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm">
                                  Không có hồ sơ pháp lý
                                </div>
                              );
                            }

                            return documents.map((doc: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate max-w-[150px]">{doc.name}</p>
                                    <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(2)} KB</p>
                                  </div>
                                </div>
                                <a
                                  href={getIPFSUrl(doc.hash)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 ml-2 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded hover:bg-blue-200 transition-colors"
                                >
                                  Xem
                                </a>
                              </div>
                            ));
                          } catch (e) {
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex items-center justify-end space-x-4">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Đóng
                </button>
                {(selectedVehicle.status === 'PENDING' || selectedVehicle.status === 'TRANSFERRING') && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
};

export default AuthorityDashboard;
