import { parentPort, workerData } from 'worker_threads';
import { ethers } from 'ethers';

interface WorkerData {
  prefix?: string;
  suffix?: string;
  caseSensitive: boolean;
  workerId: number;
}

const { prefix, suffix, caseSensitive, workerId } = workerData as WorkerData;

let attempts = 0;
const progressInterval = 10000;

function matchesPattern(address: string, targetPrefix?: string, targetSuffix?: string, isCaseSensitive?: boolean): boolean {
  const addr = isCaseSensitive ? address : address.toLowerCase();
  const addrWithoutPrefix = addr.slice(2);
  
  let prefixMatch = true;
  let suffixMatch = true;
  
  if (targetPrefix) {
    prefixMatch = addrWithoutPrefix.startsWith(targetPrefix);
  }
  
  if (targetSuffix) {
    suffixMatch = addrWithoutPrefix.endsWith(targetSuffix);
  }
  
  return prefixMatch && suffixMatch;
}

function generateAndCheck(): void {
  while (true) {
    const wallet = ethers.Wallet.createRandom();
    attempts++;
    
    if (matchesPattern(wallet.address, prefix, suffix, caseSensitive)) {
      parentPort?.postMessage({
        type: 'found',
        address: wallet.address,
        privateKey: wallet.privateKey,
        attempts: attempts
      });
      break;
    }
    
    if (attempts % progressInterval === 0) {
      parentPort?.postMessage({
        type: 'progress',
        attempts: progressInterval,
        workerId: workerId
      });
      attempts = 0;
    }
  }
}

generateAndCheck(); 