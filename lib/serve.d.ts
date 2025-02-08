import { type Application } from 'express';
import { CtxSchema, InternalRoute, InlineHandler, MiddlewareRoute, ContainsWhitespace, CustomHandler, CustomRouteDefinition } from './context';
import http from 'http';
export declare const HandlerSchema: <T extends CtxSchema>(handler: CustomHandler<T>, hook?: MiddlewareRoute<T>) => {
    handler: CustomHandler<T>;
    hook: MiddlewareRoute<T> | undefined;
};
export interface IAppRouter {
    get<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    get<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    post<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    post<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    put<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    put<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    delete<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    delete<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    patch<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    patch<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    getRoutes(): InternalRoute[];
    Router<T extends string>(group?: ContainsWhitespace<T>): this;
}
export declare class AppRouter implements IAppRouter {
    protected _routes: InternalRoute[];
    private add;
    get<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    get<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    post<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    post<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    put<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    put<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    delete<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    delete<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    patch<const P extends string, const R extends CtxSchema>(path: P, options: CustomRouteDefinition<R>): this;
    patch<const P extends string, const R extends CtxSchema>(path: P, handler: InlineHandler<R, P>, hook?: MiddlewareRoute<R>): this;
    getRoutes: () => InternalRoute[];
    Router<T extends string>(group?: ContainsWhitespace<T>): this;
}
export default class AppServer extends AppRouter {
    private readonly instance;
    constructor();
    router(router: AppRouter): void;
    private validatorFactory;
    private createContext;
    register(): Application;
    listen(port: number, callback?: (err?: Error) => void): http.Server<typeof http.IncomingMessage, typeof http.ServerResponse>;
}
export declare function Router(): AppRouter;
