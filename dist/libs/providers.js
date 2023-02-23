"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProvider = void 0;
const ethers_1 = require("ethers");
const config_1 = require("./config");
// Provider Functions
function getProvider() {
    return new ethers_1.ethers.JsonRpcProvider(config_1.CurrentConfig.rpc.mainnet);
}
exports.getProvider = getProvider;
