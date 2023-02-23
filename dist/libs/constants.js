"use strict";
// This file stores web3 related constants such as addresses, token definitions, ETH currency references and ABI's
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMP_TOKEN = exports.DAI_TOKEN = exports.USDC_TOKEN = exports.WETH_TOKEN = exports.ETHER = exports.QUOTER_CONTRACT_ADDRESS = exports.POOL_FACTORY_CONTRACT_ADDRESS = void 0;
const sdk_core_1 = require("@uniswap/sdk-core");
// Addresses
exports.POOL_FACTORY_CONTRACT_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
exports.QUOTER_CONTRACT_ADDRESS = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";
// Currencies and Tokens
exports.ETHER = sdk_core_1.Ether.onChain(1);
exports.WETH_TOKEN = new sdk_core_1.Token(sdk_core_1.SupportedChainId.MAINNET, "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", 18, "WETH", "Wrapped Ether");
exports.USDC_TOKEN = new sdk_core_1.Token(sdk_core_1.SupportedChainId.MAINNET, "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", 6, "USDC", "USD Coin");
exports.DAI_TOKEN = new sdk_core_1.Token(sdk_core_1.SupportedChainId.MAINNET, "0x6B175474E89094C44Da98b954EedeAC495271d0F", 18, "Dai", "dai");
exports.COMP_TOKEN = new sdk_core_1.Token(sdk_core_1.SupportedChainId.MAINNET, "0xc00e94cb662c3520282e6f5717214004a7f26888", 18, "COMP", "Compound");
