// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";
import "./RewardToken.sol";  // 引入积分合约

contract BuyMyRoom is ERC721, Ownable {

    RewardToken public rewardToken;
    uint256 public rate = 100; // 兑换比例，1ETH = 100积分
    // 事件声明
    event HouseListed(uint256 tokenId, uint256 price, address owner);
    event HousePurchased(uint256 tokenId, address newOwner, uint256 price);
    event HouseClaimed(uint256 tokenId, address owner);

    // 房屋结构体定义
    struct House {
        address owner;
        uint256 price;
        uint256 listedTimestamp;
        bool forSale;
    }

    // 房屋集合
    mapping(uint256 => House) public houses;
    uint256 public houseCount;
    uint256 public feeRate; // 固定手续费比例
    uint256 public maxSupply = 100; // 设置总的房屋供应量
    mapping(address => bool) public claimed; // 记录用户是否已领取

    // 构造函数
    constructor(uint256 _feeRate, address _rewardToken) ERC721("BuyMyRoom", "BMR") Ownable(msg.sender) {
        feeRate = _feeRate;
        rewardToken = RewardToken(_rewardToken);
    }
    // 使用以太币兑换积分
    function exchangeEthToPoints() external payable {
        uint256 tokenAmount = msg.value * rate;
        rewardToken.mint(msg.sender, tokenAmount);
    }

    // 使用积分购买房屋
    function buyHouseWithPoints(uint256 tokenId, uint256 priceInPoints) external {
        require(houses[tokenId].forSale, "House not for sale");
        require(rewardToken.balanceOf(msg.sender) >= priceInPoints, "Insufficient points");

        address previousOwner = ownerOf(tokenId);

        // 买家燃烧积分
        rewardToken.burn(msg.sender, priceInPoints);
        rewardToken.mint(previousOwner, priceInPoints);

        // 房屋转让逻辑
        _transfer(previousOwner, msg.sender, tokenId);
        houses[tokenId].forSale = false;
        houses[tokenId].listedTimestamp = 0;

        emit HousePurchased(tokenId, msg.sender, priceInPoints);
    }

    // 管理员创建新的房屋NFT并发放
    function mintHouse(address to) external onlyOwner {
        require(houseCount < maxSupply, "Max supply reached");
        uint256 tokenId = houseCount;
        _safeMint(to, tokenId);
        houses[tokenId] = House({
            owner: to,
            price: 0,
            listedTimestamp: 0,
            forSale: false
        });
        houseCount++;
    }

    // 用户免费领取房屋
    function claimHouse() external {
        require(!claimed[msg.sender], "You have already claimed a house");
        require(houseCount < maxSupply, "Max supply reached");

        uint256 tokenId = houseCount;
        _safeMint(msg.sender, tokenId);
        houses[tokenId] = House({
            owner: msg.sender,
            price: 0,
            listedTimestamp: 0,
            forSale: false
        });

        claimed[msg.sender] = true; // 标记为已领取
        houseCount++;

        emit HouseClaimed(tokenId, msg.sender);
    }

    // 房主挂牌出售房屋
    function listHouse(uint256 tokenId, uint256 price) external {
        require(ownerOf(tokenId) == msg.sender, "Only owner can list house");
        require(price > 0, "Price must be greater than zero");

        houses[tokenId].price = price;
        houses[tokenId].listedTimestamp = block.timestamp;
        houses[tokenId].forSale = true;

        emit HouseListed(tokenId, price, msg.sender);
    }

    // 购买房屋
    function buyHouse(uint256 tokenId) external payable {
        console.log("msg.value: = %s", msg.value);
        console.log("houses[tokenId].price: = %s", houses[tokenId].price);
        require(houses[tokenId].forSale, "House is not for sale");
        require(msg.value == houses[tokenId].price, "Incorrect payment");

        address previousOwner = ownerOf(tokenId);
        uint256 salePrice = houses[tokenId].price;
        uint256 fee = (block.timestamp - houses[tokenId].listedTimestamp) * feeRate * salePrice / 10000;
        console.log("fee: = %s", fee);
        // 将NFT转移给新拥有者
        _transfer(previousOwner, msg.sender, tokenId);

        // 更新房屋信息
        houses[tokenId].owner = msg.sender;
        houses[tokenId].forSale = false;
        houses[tokenId].listedTimestamp = 0;

        // 扣除手续费并转账
        payable(owner()).transfer(fee);
        payable(previousOwner).transfer(salePrice - fee);

        emit HousePurchased(tokenId, msg.sender, salePrice);
    }

    // 查看用户拥有的房屋列表
    function getOwnedHouses(address user) external view returns (uint256[] memory) {
        uint256[] memory ownedHouseIds = new uint256[](houseCount);
        uint256 counter = 0;

        for (uint256 i = 0; i < houseCount; i++) {
            if (ownerOf(i) == user) {
                ownedHouseIds[counter] = i;
                counter++;
            }
        }

        // Resize the array to fit
        uint256[] memory result = new uint256[](counter);
        for (uint256 j = 0; j < counter; j++) {
            result[j] = ownedHouseIds[j];
        }

        return result;
    }

    // 查看所有出售中的房屋
    function getAllListedHouses() external view returns (uint256[] memory) {
        uint256[] memory listedHouseIds = new uint256[](houseCount);
        uint256 counter = 0;

        for (uint256 i = 0; i < houseCount; i++) {
            if (houses[i].forSale) {
                listedHouseIds[counter] = i;
                counter++;
            }
        }

        uint256[] memory result = new uint256[](counter);
        for (uint256 j = 0; j < counter; j++) {
            result[j] = listedHouseIds[j];
        }

        return result;
    }

    function helloworld() pure external returns (string memory) {
        return "hello world";
    }
}
