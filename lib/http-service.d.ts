import { AxiosBasicCredentials, AxiosError, AxiosHeaders, AxiosRequestConfig } from 'axios';
declare const http_method: readonly ["GET", "POST", "PUT", "DELETE"];
type HTTP_METHOD = (typeof http_method)[number];
type TMap = {
    [key: string]: string;
};
type HttpOption = {
    headers?: AxiosHeaders;
    method: HTTP_METHOD;
    params?: TMap;
    query?: TMap;
    body?: TMap;
    retry_condition?: ((error: AxiosError) => boolean | Promise<boolean>) | undefined;
    retry_count?: number;
    timeout?: number;
    url: string;
    auth?: AxiosBasicCredentials;
    axiosRequestConfig?: AxiosRequestConfig;
};
type ApiResponse<B extends unknown> = {
    data?: B;
    headers?: object;
    status: number;
};
type RA = HttpOption | HttpOption[];
type ReturnPromise<T, Body extends unknown> = T extends HttpOption[] ? ApiResponse<Body>[] : ApiResponse<Body>;
interface IHttpService {
    requestHttp<B extends unknown, T extends RA>(optionRequest: T): Promise<ReturnPromise<T, B>>;
}
declare class HttpService implements IHttpService {
    requestHttp<B extends unknown, T extends RA>(optionRequest: T): Promise<ReturnPromise<T, B>>;
}
export { HttpOption, ApiResponse, IHttpService };
export default HttpService;
