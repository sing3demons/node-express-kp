var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Kafka } from 'kafkajs';
import { TypeCompiler } from '@sinclair/typebox/compiler';
export class ServerKafkaError extends Error {
    constructor({ message, topic, payload }) {
        super(message);
        this.name = 'ServerKafkaError';
        this.topic = topic;
        this.payload = payload;
    }
}
export class ServerKafka {
    constructor(options) {
        this.client = null;
        this.consumer = null;
        this.producer = null;
        this.messageHandlers = new Map();
        this.schemaHandler = new Map();
        this.validate = (topic, data, rawMessage) => {
            const schema = this.schemaHandler.get(topic);
            if (schema === null || schema === void 0 ? void 0 : schema.body) {
                const typeCheck = TypeCompiler.Compile(schema.body);
                if (!typeCheck.Check(data)) {
                    const first = typeCheck.Errors(data).First();
                    throw new ServerKafkaError({
                        message: 'Invalid schema',
                        topic: topic,
                        payload: first,
                    });
                }
            }
            if (schema === null || schema === void 0 ? void 0 : schema.headers) {
                const typeCheck = TypeCompiler.Compile(schema.headers);
                if (!typeCheck.Check(rawMessage.headers)) {
                    const first = typeCheck.Errors(rawMessage.headers).First();
                    throw new ServerKafkaError({
                        message: 'Invalid schema',
                        topic: topic,
                        payload: first,
                    });
                }
            }
        };
        this.options = options;
        const clientOptions = options.client || {};
        const consumerOptions = options.consumer || {};
        this.clientId = clientOptions.clientId;
        this.groupId = consumerOptions.groupId || this.clientId;
    }
    listen(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.client = this.createClient();
                yield this.start(callback);
            }
            catch (err) {
                if (callback) {
                    callback(err);
                }
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.consumer)
                yield this.consumer.disconnect();
            if (this.producer)
                yield this.producer.disconnect();
            this.consumer = null;
            this.producer = null;
            this.client = null;
        });
    }
    start(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            const consumerOptions = Object.assign(Object.assign({}, this.options.consumer), { groupId: this.groupId });
            this.consumer = this.client.consumer(consumerOptions);
            this.producer = this.client.producer(this.options.producer);
            try {
                yield this.consumer.connect();
                yield this.producer.connect();
                yield this.bindEvents(this.consumer);
            }
            catch (error) {
                console.error('Failed to connect to Kafka', error);
                yield this.close();
            }
            if (callback) {
                callback();
            }
        });
    }
    createClient() {
        var _a, _b, _c, _d, _e, _f;
        const config = Object.assign(Object.assign({}, this.options.client), { brokers: this.options.client.brokers, clientId: this.clientId, logLevel: ((_a = this.options.client) === null || _a === void 0 ? void 0 : _a.logLevel) || 1, retry: {
                initialRetryTime: ((_c = (_b = this.options.client) === null || _b === void 0 ? void 0 : _b.retry) === null || _c === void 0 ? void 0 : _c.initialRetryTime) || 300,
                retries: ((_e = (_d = this.options.client) === null || _d === void 0 ? void 0 : _d.retry) === null || _e === void 0 ? void 0 : _e.retries) || 8,
            } });
        if ((_f = this.options.client) === null || _f === void 0 ? void 0 : _f.auth) {
            config.sasl = {
                mechanism: 'plain',
                username: this.options.client.auth.username,
                password: this.options.client.auth.password,
            };
        }
        return new Kafka(config);
    }
    bindEvents(consumer) {
        return __awaiter(this, void 0, void 0, function* () {
            const registeredPatterns = [...this.messageHandlers.keys()];
            const consumerSubscribeOptions = this.options.subscribe || {};
            if (registeredPatterns.length > 0) {
                yield consumer.subscribe(Object.assign(Object.assign({}, consumerSubscribeOptions), { topics: registeredPatterns }));
            }
            const consumerRunOptions = Object.assign(Object.assign({}, this.options.run), { eachMessage: this.getMessageHandler() });
            yield consumer.run(consumerRunOptions);
        });
    }
    getMessageHandler() {
        return (payload) => __awaiter(this, void 0, void 0, function* () {
            yield this.handleMessage(payload);
        });
    }
    handleMessage(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const { topic, message } = payload;
                for (const key in message === null || message === void 0 ? void 0 : message.headers) {
                    if (Object.prototype.hasOwnProperty.call(message.headers, key)) {
                        const element = message.headers[key];
                        if (element instanceof Buffer) {
                            message.headers[key] = element.toString();
                        }
                    }
                }
                const beforeHandle = (_a = this.schemaHandler.get(topic)) === null || _a === void 0 ? void 0 : _a.beforeHandle;
                const rawMessage = {
                    topic,
                    partition: payload.partition,
                    headers: message.headers,
                    value: ((_b = message.value) === null || _b === void 0 ? void 0 : _b.toString()) || '',
                    body: JSON.parse(((_c = message.value) === null || _c === void 0 ? void 0 : _c.toString()) || ''),
                };
                const handler = this.getHandlerByPattern(rawMessage.topic);
                if (!handler) {
                    return;
                }
                const schemaCtx = this.schemaHandler.get(topic) || {};
                const kafkaContext = Object.assign(Object.assign({}, rawMessage), { validate: (data) => this.validate(topic, data, rawMessage), sendMessage: (topic, payload) => __awaiter(this, void 0, void 0, function* () { return yield this.sendMessage(topic, payload); }), body: rawMessage.body });
                if (beforeHandle) {
                    yield beforeHandle(kafkaContext);
                }
                const response = yield handler(kafkaContext);
                if (response.topic && response.data) {
                    yield this.sendMessage(response.topic, response.data);
                }
            }
            catch (error) {
                console.error('Failed to handle message', error);
            }
        });
    }
    sendMessage(topic, payload) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            let producer = this.producer;
            if (!producer) {
                producer = (_b = (_a = this.client) === null || _a === void 0 ? void 0 : _a.producer(this.options.producer)) !== null && _b !== void 0 ? _b : null;
            }
            if (!producer) {
                return {
                    err: true,
                    result_desc: 'Failed to connect to Kafka',
                    result_data: [],
                };
            }
            const messages = [];
            if (typeof payload === 'object') {
                if (Array.isArray(payload)) {
                    payload.forEach((msg) => {
                        messages.push({ value: JSON.stringify(msg) });
                    });
                }
                else {
                    messages.push({ value: JSON.stringify(payload) });
                }
            }
            else {
                messages.push({ value: payload });
            }
            try {
                yield producer.connect();
                const recordMetadata = yield producer.send({
                    topic,
                    messages: messages.map((msg) => {
                        try {
                            return JSON.parse(String(msg));
                        }
                        catch (error) {
                            return msg;
                        }
                    }),
                });
                const result = {
                    err: false,
                    result_desc: 'success',
                    result_data: recordMetadata,
                };
                return result;
            }
            catch (error) {
                const result = {
                    err: true,
                    result_desc: 'Failed to send message',
                    result_data: [],
                };
                if (error instanceof Error) {
                    result.result_desc = error.message;
                }
                return result;
            }
            finally {
                yield producer.disconnect();
            }
        });
    }
    getHandlerByPattern(pattern) {
        return this.messageHandlers.get(pattern);
    }
    consume(pattern, handler, schema) {
        this.messageHandlers.set(pattern, handler);
        if (schema) {
            this.schemaHandler.set(pattern, schema);
        }
    }
}
