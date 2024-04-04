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
const express_1 = require("express");
const axios_1 = __importDefault(require("axios"));
const web3_js_1 = require("@solana/web3.js");
const config_1 = require("../../config/config");
const utils_1 = require("../../utils");
// Create a new instance of the Express Router
const Token = (0, express_1.Router)();
// @route    GET api/tokens
// @desc     Ping
// @access   Public
Token.get("/", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return res.json("API is working");
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}));
// @route    GET api/tokens/pair
// @desc     Fetch Pairs List
// @params   baseToken:string, quoteToken?:string
// @access   Public
Token.get("/pair", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const baseToken = req.query.baseToken;
        const quoteToken = req.query.quoteToken;
        if (typeof baseToken !== 'string') {
            return res.status(400).json({ error: 'Base token must be a string' });
        }
        if (!(0, utils_1.isValidSolanaAddress)(baseToken))
            return res.status(400).json({ error: 'Invalid Base Token address' });
        if (quoteToken) {
            if (typeof quoteToken !== 'string') {
                return res.status(400).json({ error: 'Quote token must be a string' });
            }
            if (!(0, utils_1.isValidSolanaAddress)(baseToken))
                return res.status(400).json({ error: 'Invalid Quote Token address' });
        }
        const result = yield axios_1.default.get(`${config_1.DEX_API_URL}/tokens/${baseToken}`);
        const pairList = result.data.pairs;
        if (quoteToken) {
            res.json(pairList.filter((item) => (item.dexId === "raydium") && ((item.baseToken.address === baseToken && item.quoteToken.address === quoteToken) ||
                (item.baseToken.address === quoteToken && item.quoteToken.address === baseToken))));
            // res.json(pairList.filter((item: any) => (item.baseToken.address == baseToken) && (item.quoteToken.address == quoteToken) || (item.baseToken.address == quoteToken) && (item.quoteToken.address == baseToken)))
        }
        else {
            res.json(pairList.filter((item) => ((item.baseToken.address == baseToken) || (item.quoteToken.address == baseToken)) && item.dexId == "raydium"));
            // res.json(pairList.filter((item: any) => (item.baseToken.address == baseToken) || (item.quoteToken.address == baseToken)))
        }
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}));
// @route    GET api/tokens/topholders
// @desc     Get top holders of current token
// @params   address:string
// @access   Public
Token.get("/topholders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const address = req.query.tokenMint;
        if (typeof address !== 'string') {
            return res.status(400).json({ error: 'Base token must be a string' });
        }
        if (!(0, utils_1.isValidSolanaAddress)(address))
            return res.status(400).json({ error: 'Invalid Base Token address' });
        const holders = yield config_1.connection.getTokenLargestAccounts(new web3_js_1.PublicKey(address));
        if (holders && holders.value.length) {
            res.json(holders.value);
        }
        else
            res.status(404).json({ error: 'Not found' });
    }
    catch (error) {
        console.error(error);
        return res.status(400).json({ error: "Internal Server Error" });
    }
}));
// @route    GET api/tokens/toptrader
// @desc     Get top traders of current token
// @params   address:string
// @access   Public
Token.get("/toptraders", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const token = req.query.token;
        if (typeof token !== 'string') {
            return res.status(400).json({ error: 'Base token must be a string' });
        }
        if (!(0, utils_1.isValidSolanaAddress)(token))
            return res.status(400).json({ error: 'Invalid Base Token address' });
        const pairsData = yield axios_1.default.get(`${config_1.DEX_API_URL}/tokens/${token}`);
        const pairsList = pairsData.data.pairs;
        const raydiumPools = pairsList.filter((item) => (item.dexId === "raydium"));
        const filtered = raydiumPools.map((item) => ({
            pairAddress: item.pairAddress,
            baseToken: {
                address: item.baseToken.address,
                name: item.baseToken.name,
                symbol: item.baseToken.symbol
            },
            quoteToken: {
                address: item.quoteToken.address,
                name: item.quoteToken.name,
                symbol: item.quoteToken.symbol
            }
        }));
        const data = yield (0, utils_1.getTopTradersList)(filtered);
        res.json(data);
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}));
exports.default = Token;
