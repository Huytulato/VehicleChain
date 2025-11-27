import React from 'react';
import type { Vehicle } from '../types';
import StatusBadge from './StatusBadge';
import { VehicleStatus } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onViewDetails?: (vin: string) => void;
  onTransfer?: (vin: string) => void;
  onResubmit?: (vin: string) => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onViewDetails,
  onTransfer,
  onResubmit,
}) => {
  const canTransfer = vehicle.status === VehicleStatus.ACTIVE;
  const isRejected = vehicle.status === VehicleStatus.REJECTED;

  return (
    <div className="card hover:shadow-lg transition-shadow duration-200 animate-fade-in">
      {/* Status badge in top-right corner */}
      <div className="absolute top-4 right-4">
        <StatusBadge status={vehicle.status} />
      </div>

      {/* Vehicle Image Placeholder */}
      <div className="w-full h-40 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-4 flex items-center justify-center">
        <svg
          className="w-16 h-16 text-blue-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      {/* Vehicle Info */}
      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">{vehicle.licensePlate}</h3>
        <p className="text-sm text-gray-600">
          Số khung: <span className="font-mono">{vehicle.vin}</span>
        </p>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{vehicle.brand}</span>
          <span>•</span>
          <span>{vehicle.color}</span>
        </div>
        
        {/* Rejection Reason Alert */}
        {isRejected && (
          <div className="mt-4 bg-red-50 border-l-4 border-red-500 p-3 rounded">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">Lý do từ chối:</p>
                <p className="text-sm text-red-700 mt-1">
                  {/* TODO: Add rejection reason from contract */}
                  Giấy tờ không hợp lệ hoặc thông tin không chính xác
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-6">
        {isRejected ? (
          <>
            <button
              onClick={() => onViewDetails?.(vehicle.vin)}
              className="btn btn-outline flex-1"
            >
              Xem chi tiết
            </button>
            <button
              onClick={() => onResubmit?.(vehicle.vin)}
              className="btn bg-orange-600 hover:bg-orange-700 text-white flex-1"
            >
              Đăng ký lại
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onViewDetails?.(vehicle.vin)}
              className="btn btn-outline flex-1"
            >
              Xem chi tiết
            </button>
            <button
              onClick={() => onTransfer?.(vehicle.vin)}
              className="btn btn-primary flex-1"
              disabled={!canTransfer}
            >
              Chuyển nhượng
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VehicleCard;
