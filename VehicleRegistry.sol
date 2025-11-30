// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VehicleRegistry {
    
    // --- 1. CẤU TRÚC DỮ LIỆU (DATA STRUCTURES) ---

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

    // [MỚI] Thông tin công dân để hiển thị tên thật
    struct Citizen {
        string fullName;
        string cccd;
        string phoneNumber;
        string homeAddress;
        bool isRegistered;
    }

    // --- 2. LƯU TRỮ (STORAGE) ---

    address public authority; // Địa chỉ Admin (Cơ quan)

    mapping(string => Vehicle) public vehicles;             // Tra cứu xe theo VIN
    mapping(address => string[]) public ownerVehicles;      // Tra cứu danh sách xe của ví
    mapping(address => Citizen) public citizens;            // [MỚI] Tra cứu thông tin công dân

    string[] public allVINs; // Danh sách toàn bộ VIN (Cho Admin)

    // --- 3. SỰ KIỆN (EVENTS) - Thêm timestamp để vẽ Timeline ---

    event YeuCauMoi(string vin, address indexed owner, uint256 timestamp);
    event DaDuyetCapMoi(string vin, address indexed owner, uint256 timestamp);
    event YeuCauSangTen(string vin, address indexed from, address indexed to, uint256 timestamp);
    event DaDuyetSangTen(string vin, address indexed from, address indexed to, uint256 timestamp);
    
    // [MỚI] Sự kiện từ chối kèm lý do
    event HoSoBiTuChoi(string vin, address indexed owner, string lyDo, uint256 timestamp);
    event CongDanMoi(address indexed wallet, string fullName);

    // --- 4. MODIFIERS & INIT ---

    modifier onlyAuthority() {
        require(msg.sender == authority, "Loi: Chi danh cho Co quan chuc nang");
        _;
    }

    constructor() {
        authority = msg.sender; // Người deploy là Admin
    }

    // --- 5. CHỨC NĂNG: ĐỊNH DANH CÔNG DÂN (KYC) ---

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
    }

    // --- 6. CHỨC NĂNG: QUẢN LÝ XE ---

    // NGƯỜI DÂN: Đăng ký xe mới
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
    }

    // NGƯỜI DÂN: Yêu cầu bán xe
    function requestTransfer(string memory _vin, address _buyer) public {
        require(vehicles[_vin].owner == msg.sender, "Khong phai xe chinh chu");
        require(vehicles[_vin].status == Status.DA_CAP, "Xe khong o trang thai hop le de ban");
        require(_buyer != address(0), "Dia chi nguoi mua khong hop le");
        require(_buyer != msg.sender, "Khong the tu ban cho chinh minh");

        vehicles[_vin].status = Status.CHO_DUYET_SANG_TEN;
        vehicles[_vin].pendingBuyer = _buyer;

        emit YeuCauSangTen(_vin, msg.sender, _buyer, block.timestamp);
    }

    // --- 7. CHỨC NĂNG: QUẢN LÝ CỦA CƠ QUAN ---

    // Duyệt cấp mới
    function approveRegistration(string memory _vin) public onlyAuthority {
        require(vehicles[_vin].status == Status.CHO_DUYET_CAP_MOI, "Trang thai khong hop le");
        
        vehicles[_vin].status = Status.DA_CAP;
        vehicles[_vin].timestamp = block.timestamp;
        
        emit DaDuyetCapMoi(_vin, vehicles[_vin].owner, block.timestamp);
    }

    // Duyệt sang tên
    function approveTransfer(string memory _vin) public onlyAuthority {
        require(vehicles[_vin].status == Status.CHO_DUYET_SANG_TEN, "Khong co yeu cau sang ten");

        address oldOwner = vehicles[_vin].owner;
        address newOwner = vehicles[_vin].pendingBuyer;

        // Xóa xe khỏi danh sách chủ cũ
        _removeVinFromOwner(oldOwner, _vin);

        // Thêm xe vào danh sách chủ mới
        ownerVehicles[newOwner].push(_vin);

        // Cập nhật thông tin xe
        vehicles[_vin].owner = newOwner;
        vehicles[_vin].pendingBuyer = address(0);
        vehicles[_vin].status = Status.DA_CAP;
        vehicles[_vin].timestamp = block.timestamp;

        emit DaDuyetSangTen(_vin, oldOwner, newOwner, block.timestamp);
    }

    // Từ chối hồ sơ (Có lưu lý do)
    function rejectVehicle(string memory _vin, string memory _reason) public onlyAuthority {
        // Chỉ từ chối được xe đang chờ duyệt
        require(vehicles[_vin].status == Status.CHO_DUYET_CAP_MOI || vehicles[_vin].status == Status.CHO_DUYET_SANG_TEN, "Trang thai khong the tu choi");

        vehicles[_vin].status = Status.BI_TU_CHOI;
        vehicles[_vin].rejectReason = _reason;
        vehicles[_vin].pendingBuyer = address(0); // Reset người mua nếu đang bán
        vehicles[_vin].timestamp = block.timestamp;

        emit HoSoBiTuChoi(_vin, vehicles[_vin].owner, _reason, block.timestamp);
    }

    // --- 8. HÀM HỖ TRỢ (INTERNAL & VIEW) ---

    // Hàm nội bộ: Xóa phần tử khỏi mảng (Swap & Pop)
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

    // Lấy danh sách xe của User (Trả về mảng Object)
    function getMyVehicles(address _user) public view returns (Vehicle[] memory) {
        string[] memory vins = ownerVehicles[_user];
        Vehicle[] memory myCars = new Vehicle[](vins.length);
        
        for(uint i = 0; i < vins.length; i++) {
            myCars[i] = vehicles[vins[i]];
        }
        return myCars;
    }

    // Lấy tất cả xe (Cho Admin Dashboard)
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
}