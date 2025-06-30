import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ethers } from "ethers";

interface ChainConfig {
  name: string;
  chainId: number;
  rpcUrl: string;
  symbol: string;
  explorerUrl?: string;
}

const DEFAULT_CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    name: "Ethereum Mainnet",
    chainId: 1,
    rpcUrl: "https://rpc.ankr.com/eth",
    symbol: "ETH",
    explorerUrl: "https://etherscan.io"
  },
  polygon: {
    name: "Polygon",
    chainId: 137,
    rpcUrl: "https://rpc.ankr.com/polygon",
    symbol: "MATIC",
    explorerUrl: "https://polygonscan.com"
  },
  bsc: {
    name: "BSC",
    chainId: 56,
    rpcUrl: "https://rpc.ankr.com/bsc",
    symbol: "BNB",
    explorerUrl: "https://bscscan.com"
  },
  arbitrum: {
    name: "Arbitrum One",
    chainId: 42161,
    rpcUrl: "https://rpc.ankr.com/arbitrum",
    symbol: "ETH",
    explorerUrl: "https://arbiscan.io"
  },
  optimism: {
    name: "Optimism",
    chainId: 10,
    rpcUrl: "https://rpc.ankr.com/optimism",
    symbol: "ETH",
    explorerUrl: "https://optimistic.etherscan.io"
  },
  avalanche: {
    name: "Avalanche C-Chain",
    chainId: 43114,
    rpcUrl: "https://rpc.ankr.com/avalanche",
    symbol: "AVAX",
    explorerUrl: "https://snowtrace.io"
  },
  fantom: {
    name: "Fantom",
    chainId: 250,
    rpcUrl: "https://rpc.ankr.com/fantom",
    symbol: "FTM",
    explorerUrl: "https://ftmscan.com"
  },
  sepolia: {
    name: "Sepolia Testnet",
    chainId: 11155111,
    rpcUrl: "https://rpc.ankr.com/eth_sepolia",
    symbol: "ETH",
    explorerUrl: "https://sepolia.etherscan.io"
  }
};

export class RpcService {
  private providers: Map<string, ethers.JsonRpcProvider> = new Map();

  constructor() {
    // Initialize providers for all default chains
    for (const [key, config] of Object.entries(DEFAULT_CHAINS)) {
      this.providers.set(key, new ethers.JsonRpcProvider(config.rpcUrl));
    }
  }

