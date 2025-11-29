import React, { useEffect, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import VehicleCard from '../../components/VehicleCard';
import { CardSkeleton } from '../../components/Skeleton';
import { getMyVehicles, requestTransfer } from '../../services/blockchain';
import { getIPFSUrl } from '../../services/ipfs';
import type { Vehicle } from '../../types';
import { TruckIcon, ClockIcon, CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ethers } from 'ethers';

interface MyGarageProps {
  onRegisterClick?: (vinToEdit?: string) => void;
}

const MyGarage: React.FC<MyGarageProps> = ({ onRegisterClick }) => {
  const { account } = useWallet();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  const loadVehicles = async () => {
    if (!account) return;

    setLoading(true);
    try {
      const data = await getMyVehicles(account);
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (account) {
      loadVehicles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account]);

  const handleViewDetails = (vin: string) => {
    const vehicle = vehicles.find(v => v.vin === vin);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setShowDetailModal(true);
    }
  };

  const handleTransfer = (vin: string) => {
    const vehicle = vehicles.find(v => v.vin === vin);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setTransferAddress('');
      setShowTransferModal(true);
    }
  };

  const handleResubmit = (vin: string) => {
    if (onRegisterClick) {
      onRegisterClick(vin);
    }
  };

  // Statistics
  const totalVehicles = vehicles.length;
  const pendingVehicles = vehicles.filter(v => v.status === 'PENDING').length;
  const approvedVehicles = vehicles.filter(v => v.status === 'ACTIVE').length;
  const rejectedVehicles = vehicles.filter(v => v.status === 'REJECTED').length;

  return (
    <div className="space-y-6">
      {/* Compact Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TruckIcon className="w-10 h-10 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng số xe</p>
              <p className="text-2xl font-bold text-blue-600">{totalVehicles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-amber-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="w-10 h-10 text-amber-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
              <p className="text-2xl font-bold text-amber-600">{pendingVehicles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-green-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="w-10 h-10 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
              <p className="text-2xl font-bold text-green-600">{approvedVehicles}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-5 border-l-4 border-red-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <XCircleIcon className="w-10 h-10 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Từ chối</p>
              <p className="text-2xl font-bold text-red-600">{rejectedVehicles}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : vehicles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.vin} className="relative">
              <VehicleCard
                vehicle={vehicle}
                onViewDetails={handleViewDetails}
                onTransfer={handleTransfer}
                onResubmit={handleResubmit}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-16 text-center">
          <TruckIcon className="w-24 h-24 mx-auto mb-6 text-gray-300" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Chưa có phương tiện</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Bạn chưa đăng ký phương tiện nào. Hãy bắt đầu đăng ký phương tiện đầu tiên của bạn.
          </p>
          {onRegisterClick && (
            <button
              onClick={onRegisterClick}
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all font-medium text-lg"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Đăng ký ngay
            </button>
          )}
        </div>
      )}

      {/* Vehicle Detail Modal */}
      {showDetailModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center text-white">
                <TruckIcon className="w-6 h-6 mr-3" />
                <h2 className="text-xl font-bold">
                  Chi tiết xe - {selectedVehicle.licensePlate}
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
            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Left: Vehicle Information */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Thông tin xe</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Biển số:</span>
                        <span className="font-bold text-lg">{selectedVehicle.licensePlate}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Số khung (VIN):</span>
                        <span className="font-mono text-sm font-semibold">{selectedVehicle.vin}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Nhãn hiệu:</span>
                        <span className="font-semibold">{selectedVehicle.brand}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Trạng thái:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedVehicle.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                          selectedVehicle.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                          selectedVehicle.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {selectedVehicle.status === 'ACTIVE' ? 'Đã duyệt' :
                           selectedVehicle.status === 'PENDING' ? 'Chờ duyệt' :
                           selectedVehicle.status === 'REJECTED' ? 'Từ chối' :
                           'Chuyển nhượng'}
                        </span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600 font-medium">Ngày đăng ký:</span>
                        <span className="font-semibold">
                          {selectedVehicle.registrationDate 
                            ? new Date(selectedVehicle.registrationDate * 1000).toLocaleDateString('vi-VN')
                            : 'Chưa rõ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Reason */}
                  {selectedVehicle.status === 'REJECTED' && selectedVehicle.rejectReason && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
                      <div className="flex items-start">
                        <XCircleIcon className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">Lý do từ chối:</p>
                          <p className="text-sm text-red-700 mt-1">{selectedVehicle.rejectReason}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Images */}
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 text-gray-900">Hình ảnh phương tiện</h3>
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
                                    className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => window.open(getIPFSUrl(photoHashes[key]), '_blank')}
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
                        } catch (e) {
                          return (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                              <p>Không có hình ảnh</p>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Ownership Modal */}
      {showTransferModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Chuyển nhượng xe {selectedVehicle.licensePlate}
              </h2>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Nhập địa chỉ ví Ethereum của người nhận. Yêu cầu chuyển nhượng sẽ được gửi lên
                blockchain và cần cơ quan phê duyệt. Tất cả thao tác sẽ được ký xác nhận qua MetaMask.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Địa chỉ ví người nhận (0x...)
                </label>
                <input
                  type="text"
                  value={transferAddress}
                  onChange={(e) => setTransferAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                />
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded">
                <p className="text-xs text-yellow-800">
                  ⚠️ Sau khi gửi yêu cầu, xe sẽ ở trạng thái chờ duyệt chuyển nhượng. Cơ quan chức năng
                  phê duyệt xong thì quyền sở hữu mới được cập nhật sang chủ mới.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={() => setShowTransferModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium"
              >
                Hủy
              </button>
              <button
                onClick={async () => {
                  if (!selectedVehicle) return;
                  
                  // Validation: Kiểm tra địa chỉ có được nhập không
                  if (!transferAddress || !transferAddress.trim()) {
                    alert('⚠️ Vui lòng nhập địa chỉ ví người nhận');
                    return;
                  }

                  const trimmedAddress = transferAddress.trim();

                  // Validation: Kiểm tra địa chỉ hợp lệ
                  if (!ethers.isAddress(trimmedAddress)) {
                    alert('❌ Địa chỉ ví không hợp lệ. Vui lòng nhập địa chỉ Ethereum hợp lệ (bắt đầu bằng 0x và có 42 ký tự)');
                    return;
                  }

                  // Validation: Kiểm tra không được chuyển cho chính mình
                  if (account && trimmedAddress.toLowerCase() === account.toLowerCase()) {
                    alert('❌ Bạn không thể chuyển nhượng xe cho chính mình!');
                    return;
                  }

                  // Validation: Kiểm tra không được chuyển cho địa chỉ zero
                  if (trimmedAddress === ethers.ZeroAddress || trimmedAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
                    alert('❌ Không thể chuyển nhượng cho địa chỉ rỗng');
                    return;
                  }

                  try {
                    setIsTransferring(true);
                    const txHash = await requestTransfer(selectedVehicle.vin, trimmedAddress);
                    alert(`✅ Đã gửi yêu cầu chuyển nhượng!\nTx hash: ${txHash}`);
                    setShowTransferModal(false);
                    setTransferAddress('');
                    await loadVehicles();
                  } catch (error: any) {
                    console.error('Error requesting transfer:', error);
                    alert(`❌ Lỗi khi gửi yêu cầu chuyển nhượng: ${error.message || 'Vui lòng thử lại'}`);
                  } finally {
                    setIsTransferring(false);
                  }
                }}
                disabled={isTransferring}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isTransferring ? 'Đang gửi yêu cầu...' : 'Gửi yêu cầu chuyển nhượng'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyGarage;
