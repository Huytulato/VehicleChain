// Blockchain Service - Smart Contract Interactions
import { ethers } from 'ethers';
import contractABI from '../utils/contractABI.json';
import type { Vehicle, VehicleHistory, TransferRequest, VehicleStatusType, VehicleActivity } from '../types';
import { decryptData } from '../utils/encryption';
import type { User, UserRoleType } from '../types';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

/**
 * Map contract status enum to string
 * Contract enum: 0=KHONG_TON_TAI, 1=CHO_DUYET_CAP_MOI, 2=DA_CAP, 3=CHO_DUYET_SANG_TEN, 4=BI_TU_CHOI
 */
const mapContractStatus = (status: number): VehicleStatusType => {
  const statusMap: { [key: number]: VehicleStatusType } = {
    0: 'PENDING',      // KHONG_TON_TAI (shouldn't happen in returned data)
    1: 'PENDING',      // CHO_DUYET_CAP_MOI
    2: 'ACTIVE',       // DA_CAP
    3: 'TRANSFERRING', // CHO_DUYET_SANG_TEN
    4: 'REJECTED',     // BI_TU_CHOI
  };
  return statusMap[status] || 'PENDING';
};

/**
 * Map raw vehicle struct from contract to frontend Vehicle type
 */
const mapContractVehicle = (v: any): Vehicle => {
  const status = mapContractStatus(Number(v.status));
  // Kiểm tra địa chỉ ví 0x0...0 để xác định có người mua chờ hay không
  const hasPendingBuyer = v.pendingBuyer && v.pendingBuyer !== ethers.ZeroAddress;

  let applicationType: Vehicle['applicationType'] = undefined;
  if (status === 'PENDING' && !hasPendingBuyer) {
    applicationType = 'REGISTRATION';
  } else if (status === 'TRANSFERRING' && hasPendingBuyer) {
    applicationType = 'TRANSFER';
  }

  return {
    vin: v.vin,
    licensePlate: v.plateNumber,
    brand: v.brand || 'Unknown',
    owner: v.owner,
    status,
    photoIpfsHash: v.ipfsHash,
    registrationDate: Number(v.timestamp),
    engineNumber: '', // Contract hiện tại chưa lưu số máy, để trống hoặc update contract sau
    color: '',
    rejectReason: v.rejectReason || '',
    pendingBuyer: hasPendingBuyer ? v.pendingBuyer : undefined,
    applicationType,
  };
};

export interface KYCInfo {
  fullName: string;
  idNumber: string; // CCCD
  phone: string;
  residenceAddress: string;
  isVerified: boolean;
}

/**
 * Get the contract instance
 */
const getContract = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask is not installed');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer);
};

// --- KYC FUNCTIONS (UPDATED TO REAL DATA) ---

/**
 * Register KYC data for a user
 * Calls: registerCitizen(name, cccd, phone, address)
 */
