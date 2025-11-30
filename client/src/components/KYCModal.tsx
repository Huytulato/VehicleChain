import React, { useState } from 'react';
import { XMarkIcon, UserCircleIcon, IdentificationIcon, PhoneIcon, HomeIcon } from '@heroicons/react/24/outline';
import { registerKYC } from '../services/blockchain';
import Spinner from './Spinner';

interface KYCModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const KYCModal: React.FC<KYCModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    cccd: '',
    phoneNumber: '',
    homeAddress: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    }
    if (!formData.cccd.trim()) {
      newErrors.cccd = 'Số CCCD/CMND là bắt buộc';
    } else if (!/^\d{9,12}$/.test(formData.cccd)) {
      newErrors.cccd = 'Số CCCD/CMND phải từ 9-12 chữ số';
    }
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Số điện thoại là bắt buộc';
    } else if (!/^0\d{9,10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Số điện thoại không hợp lệ';
    }
    if (!formData.homeAddress.trim()) {
      newErrors.homeAddress = 'Địa chỉ thường trú là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await registerKYC({
        fullName: formData.fullName,
        idNumber: formData.cccd,
        phone: formData.phoneNumber,
        residenceAddress: formData.homeAddress
      });

      alert('✅ Đăng ký định danh thành công!\nBạn có thể bắt đầu sử dụng các tính năng của hệ thống.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('KYC Registration Error:', error);
      alert(`❌ Lỗi đăng ký: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-xl relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
          <div className="flex items-center">
            <UserCircleIcon className="w-12 h-12 text-white mr-4" />
            <div>
              <h2 className="text-2xl font-bold text-white">Xác thực định danh (KYC)</h2>
              <p className="text-blue-100 mt-1">Vui lòng cung cấp thông tin để sử dụng hệ thống</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Info Alert */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="text-sm text-blue-800">
                <p className="font-medium">Lưu ý về bảo mật:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><strong>Họ tên</strong> sẽ được lưu dạng văn bản thường để hiển thị</li>
                  <li><strong>CCCD, SĐT, Địa chỉ</strong> sẽ được mã hóa RSA trước khi lưu blockchain</li>
                  <li>Chỉ cơ quan có thẩm quyền mới có thể giải mã thông tin nhạy cảm</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IdentificationIcon className="w-5 h-5 inline mr-2 text-blue-600" />
              Họ và tên <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="VD: Nguyễn Văn A"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.fullName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
            )}
          </div>

          {/* CCCD */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IdentificationIcon className="w-5 h-5 inline mr-2 text-blue-600" />
              Số CCCD/CMND <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="cccd"
              value={formData.cccd}
              onChange={handleChange}
              placeholder="VD: 001234567890"
              maxLength={12}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.cccd ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.cccd && (
              <p className="mt-1 text-sm text-red-600">{errors.cccd}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">🔒 Sẽ được mã hóa RSA trước khi lưu</p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <PhoneIcon className="w-5 h-5 inline mr-2 text-blue-600" />
              Số điện thoại <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="VD: 0987654321"
              maxLength={11}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">🔒 Sẽ được mã hóa RSA trước khi lưu</p>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <HomeIcon className="w-5 h-5 inline mr-2 text-blue-600" />
              Địa chỉ thường trú <span className="text-red-500">*</span>
            </label>
            <textarea
              name="homeAddress"
              value={formData.homeAddress}
              onChange={handleChange}
              placeholder="VD: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM"
              rows={3}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.homeAddress ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.homeAddress && (
              <p className="mt-1 text-sm text-red-600">{errors.homeAddress}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">🔒 Sẽ được mã hóa RSA trước khi lưu</p>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span className="ml-2">Đang xử lý...</span>
                </>
              ) : (
                'Xác nhận đăng ký'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default KYCModal;
