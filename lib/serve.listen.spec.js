var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import AppServer, { Router } from './serve';
import { Type } from '@sinclair/typebox';
jest.mock('express', () => {
    const mockExpress = jest.fn(() => ({
        use: jest.fn(),
        get: jest.fn(),
        listen: jest.fn(),
        json: jest.fn(() => jest.fn()),
        urlencoded: jest.fn(() => jest.fn()),
        route: jest.fn(() => ({
            get: jest.fn(),
            post: jest.fn(),
            put: jest.fn(),
            delete: jest.fn(),
        })),
    }));
    mockExpress.json = jest.fn(() => jest.fn());
    mockExpress.urlencoded = jest.fn(() => jest.fn());
    return mockExpress;
});
jest.mock('http', () => ({
    createServer: jest.fn(() => {
        const mockServer = {
            listen: jest.fn(() => {
                return {
                    on: jest.fn((event, callback) => {
                        if (event === 'listening') {
                            callback();
                        }
                    }),
                    close: jest.fn((callback) => {
                        callback();
                    }),
                };
            }),
            close: jest.fn(),
            on: jest.fn((event, callback) => {
                if (event === 'connection') {
                    const mockSocket = {};
                    callback(mockSocket);
                }
            }),
        };
        return mockServer;
    }),
}));
describe('Serve listen', () => {
    let appServer;
    let server;
    let appRouter = Router();
    beforeEach(() => {
        appServer = new AppServer();
        appRouter.get('/', (ctx) => __awaiter(void 0, void 0, void 0, function* () { return ctx.response(200, 'Hello World'); }), {
            schema: {
                query: Type.Object({
                    name: Type.String(),
                }),
            },
        });
        appServer.router(appRouter);
        server = appServer.listen(3000, () => {
            console.log('Server listening on port 3000');
        });
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    test('should handle shutdown signals gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
        const processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
        jest.spyOn(console, 'log').mockImplementation();
        jest.spyOn(appServer, 'register').mockImplementation();
        jest.useFakeTimers();
        process.emit('SIGINT');
        jest.runAllTimers();
        expect(server.close).toHaveBeenCalledTimes(1);
        expect(processExitSpy).toHaveBeenCalledWith(0);
        processExitSpy.mockRestore();
        jest.useRealTimers();
    }));
});
//# sourceMappingURL=serve.listen.spec.js.map