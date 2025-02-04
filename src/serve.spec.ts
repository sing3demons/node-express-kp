import supertest from 'supertest'
import AppServer, { HandlerSchema, Router } from '.'
import { Type } from '@sinclair/typebox'

describe('Server test', () => {
  afterAll(() => {
    jest.restoreAllMocks()
  })
  const router = Router()

  router.get('', async (ctx) => {
    ctx.response(200, 'Hello World')
  })

  router.post('/', async (ctx) => {
    ctx.response(200, 'Hello World')
  })

  router.patch('/:id', async (ctx) => {
    ctx.response(200, 'Hello World')
  })

  router.put('/:id', async (ctx) => {
    ctx.response(200, 'Put: Hello World')
  })

  router.delete('/:id', async (ctx) => {
    ctx.response(200, 'Hello World')
  })

  const getX = HandlerSchema(
    async (ctx) => {
      ctx.set.headers = {
        'x-api-key': ctx.headers['x-api-key'] || '1vcxvcbfkkkkkhfngxnfnvnb2',
      }

      ctx.response(200, 'x')
    },
    {
      schema: {
        headers: Type.Optional(
          Type.Object({
            'x-api-key': Type.Optional(
              Type.String({
                minLength: 3,
              })
            ),
          })
        ),
      },
    }
  )

  const postX = HandlerSchema(
    async (ctx) => {
      ctx.response(200, 'x')
    },
    {
      schema: {
        body: Type.Object({
          x: Type.String(),
        }),
      },
    }
  )

  const putX = HandlerSchema(
    async (ctx) => {
      ctx.response(200, 'x')
    },
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
      },
    }
  )

  const deleteX = HandlerSchema(
    async (ctx) => {
      ctx.response(200, 'x')
    },
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
      },
    }
  )

  const patchX = HandlerSchema(
    async (ctx) => {
      ctx.response(200, 'x')
    },
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
        }),
      },
    }
  )

  const getXx = HandlerSchema(
    async (ctx) => {
      ctx.response(200, 'Hello World')
    },
    {
      schema: {
        params: Type.Object({
          id: Type.String(),
          name: Type.Number(),
        }),
      },
    }
  )

  router.get('/xx/:id/:name', getXx)

  router.put('/x/:id', putX)
  router.post('/x', postX)
  router.delete('/x/:id', deleteX)
  router.patch('/x/:id', patchX)
  router.get('/x', getX)

  describe('Serve', () => {
    const server = new AppServer()
    server.router(router)
    const app = server.register()

    afterEach(() => {
      jest.clearAllMocks()
    })

    it('should return 200 when get product', async () => {
      const response = await supertest(app).get('/')
      expect(response.status).toBe(200)
    })

    it('should return 200 when create product', async () => {
      const response = await supertest(app).post('/')
      expect(response.status).toBe(200)
    })

    it('should return 200 when update product', async () => {
      const response = await supertest(app).patch('/1')
      expect(response.status).toBe(200)
    })

    it('should return 200 when update product', async () => {
      const response = await supertest(app).put('/1')
      expect(response.status).toBe(200)
    })

    it('should return 200 when delete product', async () => {
      const response = await supertest(app).delete('/1')
      expect(response.status).toBe(200)
    })

    it('should return 200 when get x', async () => {
      const response = await supertest(app).get('/x').set('x-api-key', '1vcxvcbfkkkkkhfngxnfnvnb2')
      expect(response.status).toBe(200)
    })

    it('should return 200 when create x', async () => {
      const response = await supertest(app).post('/x').send({ x: 'x' })
      expect(response.status).toBe(200)
    })

    it('should return 200 when update x', async () => {
      const response = await supertest(app).put('/x/1')
      expect(response.status).toBe(200)
    })

    it('should return 200 when delete x', async () => {
      const response = await supertest(app).delete('/x/1')
      expect(response.status).toBe(200)
    })

    it('should return 200 when patch x', async () => {
      const response = await supertest(app).patch('/x/1')
      expect(response.status).toBe(200)
    })

    it('should return 400 when create x without body', async () => {
      const response = await supertest(app).post('/x')
      expect(response.status).toBe(400)
    })

    // test 400 when update x without id
    it('should return 400 when update x without id', async () => {
      const response = await supertest(app).post('/x')
      expect(response.status).toBe(400)
      expect(response.body).toEqual({
        data: [
          { message: 'Expected required property', path: '/x', type: 'body' },
          { message: 'Expected string', path: '/x', type: 'body' },
        ],
        desc: 'invalid_request',
      })
    })

    // get xx
    it('should return 200 when get xx', async () => {
      const response = await supertest(app).get('/xx/1/2')
      expect(response.status).toBe(400)
    })

    it('should return 200 when get x with header', async () => {
      const response = await supertest(app).get('/x').set('x-api-key', '12')
      expect(response.status).toBe(400)
    })
  })

  describe('Serve group', () => {
    const server = new AppServer()
    server.router(router)

    afterEach(() => {
      jest.clearAllMocks()
    })
    router.get(
      '/xx',
      async (ctx) => {
        ctx.response(200, 'Hello World', {
          "x-api-key": ctx.headers['x-api-key'] || '1vcxvcbfkkkkkhfngxnfnvnb2',
        })
      },
      {
        schema: {
          query: Type.Object({
            name: Type.String(),
          }),
        },
      }
    )

    router.get('/xzx', async (ctx) => {
      ctx.set.headers = {
        'x-api-key': ctx.headers['x-api-key'] || '1vcxvcbfkkkkkhfngxnfnvnb2',
      }

      ctx.set.cookie = {
        name: 'test',
        value: 'test',
        options: {
          domain: 'localhost',
        },
      }

      return {
        status: 200,
        body: 'Hello World',
      }
    })

    server.router(router.Router('/group'))

    it('should return 200 when get product', async () => {
      const response = await supertest(server.register()).get('/group/xx?name=1')
      expect(response.status).toBe(200)
    })

    it('should return 400 when get product', async () => {
      const response = await supertest(server.register()).get('/group/xx')
      expect(response.status).toBe(400)
    })

    it('should return 200 when get product', async () => {
      const response = await supertest(server.register()).get('/group/xzx')
      expect(response.status).toBe(200)
    })

    // url not found
    it('should return 404 when url not found', async () => {
      const response = await supertest(server.register()).get('/group/xz/xx')
      expect(response.status).toBe(404)
      expect(response.body).toEqual({
        desc: 'not_found',
        data: { method: 'GET', url: '/group/xz/xx' },
      })
    })
  })
})
