import lo from "lodash";
import { struct, u8, u64, publicKey } from "@raydium-io/raydium-sdk";
import { PublicKey } from "@solana/web3.js";
import axios from "axios";
import { Metaplex } from "@metaplex-foundation/js";

import { Raydium, RaydiumAuthority, connection } from "./config/config";
import { IPairInfo } from "./utils/types";

const LOG_TYPE = struct([u8("log_type")]);
const RAY_IX_TYPE = {
  CREATE_POOL: 0,
  ADD_LIQUIDITY: 1,
  BURN_LIQUIDITY: 2,
  SWAP: 3,
};
const INIT_LOG = struct([
  u8("log_type"),
  u64("time"),
  u8("pc_decimals"),
  u8("coin_decimals"),
  u64("pc_lot_size"),
  u64("coin_lot_size"),
  u64("pc_amount"),
  u64("coin_amount"),
  publicKey("market"),
]);

const ACTION_TYPE = {
  DEPOSIT: "deposit",
  WITHDRAW: "withdraw",
  MINT: "mint",
  BURN: "burn",
  CREATE: "create",
  DEFAULT: "unknown",
};

const parseCreateTransaction = async (input_data: any, sig: string) => {
  try {
    const tx = await connection.getParsedTransaction(sig, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 2,
    });
    // if (tx) {
    const feePayer = tx?.transaction.message.accountKeys[0].pubkey.toBase58();

    const ixs = tx?.transaction.message.instructions;
    let ix_index = -1;
    if (ixs?.length) {
      for (let i = 0; i < ixs.length; i++) {
        if (ixs[i].programId.toBase58() == Raydium.toBase58()) {
          ix_index = i;
          break;
        }
      }

      const inner_ixs = tx?.meta?.innerInstructions;
      if (ix_index == -1) {
        console.error(`Could not parse activity from ix in ${sig}`);
        return [
          {
            user: feePayer,
            signature: sig,
          },
        ];
      }

      let result: any[] = [];
      inner_ixs
        ?.filter((inner_ixs) => inner_ixs.index === ix_index)[0]
        .instructions.slice(-3)
        .map((inn_ix) => {
          let bIsSending = ACTION_TYPE.DEFAULT;
          // @ts-ignore
          const owner = inn_ix.parsed?.info?.authority;
          // @ts-ignore
          if (owner === feePayer || inn_ix.parsed?.type === "mintTo")
            bIsSending = ACTION_TYPE.DEPOSIT;
          else if (
            owner === RaydiumAuthority.toBase58() ||
            // @ts-ignore
            inn_ix.parsed?.type == "mintTo"
          )
            bIsSending = ACTION_TYPE.MINT;
          result.push({
            mode: bIsSending,
            user: feePayer,
            // @ts-ignore
            amount: inn_ix.parsed?.info?.amount,
            mintOrAta:
              // @ts-ignore
              inn_ix.parsed?.info?.mint || inn_ix.parsed?.info?.destination,
            signature: sig,
          });
        });

      return result;
    }
    // }
  } catch (error) {
    console.error(error);
    return [
      {
        signature: sig,
      },
    ];
  }
}

const fetchTokenInfo = async (info: any[]) => {
  let result = info;
  if (!info[0].mintOrAta) return result;

  let data: IPairInfo | undefined;
  try {
    data = await getTokenAddress(
      result.map((r) => new PublicKey(r.mintOrAta))
    );
  } catch (err) {
    console.error("Getting token address occur errors");
    return;
  }
  for (let i = 0; i < result.length; i++) {
    if (data) result[i].token = data[result[i].mintOrAta];
  }
  return result;
}

const getTokenAddress = async (accounts: PublicKey[]) => {
  try {
    // Get the pool account info
    let poolAccountInfo = await connection.getMultipleParsedAccounts(accounts);
    let mintInfo: IPairInfo = {};
    poolAccountInfo.value.map((info, idx) => {
      const account = accounts[idx].toBase58();
      // @ts-ignore
      if (info?.data.space === 165) {
        // @ts-ignore
        const mint = info.data.parsed.info?.mint;
        mintInfo[account] = {
          address: mint,
          // @ts-ignore
          decimals: info.data.parsed?.info?.tokenAmount?.decimals,
        };
        // @ts-ignore
      } else if (info?.data.space === 82) {
        mintInfo[account] = {
          address: account,
          // @ts-ignore
          decimals: info.data.parsed?.info?.decimals,
        };
      }
    });

    // Retrieve the token address from the token account data
    return await getMetadata(mintInfo);
  } catch (error) {
    console.error("Error:", error);
  }
};

