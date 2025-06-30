# Blockchain MCP Server

A Model Context Protocol (MCP) based blockchain tools server providing Ethereum vanity address generation and Cast command functionality.

<a href="https://glama.ai/mcp/servers/@lienhage/blockchain-mcp">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@lienhage/blockchain-mcp/badge" alt="Blockchain Server MCP server" />
</a>

## Features

### 1. Ethereum Vanity Address Generation
- 🎯 Support for specifying address prefix and suffix
- ⚡ Multi-threaded concurrent computation for optimized performance
- 📊 Real-time generation statistics display
- ✅ Address validity verification

### 2. Cast Command Tools
- 🔍 **4byte**: Get function signatures from function selectors
- 🔧 **4byte-decode**: Decode ABI-encoded calldata
- 📦 **abi-encode**: ABI encode function parameters
- 🔄 **abi-decode**: ABI decode data

### 3. RPC Service
- 📞 **static-call**: Make static calls on any EVM-compatible chain (read-only)
- 💸 **send-transaction**: Send transactions to smart contracts (requires private key)
- 💰 **get-balance**: Query address balance
- 🔗 **list-chains**: List supported chains

## Installation and Usage

### Install Dependencies
```bash
npm install
```

### Build Project
```bash
npm run build
```

### Run Server
```bash
npm start
```

### Development Mode
```bash
npm run dev
```

## Tool Usage Guide

### Vanity Address Generation

#### `generate-vanity-address`
Generate Ethereum addresses matching specified conditions

**Parameters:**
- `prefix` (optional): Address prefix, excluding 0x
- `suffix` (optional): Address suffix
- `workers` (optional): Number of concurrent threads, default 4, max 16
- `caseSensitive` (optional): Whether case-sensitive, default false

**Example:**
```json
{
  "prefix": "1234",
  "suffix": "abcd",
  "workers": 8,
  "caseSensitive": false
}
```

#### `validate-ethereum-address`
Validate Ethereum address validity

**Parameters:**
- `address`: Ethereum address to validate

### Cast Command Tools

#### `4byte`
Get function signatures for the given selector

**Parameters:**
- `selector`: 4-byte function selector (hexadecimal)

**Example:**
```json
{
  "selector": "0xa9059cbb"
}
```

#### `4byte-decode`
Decode ABI-encoded calldata

**Parameters:**
- `calldata`: ABI-encoded calldata (hexadecimal)

**Example:**
```json
{
  "calldata": "0xa9059cbb000000000000000000000000..."
}
```

#### `abi-encode`
ABI encode function parameters

**Parameters:**
- `types`: Parameter types array
- `values`: Parameter values array

**Example:**
```json
{
  "types": ["uint256", "address", "bool"],
  "values": [1000, "0x1234567890123456789012345678901234567890", true]
}
```

#### `abi-encode-with-signature`
Complete function call ABI encoding (with function selector)

**Parameters:**
- `functionSignature`: Function signature
- `values`: Parameter values array

**Example:**
```json
{
  "functionSignature": "transfer(address,uint256)",
  "values": ["0x1234567890123456789012345678901234567890", 1000]
}
```

#### `abi-decode`
Decode ABI-encoded data

**Parameters:**
- `types`: Parameter types array
- `data`: Hexadecimal data to decode

**Example:**
```json
{
  "types": ["uint256", "address"],
  "data": "0x00000000000000000000000000000000000000000000000000000000000003e8"
}
```

### RPC Service Tools

#### `list-chains`
List all supported EVM-compatible chains

**Parameters:** None

#### `get-balance`
Query address balance on specified chain

**Parameters:**
- `chain`: Chain identifier (e.g., "ethereum", "polygon", "bsc")
- `address`: Address to query
- `blockTag` (optional): Block tag, default "latest"

**Example:**
```json
{
  "chain": "ethereum",
  "address": "0x1234567890123456789012345678901234567890"
}
```

#### `static-call`
Make static calls to smart contracts (read-only operations)

**Parameters:**
- `chain`: Chain identifier
- `to`: Contract address
- `data`: ABI-encoded function call data
- `blockTag` (optional): Block tag, default "latest"

**Example:**
```json
{
  "chain": "ethereum",
  "to": "0xA0b86a33E6441068C73f4Ea6cB24b80b52bF97F4",
  "data": "0x70a08231000000000000000000000000123456789012345678901234567890123456789"
}
```

#### `send-transaction`
Send transactions to smart contracts (requires private key)

**Parameters:**
- `chain`: Chain identifier
- `to`: Contract address
- `data`: ABI-encoded function call data
- `value` (optional): ETH amount to send (wei)
- `gasLimit` (optional): Gas limit
- `gasPrice` (optional): Gas price (wei)
- `privateKey`: Sender's private key

**Example:**
```json
{
  "chain": "sepolia",
  "to": "0x1234567890123456789012345678901234567890",
  "data": "0xa9059cbb000000000000000000000000...",
  "value": "0",
  "privateKey": "0x..."
}
```

## Performance Optimization

### Vanity Address Generation Performance Tips
- Shorter prefixes generate faster
- Suffixes are slightly easier than prefixes
- Recommended to use 4-8 worker threads for optimal performance
- Avoid specifying both long prefix and long suffix simultaneously

### Expected Generation Time
- 4 hex characters: seconds to minutes
- 5 hex characters: minutes to tens of minutes
- 6 hex characters: hours
- 7+ characters: may take very long time

## Supported Blockchain Networks

### Mainnet
- **Ethereum**: ethereum (Chain ID: 1)
- **Polygon**: polygon (Chain ID: 137)
- **BSC**: bsc (Chain ID: 56)
- **Arbitrum**: arbitrum (Chain ID: 42161)
- **Optimism**: optimism (Chain ID: 10)
- **Avalanche**: avalanche (Chain ID: 43114)
- **Fantom**: fantom (Chain ID: 250)

### Testnet
- **Sepolia**: sepolia (Chain ID: 11155111)

All networks use public RPC endpoints to ensure stability and accessibility.

## Tech Stack

- **TypeScript**: Type-safe JavaScript
- **MCP SDK**: Model Context Protocol implementation
- **Ethers.js**: Ethereum library
- **Node.js Worker Threads**: Multi-threaded concurrent computation
- **4byte.directory API**: Function signature database

## Security Considerations

⚠️ **Important Notes:**
- Generated private keys have complete control over assets
- Always keep private keys secure and never share them with anyone
- Recommend generating important addresses in offline environments
- This tool is for learning and testing purposes only

## Installation via NPM

You can install this MCP server globally:

```bash
npm install -g blockchain-mcp-server
```

Or use it with npx:

```bash
npx blockchain-mcp-server
```

### MCP Configuration

Add to your MCP client configuration:

```json
{
  "mcpServers": {
    "blockchain": {
      "command": "npx",
      "args": ["blockchain-mcp-server"]
    }
  }
}
```

## License

MIT License