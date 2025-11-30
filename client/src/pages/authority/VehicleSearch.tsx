import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { searchVehicleByVIN, getVehicleHistory, getBuyerInfo } from '../../services/blockchain';
import type { Vehicle } from '../../types';
import { 
  MagnifyingGlassIcon,
  DocumentTextIcon,
  UserIcon,
  ClockIcon,
  ArrowRightIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Spinner from '../../components/Spinner';
import StatusBadge from '../../components/StatusBadge';

interface HistoryRecord {
  from: string;
  to: string;
  timestamp: number;
  contractIpfsHash: string;
  fromName?: string;
  toName?: string;
}

const VehicleSearch: React.FC = () => {
  const { user } = useWallet();

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [ownerInfo, setOwnerInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setError('Vui lòng nhập VIN hoặc biển số');
      return;
    }

    setSearching(true);
    setError('');
    setVehicle(null);
    setHistory([]);
    setOwnerInfo(null);

    try {
      // Tìm xe theo VIN hoặc biển số
      const result = await searchVehicleByVIN(searchQuery.trim());
      
      if (!result) {
        setError('Không tìm thấy phương tiện này trong hệ thống');
        return;
      }

      setVehicle(result);

      // Lấy thông tin chủ xe
      try {
        const info = await getBuyerInfo(result.owner);
        setOwnerInfo(info);
      } catch (e) {
        console.log('Owner chưa có KYC');
      }

      // Lấy lịch sử
      setLoadingHistory(true);
      try {
        const historyData = await getVehicleHistory(result.vin);
        
        // Lấy tên cho từng địa chỉ
        const enrichedHistory = await Promise.all(
          historyData.map(async (record: any) => {
            let fromName = 'Không rõ';
            let toName = 'Không rõ';

            try {
              const fromInfo = await getBuyerInfo(record.from);
              fromName = fromInfo.fullName;
            } catch (e) {
              // Skip
            }

            try {
              const toInfo = await getBuyerInfo(record.to);
              toName = toInfo.fullName;
            } catch (e) {
              // Skip
            }

            return { ...record, fromName, toName };
          })
        );

        setHistory(enrichedHistory);
      } catch (e) {
        console.error('Error loading history:', e);
      } finally {
        setLoadingHistory(false);
      }

    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'Lỗi khi tra cứu. Vui lòng thử lại.');
    } finally {
      setSearching(false);
    }
  };

  const getIPFSUrl = (hash: string) => {
    return `https://ipfs.io/ipfs/${hash}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'PENDING':
      case 'TRANSFERRING':
        return <ClockIcon className="w-5 h-5 text-amber-600" />;
      case 'REJECTED':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ExclamationCircleIcon className="w-5 h-5 text-gray-600" />;
    }
  };

  // Check if user is authority
  if (user?.role !== 'AUTHORITY' && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md text-center">
          <ExclamationCircleIcon className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">
            Chức năng này chỉ dành cho cơ quan chức năng
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center">
            <MagnifyingGlassIcon className="w-10 h-10 text-indigo-600 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Tra cứu phương tiện</h1>
              <p className="text-gray-600">Tìm kiếm thông tin và lịch sử chuyển nhượng theo VIN hoặc biển số</p>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Nhập VIN hoặc biển số xe (VD: 1HGCM82633A123456 hoặc 30A-12345)"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center"
            >
              {searching ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Đang tìm...</span>
                </>
              ) : (
                <>
                  <MagnifyingGlassIcon className="w-5 h-5 mr-2" />
                  Tra cứu
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center text-red-700">
              <ExclamationCircleIcon className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}
        </div>

        {/* Kết quả */}
        {vehicle && (
          <div className="space-y-6">
            {/* Thông tin xe */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Thông tin phương tiện</h2>
                <StatusBadge status={vehicle.status} />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Ảnh xe */}
                <div className="bg-gray-100 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
                  {vehicle.photoIpfsHash ? (
                    <img 
                      src={getIPFSUrl(vehicle.photoIpfsHash)}
                      alt={vehicle.brand}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <DocumentTextIcon className="w-24 h-24 text-gray-400" />
                  )}
                </div>

                {/* Chi tiết */}
                <div className="space-y-3">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Nhãn hiệu:</span>
                        <p className="font-bold text-gray-900">{vehicle.brand}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Biển số:</span>
                        <p className="font-bold text-gray-900 text-lg">{vehicle.licensePlate}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-600">Số khung (VIN):</span>
                        <p className="font-mono text-sm text-gray-900 break-all">{vehicle.vin}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Trạng thái:</span>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusIcon(vehicle.status)}
                          <span className="font-medium">
                            {vehicle.status === 'ACTIVE' && 'Đã cấp'}
                            {vehicle.status === 'PENDING' && 'Chờ duyệt đăng ký'}
                            {vehicle.status === 'TRANSFERRING' && 'Chờ duyệt chuyển nhượng'}
                            {vehicle.status === 'REJECTED' && 'Bị từ chối'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">Ngày đăng ký:</span>
                        <p className="font-medium text-gray-900">
                          {vehicle.registrationDate 
                            ? new Date(vehicle.registrationDate * 1000).toLocaleDateString('vi-VN')
                            : 'Chưa rõ'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Lý do từ chối (nếu có) */}
                  {vehicle.status === 'REJECTED' && vehicle.rejectReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-700">
                        <span className="font-semibold">Lý do từ chối:</span> {vehicle.rejectReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Thông tin chủ xe hiện tại */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <UserIcon className="w-6 h-6 mr-2 text-indigo-600" />
                Chủ sở hữu hiện tại
              </h3>
              
              <div className="bg-gray-50 rounded-lg p-4">
                {ownerInfo ? (
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Họ tên:</span>
                      <p className="font-bold text-gray-900">{ownerInfo.fullName}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">CCCD:</span>
                      <p className="font-mono text-gray-900">{ownerInfo.idNumber}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">SĐT:</span>
                      <p className="font-mono text-gray-900">{ownerInfo.phone}</p>
                    </div>
                    <div className="md:col-span-3">
                      <span className="text-gray-600">Địa chỉ ví:</span>
                      <p className="font-mono text-xs text-gray-900 break-all">{vehicle.owner}</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Chủ xe chưa đăng ký KYC</p>
                    <p className="font-mono text-xs text-gray-600 mt-2">{vehicle.owner}</p>
                  </div>
                )}
              </div>

              {/* Người mua đang chờ (nếu có) */}
              {vehicle.pendingBuyer && (
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-semibold text-amber-900 mb-2">
                    ⏳ Đang chờ duyệt chuyển nhượng đến:
                  </p>
                  <p className="font-mono text-xs text-amber-700">{vehicle.pendingBuyer}</p>
                </div>
              )}
            </div>

            {/* Lịch sử chuyển nhượng */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <ClockIcon className="w-6 h-6 mr-2 text-indigo-600" />
                Lịch sử chuyển nhượng
              </h3>

              {loadingHistory ? (
                <div className="text-center py-8">
                  <Spinner />
                  <p className="mt-3 text-gray-600">Đang tải lịch sử...</p>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <DocumentTextIcon className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                  <p>Chưa có lịch sử chuyển nhượng</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((record, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      {/* Ngày giờ */}
                      <div className="text-xs text-gray-500 mb-3">
                        📅 {new Date(record.timestamp * 1000).toLocaleString('vi-VN')}
                      </div>

                      {/* Chuyển từ → đến */}
                      <div className="grid md:grid-cols-3 gap-4 items-center mb-3">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                          <p className="text-xs text-red-700 font-medium mb-1">Người bán</p>
                          <p className="font-bold text-sm">{record.fromName}</p>
                          <p className="text-xs font-mono text-gray-500">{record.from.slice(0,6)}...{record.from.slice(-4)}</p>
                        </div>

                        <div className="flex justify-center">
                          <ArrowRightIcon className="w-8 h-8 text-indigo-600" />
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <p className="text-xs text-green-700 font-medium mb-1">Người mua</p>
                          <p className="font-bold text-sm">{record.toName}</p>
                          <p className="text-xs font-mono text-gray-500">{record.to.slice(0,6)}...{record.to.slice(-4)}</p>
                        </div>
                      </div>

                      {/* Hợp đồng */}
                      {record.contractIpfsHash && (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center justify-between">
                          <div className="flex items-center">
                            <DocumentTextIcon className="w-5 h-5 text-indigo-600 mr-2" />
                            <span className="text-sm font-medium text-indigo-900">Hợp đồng mua bán</span>
                          </div>
                          <a
                            href={getIPFSUrl(record.contractIpfsHash)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 font-medium"
                          >
                            Tải xuống
                          </a>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Tổng kết */}
                  <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mt-4">
                    <p className="text-sm font-semibold text-indigo-900">
                      📊 Tổng số lần chuyển nhượng: <span className="text-lg ml-2">{history.length}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleSearch;
