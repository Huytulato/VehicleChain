// TypeScript Types and Interfaces for VehicleChain

export const VehicleStatus = {
  PENDING: 'PENDING',
  ACTIVE: 'ACTIVE',
  TRANSFERRING: 'TRANSFERRING',
  REJECTED: 'REJECTED',
} as const;

export type VehicleStatusType = typeof VehicleStatus[keyof typeof VehicleStatus];

export const UserRole = {
  CITIZEN: 'CITIZEN',
  AUTHORITY: 'AUTHORITY',
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];

export interface User {
  address: string;
  fullName?: string;
  idNumber?: string;
  phone?: string;
  residenceAddress?: string;
  isKYCVerified: boolean;
  role: UserRoleType;
  kycIpfsHash?: string;
}

export interface KYCData {
  fullName: string;
  idNumber: string;
  phone: string;
  residenceAddress: string;
  idCardFront: File | null;
  idCardBack: File | null;
}

export interface Vehicle {
  vin: string;
  engineNumber: string;
  licensePlate: string;
  brand: string;
  color: string;
  status: VehicleStatusType;
  owner: string;
  ownerName?: string;
  // Loại hồ sơ hiện tại: đăng ký mới hay chuyển nhượng
  applicationType?: 'REGISTRATION' | 'TRANSFER';
  // Người nhận dự kiến trong hồ sơ chuyển nhượng (nếu có)
  pendingBuyer?: string;
  registrationDate?: number;
  photoIpfsHash?: string;
  documentIpfsHash?: string;
  rejectReason?: string;
  photos?: {
    front?: string;
    back?: string;
    left?: string;
    right?: string;
  };
}

export interface VehicleHistory {
  timestamp: number;
  event: 'REGISTERED' | 'TRANSFERRED' | 'APPROVED' | 'REJECTED';
  from?: string;
  to?: string;
  transactionHash: string;
}

export interface TransferRequest {
  vehicleVin: string;
  from: string;
  to: string;
  requestDate: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface RegistrationRequest {
  vin: string;
  requester: string;
  requestDate: number;
  vehicle: Vehicle;
  status: VehicleStatusType;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

/**
 * Hoạt động/hồ sơ trong hệ thống (đăng ký hoặc chuyển nhượng)
 * Mỗi hoạt động là một bản ghi riêng biệt, không gộp chung
 */
export interface VehicleActivity {
  id: string; // Unique ID: vin + type + timestamp hoặc transaction hash
  vin: string;
  licensePlate: string;
  brand: string;
  activityType: 'REGISTRATION' | 'TRANSFER'; // Loại hoạt động
  status: 'PENDING' | 'APPROVED' | 'REJECTED'; // Trạng thái của hoạt động này
  fromAddress: string; // Địa chỉ ví người gửi/yêu cầu
  toAddress?: string; // Địa chỉ ví người nhận (chỉ có khi chuyển nhượng)
  timestamp: number; // Thời gian của hoạt động
  transactionHash?: string; // Hash của transaction (nếu có)
  rejectReason?: string; // Lý do từ chối (nếu bị từ chối)
  photoIpfsHash?: string; // Hash ảnh (để hiển thị)
}
