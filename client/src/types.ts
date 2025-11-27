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
  registrationDate?: number;
  photoIpfsHash?: string;
  documentIpfsHash?: string;
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
