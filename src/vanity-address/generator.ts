import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ethers } from "ethers";
import { z } from "zod";
import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface VanityResult {
  address: string;
  privateKey: string;
  attempts: number;
  timeMs: number;
}

export class VanityAddressGenerator {
  registerWithServer(server: McpServer) {
    server.registerTool(
      "generate-vanity-address",
      {
        title: "Generate Ethereum Vanity Address",
        description: "Generate Ethereum addresses matching specified prefix and suffix patterns with concurrent computation",
        inputSchema: {
          prefix: z.string().optional().describe("Address prefix (without 0x), e.g., '1234'"),
          suffix: z.string().optional().describe("Address suffix, e.g., 'abcd'"),
          workers: z.number().min(1).max(16).default(4).describe("Number of concurrent worker threads, default 4"),
          caseSensitive: z.boolean().default(false).describe("Whether to match case-sensitively, default false")
        }
      },
      async ({ prefix, suffix, workers = 4, caseSensitive = false }) => {
        if (!prefix && !suffix) {
          return {
            content: [{
              type: "text",
              text: "Error: Must specify at least one of prefix or suffix"
            }],
            isError: true
          };
        }

        try {
          const result = await this.generateVanityAddress({
            prefix: prefix?.toLowerCase(),
            suffix: suffix?.toLowerCase(),
            workers,
            caseSensitive
          });

          return {
            content: [{
              type: "text",
              text: `✅ Successfully generated vanity address!

🔹 Address: ${result.address}
🔹 Private Key: ${result.privateKey}
🔹 Attempts: ${result.attempts.toLocaleString()}
🔹 Time Taken: ${(result.timeMs / 1000).toFixed(2)} seconds
🔹 Hash Rate: ${Math.round(result.attempts / (result.timeMs / 1000)).toLocaleString()} addresses/sec

⚠️  Please keep the private key secure and never share it with others!`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error generating vanity address: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    server.registerTool(
      "validate-ethereum-address",
      {
        title: "Validate Ethereum Address",
        description: "Validate the validity of an Ethereum address",
        inputSchema: {
          address: z.string().describe("Ethereum address to validate")
        }
      },
      async ({ address }) => {
        try {
          const isValid = ethers.isAddress(address);
          const checksumAddress = isValid ? ethers.getAddress(address) : null;
          
          return {
            content: [{
              type: "text",
              text: `Address validation result:
🔹 Original Address: ${address}
🔹 Valid: ${isValid ? '✅ Valid' : '❌ Invalid'}
${checksumAddress ? `🔹 Checksum Address: ${checksumAddress}` : ''}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error validating address: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private async generateVanityAddress(options: {
    prefix?: string;
    suffix?: string;
    workers: number;
    caseSensitive: boolean;
  }): Promise<VanityResult> {
    const startTime = Date.now();
    const workers: Worker[] = [];
    let totalAttempts = 0;
    let found = false;
    let result: VanityResult | null = null;

    return new Promise((resolve, reject) => {
      for (let i = 0; i < options.workers; i++) {
        const worker = new Worker(join(__dirname, 'worker.js'), {
          workerData: {
            prefix: options.prefix,
            suffix: options.suffix,
            caseSensitive: options.caseSensitive,
            workerId: i
          }
        });

        worker.on('message', (data) => {
          if (data.type === 'found' && !found) {
            found = true;
            result = {
              address: data.address,
              privateKey: data.privateKey,
              attempts: totalAttempts + data.attempts,
              timeMs: Date.now() - startTime
            };
            
            workers.forEach(w => w.terminate());
            resolve(result);
          } else if (data.type === 'progress') {
            totalAttempts += data.attempts;
          }
        });

        worker.on('error', (error) => {
          if (!found) {
            workers.forEach(w => w.terminate());
            reject(error);
          }
        });

        workers.push(worker);
      }

      setTimeout(() => {
        if (!found) {
          workers.forEach(w => w.terminate());
          reject(new Error('Generation timeout, try reducing difficulty or increasing worker threads'));
        }
      }, 300000);
    });
  }
} 