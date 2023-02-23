import JSBI from "jsbi";
import {
  Currency,
  CurrencyAmount,
  Percent,
  SupportedChainId,
  Token,
  TradeType,
} from "@uniswap/sdk-core";
import {
  computePairAddress,
  Pair,
  Trade as TradeV2,
  Route as RouteV2,
} from "@uniswap/v2-sdk";
import {
  FeeAmount,
  nearestUsableTick,
  Pool,
  TickMath,
  TICK_SPACINGS,
  Trade as TradeV3,
  Route as RouteV3,
  SwapQuoter,
} from "@uniswap/v3-sdk";
import {
  MixedRouteTrade,
  MixedRouteSDK as MixedRoute,
  Trade as RouterTrade,
} from "@uniswap/router-sdk";
import {
  SwapOptions,
  SwapRouter,
  UniswapTrade,
  UNIVERSAL_ROUTER_ADDRESS,
} from "@uniswap/universal-router-sdk";
import IUniswapV3Pool from "@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json";
import { ethers } from "ethers";

import { getProvider } from "./libs/providers";
import { USDC_TOKEN, COMP_TOKEN, WETH_TOKEN } from "./libs/constants";
const V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const V2_ABI = [
  {
    constant: true,
    inputs: [],
    name: "getReserves",
    outputs: [
      {
        internalType: "uint112",
        name: "reserve0",
        type: "uint112",
      },
      {
        internalType: "uint112",
        name: "reserve1",
        type: "uint112",
      },
      {
        internalType: "uint32",
        name: "blockTimestampLast",
        type: "uint32",
      },
    ],
    payable: false,
    stateMutability: "view",
    type: "function",
  },
];

const FORK_BLOCK = 16075500;

type UniswapPools = {
  [key: string]: Pair | Pool;
};

export async function getPair(
  tokenA: Token,
  tokenB: Token,
  blockNumber: number
): Promise<Pair> {
  const pairAddress = computePairAddress({
    factoryAddress: V2_FACTORY,
    tokenA,
    tokenB,
  });
  const contract = new ethers.Contract(pairAddress, V2_ABI, getProvider());
  const { reserve0, reserve1 } = await contract.getReserves({
    blockTag: blockNumber,
  });
  const [token0, token1] = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks
  return new Pair(
    CurrencyAmount.fromRawAmount(token0, reserve0.toString()),
    CurrencyAmount.fromRawAmount(token1, reserve1.toString())
  );
}

export async function getPool(
  tokenA: Token,
  tokenB: Token,
  feeAmount: FeeAmount,
  blockNumber: number
): Promise<Pool> {
  const [token0, token1] = tokenA.sortsBefore(tokenB)
    ? [tokenA, tokenB]
    : [tokenB, tokenA]; // does safety checks
  const poolAddress = Pool.getAddress(token0, token1, feeAmount);
  const contract = new ethers.Contract(
    poolAddress,
    IUniswapV3Pool.abi,
    getProvider()
  );
  let liquidity = await contract.liquidity({ blockTag: blockNumber });
  let { sqrtPriceX96, tick } = await contract.slot0({ blockTag: blockNumber });
  liquidity = JSBI.BigInt(liquidity.toString());
  sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96.toString());

  return new Pool(
    token0,
    token1,
    feeAmount,
    sqrtPriceX96,
    liquidity,
    Number(tick),
    [
      {
        index: nearestUsableTick(TickMath.MIN_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: liquidity,
        liquidityGross: liquidity,
      },
      {
        index: nearestUsableTick(TickMath.MAX_TICK, TICK_SPACINGS[feeAmount]),
        liquidityNet: JSBI.multiply(liquidity, JSBI.BigInt("-1")),
        liquidityGross: liquidity,
      },
    ]
  );
}

export async function getUniswapPools(
  tokenIn: Token,
  tokenOut: Token,
  forkBlock?: number
): Promise<UniswapPools> {
  const fork = forkBlock ?? FORK_BLOCK;

  const V2 = await getPair(tokenIn, tokenOut, fork);
  const V3 = await getPool(tokenIn, tokenOut, FeeAmount.MEDIUM, fork);
  // const V3_LOW_FEE = await getPool(tokenIn, tokenOut, FeeAmount.LOW, fork);

  return {
    V2,
    V3,
    // V3_LOW_FEE,
  };
}

// alternative constructor to create from protocol-specific sdks
export function buildTrade(
  trades: (
    | TradeV2<Currency, Currency, TradeType>
    | TradeV3<Currency, Currency, TradeType>
    | MixedRouteTrade<Currency, Currency, TradeType>
  )[]
): RouterTrade<Currency, Currency, TradeType> {
  return new RouterTrade({
    v2Routes: trades
      .filter((trade) => trade instanceof TradeV2)
      .map((trade) => ({
        routev2: trade.route as RouteV2<Currency, Currency>,
        inputAmount: trade.inputAmount,
        outputAmount: trade.outputAmount,
      })),
    v3Routes: trades
      .filter((trade) => trade instanceof TradeV3)
      .map((trade) => ({
        routev3: trade.route as RouteV3<Currency, Currency>,
        inputAmount: trade.inputAmount,
        outputAmount: trade.outputAmount,
      })),
    mixedRoutes: trades
      .filter((trade) => trade instanceof MixedRouteTrade)
      .map((trade) => ({
        mixedRoute: trade.route as MixedRoute<Currency, Currency>,
        inputAmount: trade.inputAmount,
        outputAmount: trade.outputAmount,
      })),
    tradeType: trades[0].tradeType,
  });
}

// use some sane defaults
export function swapOptions(options: Partial<SwapOptions>): SwapOptions {
  return Object.assign(
    {
      slippageTolerance: new Percent(5, 100),
    },
    options
  );
}

async function getAmountOut() {
  const { V2, V3 } = await getUniswapPools(USDC_TOKEN, COMP_TOKEN);

  const amountIn = ethers.parseEther("2000").toString();
  // const trade = new TradeV2(
  //   new RouteV2([V2 as Pair], USDC_TOKEN, COMP_TOKEN),
  //   CurrencyAmount.fromRawAmount(USDC_TOKEN, amountIn),
  //   TradeType.EXACT_INPUT
  // )
  const trade = await TradeV3.fromRoute(
    new RouteV3([V3 as Pool], USDC_TOKEN, COMP_TOKEN),
    CurrencyAmount.fromRawAmount(USDC_TOKEN, amountIn),
    TradeType.EXACT_INPUT
  );
  const opts = swapOptions({
    recipient: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  });

  // Use the raw calldata and value returned to call into Universal Swap Router contracts
  const { calldata, value } = SwapRouter.swapCallParameters(
    new UniswapTrade(buildTrade([trade]), opts)
  );

  const universalRouterAddress = UNIVERSAL_ROUTER_ADDRESS(
    SupportedChainId.MAINNET
  );
  console.log(calldata, value, universalRouterAddress);
}

getAmountOut();
