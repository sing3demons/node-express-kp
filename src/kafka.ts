import {
  Kafka,
  KafkaMessage,
  Consumer,
  Producer,
  ConsumerConfig,
  RetryOptions,
  KafkaConfig,
  logLevel,
  SASLOptions,
  Mechanism,
  ProducerConfig,
} from 'kafkajs'

export type ServerKafkaOptions = {
  client: {
    clientId: string
    brokers: string[]
  }
  consumer: {
    groupId: string
    [key: string]: unknown
  }
  retry?: {
    initialRetryTime: number
    retries: number
  }
  producer?: ProducerConfig
  parser?: unknown
  subscribe?: Record<string, unknown>
  run?: Record<string, unknown>
  send?: Record<string, unknown>
  postfixId?: string
  logLevel?: logLevel
  ssl?: boolean
  requestTimeout?: number
  enforceRequestTimeout?: boolean
  connectionTimeout?: number
  sasl?: SASLOptions | Mechanism
}

type KafkaContext = {
  topic: string
  partition: number
  headers: KafkaMessage['headers']
  value: string | null
}

type MessageHandler<T = any> = (data: unknown, context: KafkaContext) => Promise<T>

type ParsedMessage = {
  topic: string
  partition: number
  headers: KafkaMessage['headers']
  value: string | null
}

type KafkaMessageHandler = {
  topic: string
  partition: number
  message: KafkaMessage
  heartbeat: () => Promise<void>
}

export class ServerKafka {
  private logger: any
  private client: Kafka | null = null
  private consumer: Consumer | null = null
  private producer: Producer | null = null
  private brokers: string[]
  private clientId: string
  private groupId: string
  private options: ServerKafkaOptions
  private messageHandlers: Map<string, MessageHandler> = new Map()
  private retry: RetryOptions

  private logLevel?: logLevel
  private ssl?: boolean
  private requestTimeout?: number
  private enforceRequestTimeout?: boolean
  private connectionTimeout?: number
  private sasl?: SASLOptions | Mechanism

  constructor(options: ServerKafkaOptions) {
    this.options = options
    this.logger = console
    const clientOptions = options.client || {}
    const consumerOptions = options.consumer || {}

    this.brokers = clientOptions.brokers
    this.clientId = clientOptions.clientId
    this.groupId = consumerOptions.groupId
    this.retry = options.retry || { initialRetryTime: 100, retries: 8 }

    this.logLevel = options.logLevel
    this.ssl = options.ssl
    this.requestTimeout = options.requestTimeout
    this.enforceRequestTimeout = options.enforceRequestTimeout
    this.connectionTimeout = options.connectionTimeout
    this.sasl = options.sasl
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

    await this.consumer.connect()
    await this.producer.connect()
    await this.bindEvents(this.consumer)

    callback()
  }

  private createClient(): Kafka {
    const config: KafkaConfig = {
      brokers: this.brokers,
      clientId: this.clientId,
      retry: this.retry,
    }

    if (this.logLevel) {
      config.logLevel = this.logLevel
    }

    if (this.ssl) {
      config.ssl = this.ssl
    }

    if (this.enforceRequestTimeout) {
      config.enforceRequestTimeout = this.enforceRequestTimeout
    }
    if (this.connectionTimeout) {
      config.connectionTimeout = this.connectionTimeout
    }
    if (this.sasl) {
      config.sasl = this.sasl
    }

    config.requestTimeout = this.requestTimeout || 30000

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

  private parser({ topic, message, partition }: KafkaMessageHandler) {
    return { topic, partition: partition, headers: message.headers, value: message.value?.toString() || '' }
  }

  private async handleMessage(payload: KafkaMessageHandler): Promise<void> {
    const { topic, partition } = payload

    const rawMessage: ParsedMessage = this.parser(payload)

    this.logger.debug('Parsed message:', rawMessage)

    if (!rawMessage?.topic) {
      this.logger.error(`No pattern found in message for topic: ${topic}`, rawMessage)
      return
    }

    const kafkaContext: KafkaContext = {
      ...rawMessage,
      partition: partition,
      topic,
    }

    const handler = this.getHandlerByPattern(rawMessage.topic)

    if (!handler) {
      this.logger.error(`No handler registered for pattern: ${rawMessage.topic}`)
      return
    }

    const response = await handler(rawMessage.value, kafkaContext)

    if (response) {
      // reply_topic
      if (response['reply-topic']) {
        await this.sendMessage({ response }, response['reply-topic'])
      }
    }
  }

  parse(message: KafkaMessage): { pattern: string; data: unknown } | {} {
    try {
      const value = message.value?.toString()
      return value ? JSON.parse(value) : {}
    } catch (err) {
      console.error('Failed to parse message', err)
      return {}
    }
  }

  private async sendMessage(message: any, replyTopic: string): Promise<void> {
    const outgoingMessage = { ...message.response }
    await this.producer!.send({
      topic: replyTopic,
      messages: [outgoingMessage],
    })
  }

  private getHandlerByPattern(pattern: string): MessageHandler | undefined {
    return this.messageHandlers.get(pattern)
  }

  public consume(pattern: string, handler: MessageHandler): void {
    this.messageHandlers.set(pattern, handler)
  }
}
