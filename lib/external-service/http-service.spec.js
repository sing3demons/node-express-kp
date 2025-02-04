var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios, { AxiosError } from 'axios';
import HttpService from './http-service';
jest.mock('axios');
jest.mock('axios-retry');
describe('HttpService', () => {
    let httpService;
    const mockUrl = 'http://localhost:3000';
    beforeEach(() => {
        httpService = new HttpService();
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should send a single GET request and return the response', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockResponse = {
            data: { message: 'Success' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
        };
        axios.request.mockResolvedValue(mockResponse);
        const requestAttributes = {
            method: 'GET',
            url: mockUrl,
        };
        const result = yield httpService.requestHttp(requestAttributes);
        expect(axios.request).toHaveBeenCalledTimes(1);
        expect(result.status).toBe(200);
    }));
    it('should send multiple requests and return an array of responses', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockResponse1 = {
            data: { message: 'Success 1' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
        };
        const mockResponse2 = {
            data: { message: 'Success 2' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
        };
        axios.request.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);
        const requestAttributes = [
            { method: 'GET', url: 'https://api.example.com/data1' },
            { method: 'GET', url: 'https://api.example.com/data2' },
        ];
        const result = yield httpService.requestHttp(requestAttributes);
        expect(axios.request).toHaveBeenCalledTimes(2);
        expect(result.length).toBe(2);
    }));
    it('should retry the request if the error matches the retry condition', () => __awaiter(void 0, void 0, void 0, function* () {
        jest.setTimeout(10000);
        const mockError = {
            response: {
                status: 429,
                headers: { 'retry-after': 1 },
            },
        };
        const mockSuccessResponse = {
            data: { message: 'Success after retry' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
        };
        axios.request
            .mockRejectedValueOnce(mockError)
            .mockResolvedValueOnce(mockSuccessResponse);
        const requestAttributes = {
            method: 'GET',
            url: 'https://api.example.com/data',
            retry_count: 1,
            retry_condition: (error) => { var _a; return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429; },
        };
        const result = yield httpService.requestHttp(requestAttributes);
        expect(result.status).toBe(429);
    }));
    it('should replace URL params correctly', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockResponse = {
            data: { message: 'Success' },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
        };
        axios.request.mockResolvedValue(mockResponse);
        const requestAttributes = {
            method: 'GET',
            url: 'https://api.example.com/:id/data',
            params: { id: '123' },
            query: { page: '1' },
            timeout: 1000,
            retry_condition: (error) => { var _a; return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429; },
            retry_count: 2,
        };
        const result = yield httpService.requestHttp(requestAttributes);
        expect(axios.request).toHaveBeenCalledWith(expect.objectContaining({
            url: 'https://api.example.com/123/data',
        }));
        expect(result.status).toBe(200);
    }));
    it('should handle network error and return a 500 response', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockError = new Error('Network error');
        axios.request.mockRejectedValue(mockError);
        const requestAttributes = {
            method: 'GET',
            url: mockUrl,
            retry_condition: (error) => { var _a; return ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429; },
        };
        const result = yield httpService.requestHttp(requestAttributes);
        expect(result.status).toBe(500);
    }));
    it('should handle AxiosError and return the response', () => __awaiter(void 0, void 0, void 0, function* () {
        const mockError = new AxiosError('Too Many Requests', 'ERR_BAD_RESPONSE', {}, {}, {
            status: 429,
            statusText: 'Too Many Requests',
            headers: {},
            data: { error: 'Rate limit exceeded' },
            config: {},
        });
        mockError.response = {
            status: 429,
            statusText: 'Too Many Requests',
            headers: { 'retry-after': '2' },
            data: { error: 'Rate limit exceeded' },
            config: {},
        };
        axios.request.mockRejectedValueOnce(mockError);
        const requestAttributes = {
            method: 'GET',
            url: mockUrl,
        };
        const result = yield httpService.requestHttp(requestAttributes);
        expect(result.status).toBe(429);
    }));
});
//# sourceMappingURL=http-service.spec.js.map