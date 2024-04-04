"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RaydiumAuthority = exports.Raydium = exports.connection = exports.DEX_URL = exports.DEX_IO_URL = exports.DEX_API_URL = exports.PORT = exports.MONGO_URL = void 0;
const web3_js_1 = require("@solana/web3.js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
try {
    dotenv_1.default.config();
}
catch (error) {
    console.error("Error loading environment variables:", error);
    process.exit(1);
}
exports.MONGO_URL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;
exports.PORT = process.env.PORT || 9000;
exports.DEX_API_URL = 'https://api.dexscreener.com/latest/dex';
exports.DEX_IO_URL = 'https://io.dexscreener.com/dex/log/amm/v2/solamm/top/solana';
exports.DEX_URL = 'https://dexscreener.com/solana';
const RPC_URL = process.env.RPC_URL;
const WSS_URL = process.env.WSS_URL;
exports.connection = new web3_js_1.Connection(RPC_URL, {
    wsEndpoint: WSS_URL,
    confirmTransactionInitialTimeout: 30000,
    commitment: "confirmed",
});
exports.Raydium = new web3_js_1.PublicKey("675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8");
exports.RaydiumAuthority = new web3_js_1.PublicKey("5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1");
