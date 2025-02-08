import { KafkaMessage, RecordMetadata } from 'kafkajs';
import { Static, TObject, TSchema } from '@sinclair/typebox';
export type CtxConsumer<Body = unknown, Headers = unknown> = {
    body: Body;
    headers: Headers;
    setHeaders: (headers: Record<string, string>) => void;
    validate: <T>(data: T) => void;
    response: (code: number, data: any) => void;
};
export type SchemaCtxConsumer<Body extends TSchema = TSchema, Header extends TSchema = TSchema> = {
    body?: Static<Body>;
    headers?: Static<Header>;
};
export type ServerKafkaOptions = {
    client: {
        clientId: string;
        brokers: string[];
        logLevel?: number;
        retry?: {
            initialRetryTime?: number;
            retries?: number;
        };
        auth?: {
            username: string;
            password: string;
        };
    };
    consumer?: {
        groupId?: string;
        [key: string]: unknown;
    };
    producer?: Record<string, unknown>;
    parser?: unknown;
    subscribe?: Record<string, unknown>;
    run?: Record<string, unknown>;
    send?: Record<string, unknown>;
};
type SchemaCtx = {
    body?: TSchema;
    query?: TSchema;
    headers?: TSchema;
};
export type KafkaContext<Schema extends SchemaCtx> = {
    topic: string;
    partition: number;
    headers: KafkaMessage['headers'];
    value: string;
    validate: <T>(data: T) => void;
    sendMessage: (topic: string, payload: any) => Promise<{
        err: boolean;
        result_desc: string;
        result_data: never[] | RecordMetadata[];
    }>;
    body: Schema['body'] extends TObject ? Static<Schema['body']> : Record<string, any>;
};
type BaseResponse = {
    topic?: string;
    status?: number;
    data?: unknown;
    success: boolean;
};
export type MessageHandler<Schema extends SchemaCtx> = (context: KafkaContext<Schema>) => Promise<BaseResponse> | BaseResponse;
export type ConsumeHandler<B extends TSchema, H extends TSchema> = (ctx: CtxConsumer<Static<B>, Static<H>>) => Promise<BaseResponse | void> | BaseResponse | void;
export declare class ServerKafkaError extends Error {
    topic?: string;
    payload?: any;
    constructor({ message, topic, payload }: {
        message: string;
        topic?: string;
        payload?: any;
    });
}
export type TSchemaCtx<BodySchema extends TSchema, HeaderSchema extends TSchema> = {
    body?: BodySchema;
    headers?: HeaderSchema;
    beforeHandle?: (ctx: CtxConsumer<Static<BodySchema>, Static<HeaderSchema>>) => Promise<any>;
};
export interface IServerKafka {
    listen(callback: (err?: Error) => void): Promise<void>;
    close(): Promise<void>;
    consume<Body extends TSchema, Header extends TSchema>(pattern: string, handler: ConsumeHandler<Body, Header>, schema?: TSchemaCtx<Body, Header>): void;
}
export declare class ServerKafka implements IServerKafka {
    private client;
    private consumer;
    private producer;
    private clientId?;
    private groupId;
    private options;
    private messageHandlers;
    private schemaHandler;
    constructor(options: ServerKafkaOptions);
    listen(callback?: (err?: Error) => void): Promise<void>;
    close(): Promise<void>;
    private start;
    private createClient;
    private bindEvents;
    private getMessageHandler;
    private handleMessage;
    private validate;
    private sendMessage;
    private getHandlerByPattern;
    consume<Body extends TSchema, Header extends TSchema>(pattern: string, handler: ConsumeHandler<Body, Header>, schema?: TSchemaCtx<Body, Header>): void;
}
export {};
