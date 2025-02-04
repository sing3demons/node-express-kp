var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import supertest from 'supertest';
import AppServer, { HandlerSchema, Router } from './serve';
import { Type } from '@sinclair/typebox';
describe('Server test', () => {
    afterAll(() => {
        jest.restoreAllMocks();
    });
    const router = Router();
    router.get('', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'Hello World');
    }));
    router.post('/', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'Hello World');
    }));
    router.patch('/:id', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'Hello World');
    }));
    router.put('/:id', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'Put: Hello World');
    }));
    router.delete('/:id', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'Hello World');
    }));
    const getX = HandlerSchema((ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.set.headers = {
            'x-api-key': ctx.headers['x-api-key'] || '1vcxvcbfkkkkkhfngxnfnvnb2',
        };
        ctx.response(200, 'x');
    }), {
        schema: {
            headers: Type.Optional(Type.Object({
                'x-api-key': Type.Optional(Type.String({
                    minLength: 3,
                })),
            })),
        },
    });
    const postX = HandlerSchema((ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'x');
    }), {
        schema: {
            body: Type.Object({
                x: Type.String(),
            }),
        },
    });
    const putX = HandlerSchema((ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'x');
    }), {
        schema: {
            params: Type.Object({
                id: Type.String(),
            }),
        },
    });
    const deleteX = HandlerSchema((ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'x');
    }), {
        schema: {
            params: Type.Object({
                id: Type.String(),
            }),
        },
    });
    const patchX = HandlerSchema((ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'x');
    }), {
        schema: {
            params: Type.Object({
                id: Type.String(),
            }),
        },
    });
    const getXx = HandlerSchema((ctx) => __awaiter(void 0, void 0, void 0, function* () {
        ctx.response(200, 'Hello World');
    }), {
        schema: {
            params: Type.Object({
                id: Type.String(),
                name: Type.Number(),
            }),
        },
    });
    router.get('/xx/:id/:name', getXx);
    router.put('/x/:id', putX);
    router.post('/x', postX);
    router.delete('/x/:id', deleteX);
    router.patch('/x/:id', patchX);
    router.get('/x', getX);
    describe('Serve', () => {
        const server = new AppServer();
        server.router(router);
        const app = server.register();
        afterEach(() => {
            jest.clearAllMocks();
        });
        it('should return 200 when get product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).get('/');
            expect(response.status).toBe(200);
        }));
        it('should return 200 when create product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).post('/');
            expect(response.status).toBe(200);
        }));
        it('should return 200 when update product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).patch('/1');
            expect(response.status).toBe(200);
        }));
        it('should return 200 when update product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).put('/1');
            expect(response.status).toBe(200);
        }));
        it('should return 200 when delete product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).delete('/1');
            expect(response.status).toBe(200);
        }));
        it('should return 200 when get x', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).get('/x').set('x-api-key', '1vcxvcbfkkkkkhfngxnfnvnb2');
            expect(response.status).toBe(200);
        }));
        it('should return 200 when create x', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).post('/x').send({ x: 'x' });
            expect(response.status).toBe(200);
        }));
        it('should return 200 when update x', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).put('/x/1');
            expect(response.status).toBe(200);
        }));
        it('should return 200 when delete x', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).delete('/x/1');
            expect(response.status).toBe(200);
        }));
        it('should return 200 when patch x', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).patch('/x/1');
            expect(response.status).toBe(200);
        }));
        it('should return 400 when create x without body', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).post('/x');
            expect(response.status).toBe(400);
        }));
        it('should return 400 when update x without id', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).post('/x');
            expect(response.status).toBe(400);
            expect(response.body).toEqual({
                data: [
                    { message: 'Expected required property', path: '/x', type: 'body' },
                    { message: 'Expected string', path: '/x', type: 'body' },
                ],
                desc: 'invalid_request',
            });
        }));
        it('should return 200 when get xx', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).get('/xx/1/2');
            expect(response.status).toBe(400);
        }));
        it('should return 200 when get x with header', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(app).get('/x').set('x-api-key', '12');
            expect(response.status).toBe(400);
        }));
    });
    describe('Serve group', () => {
        const server = new AppServer();
        server.router(router);
        afterEach(() => {
            jest.clearAllMocks();
        });
        router.get('/xx', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            ctx.response(200, 'Hello World', {
                "x-api-key": ctx.headers['x-api-key'] || '1vcxvcbfkkkkkhfngxnfnvnb2',
            });
        }), {
            schema: {
                query: Type.Object({
                    name: Type.String(),
                }),
            },
        });
        router.get('/xzx', (ctx) => __awaiter(void 0, void 0, void 0, function* () {
            ctx.set.headers = {
                'x-api-key': ctx.headers['x-api-key'] || '1vcxvcbfkkkkkhfngxnfnvnb2',
            };
            ctx.set.cookie = {
                name: 'test',
                value: 'test',
                options: {
                    domain: 'localhost',
                },
            };
            return {
                status: 200,
                body: 'Hello World',
            };
        }));
        server.router(router.Router('/group'));
        it('should return 200 when get product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(server.register()).get('/group/xx?name=1');
            expect(response.status).toBe(200);
        }));
        it('should return 400 when get product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(server.register()).get('/group/xx');
            expect(response.status).toBe(400);
        }));
        it('should return 200 when get product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(server.register()).get('/group/xzx');
            expect(response.status).toBe(200);
        }));
        it('should return 404 when url not found', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield supertest(server.register()).get('/group/xz/xx');
            expect(response.status).toBe(404);
            expect(response.body).toEqual({
                desc: 'not_found',
                data: { method: 'GET', url: '/group/xz/xx' },
            });
        }));
    });
});
//# sourceMappingURL=serve.spec.js.map