const getMetadata = async (tokenInfos: IPairInfo) => {
  const metaplex = Metaplex.make(connection);
  let tokens: any[] = await metaplex.nfts().findAllByMintList({
    mints: Object.values(tokenInfos).map((info: any) => new PublicKey(info.address)),
  });

  for (let i = 0; i < tokens.length; i++) {

    if (!tokens[i]?.uri) {
      const tokenInfo = Object.values(tokenInfos)
      const addr = tokenInfo[i].address
      const offTokenMetaAPI = `https://token-list-api.solana.cloud/v1/search?query=${addr}&start=0&limit=1&chainId=101`
      const res = await axios
        .get(offTokenMetaAPI)
        .then((res) => res.data)
        .catch((e) => {
          console.error(
            `Could not get token meta for ${addr}`
          );
          return {
            content: [],
          };
        });
      if (res.content.length > 0)
        tokens[i] = {
          mintAddress: new PublicKey(addr),
          name: res.content[0].name,
          symbol: res.content[0].symbol,
          uri: res.content[0].logoURI,
          image: res.content[0].logoURI,
        };
      else
        tokens[i] = {
          mintAddress: new PublicKey(addr),
          name: "Unregistered Token",
          symbol: addr,
          uri: "",
        };
    } else if (!tokens[i]?.image) {
      // TODO: fetch uri json and read image url.
      const response = await axios.get(tokens[i]?.uri);
      tokens[i].image = response.data.image;
      tokens[i].description = response.data.description;
    }
  }

  let result = tokenInfos;
  tokens.filter((info) => info !== null)
    .map((info: any) => {
      const mint = info?.mintAddress.toBase58();
      const idx = Object.values(result)
        // @ts-ignore
        .map((info) => info.address)
        .indexOf(mint);
      const account = Object.keys(result)[idx];
      result[account] = {
        ...result[account],
        name: info.name,
        symbol: info.symbol,
        uri: info.uri,
        image: info.json?.image || info.image,
        desc: info.json?.description || info?.description,
      };
    });
  return result;
};

const parseAmountWithDecimal = async (strAmount: any, decimals: any) => {
  const amount = parseFloat(strAmount) / 10 ** decimals;
  return amount.toString();
}

const getData = async (msg: any[] | undefined, type: number, poolId: PublicKey) => {
  if (!msg || !msg[1] || !msg[0] || !msg[1].token || !msg[0].token) return;

  if (msg[0].token) {
    let vaultAmount;
    try {
      vaultAmount = await connection.getTokenAccountBalance(new PublicKey(msg[1].mintOrAta));
    } catch (err) {
      console.error("Getting vaultAmount occur errors");
      return;
    }
    let initMint;
    try {
      initMint = await connection.getParsedAccountInfo(new PublicKey(msg[0].token.address));
    } catch (err) {
      console.error("Getting initMint occur errors");
      return;
    }
    // @ts-ignore
    const initMintToken = initMint.value?.data.parsed.info;
    const pairName = `${msg[0].token.symbol} / ${msg[1].token.symbol}`; //
    const mintAuthority = initMintToken.mintAuthority //
    const freezeAuthority = initMintToken.freezeAuthority //
    const description = msg[0].token.desc; //
    const links = {
      Transaction: `https://solscan.io/tx/${msg[0].signature}`,
      // Birdeye: `https://birdeye.so/token/${msg[0].token.address}/${msg[1].token.address}?chain=solana`,
    }; //
    const image = msg[0].token.image
    const poolCreateAAmount = await parseAmountWithDecimal(msg[0].amount, msg[0].token.decimals) + ` ${msg[0].token.symbol}`; //
    const poolCreateBAmount = await parseAmountWithDecimal(msg[1].amount, msg[1].token.decimals) + ` ${msg[1].token.symbol}`;//
    return { pairName, mintAuthority, freezeAuthority, description, links, image, poolCreateAAmount, poolCreateBAmount, poolId }
  }

}

export const trackNewPool = async () => {
  connection.onLogs(
    Raydium,
    async (x) => {
      try {
        const log = x.logs;
        const signature = x.signature;
        const error = x.err;
        const ray_log_row = lo.find(log, (y) => y.includes("ray_log"));

        if (!error && ray_log_row) {
          try {
            const match = ray_log_row.match(/ray_log: (.*)/)
            if (match?.length) {
              const ray_data = Buffer.from(
                match[1],
                "base64"
              );
              const log_type = LOG_TYPE.decode(ray_data).log_type;
              if (log_type == RAY_IX_TYPE.CREATE_POOL) {
                const tx = await connection.getParsedTransaction(signature, {
                  maxSupportedTransactionVersion: 0,
                });
                if (tx) {
                  const instructions = tx.transaction.message.instructions;
                  const raydiumInstruction = instructions.find((instruction) => { return instruction.programId.toString() == "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8" });
                  if (raydiumInstruction) {
                    if ('accounts' in raydiumInstruction) {
                      const poolId = raydiumInstruction.accounts[4];

                      const ray_input = INIT_LOG.decode(ray_data);
                      let info: any[] | undefined = [];
                      try {
                        info = await parseCreateTransaction(ray_input, signature);
                      } catch (error) {
                        return;
                      }
                      let res
                      let result
                      if (info && info?.length) {
                        res = info.map((data) => ({ ...data, token: undefined }));
                        try {
                          result = await fetchTokenInfo(res);
                        }
                        catch (error) {
                          console.error("fetchTokenInfo error", error);
                          return;
                        }
                        // send data using socket connection 
                        const returnValue = await getData(result, RAY_IX_TYPE.CREATE_POOL, poolId)
                        console.log(returnValue)
                      }
                    }
                  }
                }
              }
            }
          } catch (ex) {
            console.error(ex);
          }
        }
      } catch (ex) {
        console.error(ex);
      }
    },
    "confirmed"
  );
}