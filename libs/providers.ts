import { ethers } from "ethers";
import { CurrentConfig } from "./config";

// Provider Functions

export function getProvider(): ethers.Provider {
  return new ethers.JsonRpcProvider(CurrentConfig.rpc.mainnet);
}
