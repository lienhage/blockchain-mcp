import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { FourByteService } from "./fourbyte.js";
import { AbiEncoder } from "./abi-encoder.js";
import { UtilsService } from "./utils.js";

export class CastCommands {
  private fourByteService: FourByteService;
  private abiEncoder: AbiEncoder;
  private utilsService: UtilsService;

  constructor() {
    this.fourByteService = new FourByteService();
    this.abiEncoder = new AbiEncoder();
    this.utilsService = new UtilsService();
  }

  registerWithServer(server: McpServer) {
    this.fourByteService.registerWithServer(server);
    this.abiEncoder.registerWithServer(server);
    this.utilsService.registerWithServer(server);
  }
} 