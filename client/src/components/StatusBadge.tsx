import React from 'react';
import type { VehicleStatusType } from '../types';

interface StatusBadgeProps {
  status: VehicleStatusType;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getBadgeStyles = () => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'TRANSFERRING':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'PENDING':
        return '🟡 Chờ duyệt';
      case 'ACTIVE':
        return '🟢 Hợp lệ';
      case 'TRANSFERRING':
        return '🔵 Đang chuyển nhượng';
      case 'REJECTED':
        return '🔴 Đã từ chối';
      default:
        return status;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getBadgeStyles()}`}
    >
      {getLabel()}
    </span>
  );
};

export default StatusBadge;
