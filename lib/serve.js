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
exports.Router = exports.AppRouter = exports.HandlerSchema = void 0;
const express_1 = __importDefault(require("express"));
const value_1 = require("@sinclair/typebox/value");
const uuid_1 = require("uuid");
const compiler_1 = require("@sinclair/typebox/compiler");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const http_1 = __importDefault(require("http"));
const HandlerSchema = (handler, hook) => ({
    handler,
    hook,
});
exports.HandlerSchema = HandlerSchema;
class AppRouter {
    constructor() {
        this._routes = [];
        this.getRoutes = () => this._routes;
    }
    add(method, path, handler, hook) {
        this._routes.push({
            method,
            path: path.replace(/\/+$/, '').replace(/^([^/])/, '/$1'),
            handler,
            hook,
        });
        return this;
    }
    get(path, handlerOrOptions, hook) {
        if (typeof handlerOrOptions === 'function') {
            return this.add("get", path, handlerOrOptions, hook);
        }
        return this.add("get", path, handlerOrOptions.handler, handlerOrOptions.hook);
    }
    post(path, handlerOrOptions, hook) {
        if (typeof handlerOrOptions === 'function') {
            return this.add("post", path, handlerOrOptions, hook);
        }
        return this.add("post", path, handlerOrOptions.handler, handlerOrOptions.hook);
    }
    put(path, handlerOrOptions, hook) {
        if (typeof handlerOrOptions === 'function') {
            return this.add("put", path, handlerOrOptions, hook);
        }
        return this.add("put", path, handlerOrOptions.handler, handlerOrOptions.hook);
    }
    delete(path, handler, hook) {
        if (typeof handler === 'function') {
            return this.add("delete", path, handler, hook);
        }
        return this.add("delete", path, handler.handler, handler.hook);
    }
    patch(path, handler, hook) {
        if (typeof handler === 'function') {
            return this.add("patch", path, handler, hook);
        }
        return this.add("patch", path, handler.handler, handler.hook);
    }
    Router(group) {
        if (group) {
            if (group.startsWith('/')) {
                this._routes = this._routes.map((e) => (Object.assign(Object.assign({}, e), { path: `${group}${e.path}`.replace(/\/$/, '') })));
            }
            else {
                this._routes = this._routes.map((e) => (Object.assign(Object.assign({}, e), { path: `/${group}${e.path}`.replace(/\/$/, '') })));
            }
        }
        return this;
    }
}
exports.AppRouter = AppRouter;
class AppServer extends AppRouter {
    constructor() {
        super();
        this.instance = (0, express_1.default)();
        this.instance.use((req, _res, next) => {
            if (!req.headers['x-session']) {
                req.headers['x-session'] = (0, uuid_1.v4)();
            }
            if (!req.headers['x-tid']) {
                req.headers['x-tid'] = (0, uuid_1.v7)();
            }
            next();
        });
        this.instance.use(express_1.default.json());
        this.instance.use(express_1.default.urlencoded({ extended: true }));
        this.instance.use((0, cookie_parser_1.default)());
    }
    router(router) {
        router.getRoutes().forEach((e) => this._routes.push(e));
    }
    validatorFactory(req, schema) {
        const errors = [];
        if (schema.body) {
            const C = compiler_1.TypeCompiler.Compile(schema.body);
            const isValid = C.Check(req.body);
            if (!isValid) {
                errors.push(...[...C.Errors(req.body)].map((e) => ({ type: 'body', path: e.path, message: e.message })));
            }
        }
        if (schema.params) {
            const C = compiler_1.TypeCompiler.Compile(schema.params);
            const isValid = C.Check(req.params);
            if (!isValid) {
                errors.push(...[...C.Errors(req.params)].map((e) => ({ type: 'params', path: e.path, message: e.message })));
            }
        }
        if (schema.query) {
            const C = compiler_1.TypeCompiler.Compile(schema.query);
            const isValid = C.Check(req.query);
            if (!isValid) {
                errors.push(...[...C.Errors(req.query)].map((e) => ({ type: 'query', path: e.path, message: e.message })));
            }
        }
        if (schema.headers) {
            const C = compiler_1.TypeCompiler.Compile(schema.headers);
            const isValid = C.Check(req.headers);
            if (!isValid) {
                errors.push(...[...C.Errors(req.headers)].map((e) => ({ type: 'headers', path: e.path, message: e.message })));
            }
        }
        const isError = errors.length > 0 ? true : false;
        return {
            err: isError,
            desc: isError ? 'invalid_request' : 'success',
            data: errors,
        };
    }
    createContext(req, res) {
        const context = {
            body: req.body,
            headers: req.headers,
            params: req.params,
            query: req.query,
            response: (code, data, headers) => {
                if (headers && Object.keys(headers).length > 0) {
                    res.set(headers);
                }
                res.status(code).send(data);
            },
            validate(schema, data) {
                try {
                    const C = compiler_1.TypeCompiler.Compile(schema);
                    const isValid = C.Check(data);
                    if (!isValid) {
                        const description = [...value_1.Value.Errors(schema, data)].map((err) => err.message).join(', ');
                        return {
                            err: true,
                            description,
                            value: {},
                        };
                    }
                    return {
                        err: false,
                        description: 'success',
                        value: data,
                    };
                }
                catch (error) {
                    if (error instanceof Error) {
                        return {
                            err: true,
                            description: error.message,
                            value: {},
                        };
                    }
                    return {
                        err: true,
                        description: 'unknown_error',
                        value: {},
                    };
                }
            },
            set: {
                headers: undefined,
                status: 200,
                cookie: undefined,
            },
        };
        return context;
    }
    register() {
        this._routes.forEach(({ method, path, handler, hook }) => {
            this.instance.route(path)[method]((req, res, next) => __awaiter(this, void 0, void 0, function* () {
                const ctx = this.createContext(req, res);
                const schemas = (hook === null || hook === void 0 ? void 0 : hook.schema) || {};
                const schema = this.validatorFactory(ctx, schemas);
                if (schema.err) {
                    res.status(400).json({
                        desc: schema.desc,
                        data: schema.data,
                    });
                    return next();
                }
                const result = yield handler(ctx);
                if (result && ctx.set.headers) {
                    res.set(ctx.set.headers);
                }
                if (result && ctx.set.cookie) {
                    res.cookie(ctx.set.cookie.name, ctx.set.cookie.value, ctx.set.cookie.options);
                }
                if (result && ctx.set.status) {
                    res.status(ctx.set.status);
                }
                if (result) {
                    res.json(result);
                }
            }));
        });
        this._routes.length = 0;
        this.instance.use((req, res) => {
            res.status(404).json({
                desc: 'not_found',
                data: {
                    url: req.url,
                    method: req.method,
                },
            });
        });
        return this.instance;
    }
    listen(port, callback) {
        if (this._routes.length !== 0) {
            this.register();
        }
        const server = http_1.default.createServer(this.instance).listen(port, callback);
        const signals = ['SIGINT', 'SIGTERM', 'SIGQUIT'];
        signals.forEach((signal) => {
            process.on(signal, () => {
                console.log(`Received ${signal}. Closing server.`);
                server.close(() => {
                    console.log('Server closed.');
                    if (callback)
                        callback();
                    process.exit(0);
                });
                setTimeout(() => {
                    console.log('Could not close server in time. Forcing shutdown.');
                    process.exit(1);
                }, 10000);
            });
        });
        return server;
    }
}
exports.default = AppServer;
function Router() {
    return new AppRouter();
}
exports.Router = Router;
