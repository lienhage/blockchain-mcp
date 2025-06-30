import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ethers } from "ethers";

export class AbiEncoder {
  registerWithServer(server: McpServer) {
    server.registerTool(
      "abi-encode",
      {
        title: "abi encode",
        description: "encode function parameters with abi",
        inputSchema: {
          types: z.array(z.string()).describe("parameter types array, e.g. ['uint256', 'address', 'bool']"),
          values: z.array(z.union([z.string(), z.number(), z.boolean()])).describe("parameter values array, corresponding to the types array")
        }
      },
      async ({ types, values }) => {
        try {
          if (types.length !== values.length) {
            return {
              content: [{
                type: "text",
                text: "error: parameter types and values length mismatch"
              }],
              isError: true
            };
          }

          const processedValues = this.processValues(types, values);
          const encoded = ethers.AbiCoder.defaultAbiCoder().encode(types, processedValues);
          
          const typeSignature = `(${types.join(',')})`;
          const readableParams = types.map((type, index) => 
            `  ${type}: ${this.formatValue(values[index])}`
          ).join('\n');

          return {
            content: [{
              type: "text",
              text: `abi encode result:\n\n📋 parameter types: ${typeSignature}\n📝 parameter values:\n${readableParams}\n\n🔢 encoded result: ${encoded}\n\n📏 length: ${(encoded.length - 2) / 2} bytes`
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

    server.registerTool(
      "abi-encode-with-signature",
      {
        title: "abi encode with signature",
        description: "encode function call with abi",
        inputSchema: {
          functionSignature: z.string().describe("function signature, e.g. 'transfer(address,uint256)'"),
          values: z.array(z.union([z.string(), z.number(), z.boolean()])).describe("parameter values array, corresponding to the types array")
        }
      },
      async ({ functionSignature, values }) => {
        try {
          const iface = new ethers.Interface([`function ${functionSignature}`]);
          const functionName = functionSignature.split('(')[0];
          
          const encoded = iface.encodeFunctionData(functionName, values);
          const selector = encoded.slice(0, 10);
          const params = encoded.slice(10);
          
          const readableParams = values.map((value, index) => 
            `  parameter ${index + 1}: ${this.formatValue(value)}`
          ).join('\n');

          return {
            content: [{
              type: "text",
              text: `abi encode with signature result:\n\n📋 function signature: ${functionSignature}\n📝 parameter values:\n${readableParams}\n\n🔧 function selector: ${selector}\n📊 parameter data: 0x${params}\n🔢 encoded: ${encoded}\n\n📏 total length: ${(encoded.length - 2) / 2} bytes`
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

    server.registerTool(
      "abi-decode",
      {
        title: "abi decode",
        description: "decode abi encoded data",
        inputSchema: {
          types: z.array(z.string()).describe("parameter types array, e.g. ['uint256', 'address', 'bool']"),
          data: z.string().describe("hexadecimal data to decode")
        }
      },
      async ({ types, data }) => {
        try {
          const cleanData = data.startsWith('0x') ? data : `0x${data}`;
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(types, cleanData);
          
          const decodedValues = types.map((type, index) => {
            const value = decoded[index];
            return `  ${type}: ${this.formatDecodedValue(value, type)}`;
          }).join('\n');

          return {
            content: [{
              type: "text",
              text: `abi decode result:\n\n📊 original data: ${cleanData}\n📋 parameter types: (${types.join(',')})\n\n📝 decoded values:\n${decodedValues}`
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

  private processValues(types: string[], values: (string | number | boolean)[]): any[] {
    return values.map((value, index) => {
      const type = types[index];
      
      if (type.includes('uint') || type.includes('int')) {
        return ethers.getBigInt(value.toString());
      }
      
      if (type === 'address') {
        if (typeof value !== 'string') {
          throw new Error(`address type parameter must be a string: ${value}`);
        }
        if (!ethers.isAddress(value)) {
          throw new Error(`invalid ethereum address: ${value}`);
        }
        return value;
      }
      
      if (type === 'bool') {
        if (typeof value === 'boolean') return value;
        if (typeof value === 'string') {
          const lowercaseValue = value.toLowerCase();
          if (lowercaseValue === 'true') return true;
          if (lowercaseValue === 'false') return false;
          throw new Error(`boolean value must be true or false: ${value}`);
        }
        throw new Error(`invalid boolean value: ${value}`);
      }
      
      if (type.startsWith('bytes')) {
        if (typeof value !== 'string') {
          throw new Error(`bytes type parameter must be a string: ${value}`);
        }
        return value.startsWith('0x') ? value : `0x${value}`;
      }
      
      return value;
    });
  }

  private formatValue(value: string | number | boolean): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    return String(value);
  }

  private formatDecodedValue(value: any, type: string): string {
    if (typeof value === 'bigint') {
      return value.toString();
    }
    
    if (type === 'address') {
      return value.toString();
    }
    
    if (type === 'bool') {
      return value ? 'true' : 'false';
    }
    
    if (type.startsWith('bytes')) {
      return value.toString();
    }
    
    if (typeof value === 'string') {
      return `"${value}"`;
    }
    
    return String(value);
  }
} 