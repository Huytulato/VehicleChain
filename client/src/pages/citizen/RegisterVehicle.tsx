import React, { useState } from 'react';
import Spinner from '../../components/Spinner';

const RegisterVehicle: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    vin: '',
    engineNumber: '',
    licensePlate: '',
    brand: '',
    color: '',
  });

  const steps = [
    { number: 1, title: 'Thông tin' },
    { number: 2, title: 'Hình ảnh' },
    { number: 3, title: 'Giấy tờ' },
    { number: 4, title: 'Xác nhận' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      alert('Đã gửi hồ sơ đăng ký thành công! Chuyển sang tab "My Garage" để xem.');
      setIsSubmitting(false);
      // Reset form
      setCurrentStep(1);
      setFormData({
        vin: '',
        engineNumber: '',
        licensePlate: '',
        brand: '',
        color: '',
      });
    }, 2000);
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
              <label className="label">Số khung (VIN)</label>
              <input
                type="text"
                name="vin"
                value={formData.vin}
                onChange={handleInputChange}
                className="input"
                placeholder="Nhập số khung"
              />
            </div>

            <div>
              <label className="label">Số máy</label>
              <input
                type="text"
                name="engineNumber"
                value={formData.engineNumber}
                onChange={handleInputChange}
                className="input"
                placeholder="Nhập số máy"
              />
            </div>

            <div>
              <label className="label">Biển số</label>
              <input
                type="text"
                name="licensePlate"
                value={formData.licensePlate}
                onChange={handleInputChange}
                className="input"
                placeholder="Ví dụ: 30A-12345"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="label">Nhãn hiệu</label>
                <input
                  type="text"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Honda, Yamaha..."
                />
              </div>
              <div>
                <label className="label">Màu sơn</label>
                <input
                  type="text"
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="Đỏ, Xanh, Trắng..."
                />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Hình ảnh ngoại quan</h2>
            <p className="text-gray-600">Vui lòng chụp ảnh xe từ 4 góc độ</p>

            <div className="grid md:grid-cols-2 gap-4">
              {['Mặt trước', 'Mặt sau', 'Bên trái', 'Bên phải'].map((label) => (
                <div key={label} className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors">
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
                </div>
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

            <h2 className="text-2xl font-bold">Hồ sơ pháp lý</h2>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <div className="text-6xl mb-4">🔒</div>
              <p className="text-lg font-medium text-gray-700 mb-2">Tải lên giấy tờ pháp lý</p>
              <p className="text-sm text-gray-500 mb-4">Chứng nhận nguồn gốc, Hóa đơn mua bán, Giấy đăng ký xe...</p>
              <button className="btn btn-outline">
                Chọn tệp
              </button>
            </div>
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
