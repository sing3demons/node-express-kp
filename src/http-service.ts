import axios, {
  AxiosBasicCredentials,
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosResponseHeaders,
} from 'axios'
import axiosRetry, { IAxiosRetryConfig } from 'axios-retry'

const http_method = ['GET', 'POST', 'PUT', 'DELETE'] as const
type HTTP_METHOD = (typeof http_method)[number]
type TMap = { [key: string]: string }

type HttpOption = {
  headers?: AxiosHeaders
  method: HTTP_METHOD
  params?: TMap
  query?: TMap
  body?: TMap
  retry_condition?: ((error: AxiosError) => boolean | Promise<boolean>) | undefined
  retry_count?: number
  timeout?: number
  url: string
  auth?: AxiosBasicCredentials
  axiosRequestConfig?: AxiosRequestConfig
}

type ApiResponse<B extends unknown> = {
  data?: B
  headers?: object
  status: number
}

type RA = HttpOption | HttpOption[]
type ReturnPromise<T, Body extends unknown> = T extends HttpOption[] ? ApiResponse<Body>[] : ApiResponse<Body>

interface IHttpService {
  requestHttp<B extends unknown, T extends RA>(optionRequest: T): Promise<ReturnPromise<T, B>>
}

class HttpService implements IHttpService {
  async requestHttp<B extends unknown, T extends RA>(optionRequest: T): Promise<ReturnPromise<T, B>> {
    const requestAttributes: HttpOption[] = []
    let returnObjFlag = true

    if (Array.isArray(optionRequest)) {
      optionRequest.forEach((request) => {
        requestAttributes.push(request)
      })
      returnObjFlag = false
      optionRequest.length = 0
    } else {
      requestAttributes.push(optionRequest)
    }

    const axiosRetryConfig: IAxiosRetryConfig = {
      retries: 3, // Allow at least one retry
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => error.response?.status === 429, // Retry only on 429
    }

    axiosRetry(axios, axiosRetryConfig)

    const requests: Promise<AxiosResponse<any, any>>[] = []

    function processOptionAttributes(request: HttpOption) {
      const {
        headers,
        method,
        params,
        query,
        body,
        retry_condition,
        retry_count,
        timeout,
        url,
        auth,
        axiosRequestConfig,
      } = request
      const config: AxiosRequestConfig = {
        ...axiosRequestConfig,
        headers,
        method,
        url: params ? replaceUrlParam(url, params) : url,
        data: body,
        timeout,
        auth,
      }

      if (retry_count) {
        if (!config['axios-retry']) {
          config['axios-retry'] = { ...axiosRetryConfig }
        }
        config['axios-retry'].retries = retry_count
      }

      if (retry_condition) {
        if (!config['axios-retry']) {
          config['axios-retry'] = { ...axiosRetryConfig }
        }
        config['axios-retry'].retryCondition = retry_condition
      }

      if (timeout) {
        config['timeout'] = timeout
      }

      if (query) {
        config['params'] = query
      }

      requests.push(makeRequest(config))
    }

    requestAttributes.forEach(processOptionAttributes)
    requestAttributes.length = 0

    if (returnObjFlag) {
      const result = await requests.pop()
      const response: ReturnPromise<T, B> = {
        data: result?.data,
        headers: (result?.headers as AxiosResponseHeaders) ?? {},
        status: result?.status,
      } as ReturnPromise<T, B>
      return response
    }

    const result: AxiosResponse<B, B>[] = await Promise.all(requests)
    requests.length = 0

    return result as unknown as ReturnPromise<T, B>
  }
}

function replaceUrlParam(url: string, params: TMap) {
  let subURL = url.split('/')

  for (let i = 0; i < subURL.length; i++) {
    if (subURL[i] !== '' && subURL[i]?.startsWith(':')) {
      const sub = subURL[i]?.substring(1)
      let replaceValue = sub ? params[sub] : undefined
      if (replaceValue) {
        subURL[i] = replaceValue
        continue
      }
    }
  }
  return subURL.join('/')
}

async function makeRequest(config: AxiosRequestConfig): Promise<AxiosResponse> {
  const response: ApiResponse<any> = {
    status: 200,
    headers: undefined,
  }
  try {
    const result = await axios.request(config)
    response.data = result.data
    response.headers = result.headers
    response.status = result.status

    return response as unknown as AxiosResponse
  } catch (error) {
    if (error instanceof AxiosError) {
      response.data = error.response?.data ?? error.message
      response.headers = error.response?.headers
      response.status = error.response?.status ?? 500
    } else if (error instanceof Error) {
      response.data = error?.message
      response.status = 500
      return {
        data: error.message,
        headers: {},
        status: 500,
      } as unknown as AxiosResponse
    } else {
      const err = error as AxiosError
      response.data = err?.message
      response.headers = err?.response?.headers
      response.status = err?.response?.status ?? 500
    }

    return response as unknown as AxiosResponse
  }
}

export { HttpOption, ApiResponse, IHttpService }
export default HttpService
