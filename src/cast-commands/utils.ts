import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ethers } from "ethers";

export class UtilsService {
  registerWithServer(server: McpServer) {
    server.registerTool(
      "sig",
      {
        title: "sig",
        description: "get function selector",
        inputSchema: {
          functionName: z.string().describe("function signature, e.g. 'transfer(address,uint256)'"),
        }
      },
      async ({ functionName }) => {
        const functionSelector = ethers.keccak256(ethers.toUtf8Bytes(functionName)).slice(0, 10);
        return {
          content: [{ type: "text", text: `function selector: ${functionSelector}` }]
        };
      }
    );
    // register tools to get event signature
    server.registerTool(
      "event-sig",
      {
        title: "event-sig",
        description: "get event selector",
        inputSchema: {
            eventName: z.string().describe("event name, e.g. 'Transfer(address indexed from, address indexed to, uint256 amount)'"), 
        }
      },
        async ({ eventName }) => {
            const eventSignature = ethers.keccak256(ethers.toUtf8Bytes(eventName)).slice(0, 10);
            return {
            content: [{ type: "text", text: `event signature: ${eventSignature}` }]
            };
        }
    );
    // tool to calculate keccak256 hash
    server.registerTool(
      "keccak256",
      {
        title: "keccak256",
        description: "calculate keccak256 hash",
        inputSchema: {
          data: z.string().describe("data to hash"),
        }
      },
      async ({ data }) => {
        const hash = ethers.keccak256(ethers.toUtf8Bytes(data));
        return {
          content: [{ type: "text", text: `keccak256 hash: ${hash}` }]
        };
      }
    );
  }
}