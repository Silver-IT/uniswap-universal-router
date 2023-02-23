"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.swapOptions = exports.buildTrade = exports.getUniswapPools = exports.getPool = exports.getPair = void 0;
const jsbi_1 = __importDefault(require("jsbi"));
const sdk_core_1 = require("@uniswap/sdk-core");
const v2_sdk_1 = require("@uniswap/v2-sdk");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const router_sdk_1 = require("@uniswap/router-sdk");
const universal_router_sdk_1 = require("@uniswap/universal-router-sdk");
const UniswapV3Pool_json_1 = __importDefault(require("@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json"));
const ethers_1 = require("ethers");
const providers_1 = require("./libs/providers");
const constants_1 = require("./libs/constants");
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
function getPair(tokenA, tokenB, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const pairAddress = (0, v2_sdk_1.computePairAddress)({
            factoryAddress: V2_FACTORY,
            tokenA,
            tokenB,
        });
        const contract = new ethers_1.ethers.Contract(pairAddress, V2_ABI, (0, providers_1.getProvider)());
        const { reserve0, reserve1 } = yield contract.getReserves({
            blockTag: blockNumber,
        });
        const [token0, token1] = tokenA.sortsBefore(tokenB)
            ? [tokenA, tokenB]
            : [tokenB, tokenA]; // does safety checks
        return new v2_sdk_1.Pair(sdk_core_1.CurrencyAmount.fromRawAmount(token0, reserve0.toString()), sdk_core_1.CurrencyAmount.fromRawAmount(token1, reserve1.toString()));
    });
}
exports.getPair = getPair;
function getPool(tokenA, tokenB, feeAmount, blockNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        const [token0, token1] = tokenA.sortsBefore(tokenB)
            ? [tokenA, tokenB]
            : [tokenB, tokenA]; // does safety checks
        const poolAddress = v3_sdk_1.Pool.getAddress(token0, token1, feeAmount);
        const contract = new ethers_1.ethers.Contract(poolAddress, UniswapV3Pool_json_1.default.abi, (0, providers_1.getProvider)());
        let liquidity = yield contract.liquidity({ blockTag: blockNumber });
        let { sqrtPriceX96, tick } = yield contract.slot0({ blockTag: blockNumber });
        liquidity = jsbi_1.default.BigInt(liquidity.toString());
        sqrtPriceX96 = jsbi_1.default.BigInt(sqrtPriceX96.toString());
        return new v3_sdk_1.Pool(token0, token1, feeAmount, sqrtPriceX96, liquidity, Number(tick), [
            {
                index: (0, v3_sdk_1.nearestUsableTick)(v3_sdk_1.TickMath.MIN_TICK, v3_sdk_1.TICK_SPACINGS[feeAmount]),
                liquidityNet: liquidity,
                liquidityGross: liquidity,
            },
            {
                index: (0, v3_sdk_1.nearestUsableTick)(v3_sdk_1.TickMath.MAX_TICK, v3_sdk_1.TICK_SPACINGS[feeAmount]),
                liquidityNet: jsbi_1.default.multiply(liquidity, jsbi_1.default.BigInt("-1")),
                liquidityGross: liquidity,
            },
        ]);
    });
}
exports.getPool = getPool;
function getUniswapPools(tokenIn, tokenOut, forkBlock) {
    return __awaiter(this, void 0, void 0, function* () {
        const fork = forkBlock !== null && forkBlock !== void 0 ? forkBlock : FORK_BLOCK;
        const V2 = yield getPair(tokenIn, tokenOut, fork);
        const V3 = yield getPool(tokenIn, tokenOut, v3_sdk_1.FeeAmount.MEDIUM, fork);
        // const V3_LOW_FEE = await getPool(tokenIn, tokenOut, FeeAmount.LOW, fork);
        return {
            V2,
            V3,
            // V3_LOW_FEE,
        };
    });
}
exports.getUniswapPools = getUniswapPools;
// alternative constructor to create from protocol-specific sdks
function buildTrade(trades) {
    return new router_sdk_1.Trade({
        v2Routes: trades
            .filter((trade) => trade instanceof v2_sdk_1.Trade)
            .map((trade) => ({
            routev2: trade.route,
            inputAmount: trade.inputAmount,
            outputAmount: trade.outputAmount,
        })),
        v3Routes: trades
            .filter((trade) => trade instanceof v3_sdk_1.Trade)
            .map((trade) => ({
            routev3: trade.route,
            inputAmount: trade.inputAmount,
            outputAmount: trade.outputAmount,
        })),
        mixedRoutes: trades
            .filter((trade) => trade instanceof router_sdk_1.MixedRouteTrade)
            .map((trade) => ({
            mixedRoute: trade.route,
            inputAmount: trade.inputAmount,
            outputAmount: trade.outputAmount,
        })),
        tradeType: trades[0].tradeType,
    });
}
exports.buildTrade = buildTrade;
// use some sane defaults
function swapOptions(options) {
    return Object.assign({
        slippageTolerance: new sdk_core_1.Percent(5, 100),
    }, options);
}
exports.swapOptions = swapOptions;
function getAmountOut() {
    return __awaiter(this, void 0, void 0, function* () {
        const { V2, V3 } = yield getUniswapPools(constants_1.USDC_TOKEN, constants_1.COMP_TOKEN);
        const amountIn = ethers_1.ethers.parseEther("2000").toString();
        // const trade = new TradeV2(
        //   new RouteV2([V2 as Pair], USDC_TOKEN, COMP_TOKEN),
        //   CurrencyAmount.fromRawAmount(USDC_TOKEN, amountIn),
        //   TradeType.EXACT_INPUT
        // )
        const trade = yield v3_sdk_1.Trade.fromRoute(new v3_sdk_1.Route([V3], constants_1.USDC_TOKEN, constants_1.COMP_TOKEN), sdk_core_1.CurrencyAmount.fromRawAmount(constants_1.USDC_TOKEN, amountIn), sdk_core_1.TradeType.EXACT_INPUT);
        const opts = swapOptions({
            recipient: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        });
        // Use the raw calldata and value returned to call into Universal Swap Router contracts
        const { calldata, value } = universal_router_sdk_1.SwapRouter.swapCallParameters(new universal_router_sdk_1.UniswapTrade(buildTrade([trade]), opts));
        const universalRouterAddress = (0, universal_router_sdk_1.UNIVERSAL_ROUTER_ADDRESS)(sdk_core_1.SupportedChainId.MAINNET);
        console.log(calldata, value, universalRouterAddress);
    });
}
getAmountOut();