export const registerKYC = async (kycData: {
  fullName: string;
  idNumber: string;
  phone: string;
  residenceAddress: string;
  ipfsHash?: string; // Contract hiện tại chưa lưu ảnh KYC, có thể bỏ qua hoặc update contract
}): Promise<string> => {
  try {
    console.log('Registering KYC:', kycData);
    
    // Import hàm mã hóa
    const { encryptData } = await import('../utils/encryption');
    
    // MÃ HÓA DỮ LIỆU NHẠY CẢM trước khi gửi lên blockchain
    const encryptedIdNumber = encryptData(kycData.idNumber);
    const encryptedPhone = encryptData(kycData.phone);
    const encryptedAddress = encryptData(kycData.residenceAddress);
    
    console.log('✅ Dữ liệu đã được mã hóa');
    
    const contract = await getContract();
    const tx = await contract.registerCitizen(
      kycData.fullName, // Tên có thể để thường (hoặc mã hóa nếu muốn)
      encryptedIdNumber,
      encryptedPhone,
      encryptedAddress
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error registering KYC:', error);
    throw error;
  }
};

/**
 * Update KYC data for a user (CHO PHÉP CẬP NHẬT DỮ LIỆU CŨ)
 */
export const updateKYC = async (kycData: {
  fullName: string;
  idNumber: string;
  phone: string;
  residenceAddress: string;
}): Promise<string> => {
  try {
    console.log('Updating KYC:', kycData);
    
    // Import hàm mã hóa
    const { encryptData } = await import('../utils/encryption');
    
    // MÃ HÓA DỮ LIỆU NHẠY CẢM trước khi gửi lên blockchain
    const encryptedIdNumber = encryptData(kycData.idNumber);
    const encryptedPhone = encryptData(kycData.phone);
    const encryptedAddress = encryptData(kycData.residenceAddress);
    
    console.log('✅ Dữ liệu đã được mã hóa');
    
    const contract = await getContract();
    const tx = await contract.updateCitizen(
      kycData.fullName, // Tên KHÔNG mã hóa để hiển thị thân thiện
      encryptedIdNumber,
      encryptedPhone,
      encryptedAddress
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error updating KYC:', error);
    throw error;
  }
};

/**
 * Check if user has completed KYC
 * Reads from: citizens(address) mapping
 */
export const checkKYCStatus = async (address: string): Promise<boolean> => {
  try {
    if (!address) return false;
    const contract = await getContract();
    const citizen = await contract.citizens(address);
    // Kiểm tra cờ isRegistered trong struct Citizen
    return citizen.isRegistered === true;
  } catch (error) {
    console.error('Error checking KYC status:', error);
    return false;
  }
};

/**
 * Get user KYC data
 * Reads from: citizens(address) mapping
 */
export const getUserKYC = async (address: string): Promise<KYCInfo | null> => {
  try {
    const contract = await getContract();
    const citizen = await contract.citizens(address);

    if (!citizen.isRegistered) return null;

    return {
      fullName: citizen.fullName,
      idNumber: citizen.cccd,
      phone: citizen.phoneNumber,
      residenceAddress: citizen.homeAddress,
      isVerified: true,
    };
  } catch (error) {
    console.error('Error getting KYC data:', error);
    return null;
  }
};


/**
 * Lấy thông tin User và Giải mã dữ liệu
 */
export const getUserProfile = async (address: string): Promise<User | null> => {
  try {
    const contract = await getContract();
    
    // 1. Lấy quyền Admin để xác định Role
    const authorityAddress = await contract.authority();
    const adminAddress = import.meta.env.VITE_ADMIN_ADDRESS?.toLowerCase() || '';
    
    console.log('🔍 Role check:', {
      userAddress: address.toLowerCase(),
      contractAuthority: authorityAddress.toLowerCase(),
      envAdmin: adminAddress,
      isContractAuthority: address.toLowerCase() === authorityAddress.toLowerCase(),
      isEnvAdmin: address.toLowerCase() === adminAddress
    });
    
    const role: UserRoleType = (
      address.toLowerCase() === authorityAddress.toLowerCase() ||
      address.toLowerCase() === adminAddress
    ) ? 'AUTHORITY' : 'CITIZEN';
    
    console.log('✅ Assigned role:', role);

    // 2. Lấy thông tin công dân từ Smart Contract
    // Struct trong Solidity: { fullName, cccd, phoneNumber, homeAddress, isRegistered }
    const data = await contract.citizens(address);

    // Nếu chưa đăng ký thì trả về user rỗng (chỉ có address và role)
    if (!data.isRegistered) {
      console.log('❌ User chưa đăng ký KYC:', address);
      return {
        address,
        isKYCVerified: false,
        role,
      };
    }

    // 3. GIẢI MÃ DỮ LIỆU (QUAN TRỌNG)
    // Dữ liệu trên blockchain đang là dạng mã hóa RSA
    // Chỉ Admin có PRIVATE_KEY mới giải mã được
    // User thường sẽ thấy "🔒 Dữ liệu được bảo mật"
    
    console.log('📋 Dữ liệu từ blockchain:', {
      fullName: data.fullName,
      cccd: data.cccd ? data.cccd.substring(0, 50) + '...' : 'N/A',
      phoneNumber: data.phoneNumber ? data.phoneNumber.substring(0, 50) + '...' : 'N/A',
    });
    
    // Giải mã an toàn - nếu lỗi thì trả về chuỗi rỗng
    let decryptedIdNumber = '';
    let decryptedPhone = '';
    let decryptedAddress = '';
    
    try {
      if (data.cccd) decryptedIdNumber = decryptData(data.cccd);
    } catch (e) {
      console.warn('Cannot decrypt CCCD:', e);
      decryptedIdNumber = data.cccd || '';
    }
    
    try {
      if (data.phoneNumber) decryptedPhone = decryptData(data.phoneNumber);
    } catch (e) {
      console.warn('Cannot decrypt phone:', e);
      decryptedPhone = data.phoneNumber || '';
    }
    
    try {
      if (data.homeAddress) decryptedAddress = decryptData(data.homeAddress);
    } catch (e) {
      console.warn('Cannot decrypt address:', e);
      decryptedAddress = data.homeAddress || '';
    }
    
    const userProfile = {
      address,
      fullName: data.fullName, // Tên không mã hóa, hiển thị bình thường
      idNumber: decryptedIdNumber, 
      phone: decryptedPhone,
      residenceAddress: decryptedAddress,
      isKYCVerified: true,
      role,
      // kycIpfsHash: data.ipfsHash // Mở comment nếu contract bạn có trường này
    };
    
    console.log('✅ User profile đã xử lý:', {
      ...userProfile,
      idNumber: userProfile.idNumber ? userProfile.idNumber.substring(0, 10) + '...' : 'N/A',
      phone: userProfile.phone ? userProfile.phone.substring(0, 10) + '...' : 'N/A',
    });
    
    return userProfile;

  } catch (error) {
    console.error('Lỗi lấy profile:', error);
    return null;
  }
};
// --- VEHICLE FUNCTIONS ---

/**
 * Submit a new vehicle registration
 */
export const submitVehicle = async (
  vin: string,
  photoIpfsHash: string,
  licensePlate: string,
  brand: string
): Promise<string> => {
  try {
    console.log('Submitting vehicle:', { vin, photoIpfsHash, licensePlate, brand });
    const contract = await getContract();
    const tx = await contract.requestRegistration(
      vin,
      photoIpfsHash,
      licensePlate,
      brand
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error submitting vehicle:', error);
    throw error;
  }
};

/**
 * Get vehicle details by VIN
 */
export const getVehicleDetails = async (vin: string): Promise<Vehicle | null> => {
  try {
    const contract = await getContract();
    const vehicle = await contract.vehicles(vin);
    // Kiểm tra nếu vin rỗng tức là xe không tồn tại
    if (!vehicle.vin) return null;
    return mapContractVehicle(vehicle);
  } catch (error) {
    console.error('Error getting vehicle details:', error);
    return null;
  }
};

/**
 * Get all vehicles owned by an address
 */
export const getMyVehicles = async (address: string): Promise<Vehicle[]> => {
  try {
    console.log('Getting vehicles for address:', address);
    const contract = await getContract();
    // Contract function: getMyVehicles(address _user)
    const vehicles = await contract.getMyVehicles(address);
    return vehicles.map(mapContractVehicle);
  } catch (error) {
    console.error('Error getting vehicles:', error);
    return [];
  }
};

/**
 * Request transfer of ownership
 */
export const requestTransfer = async (vin: string, newOwner: string): Promise<string> => {
  try {
    console.log('Requesting transfer:', { vin, newOwner });
    const contract = await getContract();
    const tx = await contract.requestTransfer(vin, newOwner);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error requesting transfer:', error);
    throw error;
  }
};

// --- AUTHORITY FUNCTIONS ---

/**
 * Approve a vehicle registration
 */
export const approveVehicle = async (vin: string): Promise<string> => {
  try {
    console.log('Approving vehicle:', vin);
    const contract = await getContract();
    const tx = await contract.approveRegistration(vin);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error approving vehicle:', error);
    throw error;
  }
};

/**
 * Reject a vehicle registration
 */
export const rejectVehicle = async (vin: string, reason?: string): Promise<string> => {
  try {
    console.log('Rejecting vehicle:', { vin, reason });
    const contract = await getContract();
    const tx = await contract.rejectVehicle(
      vin,
      reason || 'Không đạt yêu cầu'
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error rejecting vehicle:', error);
    throw error;
  }
};

/**
 * Approve a transfer request
 */
export const approveTransfer = async (vin: string): Promise<string> => {
  try {
    console.log('Approving transfer:', vin);
    const contract = await getContract();
    const tx = await contract.approveTransfer(vin);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error approving transfer:', error);
    throw error;
  }
};

/**
 * Get pending registrations (Authority only)
 * Logic: Lấy tất cả xe -> Lọc Status == PENDING
 */
export const getPendingRegistrations = async (): Promise<Vehicle[]> => {
  try {
    const contract = await getContract();
    // Hàm getAllVehicles này trả về mảng tất cả xe
    const allVehicles = await contract.getAllVehicles();

    // Map và Filter
    const mappedVehicles = allVehicles.map(mapContractVehicle);

    // Status 1 = CHO_DUYET_CAP_MOI
    return mappedVehicles.filter((v: Vehicle) => v.status === 'PENDING');
  } catch (error) {
    console.error('Error getting pending registrations:', error);
    return [];
  }
};

/**
 * Get pending transfers (Authority only)
 * Logic: Lấy tất cả xe -> Lọc Status == TRANSFERRING
 */
export const getPendingTransfers = async (): Promise<Vehicle[]> => {
  try {
    console.log('Getting pending transfers');
    const contract = await getContract();
    const allVehicles = await contract.getAllVehicles();
    const mappedVehicles = allVehicles.map(mapContractVehicle);

    // Status 3 = CHO_DUYET_SANG_TEN
    return mappedVehicles.filter((v: Vehicle) => v.status === 'TRANSFERRING');
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    return [];
  }
};

/**
 * Get all vehicles for authority dashboard
 */
export const getAllVehiclesForAuthority = async (): Promise<Vehicle[]> => {
  try {
    const contract = await getContract();
    const allVehicles = await contract.getAllVehicles();
    return allVehicles.map(mapContractVehicle);
  } catch (error) {
    console.error('Error getting all vehicles:', error);
    return [];
  }
};

// --- HISTORY & EVENTS ---

/**
 * Get contract instance without signer (for reading events)
 */
const getContractReadOnly = async () => {
  if (!window.ethereum) throw new Error('MetaMask is not installed');
  const provider = new ethers.BrowserProvider(window.ethereum);
  return new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
};

/**
 * Get all vehicle activities from events
 * Tái hiện lịch sử dựa trên các Event đã emit trong Smart Contract
 */
export const getAllVehicleActivities = async (): Promise<VehicleActivity[]> => {
  try {
    console.log('Fetching events history...');
    const contract = await getContractReadOnly();
    const provider = new ethers.BrowserProvider(window.ethereum);

    // Để bổ sung data, ta cần lấy thông tin xe hiện tại
    const allVehicles = await contract.getAllVehicles();
    const vehicleMap = new Map<string, any>();
    allVehicles.forEach((v: any) => vehicleMap.set(v.vin, v));

    const activities: VehicleActivity[] = [];
    const filterFrom = 0; // Nên thay bằng block number lúc deploy contract để nhanh hơn
    const currentBlock = await provider.getBlockNumber();

    // 1. Sự kiện: YeuCauMoi (Nộp hồ sơ)
    const reqEvents = await contract.queryFilter(contract.filters.YeuCauMoi(), filterFrom, currentBlock);
    for (const event of reqEvents as any[]) {
      const v = vehicleMap.get(event.args.vin);
      activities.push({
        id: `req_${event.transactionHash}`,
        vin: event.args.vin,
        licensePlate: v?.plateNumber || 'Unknown',
        brand: v?.brand || 'Unknown',
        activityType: 'REGISTRATION',
        status: 'PENDING',
        fromAddress: event.args.owner,
        timestamp: Number(event.args.timestamp || 0), // Lấy timestamp từ event
        transactionHash: event.transactionHash,
        photoIpfsHash: v?.ipfsHash
      });
    }

    // 2. Sự kiện: DaDuyetCapMoi (Đã duyệt)
    const approvedEvents = await contract.queryFilter(contract.filters.DaDuyetCapMoi(), filterFrom, currentBlock);
    for (const event of approvedEvents as any[]) {
      const v = vehicleMap.get(event.args.vin);
      activities.push({
        id: `app_${event.transactionHash}`,
        vin: event.args.vin,
        licensePlate: v?.plateNumber || 'Unknown',
        brand: v?.brand || 'Unknown',
        activityType: 'REGISTRATION',
        status: 'APPROVED',
        fromAddress: event.args.owner,
        timestamp: Number(event.args.timestamp || 0),
        transactionHash: event.transactionHash,
        photoIpfsHash: v?.ipfsHash
      });
    }

    // 3. Sự kiện: HoSoBiTuChoi (Bị từ chối - Quan trọng)
    const rejectEvents = await contract.queryFilter(contract.filters.HoSoBiTuChoi(), filterFrom, currentBlock);
    for (const event of rejectEvents as any[]) {
      const v = vehicleMap.get(event.args.vin);
      activities.push({
        id: `rej_${event.transactionHash}`,
        vin: event.args.vin,
        licensePlate: v?.plateNumber || 'Unknown',
        brand: v?.brand || 'Unknown',
        activityType: 'REGISTRATION',
        status: 'REJECTED',
        fromAddress: event.args.owner,
        rejectReason: event.args.lyDo, // Lấy lý do từ event
        timestamp: Number(event.args.timestamp || 0),
        transactionHash: event.transactionHash,
        photoIpfsHash: v?.ipfsHash
      });
    }

    // 4. Sự kiện: YeuCauSangTen (Chuyển nhượng)
    const transferReqEvents = await contract.queryFilter(contract.filters.YeuCauSangTen(), filterFrom, currentBlock);
    for (const event of transferReqEvents as any[]) {
      const v = vehicleMap.get(event.args.vin);
      activities.push({
        id: `trans_req_${event.transactionHash}`,
        vin: event.args.vin,
        licensePlate: v?.plateNumber || 'Unknown',
        brand: v?.brand || 'Unknown',
        activityType: 'TRANSFER',
        status: 'PENDING',
        fromAddress: event.args.from,
        toAddress: event.args.to,
        timestamp: Number(event.args.timestamp || 0),
        transactionHash: event.transactionHash,
        photoIpfsHash: v?.ipfsHash
      });
    }

    // 5. Sự kiện: DaDuyetSangTen (Đã sang tên)
    const transferAppEvents = await contract.queryFilter(contract.filters.DaDuyetSangTen(), filterFrom, currentBlock);
    for (const event of transferAppEvents as any[]) {
      const v = vehicleMap.get(event.args.vin);
      activities.push({
        id: `trans_app_${event.transactionHash}`,
        vin: event.args.vin,
        licensePlate: v?.plateNumber || 'Unknown',
        brand: v?.brand || 'Unknown',
        activityType: 'TRANSFER',
        status: 'APPROVED',
        fromAddress: event.args.from,
        toAddress: event.args.to,
        timestamp: Number(event.args.timestamp || 0),
        transactionHash: event.transactionHash,
        photoIpfsHash: v?.ipfsHash
      });
    }

    // Sắp xếp mới nhất lên đầu
    activities.sort((a, b) => b.timestamp - a.timestamp);

    return activities;
  } catch (error) {
    console.error('Error getting vehicle activities:', error);
    return [];
  }
};

/**
 * Yêu cầu chuyển nhượng với hợp đồng mua bán
 */
export const requestTransferWithContract = async (
  vin: string,
  buyerAddress: string,
  contractFile: File
): Promise<string> => {
  try {
    console.log('Uploading contract to IPFS...');
    const { uploadFileToIPFS } = await import('./ipfs');
    const contractHash = await uploadFileToIPFS(contractFile);
    
    console.log('Requesting transfer with contract:', { vin, buyerAddress, contractHash });
    const contract = await getContract();
    const tx = await contract.requestTransfer(vin, buyerAddress, contractHash);
    await tx.wait();
    
    return tx.hash;
  } catch (error) {
    console.error('Error requesting transfer:', error);
    throw error;
  }
};

/**
 * Lấy lịch sử chuyển nhượng của xe
 */
export const getVehicleHistory = async (vin: string): Promise<any[]> => {
  try {
    const contract = await getContract();
    const history = await contract.getVehicleHistory(vin);
    
    return history.map((record: any) => ({
      from: record.from,
      to: record.to,
      timestamp: Number(record.timestamp),
      contractIpfsHash: record.contractIpfsHash
    }));
  } catch (error) {
    console.error('Error getting vehicle history:', error);
    return [];
  }
};

/**
 * Lấy thông tin người mua (để hiển thị khi nhập địa chỉ ví)
 */
export const getBuyerInfo = async (address: string): Promise<{
  fullName: string;
  idNumber: string;
  phone: string;
}> => {
  try {
    const contract = await getContract();
    const citizen = await contract.getCitizen(address);
    
    if (!citizen.isRegistered) {
      throw new Error('Người mua chưa đăng ký KYC trong hệ thống');
    }

    return {
      fullName: citizen.fullName,
      idNumber: decryptData(citizen.cccd),
      phone: decryptData(citizen.phoneNumber)
    };
  } catch (error: any) {
    console.error('Error getting buyer info:', error);
    throw error;
  }
};

/**
 * Tìm kiếm xe theo VIN hoặc biển số
 */
export const searchVehicleByVIN = async (query: string): Promise<Vehicle | null> => {
  try {
    const contract = await getContract();
    
    // Thử tìm theo VIN trước
    let vehicle = await contract.vehicles(query);
    
    // Nếu không tìm thấy, tìm trong tất cả xe theo biển số
    if (!vehicle.vin || vehicle.status === 0) {
      const allVehicles = await contract.getAllVehicles();
      const found = allVehicles.find((v: any) => 
        v.plateNumber.toLowerCase() === query.toLowerCase()
      );
      
      if (found) {
        vehicle = found;
      } else {
        return null;
      }
    }

    return mapContractVehicle(vehicle);
  } catch (error) {
    console.error('Error searching vehicle:', error);
    return null;
  }
};

export { getContract };