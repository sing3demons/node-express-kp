import { Kafka, KafkaMessage, Consumer, Producer, RecordMetadata, Message, KafkaConfig, ConsumerConfig } from 'kafkajs'
import { Static, TObject, TSchema } from '@sinclair/typebox'
import { TypeCompiler } from '@sinclair/typebox/compiler'

export type CtxConsumer<Body = unknown, Headers = unknown> = {
  body: Body
  headers: Headers
  setHeaders: (headers: Record<string, string>) => void
  validate: <T>(data: T) => void
  response: (code: number, data: any) => void
}

export type SchemaCtxConsumer<Body extends TSchema = TSchema, Header extends TSchema = TSchema> = {
  body?: Static<Body>
  headers?: Static<Header>
}

export type ServerKafkaOptions = {
  client: {
    clientId: string
    brokers: string[]
    logLevel?: number
    retry?: {
      initialRetryTime?: number
      retries?: number
    }
    auth?: {
      username: string
      password: string
    }
  }
  consumer?: {
    groupId?: string
    [key: string]: unknown
  }
  producer?: Record<string, unknown>
  parser?: unknown
  subscribe?: Record<string, unknown>
  run?: Record<string, unknown>
  send?: Record<string, unknown>
}

type SchemaCtx = {
  body?: TSchema
  query?: TSchema
  headers?: TSchema
}

export type KafkaContext<Schema extends SchemaCtx> = {
  topic: string
  partition: number
  headers: KafkaMessage['headers']
  value: string
  validate: <T>(data: T) => void
  sendMessage: (
    topic: string,
    payload: any
  ) => Promise<{
    err: boolean
    result_desc: string
    result_data: never[] | RecordMetadata[]
  }>
  body: Schema['body'] extends TObject ? Static<Schema['body']> : Record<string, any>
}

type BaseResponse = {
  topic?: string
  status?: number
  data?: unknown
  success: boolean
}

export type MessageHandler<Schema extends SchemaCtx> = (
  context: KafkaContext<Schema>
) => Promise<BaseResponse> | BaseResponse

export type ConsumeHandler<B extends TSchema, H extends TSchema> = (
  ctx: CtxConsumer<Static<B>, Static<H>>
) => Promise<BaseResponse> | BaseResponse

type ParsedMessage = {
  topic: string
  partition: number
  headers: KafkaMessage['headers']
  value: string
  body: Record<string, TSchema>
}

class ServerKafkaError extends Error {
  topic?: string
  payload?: any

  constructor({ message, topic, payload }: { message: string; topic?: string; payload?: any }) {
    super(message)
    this.name = 'ServerKafkaError'
    this.topic = topic
    this.payload = payload
  }
}

export type TSchemaCtx<BodySchema extends TSchema, HeaderSchema extends TSchema> = {
  body?: BodySchema
  headers?: HeaderSchema
  beforeHandle?: (ctx: CtxConsumer<Static<BodySchema>, Static<HeaderSchema>>) => Promise<any>
}

export interface IServerKafka {
  listen(callback: (err?: Error) => void): Promise<void>
  close(): Promise<void>
  consume<Body extends TSchema, Header extends TSchema>(
    pattern: string,
    handler: ConsumeHandler<Body, Header>,
    schema?: TSchemaCtx<Body, Header>
  ): void
}

export class ServerKafka implements IServerKafka {
  private client: Kafka | null = null
  private consumer: Consumer | null = null
  private producer: Producer | null = null

  private clientId?: string
  private groupId: string
  private options: ServerKafkaOptions
  private messageHandlers = new Map()
  private schemaHandler = new Map<string, TSchemaCtx<TSchema, TSchema>>()

  constructor(options: ServerKafkaOptions) {
    this.options = options
    const clientOptions = options.client || {}
    const consumerOptions = options.consumer || {}
    this.clientId = clientOptions.clientId
    this.groupId = consumerOptions.groupId || this.clientId
  }

  async listen(callback: (err?: Error) => void): Promise<void> {
    try {
      this.client = this.createClient()
      await this.start(callback)
    } catch (err) {
      callback(err as Error)
    }
  }

  async close(): Promise<void> {
    if (this.consumer) await this.consumer.disconnect()
    if (this.producer) await this.producer.disconnect()
    this.consumer = null
    this.producer = null
    this.client = null
  }

  private async start(callback: () => void): Promise<void> {
    const consumerOptions: ConsumerConfig = { ...this.options.consumer, groupId: this.groupId }
    this.consumer = this.client!.consumer(consumerOptions)
    this.producer = this.client!.producer(this.options.producer)

    try {
      await this.consumer.connect()
      await this.producer.connect()

      await this.bindEvents(this.consumer)
    } catch (error) {
      console.error('Failed to connect to Kafka', error)
      await this.close()
    }

    callback()
  }

  private createClient(): Kafka {
    const config: KafkaConfig = {
      ...this.options.client,
      brokers: this.options.client.brokers,
      clientId: this.clientId,
      logLevel: this.options.client?.logLevel || 1,
      retry: {
        initialRetryTime: this.options.client?.retry?.initialRetryTime || 300,
        retries: this.options.client?.retry?.retries || 8,
      },
    }

    if (this.options.client?.auth) {
      config.sasl = {
        mechanism: 'plain',
        username: this.options.client.auth.username,
        password: this.options.client.auth.password,
      }
    }

    return new Kafka(config)
  }

