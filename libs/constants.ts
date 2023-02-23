// This file stores web3 related constants such as addresses, token definitions, ETH currency references and ABI's

import { Ether, SupportedChainId, Token } from "@uniswap/sdk-core";

// Addresses

export const POOL_FACTORY_CONTRACT_ADDRESS =
  "0x1F98431c8aD98523631AE4a59f267346ea31F984";
export const QUOTER_CONTRACT_ADDRESS =
  "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6";

// Currencies and Tokens

export const ETHER = Ether.onChain(1);

export const WETH_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  18,
  "WETH",
  "Wrapped Ether"
);

export const USDC_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  6,
  "USDC",
  "USD Coin"
);

export const DAI_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0x6B175474E89094C44Da98b954EedeAC495271d0F",
  18,
  "Dai",
  "dai"
);

export const COMP_TOKEN = new Token(
  SupportedChainId.MAINNET,
  "0xc00e94cb662c3520282e6f5717214004a7f26888",
  18,
  "COMP",
  "Compound"
);
