# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a Hardhat Ignition module that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat ignition deploy ./ignition/modules/Lock.js
```


npx hardhat run scripts/deploy.js --network localhost
(node:23672) [MODULE_TYPELESS_PACKAGE_JSON] Warning: Module type of file:///Users/wangdong/workspace/miniswap/scripts/deploy.js is not specified and it doesn't parse as CommonJS.
Reparsing as ES module because module syntax was detected. This incurs a performance overhead.
To eliminate this warning, add "type": "module" to /Users/wangdong/workspace/miniswap/package.json.
(Use `node --trace-warnings ...` to show where the warning was created)
Deploying contracts with account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
MiniswapFactory deployed to: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
No WETH_ADDRESS provided, deploying a mock WETH9...
Mock WETH9 deployed to: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
MiniswapRouter deployed to: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707

Deployment completed successfully!
=================================
Factory: 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9
WETH: 0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9
Router: 0x5FC8d32690cc91D4c39d9d3abcBD16989F875707