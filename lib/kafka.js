var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Kafka, } from 'kafkajs';
export class ServerKafka {
    constructor(options) {
        this.client = null;
        this.consumer = null;
        this.producer = null;
        this.messageHandlers = new Map();
        this.options = options;
        this.logger = console;
        const clientOptions = options.client || {};
        const consumerOptions = options.consumer || {};
        this.brokers = clientOptions.brokers;
        this.clientId = clientOptions.clientId;
        this.groupId = consumerOptions.groupId;
        this.retry = options.retry || { initialRetryTime: 100, retries: 8 };
        this.logLevel = options.logLevel;
        this.ssl = options.ssl;
        this.requestTimeout = options.requestTimeout;
        this.enforceRequestTimeout = options.enforceRequestTimeout;
        this.connectionTimeout = options.connectionTimeout;
        this.sasl = options.sasl;
    }
    listen(callback) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this.client = this.createClient();
                yield this.start(callback);
            }
            catch (err) {
                callback(err);
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
            yield this.consumer.connect();
            yield this.producer.connect();
            yield this.bindEvents(this.consumer);
            callback();
        });
    }
    createClient() {
        const config = {
            brokers: this.brokers,
            clientId: this.clientId,
            retry: this.retry,
        };
        if (this.logLevel) {
            config.logLevel = this.logLevel;
        }
        if (this.ssl) {
            config.ssl = this.ssl;
        }
        if (this.enforceRequestTimeout) {
            config.enforceRequestTimeout = this.enforceRequestTimeout;
        }
        if (this.connectionTimeout) {
            config.connectionTimeout = this.connectionTimeout;
        }
        if (this.sasl) {
            config.sasl = this.sasl;
        }
        config.requestTimeout = this.requestTimeout || 30000;
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
    parser({ topic, message, partition }) {
        var _a;
        return { topic, partition: partition, headers: message.headers, value: ((_a = message.value) === null || _a === void 0 ? void 0 : _a.toString()) || '' };
    }
    handleMessage(payload) {
        return __awaiter(this, void 0, void 0, function* () {
            const { topic, partition } = payload;
            const rawMessage = this.parser(payload);
            this.logger.debug('Parsed message:', rawMessage);
            if (!(rawMessage === null || rawMessage === void 0 ? void 0 : rawMessage.topic)) {
                this.logger.error(`No pattern found in message for topic: ${topic}`, rawMessage);
                return;
            }
            const kafkaContext = Object.assign(Object.assign({}, rawMessage), { partition: partition, topic });
            const handler = this.getHandlerByPattern(rawMessage.topic);
            if (!handler) {
                this.logger.error(`No handler registered for pattern: ${rawMessage.topic}`);
                return;
            }
            const response = yield handler(rawMessage.value, kafkaContext);
            if (response) {
                if (response['reply-topic']) {
                    yield this.sendMessage({ response }, response['reply-topic']);
                }
            }
        });
    }
    parse(message) {
        var _a;
        try {
            const value = (_a = message.value) === null || _a === void 0 ? void 0 : _a.toString();
            return value ? JSON.parse(value) : {};
        }
        catch (err) {
            console.error('Failed to parse message', err);
            return {};
        }
    }
    sendMessage(message, replyTopic) {
        return __awaiter(this, void 0, void 0, function* () {
            const outgoingMessage = Object.assign({}, message.response);
            yield this.producer.send({
                topic: replyTopic,
                messages: [outgoingMessage],
            });
        });
    }
    getHandlerByPattern(pattern) {
        return this.messageHandlers.get(pattern);
    }
    consume(pattern, handler) {
        this.messageHandlers.set(pattern, handler);
    }
}
