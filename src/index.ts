#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { VanityAddressGenerator } from "./vanity-address/generator.js";
import { CastCommands } from "./cast-commands/index.js";
import { RpcService } from "./rpc-service/index.js";

const server = new McpServer({
  name: "blockchain-mcp",
  version: "1.0.0"
});

const vanityGenerator = new VanityAddressGenerator();
const castCommands = new CastCommands();
const rpcService = new RpcService();

vanityGenerator.registerWithServer(server);
castCommands.registerWithServer(server);
rpcService.registerWithServer(server);

const transport = new StdioServerTransport();
await server.connect(transport);

console.log("Blockchain MCP Server is running on stdio"); 