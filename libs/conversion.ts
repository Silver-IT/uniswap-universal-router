import { ethers } from "ethers";

const READABLE_FORM_LEN = 4;

export function fromReadableAmount(
  amount: number,
  decimals: number
): ethers.BigNumberish {
  return ethers.parseUnits(amount.toString(), decimals);
}

export function toReadableAmount(rawAmount: number, decimals: number): string {
  return ethers.formatUnits(rawAmount, decimals).slice(0, READABLE_FORM_LEN);
}
