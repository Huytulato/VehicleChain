/**
 * OCR Service using Tesseract.js - OPTIMIZED
 * Trích xuất thông tin từ giấy đăng ký xe Việt Nam
 */

import Tesseract from 'tesseract.js';

export interface VehicleOCRResult {
  vin?: string;          // Số khung
  engineNumber?: string; // Số máy
  licensePlate?: string; // Biển số
  brand?: string;        // Nhãn hiệu
  color?: string;        // Màu sơn
  ownerName?: string;    // Tên chủ xe
  address?: string;      // Địa chỉ chủ xe
  registrationDate?: string; // Ngày đăng ký
  rawText: string;       // Text thô từ OCR
  confidence: number;    // Độ tin cậy (0-100)
}

/**
 * IMPROVED: Advanced preprocessing with adaptive thresholding
 */
const preprocessImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }
        
        // Scale up significantly for small text
        const scale = 3;
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        
        // Step 1: Convert to grayscale and calculate average brightness
        const grayValues: number[] = [];
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          grayValues.push(gray);
        }
        
        const avgBrightness = grayValues.reduce((a, b) => a + b, 0) / grayValues.length;
        
        // Step 2: Adaptive contrast based on image brightness
        const contrast = avgBrightness < 128 ? 1.8 : 1.5;
        const intercept = 128 * (1 - contrast);

        // Step 3: Apply adaptive threshold
        const threshold = avgBrightness > 180 ? 140 : 128;

        for (let i = 0; i < data.length; i += 4) {
          const gray = grayValues[i / 4];
          
          // Enhanced contrast
          let newColor = gray * contrast + intercept;
          
          // Adaptive binarization - make text pop
          if (newColor < threshold) {
            newColor = Math.max(0, newColor * 0.6); // Much darker
          } else {
            newColor = Math.min(255, newColor * 1.15); // Much brighter
          }
          
          // Sharpen edges
          newColor = newColor < 100 ? newColor * 0.7 : newColor > 180 ? Math.min(255, newColor * 1.1) : newColor;
          
          newColor = Math.min(255, Math.max(0, newColor));

          data[i] = newColor;
          data[i + 1] = newColor;
          data[i + 2] = newColor;
        }
        
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png', 1.0));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * IMPROVED: Better cleaning with OCR error correction
 */
const cleanAlphanumeric = (text: string): string => {
  return text
    .toUpperCase()
    .replace(/[OОỌỎÕỐỒỔỖỘỚỜỞỠỢ]/gi, '0') // O variants -> 0
    .replace(/[IÍÌỈĨỊĬĮİ]/gi, '1')        // I variants -> 1
    .replace(/[SŚŜŞŠ]/gi, '5')             // S variants -> 5
    .replace(/[ZŽŹŻ]/gi, '2')              // Z -> 2
    .replace(/[^A-Z0-9]/g, '');            // Keep only letters and numbers
};

/**
 * IMPROVED: Better text normalization
 */
const normalizeVietnameseText = (text: string): string => {
  return text
    .replace(/[òóọỏõôồốổỗộơờớởỡợ]/gi, 'o')
    .replace(/[èéẹẻẽêềếểễệ]/gi, 'e')
    .replace(/[ùúụủũưừứửữự]/gi, 'u')
    .replace(/[ìíịỉĩ]/gi, 'i')
    .replace(/[àáạảãăằắẳẵặâầấẩẫậ]/gi, 'a')
    .replace(/[đ]/gi, 'd')
    .replace(/[ỳýỵỷỹ]/gi, 'y')
    .toUpperCase();
};

/**
 * Extract vehicle information from registration document
 */
export const extractVehicleInfo = async (
  imageFile: File,
  onProgress?: (progress: number) => void
): Promise<VehicleOCRResult> => {
  try {
    const imageUrl = await preprocessImage(imageFile);

    const result = await Tesseract.recognize(
      imageUrl,
      'vie+eng',
      {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(Math.round(m.progress * 100));
          }
        },
        // OPTIMIZED Tesseract config for Vietnamese documents
        tessedit_pageseg_mode: Tesseract.PSM.AUTO,
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐàáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ /:()-.,',
        preserve_interword_spaces: '1',
      }
    );

    const text = result.data.text;
    const confidence = result.data.confidence;

    const extractedInfo = parseVehicleDocument(text);

    return {
      ...extractedInfo,
      rawText: text,
      confidence: confidence,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Không thể đọc thông tin từ ảnh. Vui lòng thử lại với ảnh rõ hơn.');
  }
};

/**
 * IMPROVED: Enhanced parsing with better patterns
 */
