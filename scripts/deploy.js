import hre from "hardhat";

const { ethers } = hre;

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // 1. 部署 MiniswapFactory
    const MiniswapFactory = await ethers.getContractFactory("MiniswapFactory");
    const factory = await MiniswapFactory.deploy();
    await factory.waitForDeployment();
    console.log("MiniswapFactory deployed to:", await factory.getAddress());

    // 2. 部署或获取 WETH 地址
    console.log("No WETH_ADDRESS provided, deploying a mock WETH9...");
    const WETH9 = await ethers.getContractFactory("WETH9");
    const weth = await WETH9.deploy();
    await weth.waitForDeployment();
    const wethAddress = await weth.getAddress();
    console.log("Mock WETH9 deployed to:", wethAddress);


    // 3. 部署 MiniswapRouter
    const MiniswapRouter = await ethers.getContractFactory("MiniswapRouter");
    const router = await MiniswapRouter.deploy(await factory.getAddress(), wethAddress);
    await router.waitForDeployment();
    console.log("MiniswapRouter deployed to:", await router.getAddress());

    console.log("\nDeployment completed successfully!");
    console.log("=================================");
    console.log("Factory:", await factory.getAddress());
    console.log("WETH:", wethAddress);
    console.log("Router:", await router.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });