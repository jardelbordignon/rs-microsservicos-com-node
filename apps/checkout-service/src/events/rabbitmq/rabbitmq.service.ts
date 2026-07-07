import {
	Injectable,
	Logger,
	type OnModuleDestroy,
	type OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { type Channel, type ChannelModel, connect } from 'amqplib'

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
}
