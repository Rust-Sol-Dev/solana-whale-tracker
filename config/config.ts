import { Connection, PublicKey } from '@solana/web3.js'
import dotenv from "dotenv";
dotenv.config();

try {
  dotenv.config();
} catch (error) {
  console.error("Error loading environment variables:", error);
  process.exit(1);
}

export const MONGO_URL = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}/${process.env.DB_NAME}`;
export const PORT = process.env.PORT || 9000

export const DEX_API_URL = 'https://api.dexscreener.com/latest/dex'
export const DEX_IO_URL = 'https://io.dexscreener.com/dex/log/amm/v2/solamm/top/solana'
export const DEX_URL = 'https://dexscreener.com/solana'
const RPC_URL = process.env.RPC_URL!
const WSS_URL = process.env.WSS_URL!
export const connection = new Connection(RPC_URL, {
  wsEndpoint: WSS_URL,
  confirmTransactionInitialTimeout: 30000,
  commitment: "confirmed",
});

export const Raydium = new PublicKey(
  "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"
);

export const RaydiumAuthority = new PublicKey(
  "5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1"
);