import { Kafka, Producer, Consumer, ConsumerConfig } from 'kafkajs'
import { ServerKafka, ServerKafkaOptions } from './kafka'

jest.mock('kafkajs', () => {
  const mockProducer = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    send: jest.fn(),
  }

  const mockConsumer = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    subscribe: jest.fn(),
    run: jest.fn(),
  }

  return {
    Kafka: jest.fn(() => ({
      producer: jest.fn(() => mockProducer),
      consumer: jest.fn(() => mockConsumer),
    })),
    logLevel: { INFO: 1 },
  }
})

describe('ServerKafka', () => {
  let serverKafka: ServerKafka
  let kafkaMock: jest.Mocked<Kafka>
  let producerMock: jest.Mocked<Producer>
  let consumerMock: jest.Mocked<Consumer>

  const options: ServerKafkaOptions = {
    client: {
      clientId: 'test-client',
      brokers: ['localhost:9092'],
    },
    consumer: {
      groupId: 'test-group',
    },
  }

  const consumerOptions: ConsumerConfig = {
    groupId: options.consumer!.groupId as string,
  }
  beforeEach(() => {
    jest.clearAllMocks()
    kafkaMock = new Kafka(options.client) as jest.Mocked<Kafka>
    producerMock = kafkaMock.producer() as jest.Mocked<Producer>
    consumerMock = kafkaMock.consumer(consumerOptions) as jest.Mocked<Consumer>
    serverKafka = new ServerKafka(options)
  })

  test('should initialize Kafka client', () => {
    expect(serverKafka).toBeDefined()
  })

  test('should connect and start Kafka', async () => {
    await serverKafka.listen()
    expect(consumerMock.connect).toHaveBeenCalled()
    expect(producerMock.connect).toHaveBeenCalled()
  })

  test('should fail to send message if Kafka producer is not connected', async () => {
    producerMock.send.mockRejectedValueOnce(new Error('Failed to send'))
    const result = await serverKafka['sendMessage']('test-topic', { key: 'value' })
    expect(result.err).toBe(true)
  })
})
