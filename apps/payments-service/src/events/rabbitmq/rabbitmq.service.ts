import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createDelay } from '@repo/utils'
import {
	type Channel,
	type ChannelModel,
	type ConsumeMessage,
	connect,
} from 'amqplib'

type TQueueConfig = {
	queueName: string
	exchange: string
	routingKey: string
}

type TRetryOptions = {
	maxRetries: number
	retryDelay: number
}

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(RabbitmqService.name)
	private readonly DEFAULT_RETRY_DELAY = 30_000
	private readonly DEFAULT_MAX_RETRIES = 3
	private readonly DEFAULT_MAX_QUEUE_LENGTH = 10_000
	private readonly ONE_DAY = 24 * 60 * 60 * 1000
	private readonly DEFAULT_MESSAGE_TTL = this.ONE_DAY
	private readonly DEFAULT_DLQ_MESSAGE_TTL = 7 * this.ONE_DAY // 7 dias para análise
	private connection!: ChannelModel
	private channel!: Channel

	constructor(private readonly configService: ConfigService) {}

	onModuleInit() {
		this.connect()
	}

	onModuleDestroy() {
		this.disconnect()
	}

	async waitForConnection(maxAttempts = 10, delayMs = 500) {
		for (let attempt = 1; attempt <= maxAttempts; attempt++) {
			if (this.channel) {
				return true
			}
			this.logger.log(
				`⌛ Waiting for RabbitMQ connection... (attempt ${attempt}/${maxAttempts})`,
			)
			await createDelay(delayMs)
		}
		return false
	}

	private async connect() {
		try {
			const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL') || ''

			this.connection = await connect(rabbitmqUrl)
			this.channel = await this.connection.createChannel()

			this.logger.log('✅ RabbitMQ connected successfully')

			this.connection.on('error', (err) => {
				this.logger.error('❌ RabbitMQ connection error:', err)
			})

			this.connection.on('close', () => {
				this.logger.warn('⚠️ RabbitMQ connection closed')
			})

			this.connection.on('blocked', (reason) => {
				this.logger.warn('⚠️ RabbitMQ connection blocked:', reason)
			})

			this.connection.on('unblocked', () => {
				this.logger.log('✅ RabbitMQ connection unblocked')
			})
		} catch (error) {
			const err = error as Error
			this.logger.warn(
				'⚠️ RabbitMQ connection failed, continuing without message queue',
				err.message ?? err,
			)
		}
	}

	private async disconnect() {
		try {
			if (this.channel) {
				await this.channel.close()
				this.logger.log('✅ RabbitMQ channel closed successfully')
			}

			if (this.connection) {
				await this.connection.close()
				this.logger.log('✅ RabbitMQ connection closed successfully')
			}
		} catch (error) {
			this.logger.error('❌ Error disconnecting from RabbitMQ:', error)
		}
	}

	getChannel() {
		return this.channel
	}

	getConnection() {
		return this.connection
	}

	async publishMessage(
		exchange: string,
		routingKey: string,
		message: string,
	): Promise<void> {
		try {
			if (!this.channel) {
				this.logger.warn('⚠️ RabbitMQ channel not available, skipping message publish')
				return
			}

			await this.channel.assertExchange(exchange, 'topic', { durable: true })
			const messageBuffer = Buffer.from(JSON.stringify(message))

			const published = this.channel.publish(exchange, routingKey, messageBuffer, {
				persistent: true,
				contentType: 'application/json',
				timestamp: Date.now(),
			})

			if (!published) {
				this.logger.warn('⚠️ Message publish failed, skipping message publish')
				return
			}

			this.logger.log(
				`✅ Message published successfully to ${exchange}:${routingKey}`,
			)
			this.logger.debug(`Message content: ${JSON.stringify(message)}`)
		} catch (error) {
			this.logger.error('❌ Error publishing message to RabbitMQ:', error)
		}
	}

	async subscribeToQueue(
		queueConfig: TQueueConfig,
		callback: (message: string) => Promise<void>,
		options: Partial<TRetryOptions> = {},
	): Promise<void> {
		if (!this.channel) {
			this.logger.warn('⚠️ RabbitMQ channel not available, skipping message subscribe')
			return
		}

		const { queueName } = queueConfig

		const {
			maxRetries = this.DEFAULT_MAX_RETRIES,
			retryDelay = this.DEFAULT_RETRY_DELAY,
		} = options

		try {
			const mainQueue = await this.setupQueueInfrastructure(queueConfig, retryDelay)
			await this.channel.prefetch(1)
			await this.consumeMainQueue(queueConfig, mainQueue, callback, {
				maxRetries,
				retryDelay,
			})

			this.logger.log(`✅ Subscribed to queue ${queueName}`)
			this.logger.log(`🔄 Retry queue ${queueName}.retry (${retryDelay}ms delay)`)
			this.logger.log(`💀 Dead letter queue ${queueName}.dlq`)
		} catch (error) {
			this.logger.error(`❌ Error subscribing to queue ${queueName}:`, error)
		}
	}

	private async setupQueueInfrastructure(
		queueConfig: TQueueConfig,
		retryDelay: number,
	) {
		await this.channel.assertExchange(queueConfig.exchange, 'topic', {
			durable: true,
		})
		await this.createRetryQueue(queueConfig, retryDelay)
		await this.createDeadLetterQueue(queueConfig)
		return this.createMainQueue(queueConfig)
	}

	private async createMainQueue(queueConfig: TQueueConfig) {
		const { exchange, queueName, routingKey } = queueConfig

		const { queue } = await this.channel.assertQueue(queueName, {
			durable: true,
			arguments: {
				'x-message-ttl': this.DEFAULT_MESSAGE_TTL,
				'x-max-length': this.DEFAULT_MAX_QUEUE_LENGTH,
				'x-dead-letter-exchange': `${exchange}.retry`, // fila principal sempre envia para o retry se falhar
				'x-dead-letter-routing-key': `${routingKey}.retry`,
			},
		})

		await this.channel.bindQueue(queue, exchange, routingKey)

		return queue
	}

	private async createDeadLetterQueue(queueConfig: TQueueConfig) {
		const { exchange, queueName, routingKey } = queueConfig
		const dlqQueueName = `${queueName}.dlq`
		const dlqExchange = `${exchange}.dlq`

		await this.channel.assertExchange(dlqExchange, 'topic', { durable: true })
		await this.channel.assertQueue(dlqQueueName, {
			durable: true,
			arguments: { 'x-message-ttl': this.DEFAULT_DLQ_MESSAGE_TTL },
		})
		await this.channel.bindQueue(dlqQueueName, dlqExchange, `${routingKey}.dlq`)
	}

	private async createRetryQueue(queueConfig: TQueueConfig, retryDelay: number) {
		const { exchange, queueName, routingKey } = queueConfig
		const retryQueueName = `${queueName}.retry`
		const retryExchange = `${exchange}.retry`

		await this.channel.assertExchange(retryExchange, 'topic', { durable: true })
		await this.channel.assertQueue(retryQueueName, {
			durable: true,
			arguments: {
				'x-message-ttl': retryDelay, // Tempo de espera antes do retry
				// Quando o ttl expira, volta para o exchange principal
				'x-dead-letter-exchange': exchange,
				'x-dead-letter-routing-key': routingKey,
			},
		})
		await this.channel.bindQueue(retryQueueName, retryExchange, `${routingKey}.retry`)
	}

	private getRetryCount(msg: ConsumeMessage) {
		const xDeath = msg.properties.headers?.['x-death']

		if (!xDeath?.length) {
			return 0
		}

		// soma todas as vezes que passou pela fila principal
		return xDeath
			.filter((death) => !death.queue.endsWith('.retry'))
			.reduce((sun, death) => sun + (death.count || 0), 0)
	}

	private async consumeMainQueue(
		queueConfig: TQueueConfig,
		mainQueue: string,
		callback: (message: string) => Promise<void>,
		{ maxRetries, retryDelay }: TRetryOptions,
	) {
		const { exchange, queueName, routingKey } = queueConfig

		await this.channel.consume(mainQueue, async (msg) => {
			if (!msg) {
				return
			}

			const retryCount = this.getRetryCount(msg)
			const retryInfo = `(attempt ${retryCount + 1} of ${maxRetries})`

			try {
				const message = JSON.parse(msg.content.toString())
				this.logger.log(`📨 Message received ${retryInfo} from queue: ${queueName}`)
				this.logger.debug(`Message content: ${JSON.stringify(message)}`)

				await callback(message)
				this.channel.ack(msg) // retira a mensagem da fila, pois já foi processada com sucesso

				this.logger.log(`✅ Message processed successfully from queue: ${queueName}`)
			} catch {
				if (retryCount < maxRetries) {
					this.logger.warn(
						`⚠️ Processing failed ${retryInfo}. Retrying in ${retryDelay / 1000}s... `,
					)

					this.channel.nack(
						msg,
						false, // allUpTo? - mensagem em lote? nack de várias mensagens?
						false, // requeue? - recolocar na fila principal?
					)
				} else {
					this.logger.warn(
						`💀 Max retries (${maxRetries}) exceeded, sending to DLQ: ${queueName}.dlq`,
					)
					// Publica diretamente na DLQ (bypass da retry queue)
					this.channel.publish(`${exchange}.dlq`, `${routingKey}.dlq`, msg.content, {
						persistent: true,
						headers: msg.properties.headers,
					})
					this.channel.ack(msg) // remove da fila principal
				}
			}
		})
	}
}

/**
Header x-death adicionado automaticamente pelo RabbitMQ

{
	"x-death": [
		{
			"count": 3, // numero de vezes que foi rejeitada
			"reason": "rejected",
			"queue": "payment_queue",
			"time": 1737241200,
			"exchange": "payments.retry.dlx",
			"routing-keys": ["payments.order.retry"]
		}
	]
}
*/
