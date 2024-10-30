import { ethers } from "hardhat";

async function main() {
  // 1. 部署 RewardToken 合约
  const RewardToken = await ethers.getContractFactory("RewardToken");
  const rewardToken = await RewardToken.deploy();
  await rewardToken.deployed();
  console.log(`RewardToken deployed to ${rewardToken.address}`);

  // 2. 部署 BuyMyRoom 合约，并传入 feeRate 和 RewardToken 地址
  const BuyMyRoom = await ethers.getContractFactory("BuyMyRoom");
  const feeRate = 1; // 设置 feeRate 值
  const buyMyRoom = await BuyMyRoom.deploy(feeRate, rewardToken.address as any); // 通过 as any 避免类型检查冲突
  await buyMyRoom.deployed();

  console.log(`BuyMyRoom deployed to ${buyMyRoom.address}`);
}

// 推荐使用这种模式以便在所有地方都能使用 async/await 并正确处理错误
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
