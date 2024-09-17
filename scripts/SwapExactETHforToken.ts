import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main() {

    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const WETH = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const DAI = "0xFbE6F37d3db3fc939F665cfe21238c11a5447831";

    const TOKEN_HOLDER = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";
  
    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    const WETH_Contract = await ethers.getContractAt("IERC20", WETH, impersonatedSigner);

    const amountOutMin = ethers.parseUnits("0.001", 18);
    const deadline = Math.floor(Date.now() / 1000) + (60 * 10);
  
    const path = [WETH, DAI];

    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

    await WETH_Contract.approve(ROUTER, ethers.parseEther("2") );

    console.log("Starting ETH to DAI swap process...");
    
    const swapTx = await ROUTER.swapExactETHForTokens(
        amountOutMin,
        path,
        impersonatedSigner.address,
        deadline,
        { value: ethers.parseEther("0.1") }  
    );

    await swapTx.wait();
    console.log("Swap Tx:", swapTx);
    console.log("ETH to DAI swap completed successfully. 🤞");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});