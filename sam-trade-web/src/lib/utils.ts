import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export function parseAmount (amountStr:string):number{
  return Number(amountStr.replace(/[₹,]/g, ""));
};
