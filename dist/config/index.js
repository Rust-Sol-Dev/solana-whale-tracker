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
exports.PORT = exports.connectDb = void 0;
/**
 * MongoDB Database Connection and Configuration
 *
 * This module handles the setup and configuration of the MongoDB database connection using the Mongoose library.
 * It also exports a function to establish the connection to the database and a constant for the application's port.
 */
const mongoose_1 = __importDefault(require("mongoose"));
const config_1 = require("./config");
/**
 * Establishes a connection to the MongoDB database.
 *
 * This function sets up a connection to the MongoDB database using the provided `MONGO_URL` configuration.
 * It enforces strict query mode for safer database operations. Upon successful connection, it logs the
 * host of the connected database. In case of connection error, it logs the error message and exits the process.
 */
const connectDb = () => __awaiter(void 0, void 0, void 0, function* () {
    let isConnected = false;
    const connect = () => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (config_1.MONGO_URL) {
                const connection = yield mongoose_1.default.connect(config_1.MONGO_URL);
                console.log(`MONGODB CONNECTED : ${connection.connection.host}`);
                isConnected = true;
            }
            else {
                console.log("No Mongo URL");
            }
        }
        catch (error) {
            console.log(`Error : ${error.message}`);
            isConnected = false;
            // Attempt to reconnect
            setTimeout(connect, 1000); // Retry connection after 1 seconds
        }
    });
    connect();
    mongoose_1.default.connection.on("disconnected", () => {
        console.log("MONGODB DISCONNECTED");
        isConnected = false;
        // Attempt to reconnect
        setTimeout(connect, 1000); // Retry connection after 5 seconds
    });
    mongoose_1.default.connection.on("reconnected", () => {
        console.log("MONGODB RECONNECTED");
        isConnected = true;
    });
});
exports.connectDb = connectDb;
/**
 * The port on which the application will listen.
 *
 * This constant represents the port number on which the application's server will listen for incoming requests.
 * It is exported from the 'config' module and can be used to configure the server to listen on the specified port.
 */
var config_2 = require("./config");
Object.defineProperty(exports, "PORT", { enumerable: true, get: function () { return config_2.PORT; } });
