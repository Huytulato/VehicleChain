import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { getMyVehicles, getVehicleHistory, getBuyerInfo } from '../../services/blockchain';
import type { Vehicle } from '../../types';
import { 
  ClockIcon, 
  ArrowPathIcon, 
  DocumentTextIcon,
  UserIcon,
  CalendarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Spinner from '../../components/Spinner';

interface HistoryRecord {
  from: string;
  to: string;
  timestamp: number;
  contractIpfsHash: string;
  fromName?: string;
  toName?: string;
}

const VehicleHistory: React.FC = () => {
  const { vin } = useParams<{ vin?: string }>();
  const { account } = useWallet();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadMyVehicles();
  }, [account]);

  useEffect(() => {
    if (vin && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.vin === vin);
      if (vehicle) {
        handleSelectVehicle(vehicle);
      }
    }
  }, [vin, vehicles]);

  const loadMyVehicles = async () => {
    if (!account) return;
    try {
      setLoading(true);
      const data = await getMyVehicles(account);
      setVehicles(data);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setLoadingHistory(true);
    
    try {
      const historyData = await getVehicleHistory(vehicle.vin);
      
      // Lấy thông tin tên cho từng địa chỉ
      const enrichedHistory = await Promise.all(
        historyData.map(async (record: any) => {
          let fromName = 'Không rõ';
          let toName = 'Không rõ';

          try {
            const fromInfo = await getBuyerInfo(record.from);
            fromName = fromInfo.fullName;
          } catch (e) {
            // Nếu không có KYC, giữ "Không rõ"
          }

          try {
            const toInfo = await getBuyerInfo(record.to);
            toName = toInfo.fullName;
          } catch (e) {
            // Nếu không có KYC, giữ "Không rõ"
          }

          return {
            ...record,
            fromName,
            toName
          };
        })
      );

      setHistory(enrichedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getIPFSUrl = (hash: string) => {
    return `https://ipfs.io/ipfs/${hash}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
        <span className="ml-3 text-gray-600">Đang tải...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="w-10 h-10 text-purple-600 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lịch sử chuyển nhượng</h1>
                <p className="text-gray-600">Xem toàn bộ lịch sử giao dịch của phương tiện</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
            >
              Quay lại
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Danh sách xe */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-bold mb-4 text-gray-900">Chọn phương tiện</h2>
            
            {vehicles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Bạn chưa có xe nào</p>
              </div>
            ) : (
              <div className="space-y-3">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.vin}
                    onClick={() => handleSelectVehicle(vehicle)}
                    className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                      selectedVehicle?.vin === vehicle.vin
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        {vehicle.photoIpfsHash ? (
                          <img 
                            src={getIPFSUrl(vehicle.photoIpfsHash)}
                            alt={vehicle.brand}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ArrowPathIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-sm text-gray-900 truncate">{vehicle.brand}</h3>
                        <p className="text-xs text-gray-600">{vehicle.licensePlate}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lịch sử */}
          <div className="md:col-span-2 bg-white rounded-xl shadow-lg p-6">
            {!selectedVehicle ? (
              <div className="text-center py-16 text-gray-500">
                <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Chọn một phương tiện để xem lịch sử</p>
              </div>
            ) : (
              <>
                {/* Thông tin xe */}
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 mb-6 text-white">
                  <h2 className="text-xl font-bold mb-2">{selectedVehicle.brand}</h2>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="opacity-80">Biển số:</span>
                      <span className="ml-2 font-semibold">{selectedVehicle.licensePlate}</span>
                    </div>
                    <div>
                      <span className="opacity-80">VIN:</span>
                      <span className="ml-2 font-mono text-xs">{selectedVehicle.vin}</span>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                {loadingHistory ? (
                  <div className="text-center py-16">
                    <Spinner />
                    <p className="mt-3 text-gray-600">Đang tải lịch sử...</p>
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <DocumentTextIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Chưa có lịch sử chuyển nhượng</p>
                    <p className="text-sm mt-2">Xe này chưa từng được chuyển nhượng</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                      <ClockIcon className="w-5 h-5 mr-2 text-purple-600" />
                      Lịch sử giao dịch ({history.length})
                    </h3>

                    {/* Timeline */}
                    <div className="relative">
                      {/* Đường kẻ dọc */}
                      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-purple-200" />

                      {history.map((record, index) => (
                        <div key={index} className="relative pl-16 pb-8 last:pb-0">
                          {/* Dot */}
                          <div className="absolute left-4 top-0 w-4 h-4 bg-purple-600 rounded-full border-4 border-white shadow" />

                          {/* Content */}
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            {/* Ngày giờ */}
                            <div className="flex items-center text-xs text-gray-500 mb-3">
                              <CalendarIcon className="w-4 h-4 mr-1" />
                              {new Date(record.timestamp * 1000).toLocaleString('vi-VN')}
                            </div>

                            {/* Thông tin chuyển nhượng */}
                            <div className="grid md:grid-cols-3 gap-4 items-center mb-3">
                              {/* Người bán */}
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center mb-2">
                                  <UserIcon className="w-4 h-4 text-red-600 mr-2" />
                                  <span className="text-xs text-gray-600 font-medium">Người bán</span>
                                </div>
                                <p className="font-bold text-sm text-gray-900 mb-1">{record.fromName}</p>
                                <p className="text-xs font-mono text-gray-500">
                                  {record.from.slice(0, 6)}...{record.from.slice(-4)}
                                </p>
                              </div>

                              {/* Mũi tên */}
                              <div className="flex justify-center">
                                <ArrowRightIcon className="w-8 h-8 text-purple-600" />
                              </div>

                              {/* Người mua */}
                              <div className="bg-white rounded-lg p-3 border border-gray-200">
                                <div className="flex items-center mb-2">
                                  <UserIcon className="w-4 h-4 text-green-600 mr-2" />
                                  <span className="text-xs text-gray-600 font-medium">Người mua</span>
                                </div>
                                <p className="font-bold text-sm text-gray-900 mb-1">{record.toName}</p>
                                <p className="text-xs font-mono text-gray-500">
                                  {record.to.slice(0, 6)}...{record.to.slice(-4)}
                                </p>
                              </div>
                            </div>

                            {/* Hợp đồng */}
                            {record.contractIpfsHash && (
                              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <DocumentTextIcon className="w-5 h-5 text-purple-600 mr-2" />
                                    <span className="text-sm font-medium text-purple-900">Hợp đồng mua bán</span>
                                  </div>
                                  <a
                                    href={getIPFSUrl(record.contractIpfsHash)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1 bg-purple-600 text-white text-xs rounded-lg hover:bg-purple-700 font-medium"
                                  >
                                    Xem file
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Thống kê */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mt-6">
                      <h4 className="font-bold text-purple-900 mb-2">📊 Thống kê</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-purple-700">Tổng số lần chuyển nhượng:</span>
                          <span className="ml-2 font-bold text-purple-900">{history.length}</span>
                        </div>
                        <div>
                          <span className="text-purple-700">Chủ sở hữu hiện tại:</span>
                          <span className="ml-2 font-bold text-purple-900">
                            {history.length > 0 ? history[history.length - 1].toName : 'Chủ đầu tiên'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleHistory;
