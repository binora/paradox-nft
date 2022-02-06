// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract paradox is ERC721A, Ownable {
    using SafeMath for uint256;

    struct Level {
        uint id;
        uint mintsSoFar;
        uint mintsWithoutAnswer;
        bool initialized;
        mapping(address => uint) purchasesPerOwner;
        string imageURL;
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

    mapping(uint256 => string) private answers;

    constructor(string memory uri) ERC721A("Binny", "BINNY") {
        baseURI = uri;
        paused = true;
        admins[msg.sender] = true;

        // create an empty level to start level indices from 1
        levels.push();
    }
    
    modifier onlyAdmin(address account) {
        require(account != address(0));
        require(admins[msg.sender]);
        _;
    }

    function isAdmin(address account) public view returns (bool) {
        return admins[account];
    }

    function changeAdminStatus(address account, bool status) external onlyOwner {
        require(account != address(0));
        admins[account] = status;
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

    function createLevel(string memory imageURL, string memory answerHash) public whenPaused onlyAdmin(msg.sender) {
        require(!isEmpty(imageURL));
        require(!isEmpty(answerHash));

        Level storage level = levels.push(); 
        uint levelIndex = levels.length - 1;

        level.id = levelIndex;
        level.initialized = true;
        level.imageURL = imageURL;

        answers[levelIndex] = answerHash;
    }

    function updateLevel(uint levelIndex, bool initialized, string memory imageURL) public whenPaused onlyAdmin(msg.sender) {
        require(levelIndex > 0 && levelIndex < levels.length);
        require(!isEmpty(imageURL));

        Level storage level = levels[levelIndex];
        level.initialized = initialized;
        level.imageURL = imageURL;
    }

    function checkAnswer(uint256 levelIndex, bytes32 guess) public view returns (bool) {
        require(levelIndex > 0 && levelIndex < levels.length);

        string memory answer = answers[levelIndex];
        require(!isEmpty(answer), "Answer not set for this level");

        return guess == keccak256(abi.encode(answer, msg.sender));
    }

    function canMintWithoutAnswer(uint levelIndex, uint quantity) internal view returns (bool) {
        Level storage level = levels[levelIndex];
        return (msg.value >= quantity.mul(maxPricePerItem)) && (level.mintsWithoutAnswer.add(quantity) <= maxPurchasesWithoutAnswerPerLevel);
    }

    function canMintWithAnswer(uint levelIndex, bytes32 guess, uint quantity) internal view returns (bool) {
        require(msg.value >= quantity.mul(pricePerItem), "Insufficient transaction value");
        return checkAnswer(levelIndex, guess);
    }

    function mint(uint levelIndex, bytes32 guess, uint quantity) external payable {
        require(!paused);
        require(!isContract(msg.sender));

        require(levelIndex > 0 && levelIndex < levels.length - 1);

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

    function isEmpty(string memory str) internal pure returns (bool) {
        bytes memory s = bytes(str);
        return s.length == 0;
    }
}

