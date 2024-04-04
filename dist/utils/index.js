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
exports.getTopTradersList = exports.isValidSolanaAddress = void 0;
const config_1 = require("../config/config");
const selenium_webdriver_1 = require("selenium-webdriver");
const chrome_1 = __importDefault(require("selenium-webdriver/chrome"));
const options = new chrome_1.default.Options();
options.addArguments("--headless");
options.addArguments("--disable-gpu");
options.addArguments("--window-size=1920x1080");
options.addArguments("--disable-dev-shm-usage");
options.addArguments("--no-sandbox");
options.addArguments(`--remote-debugging-port=9999`);
options.addArguments("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537");
options.addArguments("--disable-blink-features");
options.addArguments("--disable-blink-features=AutomationControlled");
const driver = new selenium_webdriver_1.Builder().forBrowser("chrome").setChromeOptions(options).build();
const isValidSolanaAddress = (address) => __awaiter(void 0, void 0, void 0, function* () {
    // Regular expression to match a Solana address
    const solanaAddressRegex = /^[1-9A-HJ-NP-Za-km-z]{44}$/;
    return solanaAddressRegex.test(address);
});
exports.isValidSolanaAddress = isValidSolanaAddress;
const getTopTradersList = (info) => __awaiter(void 0, void 0, void 0, function* () {
    let data = info;
    let alltoptraderlist = [];
    const whaleList = [];
    for (let i = 0; i < data.length; i++) {
        const io = `${config_1.DEX_IO_URL}/${data[i].pairAddress}?q=toptrader`;
        yield driver.get(io);
        const pageSource = (yield driver.getPageSource()).toString();
        const regexPattern = /X[1-9A-HJ-NP-Za-km-z]{44}/g;
        let match;
        const matches = [];
        while ((match = regexPattern.exec(pageSource)) !== null) {
            matches.push(match[0].slice(1, 45));
        }
        data[i].topTraders = matches;
        alltoptraderlist = alltoptraderlist.concat(matches);
    }
    alltoptraderlist.map((item, index) => {
        const count = alltoptraderlist.indexOf(item, index + 1);
        if (count != -1) {
            alltoptraderlist.filter(x => x != item);
            whaleList.push(item);
        }
    });
    return { poolData: data, whaleList };
});
exports.getTopTradersList = getTopTradersList;
