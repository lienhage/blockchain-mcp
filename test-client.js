import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMCPServer() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["dist/index.js"]
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  });

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Test list tools
    const tools = await client.listTools();
    console.log("\n📋 Available tools:");
    tools.tools.forEach(tool => {
      console.log(`  - ${tool.name}: ${tool.description}`);
    });

    // Test validate address
    console.log("\n🔍 Testing address validation...");
    const validationResult = await client.callTool({
      name: "validate-ethereum-address",
      arguments: {
        address: "0x1234567890123456789012345678901234567890"
      }
    });
    console.log("Address validation result:", validationResult.content[0].text);

    // Test 4byte lookup
    console.log("\n🔍 Testing 4byte lookup...");
    const fourByteResult = await client.callTool({
      name: "4byte",
      arguments: {
        selector: "0xa9059cbb"
      }
    });
    console.log("4byte result:", fourByteResult.content[0].text);

    // Test ABI encode
    console.log("\n🔍 Testing ABI encode...");
    const abiResult = await client.callTool({
      name: "abi-encode",
      arguments: {
        types: ["uint256", "address"],
        values: [1000, "0x1234567890123456789012345678901234567890"]
      }
    });
    console.log("ABI encode result:", abiResult.content[0].text);

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

testMCPServer(); 