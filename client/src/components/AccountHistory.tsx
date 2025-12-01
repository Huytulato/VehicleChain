import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import { getAccountActivities } from '../services/blockchain';
import { 
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  UserCircleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import Spinner from '../components/Spinner';

interface Activity {
  activityType: string;
  vin: string;
  details: string;
  timestamp: number;
  relatedAddress: string;
}

const AccountHistory: React.FC = () => {
  const { account } = useWallet();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'kyc' | 'registration' | 'transfer'>('all');

  useEffect(() => {
    if (!account) {
      navigate('/');
      return;
    }
    loadActivities();
  }, [account]);

  const loadActivities = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const data = await getAccountActivities(account);
      // Sắp xếp mới nhất lên đầu
      const sorted = data.sort((a, b) => b.timestamp - a.timestamp);
      setActivities(sorted);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    if (type.includes('KYC')) return UserCircleIcon;
    if (type.includes('APPROVED')) return CheckCircleIcon;
    if (type.includes('REJECTED')) return XCircleIcon;
    if (type.includes('TRANSFER')) return ArrowPathIcon;
    return DocumentTextIcon;
  };

  const getActivityColor = (type: string) => {
    if (type.includes('KYC')) return 'bg-purple-100 border-purple-300 text-purple-800';
    if (type.includes('APPROVED')) return 'bg-green-100 border-green-300 text-green-800';
    if (type.includes('REJECTED')) return 'bg-red-100 border-red-300 text-red-800';
    if (type.includes('REQUEST')) return 'bg-amber-100 border-amber-300 text-amber-800';
    return 'bg-blue-100 border-blue-300 text-blue-800';
  };

  const getActivityLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      'KYC_REGISTERED': 'Đăng ký định danh',
      'KYC_UPDATED': 'Cập nhật định danh',
      'REGISTRATION_REQUEST': 'Yêu cầu đăng ký xe',
      'REGISTRATION_APPROVED': 'Đăng ký xe được duyệt',
      'REGISTRATION_REJECTED': 'Đăng ký xe bị từ chối',
      'TRANSFER_REQUEST_SELLER': 'Yêu cầu chuyển nhượng (Người bán)',
      'TRANSFER_REQUEST_BUYER': 'Nhận yêu cầu chuyển nhượng (Người mua)',
      'TRANSFER_APPROVED_SELLER': 'Chuyển nhượng thành công (Người bán)',
      'TRANSFER_APPROVED_BUYER': 'Nhận xe thành công (Người mua)',
      'TRANSFER_REJECTED_SELLER': 'Chuyển nhượng bị từ chối (Người bán)',
      'TRANSFER_REJECTED_BUYER': 'Yêu cầu mua bị từ chối (Người mua)',
    };
    return labels[type] || type;
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'kyc') return activity.activityType.includes('KYC');
    if (filter === 'registration') return activity.activityType.includes('REGISTRATION');
    if (filter === 'transfer') return activity.activityType.includes('TRANSFER');
    return true;
  });

  const stats = {
    total: activities.length,
    kyc: activities.filter(a => a.activityType.includes('KYC')).length,
    registration: activities.filter(a => a.activityType.includes('REGISTRATION')).length,
    transfer: activities.filter(a => a.activityType.includes('TRANSFER')).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="mt-3 text-gray-600">Đang tải lịch sử...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <ClockIcon className="w-10 h-10 text-indigo-600 mr-4" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Lịch sử hoạt động</h1>
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

        {/* Statistics */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`bg-white rounded-lg shadow-md p-5 border-l-4 transition-all ${
              filter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tổng hoạt động</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <DocumentTextIcon className="w-10 h-10 text-blue-600" />
            </div>
          </button>

          <button
            onClick={() => setFilter('kyc')}
            className={`bg-white rounded-lg shadow-md p-5 border-l-4 transition-all ${
              filter === 'kyc' ? 'border-purple-500 ring-2 ring-purple-200' : 'border-purple-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Định danh</p>
                <p className="text-2xl font-bold text-purple-600">{stats.kyc}</p>
              </div>
              <UserCircleIcon className="w-10 h-10 text-purple-600" />
            </div>
          </button>

          <button
            onClick={() => setFilter('registration')}
            className={`bg-white rounded-lg shadow-md p-5 border-l-4 transition-all ${
              filter === 'registration' ? 'border-green-500 ring-2 ring-green-200' : 'border-green-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Đăng ký xe</p>
                <p className="text-2xl font-bold text-green-600">{stats.registration}</p>
              </div>
              <DocumentTextIcon className="w-10 h-10 text-green-600" />
            </div>
          </button>

          <button
            onClick={() => setFilter('transfer')}
            className={`bg-white rounded-lg shadow-md p-5 border-l-4 transition-all ${
              filter === 'transfer' ? 'border-amber-500 ring-2 ring-amber-200' : 'border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Chuyển nhượng</p>
                <p className="text-2xl font-bold text-amber-600">{stats.transfer}</p>
              </div>
              <ArrowPathIcon className="w-10 h-10 text-amber-600" />
            </div>
          </button>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold mb-6 text-gray-900">
            {filter === 'all' ? 'Tất cả hoạt động' : 
             filter === 'kyc' ? 'Hoạt động định danh' :
             filter === 'registration' ? 'Hoạt động đăng ký xe' :
             'Hoạt động chuyển nhượng'} ({filteredActivities.length})
          </h2>

          {filteredActivities.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Chưa có hoạt động nào</p>
            </div>
          ) : (
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200" />

              {/* Activities */}
              <div className="space-y-6">
                {filteredActivities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.activityType);
                  const colorClass = getActivityColor(activity.activityType);

                  return (
                    <div key={index} className="relative pl-16">
                      {/* Dot */}
                      <div className={`absolute left-4 top-2 w-4 h-4 rounded-full border-4 border-white shadow ${
                        activity.activityType.includes('APPROVED') ? 'bg-green-600' :
                        activity.activityType.includes('REJECTED') ? 'bg-red-600' :
                        activity.activityType.includes('KYC') ? 'bg-purple-600' :
                        activity.activityType.includes('REQUEST') ? 'bg-amber-600' :
                        'bg-blue-600'
                      }`} />

                      {/* Content */}
                      <div className={`border-2 rounded-lg p-4 ${colorClass}`}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            <Icon className="w-5 h-5 mr-2" />
                            <h3 className="font-bold text-sm">
                              {getActivityLabel(activity.activityType)}
                            </h3>
                          </div>
                          <div className="flex items-center text-xs">
                            <CalendarIcon className="w-4 h-4 mr-1" />
                            {new Date(activity.timestamp * 1000).toLocaleString('vi-VN')}
                          </div>
                        </div>

                        {activity.vin && (
                          <div className="mb-2">
                            <span className="text-xs font-medium">VIN:</span>
                            <span className="ml-2 text-xs font-mono">{activity.vin}</span>
                          </div>
                        )}

                        {activity.details && (
                          <div className="mb-2">
                            <span className="text-xs font-medium">Chi tiết:</span>
                            <span className="ml-2 text-xs">{activity.details}</span>
                          </div>
                        )}

                        {activity.relatedAddress && activity.relatedAddress !== '0x0000000000000000000000000000000000000000' && (
                          <div>
                            <span className="text-xs font-medium">
                              {activity.activityType.includes('SELLER') ? 'Người mua:' : 
                               activity.activityType.includes('BUYER') ? 'Người bán:' : 
                               'Liên quan:'}
                            </span>
                            <span className="ml-2 text-xs font-mono">
                              {activity.relatedAddress.slice(0, 6)}...{activity.relatedAddress.slice(-4)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccountHistory;
