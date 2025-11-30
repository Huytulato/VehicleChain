// Wallet Context - Metamask Integration
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ethers } from 'ethers';
import type { User } from '../types';
import { UserRole } from '../types';
import { checkKYCStatus, getUserKYC } from '../services/blockchain';

// Admin addresses (hardcoded for development)
// TODO: Move to smart contract in production
const ADMIN_ADDRESSES: string[] = [
  '0xeaafb7e0ea438127a5f52dbd5fb56f5d8e9fe6f3'
].map(addr => addr.toLowerCase());

interface WalletContextType {
  account: string | null;
  user: User | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check if wallet is already connected
  useEffect(() => {
    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', () => window.location.reload());
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, []);

  // Load user data when account changes
  useEffect(() => {
    if (account) {
      loadUserData(account);
    } else {
      setUser(null);
    }
  }, [account]);

  const checkConnection = async () => {
    if (window.ethereum) {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          setAccount(accounts[0].address);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
      }
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
    } else {
      setAccount(null);
      setUser(null);
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Vui lòng cài đặt MetaMask để sử dụng ứng dụng này');
      return;
    }

    setIsConnecting(true);
    try {
      // Luôn yêu cầu MetaMask duyệt kết nối
      // eth_requestAccounts sẽ trigger MetaMask popup để người dùng duyệt
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send('eth_requestAccounts', []);

      if (!accounts || accounts.length === 0) {
        throw new Error('Không có tài khoản nào được chọn. Vui lòng chọn tài khoản trong MetaMask.');
      }

      setAccount(accounts[0]);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        alert('Bạn đã từ chối kết nối ví. Vui lòng chấp nhận trong MetaMask để tiếp tục.');
      } else {
        alert('Lỗi kết nối ví: ' + (error.message || 'Vui lòng thử lại'));
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setUser(null);
  };

  const loadUserData = async (address: string) => {
    try {
      // Check if user is admin
      const isAdmin = ADMIN_ADDRESSES.includes(address.toLowerCase());
      const userRole = isAdmin ? UserRole.AUTHORITY : UserRole.CITIZEN;

      const isKYCVerified = await checkKYCStatus(address);

      if (isKYCVerified) {
        const kycData = await getUserKYC(address);
        setUser({
          address,
          fullName: kycData?.fullName || (isAdmin ? 'Admin User' : 'User'),
          isKYCVerified: true,
          role: userRole,
        });
      } else {
        setUser({
          address,
          isKYCVerified: false,
          role: userRole,
        });
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUser({
        address,
        isKYCVerified: false,
        role: UserRole.CITIZEN,
      });
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <WalletContext.Provider
      value={{
        account,
        user,
        isConnecting,
        connectWallet,
        disconnectWallet,
        updateUser,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
