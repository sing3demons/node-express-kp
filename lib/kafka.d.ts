import { KafkaMessage, logLevel, SASLOptions, Mechanism, ProducerConfig } from 'kafkajs';
export type ServerKafkaOptions = {
    client: {
        clientId: string;
        brokers: string[];
    };
    consumer: {
        groupId: string;
        [key: string]: unknown;
    };
    retry?: {
        initialRetryTime: number;
        retries: number;
    };
    producer?: ProducerConfig;
    parser?: unknown;
    subscribe?: Record<string, unknown>;
    run?: Record<string, unknown>;
    send?: Record<string, unknown>;
    postfixId?: string;
    logLevel?: logLevel;
    ssl?: boolean;
    requestTimeout?: number;
    enforceRequestTimeout?: boolean;
    connectionTimeout?: number;
    sasl?: SASLOptions | Mechanism;
};
type KafkaContext = {
    topic: string;
    partition: number;
    headers: KafkaMessage['headers'];
    value: string | null;
};
type MessageHandler<T = any> = (data: unknown, context: KafkaContext) => Promise<T>;
export declare class ServerKafka {
    private logger;
    private client;
    private consumer;
    private producer;
    private brokers;
    private clientId;
    private groupId;
    private options;
    private messageHandlers;
    private retry;
    private logLevel?;
    private ssl?;
    private requestTimeout?;
    private enforceRequestTimeout?;
    private connectionTimeout?;
    private sasl?;
    constructor(options: ServerKafkaOptions);
    listen(callback: (err?: Error) => void): Promise<void>;
    close(): Promise<void>;
    private start;
    private createClient;
    private bindEvents;
    private getMessageHandler;
    private parser;
    private handleMessage;
    parse(message: KafkaMessage): {
        pattern: string;
        data: unknown;
    } | {};
    private sendMessage;
    private getHandlerByPattern;
    consume(pattern: string, handler: MessageHandler): void;
}
export {};
