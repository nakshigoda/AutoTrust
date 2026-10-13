// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AutoTrust {
    address public admin;

    struct Vehicle {
        string vehicleId;
        string registrationNumber;
        string manufacturer;
        string model;
        string color;
        string fuelType;
        string chassisNumber;
        string engineNumber;
        uint256 manufacturingYear;
        address currentOwner;
        string currentOwnerName;
        uint256 registrationTimestamp;
    }

    struct ServiceRecord {
        string serviceType;
        uint256 date;
        uint256 mileage;
        uint256 cost;
        address serviceCenter;
    }

    struct AccidentRecord {
        uint256 date;
        string damageDescription;
        uint256 repairCost;
        string accidentLocation;
        uint256 claimAmount;
        address insuranceCompany;
    }

    struct OwnershipRecord {
        address from;
        address to;
        string fromName;
        string toName;
        uint256 timestamp;
    }

    mapping(string => Vehicle) public vehicles; // Indexed by registrationNumber
    mapping(string => bool) public isVehicleRegistered;
    
    mapping(address => bool) public isServiceCenter;
    mapping(address => bool) public isInsuranceCompany;
    mapping(address => string) public organizationNames;

    mapping(string => ServiceRecord[]) private serviceRecords;
    mapping(string => AccidentRecord[]) private accidentRecords;
    mapping(string => OwnershipRecord[]) private ownershipHistory;

    event VehicleRegistered(string registrationNumber, string vehicleId, address owner);
    event ServiceAdded(string registrationNumber, string serviceType, address serviceCenter);
    event AccidentAdded(string registrationNumber, address insuranceCompany);
    event OwnershipTransferred(string registrationNumber, address from, address to);
    event OrganizationApproved(address wallet, string orgType, string name);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Not admin");
        _;
    }

    modifier onlyServiceCenter() {
        require(isServiceCenter[msg.sender], "Not an approved service center");
        _;
    }

    modifier onlyInsuranceCompany() {
        require(isInsuranceCompany[msg.sender], "Not an approved insurance company");
        _;
    }

    modifier onlyVehicleOwner(string memory _regNumber) {
        require(vehicles[_regNumber].currentOwner == msg.sender, "Not the vehicle owner");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function approveServiceCenter(address _wallet, string memory _name) public onlyAdmin {
        isServiceCenter[_wallet] = true;
        organizationNames[_wallet] = _name;
        emit OrganizationApproved(_wallet, "ServiceCenter", _name);
    }

    function approveInsuranceCompany(address _wallet, string memory _name) public onlyAdmin {
        isInsuranceCompany[_wallet] = true;
        organizationNames[_wallet] = _name;
        emit OrganizationApproved(_wallet, "InsuranceCompany", _name);
    }

    function registerVehicle(
        string memory _vehicleId,
        string memory _regNumber,
        string memory _manufacturer,
        string memory _model,
        string memory _color,
        string memory _fuelType,
        string memory _chassisNumber,
        string memory _engineNumber,
        uint256 _manufacturingYear,
        address _owner,
        string memory _ownerName
    ) public onlyAdmin {
        require(!isVehicleRegistered[_regNumber], "Vehicle already registered");

        vehicles[_regNumber] = Vehicle({
            vehicleId: _vehicleId,
            registrationNumber: _regNumber,
            manufacturer: _manufacturer,
            model: _model,
            color: _color,
            fuelType: _fuelType,
            chassisNumber: _chassisNumber,
            engineNumber: _engineNumber,
            manufacturingYear: _manufacturingYear,
            currentOwner: _owner,
            currentOwnerName: _ownerName,
            registrationTimestamp: block.timestamp
        });

        isVehicleRegistered[_regNumber] = true;
        
        // Record initial ownership transfer from address(0) to initial owner
        ownershipHistory[_regNumber].push(OwnershipRecord({
            from: address(0),
            to: _owner,
            fromName: "Manufacturer",
            toName: _ownerName,
            timestamp: block.timestamp
        }));

        emit VehicleRegistered(_regNumber, _vehicleId, _owner);
    }

    function addServiceRecord(
        string memory _regNumber,
        string memory _serviceType,
        uint256 _date,
        uint256 _mileage,
        uint256 _cost
    ) public onlyServiceCenter {
        require(isVehicleRegistered[_regNumber], "Vehicle not found");

        serviceRecords[_regNumber].push(ServiceRecord({
            serviceType: _serviceType,
            date: _date,
            mileage: _mileage,
            cost: _cost,
            serviceCenter: msg.sender
        }));

        emit ServiceAdded(_regNumber, _serviceType, msg.sender);
    }

    function addAccidentRecord(
        string memory _regNumber,
        uint256 _date,
        string memory _damageDescription,
        uint256 _repairCost,
        string memory _accidentLocation,
        uint256 _claimAmount
    ) public onlyInsuranceCompany {
        accidentRecords[_regNumber].push(AccidentRecord({
            date: _date,
            damageDescription: _damageDescription,
            repairCost: _repairCost,
            accidentLocation: _accidentLocation,
            claimAmount: _claimAmount,
            insuranceCompany: msg.sender
        }));

        emit AccidentAdded(_regNumber, msg.sender);
    }

    function transferOwnership(string memory _regNumber, address _newOwner, string memory _newOwnerName) public onlyVehicleOwner(_regNumber) {
        require(_newOwner != address(0), "Invalid new owner");
        
        address previousOwner = vehicles[_regNumber].currentOwner;
        string memory previousOwnerName = vehicles[_regNumber].currentOwnerName;
        vehicles[_regNumber].currentOwner = _newOwner;
        vehicles[_regNumber].currentOwnerName = _newOwnerName;

        ownershipHistory[_regNumber].push(OwnershipRecord({
            from: previousOwner,
            to: _newOwner,
            fromName: previousOwnerName,
            toName: _newOwnerName,
            timestamp: block.timestamp
        }));

        emit OwnershipTransferred(_regNumber, previousOwner, _newOwner);
    }

    function getVehicle(string memory _regNumber) public view returns (Vehicle memory) {
        require(isVehicleRegistered[_regNumber], "Vehicle not found");
        return vehicles[_regNumber];
    }

    function getServiceRecords(string memory _regNumber) public view returns (ServiceRecord[] memory) {
        require(isVehicleRegistered[_regNumber], "Vehicle not found");
        return serviceRecords[_regNumber];
    }

    function getAccidentRecords(string memory _regNumber) public view returns (AccidentRecord[] memory) {
        require(isVehicleRegistered[_regNumber], "Vehicle not found");
        return accidentRecords[_regNumber];
    }

    function getOwnershipHistory(string memory _regNumber) public view returns (OwnershipRecord[] memory) {
        require(isVehicleRegistered[_regNumber], "Vehicle not found");
        return ownershipHistory[_regNumber];
    }
}
