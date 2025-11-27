import React, { useEffect, useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import VehicleCard from '../../components/VehicleCard';
import { CardSkeleton } from '../../components/Skeleton';
import { getMyVehicles } from '../../services/blockchain';
import type { Vehicle } from '../../types';
import { TruckIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface MyGarageProps {
  onRegisterClick?: () => void;
}

const MyGarage: React.FC<MyGarageProps> = ({ onRegisterClick }) => {
  const { account } = useWallet();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);

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
    console.log('View details for:', vin);
    // Navigate to vehicle details page
  };

  const handleTransfer = (vin: string) => {
    console.log('Transfer:', vin);
    // Open transfer modal
  };

  const handleResubmit = (vin: string) => {
    console.log('Resubmit vehicle:', vin);
    // TODO: Navigate to edit/resubmit form with prefilled data
    if (onRegisterClick) {
      onRegisterClick();
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
    </div>
  );
};

export default MyGarage;
