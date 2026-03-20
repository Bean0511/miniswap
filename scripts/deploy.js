import pkg from "hardhat";
const { ethers } = pkg;
import fs from "fs";
import path from "path";
import Url from "url";
const { fileURLToPath } = Url
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with account:", deployer.address);

    // 1. 部署 MiniswapFactory
    const MiniswapFactory = await ethers.getContractFactory("MiniswapFactory");
    const factory = await MiniswapFactory.deploy();
    await factory.waitForDeployment();
    const factoryAddress = await factory.getAddress();
    console.log("MiniswapFactory deployed to:", factoryAddress);

    // 2. 部署或获取 WETH 地址
    let wethAddress = process.env.WETH_ADDRESS;
    if (!wethAddress) {
        console.log("No WETH_ADDRESS provided, deploying a mock WETH9...");
        const WETH9 = await ethers.getContractFactory("WETH9");
        const weth = await WETH9.deploy();
        await weth.waitForDeployment();
        wethAddress = await weth.getAddress();
        console.log("Mock WETH9 deployed to:", wethAddress);
    } else {
        console.log("Using provided WETH address:", wethAddress);
    }

    // 3. 部署 MiniswapRouter
    const MiniswapRouter = await ethers.getContractFactory("MiniswapRouter");
    const router = await MiniswapRouter.deploy(factoryAddress, wethAddress);
    await router.waitForDeployment();
    const routerAddress = await router.getAddress();
    console.log("MiniswapRouter deployed to:", routerAddress);

    // 4. 保存地址到文件
    const deploymentData = {
        network: (await ethers.provider.getNetwork()).name,
        chainId: (await ethers.provider.getNetwork()).chainId.toString(),
        factory: factoryAddress,
        router: routerAddress,
        weth: wethAddress,
    };
    const deploymentPath = path.join(__dirname, "../deployments.json");
    fs.writeFileSync(deploymentPath, JSON.stringify(deploymentData, null, 2));
    console.log("Deployment addresses saved to deployments.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });