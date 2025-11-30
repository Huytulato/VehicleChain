import React, { useState, useEffect } from 'react';
import Spinner from '../../components/Spinner';
import { submitVehicle, registerKYC, checkKYCStatus, updateKYC } from '../../services/blockchain';
import { uploadMultipleFiles, uploadFileToIPFS } from '../../services/ipfs';
import { XMarkIcon, PhotoIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useWallet } from '../../context/WalletContext';

interface RegisterVehicleProps {
  editVin?: string;
}

const LOCAL_STORAGE_KEY_PREFIX = 'vehicleForm_';

const RegisterVehicle: React.FC<RegisterVehicleProps> = ({ editVin }) => {
  const { account, user } = useWallet();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isKYCRegistered, setIsKYCRegistered] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    vin: '',
    engineNumber: '',
    licensePlate: '',
    brand: '',
    color: '',
    // KYC Data
    fullName: '',
    cccd: '',
    phoneNumber: '',
    homeAddress: '',
  });

  // Photo upload state with preview URLs
  const [photos, setPhotos] = useState({
    front: null as File | null,
    back: null as File | null,
    left: null as File | null,
    right: null as File | null,
  });

  const [photoPreview, setPhotoPreview] = useState({
    front: '' as string,
    back: '' as string,
    left: '' as string,
    right: '' as string,
  });

  // Document upload state - now supports multiple files
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentPreviews, setDocumentPreviews] = useState<string[]>([]);

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
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  // Check KYC status on mount
  useEffect(() => {
    const checkKYC = async () => {
      if (account) {
        const status = await checkKYCStatus(account);
        setIsKYCRegistered(status);
        
        // Pre-fill KYC data if already registered
        if (user?.isKYCVerified) {
          setFormData(prev => ({
            ...prev,
            fullName: user.fullName || '',
            cccd: user.idNumber || '',
            phoneNumber: user.phone || '',
            homeAddress: user.residenceAddress || ''
          }));
        }
      }
    };
    checkKYC();
  }, [account, user]);

  // Load stored form data when editing a rejected application
  useEffect(() => {
    if (editVin) {
      try {
        const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${editVin}`);
        if (raw) {
          const saved = JSON.parse(raw);
          setFormData(prev => ({
            ...prev,
            ...saved,
          }));
        }
      } catch (e) {
        console.error('Error loading saved vehicle form:', e);
      }
    }
  }, [editVin]);

  // Persist basic form fields so that when bị từ chối, người dùng có thể sửa lại
  useEffect(() => {
    if (formData.vin.trim()) {
      try {
        const payload = {
          vin: formData.vin,
          engineNumber: formData.engineNumber,
          licensePlate: formData.licensePlate,
          brand: formData.brand,
          color: formData.color,
        };
        localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${formData.vin}`, JSON.stringify(payload));
      } catch (e) {
        console.error('Error saving vehicle form to localStorage:', e);
      }
    }
  }, [formData]);

  const validateStep1 = (): boolean => {
    const newErrors: { [key: string]: string } = {};

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

    // Validate KYC if not registered (simplified for now, assuming always validate)
    if (!formData.fullName.trim()) newErrors.fullName = 'Họ tên là bắt buộc';
    if (!formData.cccd.trim()) newErrors.cccd = 'CCCD là bắt buộc';
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'SĐT là bắt buộc';
    if (!formData.homeAddress.trim()) newErrors.homeAddress = 'Địa chỉ là bắt buộc';

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
    if (documents.length === 0) {
      alert('⚠️ Vui lòng tải lên ít nhất 1 tài liệu pháp lý');
      return false;
    }
    return true;
  };

  const handleNext = () => {
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

  // Handle photo upload with preview
  const handlePhotoUpload = (position: 'front' | 'back' | 'left' | 'right') => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotos({ ...photos, [position]: file });

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview({ ...photoPreview, [position]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove photo
  const removePhoto = (position: 'front' | 'back' | 'left' | 'right') => {
    setPhotos({ ...photos, [position]: null });
    setPhotoPreview({ ...photoPreview, [position]: '' });
  };

  // Handle multiple documents upload with previews
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const allFiles = [...documents, ...newFiles];
      setDocuments(allFiles);

      // Create previews for new files
      newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setDocumentPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Remove document
  const removeDocument = (index: number) => {
    const newDocuments = documents.filter((_, i) => i !== index);
    const newPreviews = documentPreviews.filter((_, i) => i !== index);
    setDocuments(newDocuments);
    setDocumentPreviews(newPreviews);
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

      // Step 1.5: Register or Update KYC if needed
      if (!isKYCRegistered) {
        console.log('Đăng ký KYC lần đầu...');
        await registerKYC({
          fullName: formData.fullName,  // KHÔNG mã hóa fullName
          idNumber: formData.cccd,
          phone: formData.phoneNumber,
          residenceAddress: formData.homeAddress
        });
      } else if (user?.isKYCVerified) {
        // Nếu đã đăng ký và có thay đổi thông tin, update
        const hasChanged = 
          user.fullName !== formData.fullName ||
          user.idNumber !== formData.cccd ||
          user.phone !== formData.phoneNumber ||
          user.residenceAddress !== formData.homeAddress;
        
        if (hasChanged) {
          console.log('Cập nhật KYC...');
          await updateKYC({
            fullName: formData.fullName,  // KHÔNG mã hóa fullName
            idNumber: formData.cccd,
            phone: formData.phoneNumber,
            residenceAddress: formData.homeAddress
          });
        }
      }

      // Step 2: Upload documents to IPFS
      const documentData = [];
      if (documents.length > 0) {
        for (const doc of documents) {
          const hash = await uploadFileToIPFS(doc);
          documentData.push({
            name: doc.name,
            hash: hash,
            type: doc.type,
            size: doc.size
          });
        }
      }

      // Combine photos and documents into one JSON object
      const combinedData = {
        ...photoHashes,
        documents: documentData
      };

      const photoIpfsHash = JSON.stringify(combinedData);

      // Step 3: Submit to blockchain
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
        fullName: '',
        cccd: '',
        phoneNumber: '',
        homeAddress: '',
      });
      setPhotos({
        front: null,
        back: null,
        left: null,
        right: null,
      });
      setPhotoPreview({
        front: '',
        back: '',
        left: '',
        right: '',
      });
      setDocuments([]);
      setDocumentPreviews([]);
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

            {/* KYC Section */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-lg font-bold mb-4">Thông tin chủ xe (KYC)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`input ${errors.fullName ? 'border-red-500' : ''}`}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                </div>
                <div>
                  <label className="label">
                    Số CCCD <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="cccd"
                    value={formData.cccd}
                    onChange={handleInputChange}
                    className={`input ${errors.cccd ? 'border-red-500' : ''}`}
                    placeholder="0010..."
                  />
                  {errors.cccd && <p className="text-red-500 text-sm mt-1">{errors.cccd}</p>}
                </div>
                <div>
                  <label className="label">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className={`input ${errors.phoneNumber ? 'border-red-500' : ''}`}
                    placeholder="09..."
                  />
                  {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                </div>
                <div>
                  <label className="label">
                    Địa chỉ thường trú <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="homeAddress"
                    value={formData.homeAddress}
                    onChange={handleInputChange}
                    className={`input ${errors.homeAddress ? 'border-red-500' : ''}`}
                    placeholder="Số 1, Đại Cồ Việt..."
                  />
                  {errors.homeAddress && <p className="text-red-500 text-sm mt-1">{errors.homeAddress}</p>}
                </div>
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
              {[
                { key: 'front', label: 'Mặt trước' },
                { key: 'back', label: 'Mặt sau' },
                { key: 'left', label: 'Bên trái' },
                { key: 'right', label: 'Bên phải' }
              ].map(({ key, label }) => (
                <div key={key} className="relative">
                  {photoPreview[key as keyof typeof photoPreview] ? (
                    <div className="relative border-2 border-green-500 rounded-lg overflow-hidden group">
                      <img
                        src={photoPreview[key as keyof typeof photoPreview]}
                        alt={label}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                        <button
                          onClick={() => removePhoto(key as 'front' | 'back' | 'left' | 'right')}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="absolute top-2 left-2 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {label}
                      </div>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all block h-48 flex flex-col items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload(key as 'front' | 'back' | 'left' | 'right')}
                        className="hidden"
                      />
                      <PhotoIcon className="w-12 h-12 text-gray-400 mb-2" />
                      <p className="text-sm font-medium text-gray-700">{label}</p>
                      <p className="text-xs text-gray-500 mt-1">Click để chọn ảnh</p>
                    </label>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
              <p className="text-sm text-blue-800">
                <strong>💡 Mẹo:</strong> Chụp ảnh ở nơi sáng, đảm bảo toàn bộ xe nằm trong khung hình và biển số rõ ràng.
              </p>
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
            <p className="text-gray-600">Có thể tải lên nhiều tài liệu (Ảnh hoặc PDF)</p>

            {/* Upload Button */}
            <label className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center block cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                multiple
                onChange={handleDocumentUpload}
                className="hidden"
              />
              <DocumentIcon className="w-16 h-16 text-gray-400 mx-auto mb-3" />
              <p className="text-lg font-medium text-gray-700 mb-2">Tải lên giấy tờ pháp lý</p>
              <p className="text-sm text-gray-500 mb-4">Chứng nhận nguồn gốc, Hóa đơn mua bán, Giấy đăng ký xe...</p>
              <span className="btn btn-outline">Chọn tệp (có thể chọn nhiều)</span>
            </label>

            {/* Document Previews */}
            {documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-gray-900">
                  Đã tải lên ({documents.length} tài liệu)
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {documents.map((doc, index) => (
                    <div key={index} className="relative border-2 border-green-500 rounded-lg p-4 bg-green-50 group">
                      <div className="flex items-start space-x-3">
                        {/* Preview or Icon */}
                        <div className="flex-shrink-0">
                          {doc.type.startsWith('image/') ? (
                            <img
                              src={documentPreviews[index]}
                              alt={doc.name}
                              className="w-16 h-16 object-cover rounded border border-gray-300"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center">
                              <DocumentIcon className="w-8 h-8 text-red-600" />
                            </div>
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.size / 1024).toFixed(2)} KB
                          </p>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeDocument(index)}
                          className="flex-shrink-0 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Xác nhận thông tin</h2>

            {/* Vehicle Info */}
            <div className="bg-gray-50 rounded-lg p-6 space-y-4">
              <h3 className="font-semibold text-lg mb-3">Thông tin phương tiện</h3>
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

            {/* Photo Preview Grid */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Hình ảnh đã tải ({Object.values(photoPreview).filter(p => p).length}/4)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(photoPreview).map(([key, url]) => url && (
                  <div key={key} className="relative">
                    <img
                      src={url}
                      alt={key}
                      className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                      {key === 'front' ? 'Trước' : key === 'back' ? 'Sau' : key === 'left' ? 'Trái' : 'Phải'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Documents Preview */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Hồ sơ pháp lý ({documents.length} tài liệu)</h3>
              <div className="space-y-2">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-center space-x-3 bg-gray-50 p-3 rounded border">
                    <DocumentIcon className="w-5 h-5 text-gray-500" />
                    <span className="text-sm text-gray-700 flex-1 truncate">{doc.name}</span>
                    <span className="text-xs text-gray-500">{(doc.size / 1024).toFixed(2)} KB</span>
                  </div>
                ))}
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
