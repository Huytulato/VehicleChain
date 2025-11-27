# 🚀 Hướng dẫn Deploy Contract VehicleRegistry

## ⚠️ QUAN TRỌNG: Contract đã được cập nhật!

Contract giờ có:
- ✅ `brand` field trong Vehicle struct
- ✅ `rejectReason` field lưu lý do từ chối
- ✅ `requestRegistration(_vin, _ipfsHash, _plate, _brand)` - 4 params
- ✅ `rejectVehicle(_vin, _reason)` - 2 params

## Bước 1: Compile Contract

```bash
# Di chuyển vào thư mục gốc
cd "D:\20251 Bách khoa A+\Hệ thống mạng và máy tính\Demo\VehicleChain"

# Compile với Hardhat hoặc Remix
npx hardhat compile
```

## Bước 2: Deploy Contract Mới

**Option A: Hardhat (nếu đã setup)**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Option B: Remix IDE (Khuyến nghị)**
1. Mở Remix: https://remix.ethereum.org
2. Tạo file `VehicleRegistry.sol` và paste code
3. Compile (Solidity 0.8.0)
4. Deploy:
   - Environment: Injected Provider - MetaMask
   - Network: Localhost 31337
   - Click "Deploy"

## Bước 3: Cập nhật CONTRACT_ADDRESS

Sau khi deploy, copy địa chỉ contract mới:

```env
# File: client/.env
VITE_CONTRACT_ADDRESS=0x... # ← ĐỊA CHỈ MỚI
```

## Bước 4: Cập nhật ABI

Copy ABI từ Remix:
1. Compile tab → Copy ABI
2. Paste vào `client/src/utils/contractABI.json`

Hoặc từ Hardhat:
```bash
cp artifacts/contracts/VehicleRegistry.sol/VehicleRegistry.json client/src/utils/contractABI.json
```

## Bước 5: Khởi động lại Frontend

```bash
cd client
npm run dev
```

## ✅ Kiểm tra

1. **Console Browser**: Không có lỗi contract
2. **Đăng ký xe**: MetaMask popup với 4 params
3. **Authority Dashboard**: Hiện xe chờ duyệt
4. **Citizen Dashboard**: Hiện xe với status PENDING (màu vàng)
5. **Approve**: Chuyển sang ACTIVE (màu xanh)
6. **Reject**: Hiện lý do từ chối

## 🐛 Troubleshooting

**Lỗi "no matching fragment":**
- ABI chưa đúng → Re-export từ Remix

**Xe không hiện:**
- Console log `vehicles.map()` để xem status number
- Status 1 = PENDING, 2 = ACTIVE, 4 = REJECTED

**Authority không thấy xe:**
- Check admin address trong `WalletContext.tsx`
- Log `getAllVehicles()` raw data
