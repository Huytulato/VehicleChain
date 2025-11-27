// Blockchain Service - Smart Contract Interactions
import { ethers } from 'ethers';
import contractABI from '../utils/contractABI.json';
import type { Vehicle, VehicleHistory, TransferRequest } from '../types';

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';

interface KYCInfo {
  fullName: string;
  idNumber: string;
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

/**
 * Register KYC data for a user
 */
export const registerKYC = async (kycData: {
  fullName: string;
  idNumber: string;
  phone: string;
  residenceAddress: string;
  ipfsHash: string;
}): Promise<string> => {
  try {
    console.log('Registering KYC:', kycData);
    const contract = await getContract();
    const tx = await contract.registerKYC(
      kycData.fullName,
      kycData.idNumber,
      kycData.phone,
      kycData.residenceAddress,
      kycData.ipfsHash
    );
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error registering KYC:', error);
    throw error;
  }
};

/**
 * Check if user has completed KYC
 */
export const checkKYCStatus = async (address: string): Promise<boolean> => {
  try {
    console.log('Checking KYC status for:', address);
    // Contract doesn't have KYC functions yet
    // const contract = await getContract();
    // return await contract.isKYCVerified(address);
    
    // Return true for now (all users considered verified)
    return !!address;
  } catch (error) {
    console.error('Error checking KYC status:', error);
    return false;
  }
};

/**
 * Get user KYC data
 */
export const getUserKYC = async (address: string): Promise<KYCInfo | null> => {
  try {
    console.log('Getting KYC data for:', address);
    // Contract doesn't have KYC functions yet
    // const contract = await getContract();
    // const kycData = await contract.getUserKYC(address);
    
    // Return basic info for now
    return {
      fullName: 'User',
      idNumber: '',
      phone: '',
      residenceAddress: '',
      isVerified: true,
    };
  } catch (error) {
    console.error('Error getting KYC data:', error);
    return null;
  }
};

/**
 * Submit a new vehicle registration
 */
export const submitVehicle = async (vehicleData: {
  vin: string;
  engineNumber: string;
  licensePlate: string;
  brand: string;
  color: string;
  photoIpfsHash: string;
  documentIpfsHash: string;
}): Promise<string> => {
  try {
    console.log('Submitting vehicle:', vehicleData);
    const contract = await getContract();
    // Contract function: requestRegistration(string _vin, string _ipfsHash, string _plate)
    const tx = await contract.requestRegistration(
      vehicleData.vin,
      vehicleData.photoIpfsHash, // Use photo hash as main IPFS hash
      vehicleData.licensePlate
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
    console.log('Getting vehicle details for VIN:', vin);
    const contract = await getContract();
    const vehicle = await contract.getVehicle(vin);
    return vehicle;
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
    // Contract function: getMyVehicles() - returns vehicles for msg.sender
    const vehicles = await contract.getMyVehicles();
    return vehicles;
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

/**
 * Approve a vehicle registration (Authority only)
 */
export const approveVehicle = async (vin: string): Promise<string> => {
  try {
    console.log('Approving vehicle:', vin);
    const contract = await getContract();
    // Contract function: approveRegistration(string _vin)
    const tx = await contract.approveRegistration(vin);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error approving vehicle:', error);
    throw error;
  }
};

/**
 * Reject a vehicle registration (Authority only)
 */
export const rejectVehicle = async (vin: string, reason?: string): Promise<string> => {
  try {
    console.log('Rejecting vehicle:', { vin, reason });
    const contract = await getContract();
    // Contract function: rejectVehicle(string _vin) - doesn't accept reason parameter
    // TODO: Update contract to accept rejection reason
    const tx = await contract.rejectVehicle(vin);
    await tx.wait();
    return tx.hash;
  } catch (error) {
    console.error('Error rejecting vehicle:', error);
    throw error;
  }
};

/**
 * Approve a transfer request (Authority only)
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
 * Get vehicle history
 */
export const getVehicleHistory = async (vin: string): Promise<VehicleHistory[]> => {
  try {
    console.log('Getting vehicle history for:', vin);
    const contract = await getContract();
    return await contract.getVehicleHistory(vin);
  } catch (error) {
    console.error('Error getting vehicle history:', error);
    return [];
  }
};

/**
 * Get pending registrations (Authority only)
 */
export const getPendingRegistrations = async (): Promise<Vehicle[]> => {
  try {
    console.log('Getting pending registrations');
    const contract = await getContract();
    // Contract function: getAllVehicles() - returns all vehicles
    const allVehicles = await contract.getAllVehicles();
    // Filter for pending status
    return allVehicles.filter((v: Vehicle) => v.status === 'PENDING');
  } catch (error) {
    console.error('Error getting pending registrations:', error);
    return [];
  }
};

/**
 * Get pending transfers (Authority only)
 */
export const getPendingTransfers = async (): Promise<TransferRequest[]> => {
  try {
    console.log('Getting pending transfers');
    const contract = await getContract();
    return await contract.getPendingTransfers();
  } catch (error) {
    console.error('Error getting pending transfers:', error);
    return [];
  }
};

// Export getContract for when contract is deployed
export { getContract };