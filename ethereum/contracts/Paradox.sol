// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract paradox is ERC721A, Ownable {
    using SafeMath for uint256;

    struct Level {
        mapping(address => uint) purchasesPerOwner;
        uint id;
        uint mintsSoFar;
        uint mintsWithoutAnswer;
        bool initialized;
    }


    uint256 public constant totalItems = 4500;
    uint256 public constant itemsPerLevel = 300;
    uint256 public constant maxPurchasesWithoutAnswerPerLevel = 100;
    uint256 public constant maxPurchasePerLevelPerUser = 2;

    uint256 public constant maxPricePerItem = 1 ether;
    uint256 public constant pricePerItem = 0.02 ether;

    bool public paused;
    string public baseURI;

    mapping(address => bool) private admins;
    Level[] public levels;

    mapping(uint256 => bytes32) private answers;

    constructor(string memory uri) ERC721A("Binny", "BINNY") {
        baseURI = uri;
        paused = true;
        admins[msg.sender] = true;
    }
    
    modifier onlyAdmin(address account) {
        require(account != address(0));
        require(admins[msg.sender]);
        _;
    }

    modifier whenPaused() {
        require(paused);
        _;
    }

    function setPaused(bool state) public onlyOwner {
        paused = state;
    }

    function _baseURI() internal view override  returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory uri) public onlyOwner {
        baseURI = uri;
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    function changeAdminStatus(address account, bool status) external onlyOwner {
        require(account != address(0));
        admins[account] = status;
    }

    function createLevel(bytes32 hash) public whenPaused onlyAdmin(msg.sender) {
        Level storage level = levels.push(); 
        level.initialized = true;
        
        uint levelIndex = levels.length - 1;
        level.id = levelIndex;
        
        answers[levelIndex] = hash;
    }

    function checkAnswer(uint256 levelIndex, string memory guess) public view returns (bool) {
        bytes32 answer = answers[levelIndex];
        require(answer != bytes32(0), "Answer not set for this level");

        bytes memory g = bytes(guess);
        
        return keccak256(g) == keccak256(abi.encodePacked(answer, msg.sender));
    }

    function canMintWithoutAnswer(uint levelIndex, uint quantity) internal returns (bool) {
        Level storage level = levels[levelIndex];
        return (msg.value >= quantity.mul(maxPricePerItem)) && (level.mintsWithoutAnswer.add(quantity) <= maxPurchasesWithoutAnswerPerLevel);
    }

    function canMintWithAnswer(uint levelIndex, string memory guess, uint quantity) internal returns (bool) {
        require(msg.value >= quantity.mul(pricePerItem), "Insufficient transaction value");
        return checkAnswer(levelIndex, guess);
    }

    function mint(uint levelIndex, string memory guess, uint quantity) external payable {
        require(!paused);
        require(!isContract(msg.sender));

        uint supply = totalSupply();
        require(supply < totalItems, "Sorry, all Items are sold out.");

        Level storage currentLevel = levels[levelIndex];

        require(currentLevel.initialized, "Unknown level");
        require(currentLevel.mintsSoFar != itemsPerLevel, "All items have been minted for this level");
        require(currentLevel.mintsSoFar.add(quantity) <= itemsPerLevel, "Not enough minteable items for this level");

        require(quantity > 0 && currentLevel.purchasesPerOwner[msg.sender].add(quantity) <= maxPurchasePerLevelPerUser, "Max purchase limit for user reached for this level.");

        bool mintWithoutAnswer = canMintWithoutAnswer(levelIndex, quantity);

        if (mintWithoutAnswer) {
            currentLevel.mintsWithoutAnswer = currentLevel.mintsWithoutAnswer.add(quantity);
        } else {
            require(canMintWithAnswer(levelIndex, guess, quantity), "Incorrect answer");
        }

        currentLevel.mintsSoFar = currentLevel.mintsSoFar.add(quantity);
        currentLevel.purchasesPerOwner[msg.sender] = currentLevel.purchasesPerOwner[msg.sender].add(quantity);

        
        _safeMint(msg.sender, quantity);
    }

    function withdraw() public onlyOwner {
        uint balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }
}

