import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { getMyVehicles, requestTransferWithContract, getBuyerInfo } from '../../services/blockchain';
import { uploadFileToIPFS } from '../../services/ipfs';
import type { Vehicle } from '../../types';
import { ArrowPathIcon, DocumentArrowUpIcon, UserCircleIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Spinner from '../../components/Spinner';

const TransferVehicle: React.FC = () => {
  const { account } = useWallet();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Danh sách xe của người dùng
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // Thông tin người mua
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerInfo, setBuyerInfo] = useState<any>(null);
  const [checkingBuyer, setCheckingBuyer] = useState(false);
  const [buyerError, setBuyerError] = useState('');

  // Hợp đồng mua bán
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [uploadingContract, setUploadingContract] = useState(false);

  useEffect(() => {
    loadMyVehicles();
  }, [account]);

  const loadMyVehicles = async () => {
    if (!account) return;
    try {
      setLoading(true);
      const data = await getMyVehicles(account);
      // Chỉ lấy xe đã được duyệt (ACTIVE)
      const activeVehicles = data.filter(v => v.status === 'ACTIVE');
      setVehicles(activeVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setStep(2);
  };

  const handleCheckBuyer = async () => {
    if (!buyerAddress || buyerAddress.length !== 42) {
      setBuyerError('Địa chỉ ví không hợp lệ');
      return;
    }

    if (buyerAddress.toLowerCase() === account?.toLowerCase()) {
      setBuyerError('Không thể chuyển nhượng cho chính mình');
      return;
    }

    setCheckingBuyer(true);
    setBuyerError('');
    setBuyerInfo(null);

    try {
      const info = await getBuyerInfo(buyerAddress);
      setBuyerInfo(info);
      setStep(3);
    } catch (error: any) {
      setBuyerError(error.message || 'Người mua chưa đăng ký KYC trong hệ thống');
    } finally {
      setCheckingBuyer(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Chỉ chấp nhận PDF
      if (file.type !== 'application/pdf') {
        alert('Chỉ chấp nhận file PDF');
        return;
      }
      // Giới hạn 10MB
      if (file.size > 10 * 1024 * 1024) {
        alert('File không được vượt quá 10MB');
        return;
      }
      setContractFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedVehicle || !buyerAddress || !contractFile) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!window.confirm(
      `Xác nhận chuyển nhượng xe ${selectedVehicle.brand} (${selectedVehicle.licensePlate}) cho ${buyerInfo.fullName}?`
    )) {
      return;
    }

    setSubmitting(true);
    try {
      const txHash = await requestTransferWithContract(
        selectedVehicle.vin,
        buyerAddress,
        contractFile
      );

      alert(`✅ Yêu cầu chuyển nhượng đã được gửi!\nMã giao dịch: ${txHash}\n\nVui lòng chờ cơ quan chức năng duyệt.`);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error submitting transfer:', error);
      alert(`❌ Lỗi: ${error.message || 'Vui lòng thử lại'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
        <span className="ml-3 text-gray-600">Đang tải danh sách xe...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center">
            <ArrowPathIcon className="w-10 h-10 text-indigo-600 mr-4" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chuyển nhượng phương tiện</h1>
              <p className="text-gray-600">Thực hiện thủ tục sang tên xe đến người mua mới</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Chọn xe' },
              { num: 2, label: 'Thông tin người mua' },
              { num: 3, label: 'Hợp đồng mua bán' },
              { num: 4, label: 'Xác nhận' }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    step >= s.num 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? <CheckCircleIcon className="w-6 h-6" /> : s.num}
                  </div>
                  <span className={`mt-2 text-sm font-medium ${
                    step >= s.num ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    step > s.num ? 'bg-indigo-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step 1: Chọn xe */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Chọn phương tiện cần chuyển nhượng</h2>
            
            {vehicles.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                <ArrowPathIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Bạn chưa có xe nào đã được duyệt để chuyển nhượng</p>
                <button
                  onClick={() => navigate('/register-vehicle')}
                  className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Đăng ký xe mới
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {vehicles.map((vehicle) => (
                  <div
                    key={vehicle.vin}
                    onClick={() => handleSelectVehicle(vehicle)}
                    className="border-2 border-gray-200 rounded-lg p-4 hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
                        {vehicle.photoIpfsHash ? (
                          <img 
                            src={`https://ipfs.io/ipfs/${vehicle.photoIpfsHash}`}
                            alt={vehicle.brand}
                            className="w-full h-full object-cover rounded-lg"
                          />
                        ) : (
                          <ArrowPathIcon className="w-10 h-10 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-900">{vehicle.brand}</h3>
                        <p className="text-sm text-gray-600">Biển số: <span className="font-semibold">{vehicle.licensePlate}</span></p>
                        <p className="text-xs text-gray-500 font-mono">VIN: {vehicle.vin}</p>
                      </div>
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Thông tin người mua */}
        {step === 2 && selectedVehicle && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Thông tin người mua</h2>
            
            {/* Xe đang chuyển */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Xe đang chuyển nhượng:</p>
              <p className="font-bold text-lg">{selectedVehicle.brand} - {selectedVehicle.licensePlate}</p>
            </div>

            {/* Input địa chỉ ví */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ ví người mua <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={buyerAddress}
                onChange={(e) => {
                  setBuyerAddress(e.target.value);
                  setBuyerError('');
                  setBuyerInfo(null);
                }}
                placeholder="0x..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
              />
              {buyerError && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <XCircleIcon className="w-4 h-4 mr-1" />
                  {buyerError}
                </p>
              )}
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Quay lại
              </button>
              <button
                onClick={handleCheckBuyer}
                disabled={!buyerAddress || checkingBuyer}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {checkingBuyer ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-2">Đang kiểm tra...</span>
                  </>
                ) : (
                  <>
                    <UserCircleIcon className="w-5 h-5 mr-2" />
                    Kiểm tra người mua
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Upload hợp đồng */}
        {step === 3 && buyerInfo && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Hợp đồng mua bán</h2>

            {/* Thông tin người mua */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600 mr-2" />
                <h3 className="font-bold text-gray-900">Thông tin người mua</h3>
              </div>
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-600">Họ tên:</span>
                  <span className="ml-2 font-semibold">{buyerInfo.fullName}</span>
                </div>
                <div>
                  <span className="text-gray-600">CCCD:</span>
                  <span className="ml-2 font-semibold">{buyerInfo.idNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">SĐT:</span>
                  <span className="ml-2 font-semibold">{buyerInfo.phone}</span>
                </div>
                <div>
                  <span className="text-gray-600">Địa chỉ ví:</span>
                  <span className="ml-2 font-mono text-xs">{buyerAddress.slice(0,6)}...{buyerAddress.slice(-4)}</span>
                </div>
              </div>
            </div>

            {/* Upload hợp đồng */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hợp đồng mua bán (PDF) <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition-colors">
                <DocumentArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                {contractFile ? (
                  <div>
                    <p className="text-green-600 font-semibold mb-2">✓ {contractFile.name}</p>
                    <p className="text-sm text-gray-500 mb-3">
                      {(contractFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      onClick={() => setContractFile(null)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Xóa file
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-600 mb-2">Kéo thả file hoặc nhấn để chọn</p>
                    <p className="text-xs text-gray-500 mb-3">Chỉ chấp nhận file PDF, tối đa 10MB</p>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="contract-upload"
                    />
                    <label
                      htmlFor="contract-upload"
                      className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                    >
                      Chọn file PDF
                    </label>
                  </div>
                )}
              </div>
              <p className="mt-2 text-xs text-gray-500">
                ℹ️ Hợp đồng mua bán phải có đầy đủ thông tin 2 bên và chữ ký
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setStep(2);
                  setBuyerInfo(null);
                }}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Quay lại
              </button>
              <button
                onClick={() => setStep(4)}
                disabled={!contractFile}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Tiếp tục
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Xác nhận */}
        {step === 4 && selectedVehicle && buyerInfo && contractFile && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Xác nhận thông tin</h2>

            {/* Tổng quan */}
            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">Phương tiện</h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Nhãn hiệu:</span>
                    <span className="ml-2 font-semibold">{selectedVehicle.brand}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Biển số:</span>
                    <span className="ml-2 font-semibold">{selectedVehicle.licensePlate}</span>
                  </div>
                  <div className="md:col-span-2">
                    <span className="text-gray-600">VIN:</span>
                    <span className="ml-2 font-mono text-xs">{selectedVehicle.vin}</span>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">Người mua</h3>
                <div className="grid md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-600">Họ tên:</span>
                    <span className="ml-2 font-semibold">{buyerInfo.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">CCCD:</span>
                    <span className="ml-2 font-semibold">{buyerInfo.idNumber}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">SĐT:</span>
                    <span className="ml-2 font-semibold">{buyerInfo.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Địa chỉ ví:</span>
                    <span className="ml-2 font-mono text-xs">{buyerAddress}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 mb-3">Hợp đồng mua bán</h3>
                <div className="flex items-center">
                  <DocumentArrowUpIcon className="w-8 h-8 text-purple-600 mr-3" />
                  <div>
                    <p className="font-semibold">{contractFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(contractFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Lưu ý */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <h3 className="font-bold text-amber-900 mb-2">⚠️ Lưu ý quan trọng</h3>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• Sau khi gửi yêu cầu, bạn cần chờ cơ quan chức năng duyệt</li>
                <li>• Xe sẽ chuyển sang trạng thái "Chờ duyệt chuyển nhượng"</li>
                <li>• Không thể hủy yêu cầu sau khi đã gửi</li>
                <li>• Hợp đồng mua bán sẽ được lưu trên IPFS (không thể xóa)</li>
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setStep(3)}
                disabled={submitting}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50"
              >
                Quay lại
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" />
                    <span className="ml-2">Đang gửi yêu cầu...</span>
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-5 h-5 mr-2" />
                    Xác nhận chuyển nhượng
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransferVehicle;
