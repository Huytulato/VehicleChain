import JSEncrypt from 'jsencrypt';

// Lấy Public Key từ .env (Dùng để mã hóa - Ai cũng có quyền dùng)
const PUBLIC_KEY = import.meta.env.VITE_GOV_PUBLIC_KEY;

// Lấy Private Key từ .env (Dùng để giải mã - Chỉ Admin có, máy User sẽ là undefined)
const PRIVATE_KEY = import.meta.env.VITE_GOV_PRIVATE_KEY;

/**
 * Hàm Mã hóa (Dùng cho Người dân khi Đăng ký)
 * Input: "Nguyễn Văn A" -> Output: "Base64String..."
 */
export const encryptData = (text: string): string => {
    if (!text || !PUBLIC_KEY) {
        console.warn("Thiếu Public Key hoặc dữ liệu rỗng");
        return "";
    }
    
    const encryptor = new JSEncrypt();
    encryptor.setPublicKey(PUBLIC_KEY);
    
    // Mã hóa
    const encrypted = encryptor.encrypt(text);
    return encrypted || ""; // Trả về rỗng nếu lỗi
};

/**
 * Hàm Giải mã (Dùng cho Admin khi Duyệt hồ sơ)
 * Input: "Base64String..." -> Output: "Nguyễn Văn A"
 */
export const decryptData = (encryptedText: string): string => {
    // Nếu không có Private Key (tức là User thường đang cố xem), trả về text ẩn
    if (!PRIVATE_KEY) return "🔒 Dữ liệu được bảo mật";
    if (!encryptedText || encryptedText.trim() === "") return "";
    
    // Nếu text quá ngắn (< 50 ký tự), có thể không phải dữ liệu mã hóa
    if (encryptedText.length < 50) {
        console.warn('Text too short to be encrypted data:', encryptedText.length);
        return encryptedText; // Trả về nguyên bản
    }
    
    try {
        const decryptor = new JSEncrypt();
        decryptor.setPrivateKey(PRIVATE_KEY);
        
        const decrypted = decryptor.decrypt(encryptedText);
        
        // Nếu giải mã thất bại (do sai key hoặc dữ liệu rác)
        if (!decrypted) return "❌ Không thể giải mã";
        
        return decrypted;
    } catch (error) {
        console.error('Decryption error:', error);
        return encryptedText; // Fallback: trả về text gốc
    }
};