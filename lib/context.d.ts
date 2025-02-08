/// <reference types="node" />
import { Static, TObject } from '@sinclair/typebox';
export interface CtxSchema {
    body?: unknown;
    headers?: unknown;
    query?: unknown;
    params?: unknown;
    cookie?: unknown;
    response?: unknown;
}
export type Prettify<T> = {
    [K in keyof T]: T[K];
} & {};
type IsPathParameter<Part extends string> = Part extends `:${infer Parameter}` ? Parameter : Part extends `*` ? '*' : never;
export type GetPathParameter<Path extends string> = Path extends `${infer A}/${infer B}` ? IsPathParameter<A> | GetPathParameter<B> : IsPathParameter<Path>;
export type ResolvePath<Path extends string> = Prettify<{
    [Param in GetPathParameter<Path> as Param extends `${string}?` ? never : Param]: string;
} & {
    [Param in GetPathParameter<Path> as Param extends `${infer OptionalParam}?` ? OptionalParam : never]?: string;
}>;
export type HigherOrderFunction<T extends (...arg: unknown[]) => Function = (...arg: unknown[]) => Function> = (fn: T, request: Request) => ReturnType<T>;
type SetContentType = 'application/octet-stream' | 'application/vnd.ms-fontobject' | 'application/epub+zip' | 'application/gzip' | 'application/json' | 'application/ld+json' | 'application/ogg' | 'application/pdf' | 'application/rtf' | 'application/wasm' | 'application/xhtml+xml' | 'application/xml' | 'application/zip' | 'text/css' | 'text/csv' | 'text/html' | 'text/calendar' | 'text/javascript' | 'text/plain' | 'text/xml' | 'image/avif' | 'image/bmp' | 'image/gif' | 'image/x-icon' | 'image/jpeg' | 'image/png' | 'image/svg+xml' | 'image/tiff' | 'image/webp' | 'multipart/mixed' | 'multipart/alternative' | 'multipart/form-data' | 'audio/aac' | 'audio/x-midi' | 'audio/mpeg' | 'audio/ogg' | 'audio/opus' | 'audio/webm' | 'video/x-msvideo' | 'video/quicktime' | 'video/x-ms-wmv' | 'video/x-msvideo' | 'video/x-flv' | 'video/av1' | 'video/mp4' | 'video/mpeg' | 'video/ogg' | 'video/mp2t' | 'video/webm' | 'video/3gpp' | 'video/3gpp2' | 'font/otf' | 'font/ttf' | 'font/woff' | 'font/woff2' | 'model/gltf+json' | 'model/gltf-binary';
export type HTTPHeaders = Record<string, string | number> & {
    'www-authenticate'?: string;
    authorization?: string;
    'proxy-authenticate'?: string;
    'proxy-authorization'?: string;
    age?: string;
    'cache-control'?: string;
    'clear-site-data'?: string;
    expires?: string;
    'no-vary-search'?: string;
    pragma?: string;
    'last-modified'?: string;
    etag?: string;
    'if-match'?: string;
    'if-none-match'?: string;
    'if-modified-since'?: string;
    'if-unmodified-since'?: string;
    vary?: string;
    connection?: string;
    'keep-alive'?: string;
    accept?: string;
    'accept-encoding'?: string;
    'accept-language'?: string;
    expect?: string;
    'max-forwards'?: string;
    cookie?: string;
    'set-cookie'?: string | string[];
    'access-control-allow-origin'?: string;
    'access-control-allow-credentials'?: string;
    'access-control-allow-headers'?: string;
    'access-control-allow-methods'?: string;
    'access-control-expose-headers'?: string;
    'access-control-max-age'?: string;
    'access-control-request-headers'?: string;
    'access-control-request-method'?: string;
    origin?: string;
    'timing-allow-origin'?: string;
    'content-disposition'?: string;
    'content-length'?: string | number;
    'content-type'?: SetContentType | (string & {});
    'content-encoding'?: string;
    'content-language'?: string;
    'content-location'?: string;
    forwarded?: string;
    via?: string;
    location?: string;
    refresh?: string;
    allow?: string;
    server?: string & {};
    'accept-ranges'?: string;
    range?: string;
    'if-range'?: string;
    'content-range'?: string;
    'content-security-policy'?: string;
    'content-security-policy-report-only'?: string;
    'cross-origin-embedder-policy'?: string;
    'cross-origin-opener-policy'?: string;
    'cross-origin-resource-policy'?: string;
    'expect-ct'?: string;
    'permission-policy'?: string;
    'strict-transport-security'?: string;
    'upgrade-insecure-requests'?: string;
    'x-content-type-options'?: string;
    'x-frame-options'?: string;
    'x-xss-protection'?: string;
    'last-event-id'?: string;
    'ping-from'?: string;
    'ping-to'?: string;
    'report-to'?: string;
    te?: string;
    trailer?: string;
    'transfer-encoding'?: string;
    'alt-svg'?: string;
    'alt-used'?: string;
    date?: string;
    dnt?: string;
    'early-data'?: string;
    'large-allocation'?: string;
    link?: string;
    'retry-after'?: string;
    'service-worker-allowed'?: string;
    'source-map'?: string;
    upgrade?: string;
    'x-dns-prefetch-control'?: string;
    'x-forwarded-for'?: string;
    'x-forwarded-host'?: string;
    'x-forwarded-proto'?: string;
    'x-powered-by'?: string & {};
    'x-request-id'?: string;
    'x-requested-with'?: string;
    'x-robots-tag'?: string;
    'x-ua-compatible'?: string;
};
export declare const statusMap: {
    readonly Continue: 100;
    readonly 'Switching Protocols': 101;
    readonly Processing: 102;
    readonly 'Early Hints': 103;
    readonly OK: 200;
    readonly Created: 201;
    readonly Accepted: 202;
    readonly 'Non-Authoritative Information': 203;
    readonly 'No Content': 204;
    readonly NoContent: 204;
    readonly 'Reset Content': 205;
    readonly 'Partial Content': 206;
    readonly 'Multi-Status': 207;
    readonly 'Already Reported': 208;
    readonly 'Multiple Choices': 300;
    readonly 'Moved Permanently': 301;
    readonly Found: 302;
    readonly 'See Other': 303;
    readonly 'Not Modified': 304;
    readonly 'Temporary Redirect': 307;
    readonly 'Permanent Redirect': 308;
    readonly 'Bad Request': 400;
    readonly BadRequest: 400;
    readonly Unauthorized: 401;
    readonly 'Payment Required': 402;
    readonly Forbidden: 403;
    readonly 'Not Found': 404;
    readonly NotFound: 404;
    readonly 'Method Not Allowed': 405;
    readonly MethodNotAllowed: 405;
    readonly 'Not Acceptable': 406;
    readonly 'Proxy Authentication Required': 407;
    readonly 'Request Timeout': 408;
    readonly RequestTimeout: 408;
    readonly Conflict: 409;
    readonly Gone: 410;
    readonly 'Length Required': 411;
    readonly 'Precondition Failed': 412;
    readonly 'Payload Too Large': 413;
    readonly 'URI Too Long': 414;
    readonly 'Unsupported Media Type': 415;
    readonly 'Range Not Satisfiable': 416;
    readonly 'Expectation Failed': 417;
    readonly "I'm a teapot": 418;
    readonly 'Misdirected Request': 421;
    readonly 'Unprocessable Content': 422;
    readonly UnprocessableEntity: 422;
    readonly Locked: 423;
    readonly 'Failed Dependency': 424;
    readonly 'Too Early': 425;
    readonly 'Upgrade Required': 426;
    readonly 'Precondition Required': 428;
    readonly 'Too Many Requests': 429;
    readonly TooManyRequests: 429;
    readonly 'Request Header Fields Too Large': 431;
    readonly 'Unavailable For Legal Reasons': 451;
    readonly 'Internal Server Error': 500;
    readonly InternalServerError: 500;
    readonly 'Not Implemented': 501;
    readonly 'Bad Gateway': 502;
    readonly BadGateway: 502;
    readonly 'Service Unavailable': 503;
    readonly ServiceUnavailable: 503;
    readonly 'Gateway Timeout': 504;
    readonly 'HTTP Version Not Supported': 505;
    readonly 'Variant Also Negotiates': 506;
    readonly 'Insufficient Storage': 507;
    readonly 'Loop Detected': 508;
    readonly 'Not Extended': 510;
    readonly 'Network Authentication Required': 511;
};
export declare const InvertedStatusMap: {
    readonly 100: "Continue";
    readonly 101: "Switching Protocols";
    readonly 102: "Processing";
    readonly 103: "Early Hints";
    readonly 200: "OK";
    readonly 201: "Created";
    readonly 202: "Accepted";
    readonly 203: "Non-Authoritative Information";
    readonly 204: "No Content" | "NoContent";
    readonly 205: "Reset Content";
    readonly 206: "Partial Content";
    readonly 207: "Multi-Status";
    readonly 208: "Already Reported";
    readonly 300: "Multiple Choices";
    readonly 301: "Moved Permanently";
    readonly 302: "Found";
    readonly 303: "See Other";
    readonly 304: "Not Modified";
    readonly 307: "Temporary Redirect";
    readonly 308: "Permanent Redirect";
    readonly 400: "Bad Request" | "BadRequest";
    readonly 401: "Unauthorized";
    readonly 402: "Payment Required";
    readonly 403: "Forbidden";
    readonly 404: "Not Found" | "NotFound";
    readonly 405: "Method Not Allowed" | "MethodNotAllowed";
    readonly 406: "Not Acceptable";
    readonly 407: "Proxy Authentication Required";
    readonly 408: "Request Timeout" | "RequestTimeout";
    readonly 409: "Conflict";
    readonly 410: "Gone";
    readonly 411: "Length Required";
    readonly 412: "Precondition Failed";
    readonly 413: "Payload Too Large";
    readonly 414: "URI Too Long";
    readonly 415: "Unsupported Media Type";
    readonly 416: "Range Not Satisfiable";
    readonly 417: "Expectation Failed";
    readonly 418: "I'm a teapot";
    readonly 421: "Misdirected Request";
    readonly 422: "Unprocessable Content" | "UnprocessableEntity";
    readonly 423: "Locked";
    readonly 424: "Failed Dependency";
    readonly 425: "Too Early";
    readonly 426: "Upgrade Required";
    readonly 428: "Precondition Required";
    readonly 429: "Too Many Requests" | "TooManyRequests";
    readonly 431: "Request Header Fields Too Large";
    readonly 451: "Unavailable For Legal Reasons";
    readonly 500: "Internal Server Error" | "InternalServerError";
    readonly 501: "Not Implemented";
    readonly 502: "Bad Gateway" | "BadGateway";
    readonly 503: "Service Unavailable" | "ServiceUnavailable";
    readonly 504: "Gateway Timeout";
    readonly 505: "HTTP Version Not Supported";
    readonly 506: "Variant Also Negotiates";
    readonly 507: "Insufficient Storage";
    readonly 508: "Loop Detected";
    readonly 510: "Not Extended";
    readonly 511: "Network Authentication Required";
};
export type StatusMap = typeof statusMap;
export type InvertedStatusMap = typeof InvertedStatusMap;
export interface CookieOptions {
    domain?: string | undefined;
    es?: Date | undefined;
    httpOnly?: boolean | undefined;
    maxAge?: number | undefined;
    path?: string | undefined;
    priority?: 'low' | 'medium' | 'high' | undefined;
    partitioned?: boolean | undefined;
    sameSite?: true | false | 'lax' | 'strict' | 'none' | undefined;
    secure?: boolean | undefined;
    secrets?: string | string[];
}
export type Cookie = Prettify<CookieOptions & {
    value?: unknown;
}>;
export type Redirect = (url: string, status?: number) => void;
export type Context<Route extends CtxSchema = {}, Path extends string | undefined = undefined> = Prettify<{
    body: undefined extends Route['body'] ? Record<string, unknown> : Route['body'] extends TObject ? Static<Route['body']> : never;
    query: undefined extends Route['query'] ? Record<string, string | undefined> : Route['query'] extends TObject ? Static<Route['query']> : never;
    params: undefined extends Route['params'] ? undefined extends Path ? Record<string, string> : Path extends `${string}/${':' | '*'}${string}` ? ResolvePath<Path> : never : Route['params'] extends TObject ? Static<Route['params']> : never;
    headers: undefined extends Route['headers'] ? Record<string, string | undefined> : Route['headers'] extends TObject ? Static<Route['headers']> : never;
    redirect: Redirect;
    set: {
        headers: HTTPHeaders;
        status?: number | keyof StatusMap;
        redirect?: string;
        cookie?: Record<string, any>;
    };
    response(status: number | keyof StatusMap, body: undefined extends Route['response'] ? unknown : Route['response'][keyof Route['response']], headers?: HTTPHeaders): void;
    path: string;
    route: string;
}>;
export type Ctx<Route extends CtxSchema = {}> = Prettify<{
    body: undefined extends Route['body'] ? Record<string, unknown> : Route['body'] extends TObject ? Static<Route['body']> : never;
    query: undefined extends Route['query'] ? Record<string, string | undefined> : Route['query'] extends TObject ? Static<Route['query']> : never;
    params: undefined extends Route['params'] ? Record<string, string> : Route['params'] extends TObject ? Static<Route['params']> : never;
    headers: undefined extends Route['headers'] ? Record<string, string | undefined> : Route['headers'] extends TObject ? Static<Route['headers']> : never;
    redirect: Redirect;
    set: {
        headers: HTTPHeaders;
        status?: number | keyof StatusMap;
        redirect?: string;
        cookie?: Record<string, any>;
    };
    response(status: number | keyof StatusMap, body: undefined extends Route['response'] ? unknown : Route['response'][keyof Route['response']], headers?: HTTPHeaders): void;
    path: string;
    route: string;
}>;
export type RouteHandler<Route extends CtxSchema = {}, Path extends string | undefined = undefined> = (context: Context<Route, Path>) => Promise<unknown>;
export declare const enum HttpMethod {
    GET = "get",
    POST = "post",
    PUT = "put",
    PATCH = "patch",
    DELETE = "delete"
}
export type IExpressCookies = {
    name: string;
    value: string;
    options: CookieOptions;
};
export type InlineHandler<Route extends CtxSchema = {}, Path extends string | undefined = undefined> = RouteHandler<Route, Path>;
export type CustomHandler<Route extends CtxSchema = {}> = (context: Ctx<Route>) => Promise<unknown>;
export type MiddlewareRoute<Route extends CtxSchema> = {
    before?: HigherOrderFunction;
    after?: HigherOrderFunction;
    schema?: Route;
};
export type InternalRoute = {
    method: HttpMethod;
    path: string;
    handler: RouteHandler<any, any> | RouteHandler<any, any>[] | any;
    hook?: MiddlewareRoute<any>;
};
export type ContainsWhitespace<T extends string> = T extends `${string} ${string}` | `${string}\t${string}` | `${string}\n${string}` ? 'Error: Strings containing whitespace are not allowed' : T;
export type CustomRouteDefinition<R extends CtxSchema> = {
    handler: CustomHandler<R>;
    hook?: MiddlewareRoute<R>;
};
export {};
