import hre from "hardhat";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const deploymentPath = path.join(__dirname, "../deployments.json");
  if (!fs.existsSync(deploymentPath)) {
    console.error("deployments.json not found. Please run deploy script first.");
    process.exit(1);
  }
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));

  const factoryAddress = deployment.factory;
  const routerAddress = deployment.router;
  const wethAddress = deployment.weth;

  console.log("Starting contract verification on network:", hre.network.name);

  // 验证 MiniswapFactory
  console.log("\n🔍 Verifying MiniswapFactory...");
  try {
    await hre.run("verify:verify", {
      address: factoryAddress,
      constructorArguments: [],
    });
    console.log("✅ Factory verified");
  } catch (e) {
    console.log("⚠️ Factory verification failed or already verified:", e.message);
  }

  // 等待几秒避免请求过于频繁
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 验证 MiniswapRouter
  console.log("\n🔍 Verifying MiniswapRouter...");
  try {
    await hre.run("verify:verify", {
      address: routerAddress,
      constructorArguments: [factoryAddress, wethAddress],
    });
    console.log("✅ Router verified");
  } catch (e) {
    console.log("⚠️ Router verification failed or already verified:", e.message);
  }

  // 可以根据需要决定是否验证 WETH9（通常是标准合约，可以不验证）
  const shouldVerifyWeth = !process.env.WETH_ADDRESS; // 只有当我们自己部署时才验证
  if (shouldVerifyWeth && wethAddress) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log("\n🔍 Verifying WETH9...");
    try {
      await hre.run("verify:verify", {
        address: wethAddress,
        constructorArguments: [],
      });
      console.log("✅ WETH9 verified");
    } catch (e) {
      console.log("⚠️ WETH9 verification failed or already verified:", e.message);
    }
  } else {
    console.log("\nℹ️ Skipping WETH9 verification (external address or not deployed).");
  }

  console.log("\n✅ Verification process completed!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });