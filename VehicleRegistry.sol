// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VehicleRegistry {
    // --- 1. CẤU TRÚC DỮ LIỆU ---
    enum Status { 
        KHONG_TON_TAI,      // 0
        CHO_DUYET_CAP_MOI,  // 1
        DA_CAP,             // 2
        CHO_DUYET_SANG_TEN, // 3
        BI_TU_CHOI          // 4
    }
    struct Vehicle {
        string vin;             // Số khung (Khóa chính)
        string ipfsHash;        // Hash ảnh/giấy tờ trên IPFS
        string plateNumber;     // Biển số
        string brand;           // Nhãn hiệu
        address owner;          // Chủ sở hữu hiện tại
        address pendingBuyer;   // Người mua đang chờ (nếu có)
        Status status;          // Trạng thái hiện tại
        string rejectReason;    // Lý do từ chối (nếu có)
        uint256 timestamp;      // Thời gian cập nhật cuối
    }
    // Lịch sử giao dịch của xe
    struct TransferHistory {
        address from;           // Người bán
        address to;             // Người mua
        uint256 timestamp;      // Thời gian chuyển nhượng
        string contractIpfsHash; // Hash hợp đồng mua bán trên IPFS
    }
    // Yêu cầu chuyển nhượng (lưu riêng để theo dõi)
    struct TransferRequest {
        string vin;
        address from;
        address to;
        string contractIpfsHash; // Hash hợp đồng mua bán
        uint256 timestamp;
        bool isProcessed;        // Đã xử lý chưa (duyệt/từ chối)
    }
    struct Citizen {
        string fullName;
        string cccd;
        string phoneNumber;
        string homeAddress;
        bool isRegistered;
    }
    struct AccountActivity {
        string activityType;    // "REGISTRATION_REQUEST", "REGISTRATION_APPROVED", "REGISTRATION_REJECTED", "TRANSFER_REQUEST", "TRANSFER_APPROVED", "TRANSFER_REJECTED"
        string vin;             // VIN xe liên quan
        string details;         // Chi tiết thêm (JSON string)
        uint256 timestamp;      // Thời gian
        address relatedAddress; // Địa chỉ liên quan (người mua/bán)
    }
    // --- 2. LƯU TRỮ ---
    address public authority; // Địa chỉ Admin (Cơ quan)

    mapping(string => Vehicle) public vehicles;             // Tra cứu xe theo VIN
    mapping(address => string[]) public ownerVehicles;      // Tra cứu danh sách xe của ví
    mapping(address => Citizen) public citizens;            // Tra cứu thông tin công dân
    
    // Lịch sử chuyển nhượng của từng xe
    mapping(string => TransferHistory[]) public vehicleHistory;
    
    // Yêu cầu chuyển nhượng đang chờ (theo VIN)
    mapping(string => TransferRequest) public pendingTransfers;

    // *** MỚI: Lịch sử hoạt động của tài khoản ***
    mapping(address => AccountActivity[]) public accountActivities;

    string[] public allVINs; // Danh sách toàn bộ VIN
    // --- 3. SỰ KIỆN ---

    event YeuCauMoi(string vin, address indexed owner, uint256 timestamp);
    event DaDuyetCapMoi(string vin, address indexed owner, uint256 timestamp);
    event YeuCauSangTen(string vin, address indexed from, address indexed to, uint256 timestamp);
    event DaDuyetSangTen(string vin, address indexed from, address indexed to, uint256 timestamp);
    event HoSoBiTuChoi(string vin, address indexed owner, string lyDo, uint256 timestamp);
    event CongDanMoi(address indexed wallet, string fullName);
    event TuChoiSangTen(string vin, address indexed from, address indexed to, string lyDo, uint256 timestamp);

    // --- 4. MODIFIERS & INIT ---
    modifier onlyAuthority() {
        require(msg.sender == authority, "Loi: Chi danh cho Co quan chuc nang");
        _;
    }
    constructor() {
        authority = msg.sender; // Người deploy là Admin
    }

    // --- 5. CHỨC NĂNG: ĐỊNH DANH (KYC) ---
    function registerCitizen(string memory _name, string memory _cccd, string memory _phone, string memory _addr) public {
        require(!citizens[msg.sender].isRegistered, "Vi nay da duoc dinh danh roi");
        
        citizens[msg.sender] = Citizen({
            fullName: _name,
            cccd: _cccd,
            phoneNumber: _phone,
            homeAddress: _addr,
            isRegistered: true
        });

        emit CongDanMoi(msg.sender, _name);
        // Lưu vào lịch sử hoạt động
        _addAccountActivity(msg.sender, "KYC_REGISTERED", "", "Registered KYC information", address(0));
    }

    function updateCitizen(string memory _name, string memory _cccd, string memory _phone, string memory _addr) public {
        require(citizens[msg.sender].isRegistered, "Chua dang ky dinh danh");
        
        citizens[msg.sender] = Citizen({
            fullName: _name,
            cccd: _cccd,
            phoneNumber: _phone,
            homeAddress: _addr,
            isRegistered: true
        });

        emit CongDanMoi(msg.sender, _name);
        
        // Lưu vào lịch sử hoạt động
        _addAccountActivity(msg.sender, "KYC_UPDATED", "", "Updated KYC information", address(0));
    }
    // --- 6. CHỨC NĂNG: QUẢN LÝ XE ---

    function requestRegistration(string memory _vin, string memory _ipfsHash, string memory _plate, string memory _brand) public {
        require(vehicles[_vin].status == Status.KHONG_TON_TAI, "Xe da ton tai hoac dang cho duyet");

        vehicles[_vin] = Vehicle({
            vin: _vin,
            ipfsHash: _ipfsHash,
            plateNumber: _plate,
            brand: _brand,
            owner: msg.sender,
            pendingBuyer: address(0),
            status: Status.CHO_DUYET_CAP_MOI,
            rejectReason: "",
            timestamp: block.timestamp
        });

        ownerVehicles[msg.sender].push(_vin);
        allVINs.push(_vin);

        emit YeuCauMoi(_vin, msg.sender, block.timestamp);
        
        // Lưu vào lịch sử hoạt động
        _addAccountActivity(msg.sender, "REGISTRATION_REQUEST", _vin, _brand, address(0));
    }
    function requestTransfer(string memory _vin, address _buyer, string memory _contractIpfsHash) public {
        require(vehicles[_vin].owner == msg.sender, "Khong phai xe chinh chu");
        require(vehicles[_vin].status == Status.DA_CAP, "Xe khong o trang thai hop le de ban");
        require(_buyer != address(0), "Dia chi nguoi mua khong hop le");
        require(_buyer != msg.sender, "Khong the tu ban cho chinh minh");
        require(bytes(_contractIpfsHash).length > 0, "Can upload hop dong mua ban");

        vehicles[_vin].status = Status.CHO_DUYET_SANG_TEN;
        vehicles[_vin].pendingBuyer = _buyer;

        // Lưu yêu cầu chuyển nhượng
        pendingTransfers[_vin] = TransferRequest({
            vin: _vin,
            from: msg.sender,
            to: _buyer,
            contractIpfsHash: _contractIpfsHash,
            timestamp: block.timestamp,
            isProcessed: false
        });

        emit YeuCauSangTen(_vin, msg.sender, _buyer, block.timestamp);
        
        // Lưu vào lịch sử hoạt động cho cả người bán và người mua
        _addAccountActivity(msg.sender, "TRANSFER_REQUEST_SELLER", _vin, vehicles[_vin].brand, _buyer);
        _addAccountActivity(_buyer, "TRANSFER_REQUEST_BUYER", _vin, vehicles[_vin].brand, msg.sender);
    }

    // --- 7. CHỨC NĂNG: QUẢN LÝ CỦA CƠ QUAN ---

    function approveRegistration(string memory _vin) public onlyAuthority {
        require(vehicles[_vin].status == Status.CHO_DUYET_CAP_MOI, "Trang thai khong hop le");
        
        vehicles[_vin].status = Status.DA_CAP;
        vehicles[_vin].timestamp = block.timestamp;
        
        emit DaDuyetCapMoi(_vin, vehicles[_vin].owner, block.timestamp);
        
        // Lưu vào lịch sử hoạt động
        _addAccountActivity(vehicles[_vin].owner, "REGISTRATION_APPROVED", _vin, vehicles[_vin].brand, address(0));
    }

    function approveTransfer(string memory _vin) public onlyAuthority {
        require(vehicles[_vin].status == Status.CHO_DUYET_SANG_TEN, "Khong co yeu cau sang ten");
        require(pendingTransfers[_vin].isProcessed == false, "Yeu cau da xu ly");

        address oldOwner = vehicles[_vin].owner;
        address newOwner = vehicles[_vin].pendingBuyer;

        // Lưu lịch sử chuyển nhượng
        vehicleHistory[_vin].push(TransferHistory({
            from: oldOwner,
            to: newOwner,
            timestamp: block.timestamp,
            contractIpfsHash: pendingTransfers[_vin].contractIpfsHash
        }));

    // Xóa xe khỏi danh sách chủ cũ
        _removeVinFromOwner(oldOwner, _vin);

        // Thêm xe vào danh sách chủ mới
        ownerVehicles[newOwner].push(_vin);
        // Cập nhật thông tin xe
        vehicles[_vin].owner = newOwner;
        vehicles[_vin].pendingBuyer = address(0);
        vehicles[_vin].status = Status.DA_CAP;
        vehicles[_vin].timestamp = block.timestamp;
        // Đánh dấu yêu cầu đã xử lý
        pendingTransfers[_vin].isProcessed = true;
        emit DaDuyetSangTen(_vin, oldOwner, newOwner, block.timestamp);
        // Lưu vào lịch sử hoạt động cho cả người bán và người mua
        _addAccountActivity(oldOwner, "TRANSFER_APPROVED_SELLER", _vin, vehicles[_vin].brand, newOwner);
        _addAccountActivity(newOwner, "TRANSFER_APPROVED_BUYER", _vin, vehicles[_vin].brand, oldOwner);
    }
    // *** CẬP NHẬT: Từ chối hồ sơ - Xử lý riêng cho đăng ký và chuyển nhượng ***
    function rejectVehicle(string memory _vin, string memory _reason) public onlyAuthority {
        require(vehicles[_vin].status == Status.CHO_DUYET_CAP_MOI || vehicles[_vin].status == Status.CHO_DUYET_SANG_TEN, "Trang thai khong the tu choi");      
        // *** QUAN TRỌNG: Phân biệt giữa từ chối đăng ký và từ chối chuyển nhượng ***
        if (vehicles[_vin].status == Status.CHO_DUYET_CAP_MOI) {
            // TỪ CHỐI ĐĂNG KÝ MỚI -> Chuyển sang trạng thái BỊ TỪ CHỐI
            vehicles[_vin].status = Status.BI_TU_CHOI;
            vehicles[_vin].rejectReason = _reason;
            vehicles[_vin].timestamp = block.timestamp;
            
            emit HoSoBiTuChoi(_vin, vehicles[_vin].owner, _reason, block.timestamp);
            
            // Lưu vào lịch sử hoạt động
            _addAccountActivity(vehicles[_vin].owner, "REGISTRATION_REJECTED", _vin, vehicles[_vin].brand, address(0));
            
        } else if (vehicles[_vin].status == Status.CHO_DUYET_SANG_TEN) {
            // TỪ CHỐI CHUYỂN NHƯỢNG -> Xe TRỞ VỀ trạng thái ĐÃ CẤP, không mất xe
            address seller = vehicles[_vin].owner;
            address buyer = vehicles[_vin].pendingBuyer;
            
            vehicles[_vin].status = Status.DA_CAP;  // *** Trở về trạng thái đã cấp ***
            vehicles[_vin].rejectReason = _reason;
            vehicles[_vin].pendingBuyer = address(0); // Xóa người mua chờ
            vehicles[_vin].timestamp = block.timestamp;
            
            // Đánh dấu yêu cầu đã xử lý
            if (pendingTransfers[_vin].timestamp > 0) {
                pendingTransfers[_vin].isProcessed = true;
            }
            emit TuChoiSangTen(_vin, seller, buyer, _reason, block.timestamp);
            
            // Lưu vào lịch sử hoạt động cho cả người bán và người mua
            _addAccountActivity(seller, "TRANSFER_REJECTED_SELLER", _vin, vehicles[_vin].brand, buyer);
            _addAccountActivity(buyer, "TRANSFER_REJECTED_BUYER", _vin, vehicles[_vin].brand, seller);
        }
    }
    // --- 8. HÀM HỖ TRỢ (INTERNAL & VIEW) ---
    // Xóa phần tử khỏi mảng
    function _removeVinFromOwner(address _owner, string memory _vin) internal {
        string[] storage myCars = ownerVehicles[_owner];
        for (uint i = 0; i < myCars.length; i++) {
            if (keccak256(bytes(myCars[i])) == keccak256(bytes(_vin))) {
                myCars[i] = myCars[myCars.length - 1];
                myCars.pop();
                break;
            }
        }
    }
    // *** MỚI: Thêm hoạt động vào lịch sử tài khoản ***
    function _addAccountActivity(
        address _account,
        string memory _activityType,
        string memory _vin,
        string memory _details,
        address _relatedAddress
    ) internal {
        accountActivities[_account].push(AccountActivity({
            activityType: _activityType,
            vin: _vin,
            details: _details,
            timestamp: block.timestamp,
            relatedAddress: _relatedAddress
        }));
    }
    // Lấy danh sách xe của User
    function getMyVehicles(address _user) public view returns (Vehicle[] memory) {
        string[] memory vins = ownerVehicles[_user];
        Vehicle[] memory myCars = new Vehicle[](vins.length);
        
        for(uint i = 0; i < vins.length; i++) {
            myCars[i] = vehicles[vins[i]];
        }
        return myCars;
    }
    // Lấy tất cả xe
    function getAllVehicles() public view returns (Vehicle[] memory) {
        Vehicle[] memory allCars = new Vehicle[](allVINs.length);
        for(uint i = 0; i < allVINs.length; i++) {
            allCars[i] = vehicles[allVINs[i]];
        }
        return allCars;
    }
    // Lấy thông tin công dân
    function getCitizen(address _wallet) public view returns (Citizen memory) {
        return citizens[_wallet];
    }
    // Lấy lịch sử chuyển nhượng của xe
    function getVehicleHistory(string memory _vin) public view returns (TransferHistory[] memory) {
        return vehicleHistory[_vin];
    }
    // Lấy yêu cầu chuyển nhượng đang chờ
    function getPendingTransfer(string memory _vin) public view returns (TransferRequest memory) {
        return pendingTransfers[_vin];
    }
    // Kiểm tra xe có tồn tại không
    function vehicleExists(string memory _vin) public view returns (bool) {
        return vehicles[_vin].status != Status.KHONG_TON_TAI;
    }
    function getAccountActivities(address _account) public view returns (AccountActivity[] memory) {
        return accountActivities[_account];
    }
}
