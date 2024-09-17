import { ethers } from "hardhat";
const helpers = require("@nomicfoundation/hardhat-network-helpers");

async function main(){
    const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
    const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
    const DAI = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
    const PAIRED_HOLDER = "0xAE461cA67B15dc8dc81CE7615e0320dA1A9aB8D5"

    const TOKEN_HOLDER  = "0xf584F8728B874a6a5c7A8d4d387C9aae9172D621";
    await helpers.impersonateAccount(TOKEN_HOLDER);
    const impersonatedSigner = await ethers.getSigner(TOKEN_HOLDER);

    const amountADesired = ethers.parseUnits("30", 6);
    const amountBDesired = ethers.parseUnits("30", 18);

    const amountAMin = ethers.parseUnits("20", 6);
    const amountBMin = ethers.parseUnits("20", 18);
    const LiquidityAmount = ethers.parseUnits("0.00002", 18)

    const USDC_Contract = await ethers.getContractAt("IERC20", USDC, impersonatedSigner);
    const DAI_Contract = await ethers.getContractAt("IERC20", DAI, impersonatedSigner);
    const PAIR_Contract = await ethers.getContractAt("IERC20", PAIRED_HOLDER, impersonatedSigner)
    
    const ROUTER = await ethers.getContractAt("IUniswapV2Router", ROUTER_ADDRESS, impersonatedSigner);

    //checking initial before liquidity and final balance after liquidty

    //checking initial Balance
    const usdcInitialBal = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const daiInitialBal = await DAI_Contract.balanceOf(impersonatedSigner.address);
    console.log("USDC balance before adding liquidity", ethers.formatUnits(usdcInitialBal, 6)),
    console.log("DAI balance before adding liquidity", ethers.formatUnits(daiInitialBal, 18));


    //Approve the router to spend tokens
    await USDC_Contract.approve(ROUTER, amountADesired);
    await DAI_Contract.approve(ROUTER, amountBDesired);
    const deadline = Math.floor(Date.now() / 1000) + (60 * 10);

    
    //Add Liquidity Function
    const addLiquidityTx = await ROUTER.addLiquidity(
        USDC,
        DAI,
        amountADesired,
        amountBDesired,
        amountAMin,
        amountBMin,
        impersonatedSigner.address,
        deadline
    );
 
    await addLiquidityTx.wait(); //Wait for the transaction to be mined

    console.log("Liquidity added successfully!");

    // check lP token balance after adding liquidity
    const lpTokenBalAfterAdding = await PAIR_Contract.balanceOf(impersonatedSigner.address);
    console.log("LP Token balance after adding liquidity", ethers.formatUnits(lpTokenBalAfterAdding, 18));


    //Ensure sufficient LP tokens for removal
    if(lpTokenBalAfterAdding < (LiquidityAmount)) {
        console.error("Insufficient LP tokens to remove Liquidity");
        process.exitCode = 1
        return;
    }

    const usdcBalanceAfterAddingLiquidity = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const daiBalanceAfterAddingLiquidity = await DAI_Contract.balanceOf(impersonatedSigner.address);
    console.log("USDC balance before adding Liquidity", ethers.formatUnits(usdcBalanceAfterAddingLiquidity, 6));
    console.log("DAI balance before adding liquidity", ethers.formatUnits(daiBalanceAfterAddingLiquidity, 18));

    //Approve the router to spend LP tokens
    await PAIR_Contract.approve(ROUTER_ADDRESS, LiquidityAmount);

    //Remove Liquidity Function
    const removeLiquidityTx = await ROUTER.removeLiquidity(
        USDC,
        DAI,
        LiquidityAmount,
        amountAMin,
        amountBMin,
        impersonatedSigner.address,
        deadline

    );

    await removeLiquidityTx.wait(); //wait for the transaction to be mined

    //Check final balances
    const usdcBalAfter = await USDC_Contract.balanceOf(impersonatedSigner.address);
    const daiBalAfter = await DAI_Contract.balanceOf(impersonatedSigner.address);
    const lpTokenBalAfterRemoving = await PAIR_Contract.balanceOf(impersonatedSigner.address);
    
    console.log("USDC balance after removing liquidty", ethers.formatUnits(usdcBalAfter, 6));
    console.log("DAI balance after removing liquidity", ethers.formatUnits(daiBalAfter, 18));
    console.log("LP Token balance after adding liquidity", ethers.formatUnits(lpTokenBalAfterRemoving, 18));


}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});