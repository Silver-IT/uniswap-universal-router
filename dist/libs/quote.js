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
exports.getAmountOut = void 0;
const ethers_1 = require("ethers");
const v3_sdk_1 = require("@uniswap/v3-sdk");
const Quoter_json_1 = __importDefault(require("@uniswap/v3-periphery/artifacts/contracts/lens/Quoter.sol/Quoter.json"));
const IUniswapV3Pool_json_1 = __importDefault(require("@uniswap/v3-core/artifacts/contracts/interfaces/IUniswapV3Pool.sol/IUniswapV3Pool.json"));
const constants_1 = require("../libs/constants");
const providers_1 = require("./providers");
const conversion_1 = require("./conversion");
function getAmountOut(tokenIn, amountIn, tokenOut, poolFee) {
    return __awaiter(this, void 0, void 0, function* () {
        const quoterContract = new ethers_1.ethers.Contract(constants_1.QUOTER_CONTRACT_ADDRESS, Quoter_json_1.default.abi, (0, providers_1.getProvider)());
        const poolConstants = yield getPoolConstants(tokenIn, tokenOut, poolFee);
        const quotedAmountOut = yield quoterContract.quoteExactInputSingle.staticCall(poolConstants.token0, poolConstants.token1, poolConstants.fee, (0, conversion_1.fromReadableAmount)(amountIn, tokenIn.decimals).toString(), 0);
        console.log(quotedAmountOut, "---");
        return (0, conversion_1.toReadableAmount)(quotedAmountOut, tokenOut.decimals);
    });
}
exports.getAmountOut = getAmountOut;
function getPoolConstants(tokenIn, tokenOut, poolFee) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentPoolAddress = (0, v3_sdk_1.computePoolAddress)({
            factoryAddress: constants_1.POOL_FACTORY_CONTRACT_ADDRESS,
            tokenA: tokenIn,
            tokenB: tokenOut,
            fee: poolFee,
        });
        const poolContract = new ethers_1.ethers.Contract(currentPoolAddress, IUniswapV3Pool_json_1.default.abi, (0, providers_1.getProvider)());
        const [token0, token1, fee] = yield Promise.all([
            poolContract.token0(),
            poolContract.token1(),
            poolContract.fee(),
        ]);
        return {
            token0,
            token1,
            fee,
        };
    });
}
