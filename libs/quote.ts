import { ethers } from "ethers";
import { computePoolAddress } from "@uniswap/v3-sdk";
import { Token } from "@uniswap/sdk-core";
import Quoter from "@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json";
import IUniswapV3PoolABI from "@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json";

import {
  POOL_FACTORY_CONTRACT_ADDRESS,
  QUOTER_CONTRACT_ADDRESS,
} from "../libs/constants";
import { getProvider } from "./providers";
import { toReadableAmount, fromReadableAmount } from "./conversion";

export async function getAmountOut(
  tokenIn: Token,
  amountIn: number,
  tokenOut: Token,
  poolFee: number
): Promise<string> {
  const quoterContract = new ethers.Contract(
    QUOTER_CONTRACT_ADDRESS,
    Quoter.abi,
    getProvider()
  );
  const poolConstants = await getPoolConstants(tokenIn, tokenOut, poolFee);

  const quotedAmountOut = await quoterContract.quoteExactInputSingle.staticCall(
    poolConstants.token0,
    poolConstants.token1,
    poolConstants.fee,
    fromReadableAmount(amountIn, tokenIn.decimals).toString(),
    0
  );
  console.log(quotedAmountOut, "---");

  return toReadableAmount(quotedAmountOut, tokenOut.decimals);
}

async function getPoolConstants(
  tokenIn: Token,
  tokenOut: Token,
  poolFee: number
): Promise<{
  token0: string;
  token1: string;
  fee: number;
}> {
  const currentPoolAddress = computePoolAddress({
    factoryAddress: POOL_FACTORY_CONTRACT_ADDRESS,
    tokenA: tokenIn,
    tokenB: tokenOut,
    fee: poolFee,
  });

  const poolContract = new ethers.Contract(
    currentPoolAddress,
    IUniswapV3PoolABI.abi,
    getProvider()
  );
  const [token0, token1, fee] = await Promise.all([
    poolContract.token0(),
    poolContract.token1(),
    poolContract.fee(),
  ]);

  return {
    token0,
    token1,
    fee,
  };
}
