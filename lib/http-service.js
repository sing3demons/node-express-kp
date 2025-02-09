"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const axios_1 = __importStar(require("axios"));
const axios_retry_1 = __importDefault(require("axios-retry"));
const http_method = ['GET', 'POST', 'PUT', 'DELETE'];
class HttpService {
    requestHttp(optionRequest) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const requestAttributes = [];
            let returnObjFlag = true;
            if (Array.isArray(optionRequest)) {
                optionRequest.forEach((request) => {
                    requestAttributes.push(request);
                });
                returnObjFlag = false;
                optionRequest.length = 0;
            }
            else {
                requestAttributes.push(optionRequest);
            }
            const axiosRetryConfig = {
                retries: 3,
                retryDelay: axios_retry_1.default.exponentialDelay,
                retryCondition: (error) => { var _a; return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429; },
            };
            (0, axios_retry_1.default)(axios_1.default, axiosRetryConfig);
            const requests = [];
            function processOptionAttributes(request) {
                const { headers, method, params, query, body, retry_condition, retry_count, timeout, url, auth, axiosRequestConfig, } = request;
                const config = Object.assign(Object.assign({}, axiosRequestConfig), { headers,
                    method, url: params ? replaceUrlParam(url, params) : url, data: body, timeout,
                    auth });
                if (retry_count) {
                    if (!config['axios-retry']) {
                        config['axios-retry'] = Object.assign({}, axiosRetryConfig);
                    }
                    config['axios-retry'].retries = retry_count;
                }
                if (retry_condition) {
                    if (!config['axios-retry']) {
                        config['axios-retry'] = Object.assign({}, axiosRetryConfig);
                    }
                    config['axios-retry'].retryCondition = retry_condition;
                }
                if (timeout) {
                    config['timeout'] = timeout;
                }
                if (query) {
                    config['params'] = query;
                }
                requests.push(makeRequest(config));
            }
            requestAttributes.forEach(processOptionAttributes);
            requestAttributes.length = 0;
            if (returnObjFlag) {
                const result = yield requests.pop();
                const response = {
                    data: result === null || result === void 0 ? void 0 : result.data,
                    headers: (_a = result === null || result === void 0 ? void 0 : result.headers) !== null && _a !== void 0 ? _a : {},
                    status: result === null || result === void 0 ? void 0 : result.status,
                };
                return response;
            }
            const result = yield Promise.all(requests);
            requests.length = 0;
            return result;
        });
    }
}
function replaceUrlParam(url, params) {
    var _a, _b;
    let subURL = url.split('/');
    for (let i = 0; i < subURL.length; i++) {
        if (subURL[i] !== '' && ((_a = subURL[i]) === null || _a === void 0 ? void 0 : _a.startsWith(':'))) {
            const sub = (_b = subURL[i]) === null || _b === void 0 ? void 0 : _b.substring(1);
            let replaceValue = sub ? params[sub] : undefined;
            if (replaceValue) {
                subURL[i] = replaceValue;
                continue;
            }
        }
    }
    return subURL.join('/');
}
function makeRequest(config) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        const response = {
            status: 200,
            headers: undefined,
        };
        try {
            const result = yield axios_1.default.request(config);
            response.data = result.data;
            response.headers = result.headers;
            response.status = result.status;
            return response;
        }
        catch (error) {
            if (error instanceof axios_1.AxiosError) {
                response.data = (_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) !== null && _b !== void 0 ? _b : error.message;
                response.headers = (_c = error.response) === null || _c === void 0 ? void 0 : _c.headers;
                response.status = (_e = (_d = error.response) === null || _d === void 0 ? void 0 : _d.status) !== null && _e !== void 0 ? _e : 500;
            }
            else if (error instanceof Error) {
                response.data = error === null || error === void 0 ? void 0 : error.message;
                response.status = 500;
                return {
                    data: error.message,
                    headers: {},
                    status: 500,
                };
            }
            else {
                const err = error;
                response.data = err === null || err === void 0 ? void 0 : err.message;
                response.headers = (_f = err === null || err === void 0 ? void 0 : err.response) === null || _f === void 0 ? void 0 : _f.headers;
                response.status = (_h = (_g = err === null || err === void 0 ? void 0 : err.response) === null || _g === void 0 ? void 0 : _g.status) !== null && _h !== void 0 ? _h : 500;
            }
            return response;
        }
    });
}
exports.default = HttpService;