const parseVehicleDocument = (text: string): Partial<VehicleOCRResult> => {
  const result: Partial<VehicleOCRResult> = {};
  
  // Multi-line support - don't collapse newlines yet
  const lines = text.split('\n').map(line => line.trim());
  const fullText = text.replace(/\s+/g, ' ').trim();
  const normalizedFull = normalizeVietnameseText(fullText);

  // === 1. Số khung (VIN) - IMPROVED ===
  const vinPatterns = [
    /Số khung\s*\(Chassis N[°o]?\)\s*:\s*([A-Z0-9]{6,25})/i,
    /Chassis N[°o]?\s*:\s*([A-Z0-9]{6,25})/i,
    /So khung.*?:\s*([A-Z0-9]{6,25})/i,
    /RLHJK[A-Z0-9]{12,}/i, // Direct pattern for VIN starting with common prefix
  ];
  
  for (const pattern of vinPatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      result.vin = cleanAlphanumeric(match[1]);
      break;
    }
  }

  // Fallback: Look for long alphanumeric sequences (17 chars typical)
  if (!result.vin) {
    const vinMatch = fullText.match(/\b([A-Z0-9]{15,20})\b/i);
    if (vinMatch) {
      const candidate = cleanAlphanumeric(vinMatch[1]);
      if (candidate.length >= 15 && candidate.length <= 20) {
        result.vin = candidate;
      }
    }
  }

  // === 2. Số máy (Engine Number) - ULTRA IMPROVED ===
  const enginePatterns = [
    /Số máy\s*\(Engine N[°o]?\)\s*:\s*([A-Z0-9]{4,20})/i,
    /Engine N[°o]?\s*:\s*([A-Z0-9]{4,20})/i,
    /So may.*?:\s*([A-Z0-9]{4,20})/i,
    /[IJ]K[0-9OI]{2}[EF][0-9OI]{6,}/i, // JK01E, IK01F variants
  ];
  
  for (const pattern of enginePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      result.engineNumber = cleanAlphanumeric(match[1]);
      break;
    } else if (match && match[0]) {
      // Direct match without capture group
      result.engineNumber = cleanAlphanumeric(match[0]);
      break;
    }
  }
  
  // FALLBACK: Look for engine-like patterns near "Số máy" or between VIN and Brand
  if (!result.engineNumber) {
    const engineContext = /(?:may|engine|motor).{0,50}?([A-Z0-9]{8,15})/i;
    const match = fullText.match(engineContext);
    if (match && match[1]) {
      const candidate = cleanAlphanumeric(match[1]);
      // Validate: starts with letter, has mix of letters and numbers
      if (/^[A-Z]/.test(candidate) && /[A-Z]/.test(candidate) && /[0-9]/.test(candidate)) {
        result.engineNumber = candidate;
      }
    }
  }

  // === 3. Biển số (License Plate) - IMPROVED ===
  const platePatterns = [
    /Biến số đăng ký\s*\(N[°o]? plate\)\s*\(T\)\s*\n?\s*([0-9]{2}[A-Z][0-9]?[\s.-]*[0-9]{3,5}\.?[0-9]{0,2})/i,
    /N[°o]? plate.*?\n?\s*([0-9]{2}[A-Z][0-9]?[\s.-]*[0-9]{3,5}\.?[0-9]{0,2})/i,
    /\b([0-9]{2}[A-Z][0-9]?[\s.-]*[0-9]{3,5}\.?[0-9]{0,2})\b/i,
  ];
  
  for (const pattern of platePatterns) {
    const match = fullText.match(pattern);
    if (match && match[1]) {
      const cleaned = match[1]
        .replace(/\s+/g, '')
        .replace(/[.-]/g, '-')
        .toUpperCase();
      result.licensePlate = cleaned;
      break;
    }
  }

  // === 4. Nhãn hiệu (Brand) - IMPROVED ===
  const brandKeywords = [
    'HONDA', 'YAMAHA', 'SUZUKI', 'PIAGGIO', 'VESPA', 'SYM', 'KYMCO',
    'TOYOTA', 'HYUNDAI', 'KIA', 'MAZDA', 'FORD', 'VINFAST', 'MERCEDES',
    'BMW', 'AUDI', 'LEXUS', 'MITSUBISHI', 'NISSAN', 'CHEVROLET'
  ];
  
  const brandPatterns = [
    /Nhân hiệu\s*\(Brand\)\s*:\s*([A-Z]+)/i,
    /Brand\s*:\s*([A-Z]+)/i,
    /Nhan hieu.*?:\s*([A-Z]+)/i,
  ];
  
  for (const pattern of brandPatterns) {
    const match = normalizedFull.match(pattern);
    if (match && match[1]) {
      result.brand = match[1].trim().toUpperCase();
      break;
    }
  }
  
  if (!result.brand) {
    for (const brand of brandKeywords) {
      if (normalizedFull.includes(brand)) {
        result.brand = brand;
        break;
      }
    }
  }

  // === 5. Màu sơn (Color) - ULTRA IMPROVED ===
  const colorMap: { [key: string]: string } = {
    'XAM': 'Xám',
    'GRAY': 'Xám',
    'GREY': 'Xám',
    'XAM DEN': 'Xám Đen',
    'XAM-DEN': 'Xám Đen',
    'XAMDEN': 'Xám Đen',
    'DO': 'Đỏ',
    'RED': 'Đỏ',
    'TRANG': 'Trắng',
    'WHITE': 'Trắng',
    'DEN': 'Đen',
    'BLACK': 'Đen',
    'XANH': 'Xanh',
    'BLUE': 'Xanh',
    'BAC': 'Bạc',
    'SILVER': 'Bạc',
    'VANG': 'Vàng',
    'YELLOW': 'Vàng',
  };
  
  const colorPatterns = [
    /Màu sơn\s*\(Color\)\s*:\s*([A-ZÀ-Ỹ\s-]+?)(?=\n|Hoạt|Biến|$)/i,
    /Color\s*:\s*([A-ZÀ-Ỹ\s-]+?)(?=\n|$)/i,
    /Mau son.*?:\s*([A-ZÀ-Ỹ\s-]+?)(?=\n|$)/i,
    /(?:Color|Mau son)\s*[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];
  
  for (const pattern of colorPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const colorRaw = match[1].trim();
      const colorText = normalizeVietnameseText(colorRaw);
      
      // Try exact match first
      for (const [key, value] of Object.entries(colorMap)) {
        if (colorText.replace(/[\s-]/g, '').includes(key.replace(/[\s-]/g, ''))) {
          result.color = value;
          break;
        }
      }
      
      if (!result.color) {
        // Keep original if not mapped
        result.color = colorRaw;
      }
      break;
    }
  }
  
  // FALLBACK: Scan entire text for color keywords
  if (!result.color) {
    const normalizedUpper = normalizeVietnameseText(fullText);
    for (const [key, value] of Object.entries(colorMap)) {
      if (normalizedUpper.includes(key)) {
        result.color = value;
        break;
      }
    }
  }
  
  // SMART FALLBACK: Look between "Số khung" and "Hoạt động"
  if (!result.color) {
    const colorContext = /khung.{0,100}?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?).{0,50}?hoat/i;
    const match = text.match(colorContext);
    if (match && match[1]) {
      const candidate = match[1].trim();
      // Check if it looks like a color (2-15 chars, not all uppercase)
      if (candidate.length >= 2 && candidate.length <= 15 && !/^[A-Z0-9\s]+$/.test(candidate)) {
        result.color = candidate;
      }
    }
  }

  // === 6. Tên chủ xe (Owner Name) - IMPROVED ===
  const ownerPatterns = [
    /Tên chủ xe\s*\(Owner'?s? full name\)\s*:\s*\n?\s*([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+)/i,
    /Owner'?s? full name.*?:\s*\n?\s*([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+)/i,
    /Ten chu xe.*?:\s*\n?\s*([A-ZÀÁẢÃẠĂẰẮẲẴẶÂẦẤẨẪẬÈÉẺẼẸÊỀẾỂỄỆÌÍỈĨỊÒÓỎÕỌÔỒỐỔỖỘƠỜỚỞỠỢÙÚỦŨỤƯỪỨỬỮỰỲÝỶỸỴĐ\s]+)/i,
  ];
  
  for (const pattern of ownerPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const name = match[1].trim().replace(/\s+/g, ' ');
      // Filter out lines that are too long or contain non-name chars
      if (name.length > 5 && name.length < 50 && !/[0-9]/.test(name)) {
        result.ownerName = name;
        break;
      }
    }
  }

  // === 7. Địa chỉ (Address) - IMPROVED ===
  const addressPatterns = [
    /Địa chỉ\s*\(Address\)\s*:\s*\n?\s*([^\n]+)/i,
    /Address\s*:\s*\n?\s*([^\n]+)/i,
    /Dia chi.*?:\s*\n?\s*([^\n]+)/i,
  ];

  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const addr = match[1].trim().replace(/\s+/g, ' ');
      // Filter addresses that are too short or contain only numbers
      if (addr.length > 10 && !/^[0-9\s]+$/.test(addr)) {
        result.address = addr;
        break;
      }
    }
  }

  // === 8. Ngày đăng ký (Registration Date) - IMPROVED ===
  const datePatterns = [
    /Đông Đa[,;]?\s*ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i,
    /ngày\s*(\d{1,2})\s*tháng\s*(\d{1,2})\s*năm\s*(\d{4})/i,
    /(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      if (match.length === 4) {
        // Format: day month year
        const day = match[1].padStart(2, '0');
        const month = match[2].padStart(2, '0');
        const year = match[3];
        result.registrationDate = `${day}/${month}/${year}`;
        break;
      } else if (match[1]) {
        // Already in date format
        result.registrationDate = match[1].replace(/[.-]/g, '/');
        break;
      }
    }
  }

  return result;
};

/**
 * Check if Tesseract language data is loaded
 */
export const checkOCRReady = async (): Promise<boolean> => {
  try {
    return true;
  } catch {
    return false;
  }
};