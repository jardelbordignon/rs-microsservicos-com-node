import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type Channel, type ChannelModel, connect } from 'amqplib'
import { createDelay } from '@/utils/functions'

@Injectable()
export class RabbitmqService implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(RabbitmqService.name)
	private connection: ChannelModel
	private channel: Channel

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
		queueName: string,
		exchange: string,
		routingKey: string,
		callback: (message: string) => Promise<void>,
	): Promise<void> {
		try {
			if (!this.channel) {
				this.logger.warn(
					'⚠️ RabbitMQ channel not available, skipping message subscribe',
				)
				return
			}

			await this.channel.assertExchange(exchange, 'topic', { durable: true })

			const dlqExchange = `${exchange}.dlq`
			const dlqName = `${queueName}.dlq`
			const dlqRoutingKey = `${routingKey}.dlq`

			await this.channel.assertExchange(dlqExchange, 'topic', { durable: true })
			await this.channel.assertQueue(dlqName, {
				durable: true,
				arguments: {
					'x-message-ttl': 604800000, // 7 dias para análise
				},
			})
			await this.channel.bindQueue(dlqName, dlqExchange, dlqRoutingKey)

			const { queue } = await this.channel.assertQueue(queueName, {
				durable: true,
				arguments: {
					'x-message-ttl': 604800000,
					'x-max-length': 10000,
					'x-dead-letter-exchange': dlqExchange,
					'x-dead-letter-routing-key': dlqRoutingKey,
				},
			})

			await this.channel.bindQueue(queue, exchange, routingKey)
			await this.channel.prefetch(1)
			await this.channel.consume(queue, async (msg) => {
				if (msg) {
					try {
						const message = JSON.parse(msg.content.toString())
						this.logger.log(`📨 Received message from queue: ${queueName}`)
						this.logger.debug(`Message content: ${JSON.stringify(message)}`)
						await callback(message)
						this.channel.ack(msg) // retira a mensagem da fila, pois já foi processada com sucesso
						this.logger.log(
							`✅ Message processed successfully from queue: ${queueName}`,
						)
					} catch (error) {
						this.logger.error(`❌ Error processing message:`, error)
						this.channel.nack(
							msg,
							false, // allUpTo? - mensagem em lote? nack de várias mensagens?
							false, // requeue? - recolocar na fila principal?
						)
						this.logger.warn(`⚠️ Message sent to DLQ: ${dlqName}`)
					}
				}
			})

			this.logger.log(
				`✅ Subscribed to queue ${queueName} bound to exchange ${exchange} with routing key ${routingKey}`,
			)
		} catch (error) {
			this.logger.error('❌ Error subscribing to RabbitMQ queue:', error)
		}
	}
}
