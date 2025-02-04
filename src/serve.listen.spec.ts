import { Server } from 'http'
import AppServer, { Router } from './serve'
import express from 'express'
import { Socket } from 'net'
import { Type } from '@sinclair/typebox'

// Mock express to return a function with necessary methods, including json()
jest.mock('express', () => {
  const mockExpress = jest.fn(() => ({
    use: jest.fn(),
    get: jest.fn(),
    listen: jest.fn(),
    json: jest.fn(() => jest.fn()), // Ensure json() returns a mock middleware function
    urlencoded: jest.fn(() => jest.fn()), // Mock urlencoded() similarly if used
    route: jest.fn(() => ({
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    })),
  }))
  ;(mockExpress as unknown as jest.MockedFunction<typeof express>).json = jest.fn(() => jest.fn())
  ;(mockExpress as unknown as jest.MockedFunction<typeof express>).urlencoded = jest.fn(() => jest.fn())
  return mockExpress
})

// Mock http.createServer
jest.mock('http', () => ({
  createServer: jest.fn(() => {
    const mockServer = {
      listen: jest.fn(() => {
        return {
          on: jest.fn((event, callback) => {
            if (event === 'listening') {
              callback()
            }
          }),
          close: jest.fn((callback) => {
            callback()
          }),
        }
      }),
      close: jest.fn(),
      on: jest.fn((event, callback) => {
        if (event === 'connection') {
          const mockSocket = {} as Socket
          callback(mockSocket)
        }
      }),
    }

    return mockServer as unknown as Server // TypeScript compatibility
  }),
}))

describe('Serve listen', () => {
  let appServer: AppServer
  let server: Server
  let appRouter = Router()

  beforeEach(() => {
    appServer = new AppServer()
    appRouter.get('/', async (ctx) => ctx.response(200, 'Hello World'), {
      schema: {
        query: Type.Object({
          name: Type.String(),
        }),
      },
    })
    appServer.router(appRouter)

    server = appServer.listen(3000, () => {
      console.log('Server listening on port 3000')
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  test('should handle shutdown signals gracefully', async () => {
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation()
    jest.spyOn(console, 'log').mockImplementation()

    jest.spyOn(appServer, 'register').mockImplementation()
    // Mocking the setTimeout to prevent it from being called during the test
    jest.useFakeTimers()

    // Simulate receiving a shutdown signal (e.g., SIGINT)
    process.emit('SIGINT')

    // Fast-forward until all timers have been executed
    jest.runAllTimers()

    // Ensure that server.close was called
    expect(server.close).toHaveBeenCalledTimes(1)

    // Ensure process.exit is called with code 0 after shutdown
    expect(processExitSpy).toHaveBeenCalledWith(0)

    processExitSpy.mockRestore()
    jest.useRealTimers()
  })
})
