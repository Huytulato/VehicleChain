import React, { useState } from 'react';
import Spinner from '../../components/Spinner';
import { submitVehicle } from '../../services/blockchain';
import { uploadMultipleFiles } from '../../services/ipfs';

const RegisterVehicle: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Form data
  const [formData, setFormData] = useState({
    vin: '',
    engineNumber: '',
    licensePlate: '',
    brand: '',
    color: '',
  });

  // Photo upload state
  const [photos, setPhotos] = useState({
    front: null as File | null,
    back: null as File | null,
    left: null as File | null,
    right: null as File | null,
  });

  // Document upload state
  const [document, setDocument] = useState<File | null>(null);

  const steps = [
    { number: 1, title: 'Thông tin' },
    { number: 2, title: 'Hình ảnh' },
    { number: 3, title: 'Giấy tờ' },
    { number: 4, title: 'Xác nhận' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    if (!formData.vin.trim()) {
      newErrors.vin = 'Số khung là bắt buộc';
    }
    if (!formData.engineNumber.trim()) {
      newErrors.engineNumber = 'Số máy là bắt buộc';
    }
    if (!formData.licensePlate.trim()) {
      newErrors.licensePlate = 'Biển số là bắt buộc';
    }
    if (!formData.brand.trim()) {
      newErrors.brand = 'Nhãn hiệu là bắt buộc';
    }
    if (!formData.color.trim()) {
      newErrors.color = 'Màu sơn là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (!photos.front || !photos.back || !photos.left || !photos.right) {
      alert('⚠️ Vui lòng tải lên đầy đủ 4 hình ảnh (Mặt trước, Mặt sau, Bên trái, Bên phải)');
      return false;
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!document) {
      alert('⚠️ Vui lòng tải lên giấy tờ pháp lý');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    // Validate current step before proceeding
    let isValid = false;
    
    if (currentStep === 1) {
      isValid = validateStep1();
    } else if (currentStep === 2) {
      isValid = validateStep2();
    } else if (currentStep === 3) {
      isValid = validateStep3();
    }

    if (isValid && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePhotoUpload = (position: 'front' | 'back' | 'left' | 'right') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhotos({ ...photos, [position]: e.target.files[0] });
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocument(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Step 1: Upload photos to IPFS
      const photoFiles = {
        front: photos.front!,
        back: photos.back!,
        left: photos.left!,
        right: photos.right!,
      };
      
      const photoHashes = await uploadMultipleFiles(photoFiles);
      const photoIpfsHash = JSON.stringify(photoHashes); // Store all hashes as JSON string

      // Step 2: Submit to blockchain (MetaMask will pop up for confirmation)
      const txHash = await submitVehicle(
        formData.vin,
        photoIpfsHash,
        formData.licensePlate,
        formData.brand
      );

      alert(`✅ Đăng ký thành công!\nTransaction Hash: ${txHash}\n\nHồ sơ đang chờ cơ quan duyệt.`);
      
      // Reset form
      setCurrentStep(1);
      setFormData({
        vin: '',
        engineNumber: '',
        licensePlate: '',
        brand: '',
        color: '',
      });
      setPhotos({
        front: null,
        back: null,
        left: null,
        right: null,
      });
      setDocument(null);
    } catch (error: any) {
      console.error('Submission error:', error);
      alert(`❌ Lỗi đăng ký: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-colors
                    ${currentStep >= step.number
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                    }`}
                >
                  {step.number}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                    }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 transition-colors ${currentStep > step.number ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="card">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Thông tin phương tiện</h2>

            <div>
              <label className="label">
                Số khung (VIN) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                className={`input ${errors.vin ? 'border-red-500' : ''}`}
                placeholder="Nhập số khung"
              />
              {errors.vin && <p className="text-red-500 text-sm mt-1">{errors.vin}</p>}
            </div>

            <div>
              <label className="label">
                Số máy <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="engineNumber"
                value={formData.engineNumber}
                onChange={handleInputChange}
                className={`input ${errors.engineNumber ? 'border-red-500' : ''}`}
                placeholder="Nhập số máy"
              />
              {errors.engineNumber && <p className="text-red-500 text-sm mt-1">{errors.engineNumber}</p>}
            </div>

            <div>
              <label className="label">
                Biển số <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleInputChange}
                className={`input ${errors.licensePlate ? 'border-red-500' : ''}`}
                placeholder="Ví dụ: 30A-12345"
              />
              {errors.licensePlate && <p className="text-red-500 text-sm mt-1">{errors.licensePlate}</p>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Nhãn hiệu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className={`input ${errors.brand ? 'border-red-500' : ''}`}
                  placeholder="Honda, Yamaha..."
                />
                {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
              </div>
              <div>
                <label className="label">
                  Màu sơn <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className={`input ${errors.color ? 'border-red-500' : ''}`}
                  placeholder="Đỏ, Xanh, Trắng..."
                />
                {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">
              Hình ảnh ngoại quan <span className="text-red-500">*</span>
            </h2>
            <p className="text-gray-600">Vui lòng chụp ảnh xe từ 4 góc độ (bắt buộc)</p>

            <div className="grid md:grid-cols-2 gap-4">
              {[{key: 'front', label: 'Mặt trước'}, {key: 'back', label: 'Mặt sau'}, {key: 'left', label: 'Bên trái'}, {key: 'right', label: 'Bên phải'}].map(({key, label}) => (
                <label key={key} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload(key as 'front' | 'back' | 'left' | 'right')}
                    className="hidden"
                  />
                  {photos[key as keyof typeof photos] ? (
                    <div className="text-green-600">
                      <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-sm font-medium">Đã tải lên</p>
                      <p className="text-xs mt-1">{photos[key as keyof typeof photos]?.name}</p>
                    </div>
                  ) : (
                    <>
                      <svg
                        className="w-12 h-12 mx-auto text-gray-400 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <p className="text-sm font-medium text-gray-700">{label}</p>
                      <p className="text-xs text-gray-500 mt-1">Click để chọn ảnh</p>
                    </>
                  )}
                </label>
              ))}
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="flex items-start space-x-3 bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <svg className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="font-semibold text-blue-900">Lưu trữ bảo mật</h3>
                <p className="text-sm text-blue-800">Tài liệu sẽ được mã hóa và lưu trữ an toàn trên IPFS</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold">
              Hồ sơ pháp lý <span className="text-red-500">*</span>
            </h2>

            <label className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center block cursor-pointer hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleDocumentUpload}
                className="hidden"
              />
              {document ? (
                <div className="text-green-600">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-lg font-medium mb-2">Đã tải lên thành công</p>
                  <p className="text-sm">{document.name}</p>
                  <p className="text-xs text-gray-500 mt-2">Click để thay đổi</p>
                </div>
              ) : (
                <>
                  <div className="text-6xl mb-4">🔒</div>
                  <p className="text-lg font-medium text-gray-700 mb-2">Tải lên giấy tờ pháp lý</p>
                  <p className="text-sm text-gray-500 mb-4">Chứng nhận nguồn gốc, Hóa đơn mua bán, Giấy đăng ký xe...</p>
                  <span className="btn btn-outline">Chọn tệp</span>
                </>
              )}
            </label>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Xác nhận thông tin</h2>

            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600">Số khung (VIN)</p>
                <p className="font-semibold">{formData.vin || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Biển số</p>
                <p className="font-semibold">{formData.licensePlate || '-'}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nhãn hiệu</p>
                  <p className="font-semibold">{formData.brand || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Màu sơn</p>
                  <p className="font-semibold">{formData.color || '-'}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="text-sm text-yellow-800">
                ⚠️ Sau khi gửi, hồ sơ sẽ được lưu lên Blockchain và không thể chỉnh sửa.
                Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
              </p>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className="btn btn-outline"
          >
            ← Quay lại
          </button>

          {currentStep < 4 ? (
            <button onClick={handleNext} className="btn btn-primary">
              Tiếp theo →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn btn-secondary flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  <span>Đang gửi...</span>
                </>
              ) : (
                <span>🔏 Ký số & Gửi hồ sơ</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterVehicle;
