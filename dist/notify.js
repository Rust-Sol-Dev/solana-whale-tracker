"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackNewPool = void 0;
const lodash_1 = __importDefault(require("lodash"));
const raydium_sdk_1 = require("@raydium-io/raydium-sdk");
const web3_js_1 = require("@solana/web3.js");
const axios_1 = __importDefault(require("axios"));
const js_1 = require("@metaplex-foundation/js");
const config_1 = require("./config/config");
const LOG_TYPE = (0, raydium_sdk_1.struct)([(0, raydium_sdk_1.u8)("log_type")]);
const RAY_IX_TYPE = {
    CREATE_POOL: 0,
    ADD_LIQUIDITY: 1,
    BURN_LIQUIDITY: 2,
    SWAP: 3,
};
const INIT_LOG = (0, raydium_sdk_1.struct)([
    (0, raydium_sdk_1.u8)("log_type"),
    (0, raydium_sdk_1.u64)("time"),
    (0, raydium_sdk_1.u8)("pc_decimals"),
    (0, raydium_sdk_1.u8)("coin_decimals"),
    (0, raydium_sdk_1.u64)("pc_lot_size"),
    (0, raydium_sdk_1.u64)("coin_lot_size"),
    (0, raydium_sdk_1.u64)("pc_amount"),
    (0, raydium_sdk_1.u64)("coin_amount"),
    (0, raydium_sdk_1.publicKey)("market"),
]);
const ACTION_TYPE = {
    DEPOSIT: "deposit",
    WITHDRAW: "withdraw",
    MINT: "mint",
    BURN: "burn",
    CREATE: "create",
    DEFAULT: "unknown",
};
const parseCreateTransaction = (input_data, sig) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const tx = yield config_1.connection.getParsedTransaction(sig, {
            commitment: "confirmed",
            maxSupportedTransactionVersion: 2,
        });
        // if (tx) {
        const feePayer = tx === null || tx === void 0 ? void 0 : tx.transaction.message.accountKeys[0].pubkey.toBase58();
        const ixs = tx === null || tx === void 0 ? void 0 : tx.transaction.message.instructions;
        let ix_index = -1;
        if (ixs === null || ixs === void 0 ? void 0 : ixs.length) {
            for (let i = 0; i < ixs.length; i++) {
                if (ixs[i].programId.toBase58() == config_1.Raydium.toBase58()) {
                    ix_index = i;
                    break;
                }
            }
            const inner_ixs = (_a = tx === null || tx === void 0 ? void 0 : tx.meta) === null || _a === void 0 ? void 0 : _a.innerInstructions;
            if (ix_index == -1) {
                console.error(`Could not parse activity from ix in ${sig}`);
                return [
                    {
                        user: feePayer,
                        signature: sig,
                    },
                ];
            }
            let result = [];
            inner_ixs === null || inner_ixs === void 0 ? void 0 : inner_ixs.filter((inner_ixs) => inner_ixs.index === ix_index)[0].instructions.slice(-3).map((inn_ix) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
                let bIsSending = ACTION_TYPE.DEFAULT;
                // @ts-ignore
                const owner = (_b = (_a = inn_ix.parsed) === null || _a === void 0 ? void 0 : _a.info) === null || _b === void 0 ? void 0 : _b.authority;
                // @ts-ignore
                if (owner === feePayer || ((_c = inn_ix.parsed) === null || _c === void 0 ? void 0 : _c.type) === "mintTo")
                    bIsSending = ACTION_TYPE.DEPOSIT;
                else if (owner === config_1.RaydiumAuthority.toBase58() ||
                    // @ts-ignore
                    ((_d = inn_ix.parsed) === null || _d === void 0 ? void 0 : _d.type) == "mintTo")
                    bIsSending = ACTION_TYPE.MINT;
                result.push({
                    mode: bIsSending,
                    user: feePayer,
                    // @ts-ignore
                    amount: (_f = (_e = inn_ix.parsed) === null || _e === void 0 ? void 0 : _e.info) === null || _f === void 0 ? void 0 : _f.amount,
                    mintOrAta: 
                    // @ts-ignore
                    ((_h = (_g = inn_ix.parsed) === null || _g === void 0 ? void 0 : _g.info) === null || _h === void 0 ? void 0 : _h.mint) || ((_k = (_j = inn_ix.parsed) === null || _j === void 0 ? void 0 : _j.info) === null || _k === void 0 ? void 0 : _k.destination),
                    signature: sig,
                });
            });
            return result;
        }
        // }
    }
    catch (error) {
        console.error(error);
        return [
            {
                signature: sig,
            },
        ];
    }
});
const fetchTokenInfo = (info) => __awaiter(void 0, void 0, void 0, function* () {
    let result = info;
    if (!info[0].mintOrAta)
        return result;
    let data;
    try {
        data = yield getTokenAddress(result.map((r) => new web3_js_1.PublicKey(r.mintOrAta)));
    }
    catch (err) {
        console.error("Getting token address occur errors");
        return;
    }
    for (let i = 0; i < result.length; i++) {
        if (data)
            result[i].token = data[result[i].mintOrAta];
    }
    return result;
});
const getTokenAddress = (accounts) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Get the pool account info
        let poolAccountInfo = yield config_1.connection.getMultipleParsedAccounts(accounts);
        let mintInfo = {};
        poolAccountInfo.value.map((info, idx) => {
            var _a, _b, _c, _d, _e, _f;
            const account = accounts[idx].toBase58();
            // @ts-ignore
            if ((info === null || info === void 0 ? void 0 : info.data.space) === 165) {
                // @ts-ignore
                const mint = (_a = info.data.parsed.info) === null || _a === void 0 ? void 0 : _a.mint;
                mintInfo[account] = {
                    address: mint,
                    // @ts-ignore
                    decimals: (_d = (_c = (_b = info.data.parsed) === null || _b === void 0 ? void 0 : _b.info) === null || _c === void 0 ? void 0 : _c.tokenAmount) === null || _d === void 0 ? void 0 : _d.decimals,
                };
                // @ts-ignore
            }
            else if ((info === null || info === void 0 ? void 0 : info.data.space) === 82) {
                mintInfo[account] = {
                    address: account,
                    // @ts-ignore
                    decimals: (_f = (_e = info.data.parsed) === null || _e === void 0 ? void 0 : _e.info) === null || _f === void 0 ? void 0 : _f.decimals,
                };
            }
        });
        // Retrieve the token address from the token account data
        return yield getMetadata(mintInfo);
    }
    catch (error) {
        console.error("Error:", error);
    }
});
const getMetadata = (tokenInfos) => __awaiter(void 0, void 0, void 0, function* () {
    var _b, _c, _d;
    const metaplex = js_1.Metaplex.make(config_1.connection);
    let tokens = yield metaplex.nfts().findAllByMintList({
        mints: Object.values(tokenInfos).map((info) => new web3_js_1.PublicKey(info.address)),
    });
    for (let i = 0; i < tokens.length; i++) {
        if (!((_b = tokens[i]) === null || _b === void 0 ? void 0 : _b.uri)) {
            const tokenInfo = Object.values(tokenInfos);
            const addr = tokenInfo[i].address;
            const offTokenMetaAPI = `https://token-list-api.solana.cloud/v1/search?query=${addr}&start=0&limit=1&chainId=101`;
            const res = yield axios_1.default
                .get(offTokenMetaAPI)
                .then((res) => res.data)
                .catch((e) => {
                console.error(`Could not get token meta for ${addr}`);
                return {
                    content: [],
                };
            });
            if (res.content.length > 0)
                tokens[i] = {
                    mintAddress: new web3_js_1.PublicKey(addr),
                    name: res.content[0].name,
                    symbol: res.content[0].symbol,
                    uri: res.content[0].logoURI,
                    image: res.content[0].logoURI,
                };
            else
                tokens[i] = {
                    mintAddress: new web3_js_1.PublicKey(addr),
                    name: "Unregistered Token",
                    symbol: addr,
                    uri: "",
                };
        }
        else if (!((_c = tokens[i]) === null || _c === void 0 ? void 0 : _c.image)) {
            // TODO: fetch uri json and read image url.
            const response = yield axios_1.default.get((_d = tokens[i]) === null || _d === void 0 ? void 0 : _d.uri);
            tokens[i].image = response.data.image;
            tokens[i].description = response.data.description;
        }
    }
    let result = tokenInfos;
    tokens.filter((info) => info !== null)
        .map((info) => {
        var _a, _b;
        const mint = info === null || info === void 0 ? void 0 : info.mintAddress.toBase58();
        const idx = Object.values(result)
            // @ts-ignore
            .map((info) => info.address)
            .indexOf(mint);
        const account = Object.keys(result)[idx];
        result[account] = Object.assign(Object.assign({}, result[account]), { name: info.name, symbol: info.symbol, uri: info.uri, image: ((_a = info.json) === null || _a === void 0 ? void 0 : _a.image) || info.image, desc: ((_b = info.json) === null || _b === void 0 ? void 0 : _b.description) || (info === null || info === void 0 ? void 0 : info.description) });
    });
    return result;
});
const parseAmountWithDecimal = (strAmount, decimals) => __awaiter(void 0, void 0, void 0, function* () {
    const amount = parseFloat(strAmount) / Math.pow(10, decimals);
    return amount.toString();
});
const getData = (msg, type, poolId) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    if (!msg || !msg[1] || !msg[0] || !msg[1].token || !msg[0].token)
        return;
    if (msg[0].token) {
        let vaultAmount;
        try {
            vaultAmount = yield config_1.connection.getTokenAccountBalance(new web3_js_1.PublicKey(msg[1].mintOrAta));
        }
        catch (err) {
            console.error("Getting vaultAmount occur errors");
            return;
        }
        let initMint;
        try {
            initMint = yield config_1.connection.getParsedAccountInfo(new web3_js_1.PublicKey(msg[0].token.address));
        }
        catch (err) {
            console.error("Getting initMint occur errors");
            return;
        }
        // @ts-ignore
        const initMintToken = (_e = initMint.value) === null || _e === void 0 ? void 0 : _e.data.parsed.info;
        const pairName = `${msg[0].token.symbol} / ${msg[1].token.symbol}`; //
        const mintAuthority = initMintToken.mintAuthority; //
        const freezeAuthority = initMintToken.freezeAuthority; //
        const description = msg[0].token.desc; //
        const links = {
            Transaction: `https://solscan.io/tx/${msg[0].signature}`,
            // Birdeye: `https://birdeye.so/token/${msg[0].token.address}/${msg[1].token.address}?chain=solana`,
        }; //
        const image = msg[0].token.image;
        const poolCreateAAmount = (yield parseAmountWithDecimal(msg[0].amount, msg[0].token.decimals)) + ` ${msg[0].token.symbol}`; //
        const poolCreateBAmount = (yield parseAmountWithDecimal(msg[1].amount, msg[1].token.decimals)) + ` ${msg[1].token.symbol}`; //
        return { pairName, mintAuthority, freezeAuthority, description, links, image, poolCreateAAmount, poolCreateBAmount, poolId };
    }
});
const trackNewPool = () => __awaiter(void 0, void 0, void 0, function* () {
    config_1.connection.onLogs(config_1.Raydium, (x) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const log = x.logs;
            const signature = x.signature;
            const error = x.err;
            const ray_log_row = lodash_1.default.find(log, (y) => y.includes("ray_log"));
            if (!error && ray_log_row) {
                try {
                    const match = ray_log_row.match(/ray_log: (.*)/);
                    if (match === null || match === void 0 ? void 0 : match.length) {
                        const ray_data = Buffer.from(match[1], "base64");
                        const log_type = LOG_TYPE.decode(ray_data).log_type;
                        if (log_type == RAY_IX_TYPE.CREATE_POOL) {
                            const tx = yield config_1.connection.getParsedTransaction(signature, {
                                maxSupportedTransactionVersion: 0,
                            });
                            if (tx) {
                                const instructions = tx.transaction.message.instructions;
                                const raydiumInstruction = instructions.find((instruction) => { return instruction.programId.toString() == "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8"; });
                                if (raydiumInstruction) {
                                    if ('accounts' in raydiumInstruction) {
                                        const poolId = raydiumInstruction.accounts[4];
                                        const ray_input = INIT_LOG.decode(ray_data);
                                        let info = [];
                                        try {
                                            info = yield parseCreateTransaction(ray_input, signature);
                                        }
                                        catch (error) {
                                            return;
                                        }
                                        let res;
                                        let result;
                                        if (info && (info === null || info === void 0 ? void 0 : info.length)) {
                                            res = info.map((data) => (Object.assign(Object.assign({}, data), { token: undefined })));
                                            try {
                                                result = yield fetchTokenInfo(res);
                                            }
                                            catch (error) {
                                                console.error("fetchTokenInfo error", error);
                                                return;
                                            }
                                            // send data using socket connection 
                                            const returnValue = yield getData(result, RAY_IX_TYPE.CREATE_POOL, poolId);
                                            console.log(returnValue);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                catch (ex) {
                    console.error(ex);
                }
            }
        }
        catch (ex) {
            console.error(ex);
        }
    }), "confirmed");
});
exports.trackNewPool = trackNewPool;
