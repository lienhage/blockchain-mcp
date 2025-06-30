import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fetch from "node-fetch";

interface FourByteResult {
  id: number;
  created_at: string;
  text_signature: string;
  hex_signature: string;
  bytes_signature: string;
}

interface FourByteResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: FourByteResult[];
}

export class FourByteService {
  private readonly baseUrl = "https://www.4byte.directory/api/v1";

  registerWithServer(server: McpServer) {
    server.registerTool(
      "4byte",
      {
        title: "Get Function Signatures",
        description: "Get function signatures for the given selector from 4byte.directory",
        inputSchema: {
          selector: z.string().describe("Function selector (4-byte hex), e.g., '0xa9059cbb' or 'a9059cbb'")
        }
      },
      async ({ selector }) => {
        try {
          const cleanSelector = selector.startsWith('0x') ? selector.slice(2) : selector;
          
          if (!/^[0-9a-fA-F]{8}$/.test(cleanSelector)) {
            return {
              content: [{
                type: "text",
                text: "Error: Selector must be an 8-character hexadecimal string"
              }],
              isError: true
            };
          }

          const signatures = await this.getFunctionSignatures(cleanSelector);
          
          if (signatures.length === 0) {
            return {
              content: [{
                type: "text",
                text: `No function signatures found for selector 0x${cleanSelector}`
              }]
            };
          }

          const signaturesText = signatures.map((sig, index) => 
            `${index + 1}. ${sig.text_signature}`
          ).join('\n');

          return {
            content: [{
              type: "text",
              text: `Function signatures for selector 0x${cleanSelector}:\n\n${signaturesText}`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `Error getting function signatures: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );

    server.registerTool(
      "4byte-decode",
      {
        title: "Decode ABI Calldata",
        description: "Decode ABI-encoded calldata using 4byte.directory",
        inputSchema: {
          calldata: z.string().describe("ABI-encoded calldata (hexadecimal string)")
        }
      },
      async ({ calldata }) => {
        try {
          const cleanCalldata = calldata.startsWith('0x') ? calldata.slice(2) : calldata;
          
          if (cleanCalldata.length < 8) {
            return {
              content: [{
                type: "text",
                text: "Error: Calldata must have at least 4 bytes for function selector"
              }],
              isError: true
            };
          }

          const selector = cleanCalldata.slice(0, 8);
          const signatures = await this.getFunctionSignatures(selector);
          
          if (signatures.length === 0) {
            return {
              content: [{
                type: "text",
                text: `No function signatures found for selector 0x${selector}, cannot decode`
              }]
            };
          }

          const decodingInfo = signatures.map((sig, index) => {
            return `${index + 1}. Possible function signature: ${sig.text_signature}
   Selector: 0x${selector}
   Parameter data: 0x${cleanCalldata.slice(8)}`;
          }).join('\n\n');

          return {
            content: [{
              type: "text",
              text: `Calldata decode result:\n\noriginal data: 0x${cleanCalldata}\n\n${decodingInfo}\n\nNote: Need specific ABI definition to fully decode parameter values.`
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: `error: ${error instanceof Error ? error.message : String(error)}`
            }],
            isError: true
          };
        }
      }
    );
  }

  private async getFunctionSignatures(selector: string): Promise<FourByteResult[]> {
    const response = await fetch(
      `${this.baseUrl}/signatures/?hex_signature=0x${selector}&format=json`
    );

    if (!response.ok) {
      throw new Error(`4byte API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as FourByteResponse;
    return data.results || [];
  }
} 