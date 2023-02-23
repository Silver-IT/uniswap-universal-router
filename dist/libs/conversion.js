"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toReadableAmount = exports.fromReadableAmount = void 0;
const ethers_1 = require("ethers");
const READABLE_FORM_LEN = 4;
function fromReadableAmount(amount, decimals) {
    return ethers_1.ethers.parseUnits(amount.toString(), decimals);
}
exports.fromReadableAmount = fromReadableAmount;
function toReadableAmount(rawAmount, decimals) {
    return ethers_1.ethers.formatUnits(rawAmount, decimals).slice(0, READABLE_FORM_LEN);
}
exports.toReadableAmount = toReadableAmount;