  private async bindEvents(consumer: Consumer): Promise<void> {
    const registeredPatterns = [...this.messageHandlers.keys()]
    const consumerSubscribeOptions = this.options.subscribe || {}

    if (registeredPatterns.length > 0) {
      await consumer.subscribe({
        ...consumerSubscribeOptions,
        topics: registeredPatterns,
      })
    }

    const consumerRunOptions = {
      ...this.options.run,
      eachMessage: this.getMessageHandler(),
    }

    await consumer.run(consumerRunOptions)
  }

  private getMessageHandler() {
    return async (payload: {
      topic: string
      partition: number
      message: KafkaMessage
      heartbeat: () => Promise<void>
    }): Promise<void> => {
      await this.handleMessage(payload)
    }
  }

  private async handleMessage(payload: {
    topic: string
    partition: number
    message: KafkaMessage
    heartbeat: () => Promise<void>
  }): Promise<void> {
    try {
      const { topic, message } = payload

      for (const key in message?.headers) {
        if (Object.prototype.hasOwnProperty.call(message.headers, key)) {
          const element = message.headers[key]
          if (element instanceof Buffer) {
            message.headers[key] = element.toString()
          }
        }
      }

      const beforeHandle = this.schemaHandler.get(topic)?.beforeHandle
      const rawMessage: ParsedMessage = {
        topic,
        partition: payload.partition,
        headers: message.headers,
        value: message.value?.toString() || '',
        body: JSON.parse(message.value?.toString() || ''),
      }

      const handler = this.getHandlerByPattern(rawMessage.topic)

      if (!handler) {
        return
      }

      const schemaCtx = this.schemaHandler.get(topic) || {}

      const kafkaContext: KafkaContext<typeof schemaCtx> = {
        ...rawMessage,
        validate: (data) => this.validate(topic, data, rawMessage),
        sendMessage: async <T>(topic: string, payload: T) => await this.sendMessage(topic, payload),
        body: rawMessage.body,
      }

      if (beforeHandle) {
        await beforeHandle(kafkaContext as unknown as CtxConsumer)
      }

      const response = await handler(kafkaContext)

      if (response.topic && response.data) {
        await this.sendMessage(response.topic, response.data)
      }
    } catch (error) {
      console.error('Failed to handle message', error)
    }
  }
  private validate = <T>(topic: string, data: T, rawMessage: ParsedMessage) => {
    const schema = this.schemaHandler.get(topic)
    if (schema?.body) {
      const typeCheck = TypeCompiler.Compile(schema.body as TSchema)
      if (!typeCheck.Check(data)) {
        const first = typeCheck.Errors(data).First()
        throw new ServerKafkaError({
          message: 'Invalid schema',
          topic: topic,
          payload: first,
        })
      }
    }

    if (schema?.headers) {
      const typeCheck = TypeCompiler.Compile(schema.headers as TSchema)
      if (!typeCheck.Check(rawMessage.headers)) {
        const first = typeCheck.Errors(rawMessage.headers).First()
        throw new ServerKafkaError({
          message: 'Invalid schema',
          topic: topic,
          payload: first,
        })
      }
    }
  }

  private async sendMessage(topic: string, payload: any) {
    let producer = this.producer
    if (!producer) {
      producer = this.client?.producer(this.options.producer) ?? null
    }

    if (!producer) {
      return {
        err: true,
        result_desc: 'Failed to connect to Kafka',
        result_data: [],
      }
    }

    const messages: Message[] = []

    if (typeof payload === 'object') {
      if (Array.isArray(payload)) {
        payload.forEach((msg) => {
          messages.push({ value: JSON.stringify(msg) })
        })
      } else {
        messages.push({ value: JSON.stringify(payload) })
      }
    } else {
      messages.push({ value: payload })
    }

    try {
      await producer.connect()
      const recordMetadata = await producer.send({
        topic,
        messages: messages.map((msg) => {
          try {
            return JSON.parse(String(msg))
          } catch (error) {
            return msg
          }
        }),
      })

      const result = {
        err: false,
        result_desc: 'success',
        result_data: recordMetadata,
      }

      return result
    } catch (error) {
      const result = {
        err: true,
        result_desc: 'Failed to send message',
        result_data: [],
      }

      if (error instanceof Error) {
        result.result_desc = error.message
      }

      return result
    } finally {
      await producer.disconnect()
    }
  }

  private getHandlerByPattern(pattern: string): MessageHandler<any> | undefined {
    return this.messageHandlers.get(pattern)
  }

  public consume<Body extends TSchema, Header extends TSchema>(
    pattern: string,
    handler: ConsumeHandler<Body, Header>,
    schema?: TSchemaCtx<Body, Header>
  ): void {
    this.messageHandlers.set(pattern, handler)
    if (schema) {
      this.schemaHandler.set(pattern, schema as unknown as TSchemaCtx<TSchema, TSchema>)
    }
  }
}
