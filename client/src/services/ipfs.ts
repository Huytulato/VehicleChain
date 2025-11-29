// IPFS Service using Pinata API
import axios from 'axios';

const PINATA_API_KEY = import.meta.env.VITE_PINATA_API_KEY;
const PINATA_SECRET_KEY = import.meta.env.VITE_PINATA_SECRET_KEY;
const PINATA_GATEWAY = import.meta.env.VITE_PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs/';

/**
 * Upload a single file to IPFS via Pinata
 */
export const uploadFileToIPFS = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const metadata = JSON.stringify({
    name: file.name,
  });
  formData.append('pinataMetadata', metadata);

  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading file to IPFS:', error);
    throw new Error('Failed to upload file to IPFS');
  }
};

/**
 * Upload multiple files and return an object with their hashes
 */
export const uploadMultipleFiles = async (
  files: { [key: string]: File }
): Promise<{ [key: string]: string }> => {
  const uploadPromises = Object.entries(files).map(async ([key, file]) => {
    const hash = await uploadFileToIPFS(file);
    return { key, hash };
  });

  const results = await Promise.all(uploadPromises);
  const hashMap: { [key: string]: string } = {};
  results.forEach(({ key, hash }) => {
    hashMap[key] = hash;
  });

  return hashMap;
};

/**
 * Upload JSON data to IPFS
 */
export const uploadJSONToIPFS = async (data: object): Promise<string> => {
  try {
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      data,
      {
        headers: {
          'Content-Type': 'application/json',
          pinata_api_key: PINATA_API_KEY,
          pinata_secret_api_key: PINATA_SECRET_KEY,
        },
      }
    );
    return response.data.IpfsHash;
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw new Error('Failed to upload JSON to IPFS');
  }
};

/**
 * Get the full URL for an IPFS hash
 */
export const getIPFSUrl = (hash: string): string => {
  return `${PINATA_GATEWAY}${hash}`;
};

/**
 * Fetch data from IPFS
 */
export const fetchFromIPFS = async (hash: string): Promise<any> => {
  try {
    const response = await axios.get(getIPFSUrl(hash));
    return response.data;
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw new Error('Failed to fetch data from IPFS');
  }
};