  registerWithServer(server: McpServer) {
    server.registerTool(
      "static-call",
      {
        title: "Static Call",
        description: "Make a static call to a smart contract on any EVM-compatible chain (read-only)",
        inputSchema: {
          chain: z.string().describe(`Chain identifier. Available: ${Object.keys(DEFAULT_CHAINS).join(', ')}`),
          to: z.string().describe("Contract address to call"),
          data: z.string().describe("ABI-encoded function call data"),
          blockTag: z.string().optional().describe("Block tag (latest, earliest, pending, or block number)").default("latest")
        }
      },
      async ({ chain, to, data, blockTag = "latest" }) => {
        try {
          const chainConfig = DEFAULT_CHAINS[chain.toLowerCase()];
          if (!chainConfig) {
            return {
              content: [{
                type: "text",
                text: `Error: Unsupported chain "${chain}". Available chains: ${Object.keys(DEFAULT_CHAINS).join(', ')}`
              }],
              isError: true
            };
          }

          if (!ethers.isAddress(to)) {
            return {
              content: [{
                type: "text",
                text: `Error: Invalid contract address: ${to}`
              }],
              isError: true
            };
          }

          const provider = this.providers.get(chain.toLowerCase());
          if (!provider) {
            return {
              content: [{
                type: "text",
                text: `Error: Provider not initialized for chain: ${chain}`
              }],
              isError: true
            };
          }

          const result = await provider.call({
            to: to,
            data: data
          });

          return {
            content: [{
              type: "text",
              text: `Static call result:

🔗 Chain: ${chainConfig.name} (${chainConfig.chainId})
📄 Contract: ${to}
📊 Call Data: ${data}
🏷️ Block: ${blockTag}

📤 Result: ${result}

${chainConfig.explorerUrl ? `🔍 Explorer: ${chainConfig.explorerUrl}/address/${to}` : ''}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error making static call: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    server.registerTool(
      "send-transaction",
      {
        title: "Send Transaction",
        description: "Send a transaction to a smart contract on any EVM-compatible chain (requires private key)",
        inputSchema: {
          chain: z.string().describe(`Chain identifier. Available: ${Object.keys(DEFAULT_CHAINS).join(', ')}`),
          to: z.string().describe("Contract address to call"),
          data: z.string().describe("ABI-encoded function call data"),
          value: z.string().optional().describe("ETH value to send (in wei)").default("0"),
          gasLimit: z.string().optional().describe("Gas limit for the transaction"),
          gasPrice: z.string().optional().describe("Gas price (in wei)"),
          privateKey: z.string().describe("Private key of the sender (will be handled securely)")
        }
      },
      async ({ chain, to, data, value = "0", gasLimit, gasPrice, privateKey }) => {
        try {
          const chainConfig = DEFAULT_CHAINS[chain.toLowerCase()];
          if (!chainConfig) {
            return {
              content: [{
                type: "text",
                text: `Error: Unsupported chain "${chain}". Available chains: ${Object.keys(DEFAULT_CHAINS).join(', ')}`
              }],
              isError: true
            };
          }

          if (!ethers.isAddress(to)) {
            return {
              content: [{
                type: "text",
                text: `Error: Invalid contract address: ${to}`
              }],
              isError: true
            };
          }

          // Validate private key
          let wallet: ethers.Wallet;
          try {
            wallet = new ethers.Wallet(privateKey);
          } catch {
            return {
              content: [{
                type: "text",
                text: "Error: Invalid private key format"
              }],
              isError: true
            };
          }

          const provider = this.providers.get(chain.toLowerCase());
          if (!provider) {
            return {
              content: [{
                type: "text",
                text: `Error: Provider not initialized for chain: ${chain}`
              }],
              isError: true
            };
          }

          const connectedWallet = wallet.connect(provider);

          // Prepare transaction
          const tx: any = {
            to: to,
            data: data,
            value: value
          };

          if (gasLimit) {
            tx.gasLimit = gasLimit;
          }

          if (gasPrice) {
            tx.gasPrice = gasPrice;
          }

          // Get current nonce and balance
          const [nonce, balance] = await Promise.all([
            connectedWallet.getNonce(),
            provider.getBalance(wallet.address)
          ]);

          // Estimate gas if not provided
          if (!gasLimit) {
            try {
              const estimatedGas = await connectedWallet.estimateGas(tx);
              tx.gasLimit = estimatedGas;
            } catch (error) {
              return {
                content: [{
                  type: "text",
                  text: `Error estimating gas: ${error instanceof Error ? error.message : String(error)}`
                }],
                isError: true
              };
            }
          }

          // Send transaction
          const txResponse = await connectedWallet.sendTransaction(tx);

          return {
            content: [{
              type: "text",
              text: `Transaction sent successfully!

🔗 Chain: ${chainConfig.name} (${chainConfig.chainId})
📄 Contract: ${to}
👤 From: ${wallet.address}
💰 Value: ${ethers.formatEther(value)} ${chainConfig.symbol}
⛽ Gas Limit: ${tx.gasLimit?.toString()}
🔢 Nonce: ${nonce}

📝 Transaction Hash: ${txResponse.hash}
🔍 Explorer: ${chainConfig.explorerUrl}/tx/${txResponse.hash}

⏳ Transaction is pending confirmation...

💰 Account Balance: ${ethers.formatEther(balance)} ${chainConfig.symbol}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error sending transaction: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    server.registerTool(
      "get-balance",
      {
        title: "Get Balance",
        description: "Get the balance of an address on any EVM-compatible chain",
        inputSchema: {
          chain: z.string().describe(`Chain identifier. Available: ${Object.keys(DEFAULT_CHAINS).join(', ')}`),
          address: z.string().describe("Address to check balance for"),
          blockTag: z.string().optional().describe("Block tag (latest, earliest, pending, or block number)").default("latest")
        }
      },
      async ({ chain, address, blockTag = "latest" }) => {
        try {
          const chainConfig = DEFAULT_CHAINS[chain.toLowerCase()];
          if (!chainConfig) {
            return {
              content: [{
                type: "text",
                text: `Error: Unsupported chain "${chain}". Available chains: ${Object.keys(DEFAULT_CHAINS).join(', ')}`
              }],
              isError: true
            };
          }

          if (!ethers.isAddress(address)) {
            return {
              content: [{
                type: "text",
                text: `Error: Invalid address: ${address}`
              }],
              isError: true
            };
          }

          const provider = this.providers.get(chain.toLowerCase());
          if (!provider) {
            return {
              content: [{
                type: "text",
                text: `Error: Provider not initialized for chain: ${chain}`
              }],
              isError: true
            };
          }

          const balance = await provider.getBalance(address, blockTag);

          return {
            content: [{
              type: "text",
              text: `Balance Information:

🔗 Chain: ${chainConfig.name} (${chainConfig.chainId})
👤 Address: ${address}
🏷️ Block: ${blockTag}

💰 Balance: ${ethers.formatEther(balance)} ${chainConfig.symbol}
🔢 Wei: ${balance.toString()}

${chainConfig.explorerUrl ? `🔍 Explorer: ${chainConfig.explorerUrl}/address/${address}` : ''}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error getting balance: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    server.registerTool(
      "list-chains",
      {
        title: "List Supported Chains",
        description: "List all supported EVM-compatible chains and their configurations",
        inputSchema: {}
      },
      async () => {
        const chainsList = Object.entries(DEFAULT_CHAINS).map(([key, config]) => 
          `🔗 ${key}: ${config.name} (Chain ID: ${config.chainId})
   RPC: ${config.rpcUrl}
   Symbol: ${config.symbol}
   ${config.explorerUrl ? `Explorer: ${config.explorerUrl}` : ''}`
        ).join('\n\n');

        return {
          content: [{
            type: "text",
            text: `Supported EVM-Compatible Chains:

${chainsList}

Usage: Use the chain key (e.g., "ethereum", "polygon", "bsc") in other RPC tools.`
          }]
        };
      }
    );
  }
} 