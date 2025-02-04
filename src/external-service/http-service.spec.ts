import axios, { AxiosError } from 'axios'
import HttpService, { HttpOption } from './http-service'

jest.mock('axios')
jest.mock('axios-retry')

describe('HttpService', () => {
  let httpService: HttpService
  const mockUrl = 'http://localhost:3000'

  beforeEach(() => {
    httpService = new HttpService()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('should send a single GET request and return the response', async () => {
    const mockResponse = {
      data: { message: 'Success' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }

    ;(axios.request as jest.Mock).mockResolvedValue(mockResponse)

    const requestAttributes: HttpOption = {
      method: 'GET',
      url: mockUrl,
    }

    const result = await httpService.requestHttp(requestAttributes)

    expect(axios.request).toHaveBeenCalledTimes(1)
    expect(result.status).toBe(200)
  })

  it('should send multiple requests and return an array of responses', async () => {
    const mockResponse1 = {
      data: { message: 'Success 1' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }
    const mockResponse2 = {
      data: { message: 'Success 2' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }

    ;(axios.request as jest.Mock).mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2)

    const requestAttributes: HttpOption[] = [
      { method: 'GET', url: 'https://api.example.com/data1' },
      { method: 'GET', url: 'https://api.example.com/data2' },
    ]

    const result = await httpService.requestHttp(requestAttributes)

    expect(axios.request).toHaveBeenCalledTimes(2)
    expect(result.length).toBe(2)
  })

  it('should retry the request if the error matches the retry condition', async () => {
    jest.setTimeout(10000)

    const mockError = {
      response: {
        status: 429,
        headers: { 'retry-after': 1 },
      },
    }

    const mockSuccessResponse = {
      data: { message: 'Success after retry' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }

    ;(axios.request as jest.Mock)
      .mockRejectedValueOnce(mockError) // First call: Fail (429)
      .mockResolvedValueOnce(mockSuccessResponse) // Second call: Success

    const requestAttributes: HttpOption = {
      method: 'GET',
      url: 'https://api.example.com/data',
      retry_count: 1, // Set retry count to 1
      retry_condition: (error) => error.response?.status === 429,
    }

    const result = await httpService.requestHttp<{ message: string }, HttpOption>(requestAttributes)

    expect(result.status).toBe(429)
  })

  it('should replace URL params correctly', async () => {
    const mockResponse = {
      data: { message: 'Success' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }

    ;(axios.request as jest.Mock).mockResolvedValue(mockResponse)

    const requestAttributes: HttpOption = {
      method: 'GET',
      url: 'https://api.example.com/:id/data',
      params: { id: '123' },
      query: { page: '1' },
      timeout: 1000,
      retry_condition: (error: AxiosError) => error.response?.status === 429,
      retry_count: 2,
    }

    const result = await httpService.requestHttp(requestAttributes)

    expect(axios.request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://api.example.com/123/data', // URL should be correctly replaced
      })
    )

    expect(result.status).toBe(200)
  })

  it('should handle network error and return a 500 response', async () => {
    const mockError = new Error('Network error')
    ;(axios.request as jest.Mock).mockRejectedValue(mockError)

    const requestAttributes: HttpOption = {
      method: 'GET',
      url: mockUrl,
      retry_condition: (error: AxiosError) => error.response?.status === 429,
    }

    const result = await httpService.requestHttp(requestAttributes)

    expect(result.status).toBe(500)
  })

  // throw AxiosError
  it('should handle AxiosError and return the response', async () => {
    const mockError = new AxiosError(
      'Too Many Requests',
      'ERR_BAD_RESPONSE',
      {} as any, // AxiosRequestConfig
      {}, // Request
      {
        status: 429,
        statusText: 'Too Many Requests',
        headers: {},
        data: { error: 'Rate limit exceeded' },
        config: {},
      } as any // Mocked AxiosResponse
    )

    mockError.response = {
      status: 429,
      statusText: 'Too Many Requests',
      headers: { 'retry-after': '2' },
      data: { error: 'Rate limit exceeded' },
      config: {},
    } as any

    ;(axios.request as jest.Mock).mockRejectedValueOnce(mockError)

    const requestAttributes: HttpOption = {
      method: 'GET',
      url: mockUrl,
    }

    const result = await httpService.requestHttp(requestAttributes)

    expect(result.status).toBe(429)
  })
})
