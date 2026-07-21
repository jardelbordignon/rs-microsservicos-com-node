import { Injectable, Logger } from '@nestjs/common'

export interface IConsumerMetrics {
	totalProcessed: number // Total de mensagens processadas
	totalSuccess: number // Mensagens processadas com sucesso
	totalFailed: number // Mensagens que falharam
	totalRetries: number // Total de tentativas do retry
	lastProcessedAt: Date | null // Timestamp do último processamento
	startedAt: Date // Quando o consumer iniciou
	averageProcessingTime: number // Tempo médio de processamento em ms
}

export interface IGetMetricsResponse extends IConsumerMetrics {
	successRate: string
	uptime: string
	status: string
}

type THealthyStatus = 'healthy' | 'unhealthy' | 'degraded'

export interface IGetHealthResponse {
	status: THealthyStatus
	checks: Record<string, boolean>
	message: string
	timestamp: string
}

const baseMetrics: IConsumerMetrics = {
	averageProcessingTime: 0,
	lastProcessedAt: null,
	startedAt: new Date(),
	totalFailed: 0,
	totalProcessed: 0,
	totalRetries: 0,
	totalSuccess: 0,
}

@Injectable()
export class MetricsService {
	private readonly logger = new Logger(MetricsService.name)

	/**
	 * ==========================
	 * MÉTRICAS DE MONITORAMENTO
	 * ==========================
	 * Armazena estatísticas de processamento em memória (é um estudo, entedendo os conceitos)
	 * Em produção, usaríamos Promethes, DataDog, etc.
	 */
	private metrics = baseMetrics

	/**
	 * Acumulador para calcular tempo médio de processamento
	 * Guardamos a soma total para não precisar armazenar todos os tempos
	 */
	private totalProcessingTime = 0

	updateMetrics(success: boolean, startTime: number) {
		// Incrementa contadores
		this.metrics.totalProcessed++
		this.metrics.lastProcessedAt = new Date()

		if (success) {
			this.metrics.totalSuccess++
		} else {
			this.metrics.totalFailed++
		}

		// Atualiza tempo médio de processamento
		const processingTime = Date.now() - startTime
		this.totalProcessingTime += processingTime
		this.metrics.averageProcessingTime = Math.round(
			this.totalProcessingTime / this.metrics.totalProcessed,
		)

		// Log de métricas a cada 10 mensagens
		if (this.metrics.totalProcessed % 10 === 0) {
			this.logMetricsSummary()
		}
	}

	incrementRetryCount() {
		this.metrics.totalRetries++
	}

	private logMetricsSummary() {
		const successRate =
			this.metrics.totalProcessed > 0
				? ((this.metrics.totalSuccess / this.metrics.totalProcessed) * 100).toFixed(2)
				: '0'

		this.logger.log(`📊 ==== CONSUMER METRICS ====`)
		this.logger.log(`	Total Processed: ${this.metrics.totalProcessed}`)
		this.logger.log(`	Success: ${this.metrics.totalSuccess}`)
		this.logger.log(`	Failed: ${this.metrics.totalFailed}`)
		this.logger.log(`	Retries: ${this.metrics.totalRetries}`)
		this.logger.log(`	Success Rate: ${successRate}`)
		this.logger.log(`	Avg Processing Time: ${this.metrics.averageProcessingTime}`)
		this.logger.log(`📊 ==========================`)
	}

	getMetrics(): IGetMetricsResponse {
		// calcula a taxa de sucesso
		const successRate =
			this.metrics.totalProcessed > 0
				? `${((this.metrics.totalSuccess / this.metrics.totalProcessed) * 100).toFixed(2)}%`
				: '0%'

		// retorna uma cópia de this.metrics para evitar modificações externas e ainda as informações adicionais
		return {
			...this.metrics,
			successRate,
			uptime: this.calculateUptime(this.metrics.startedAt),
			status: 'active',
		}
	}

	resetMetrics() {
		this.metrics = baseMetrics
		this.totalProcessingTime = 0
		this.logger.log('🔄 Metrics reset')
	}

	getHealth(): IGetHealthResponse {
		const metrics = this.getMetrics()

		// verifica se está processando (ativo nos últimos 5 min)
		const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
		const isProcessing =
			!metrics.lastProcessedAt || metrics.lastProcessedAt.getTime() > fiveMinutesAgo

		// verifica a taxa de sucesso (>= 90%)
		const successRate =
			metrics.totalProcessed > 0
				? (metrics.totalSuccess / metrics.totalProcessed) * 100
				: 100
		const hasGoodSuccessRate = successRate >= 90

		// verifica se não há muitas falhas consecutivas
		const hasLowFailures = metrics.totalFailed < 100

		// determina status
		let status: THealthyStatus = 'healthy'
		let message = 'Consumer is operating normally'

		if (!isProcessing && metrics.totalProcessed > 0) {
			status = 'unhealthy'
			message = 'Consumer has not processed messages in the last 5 minutes'
		} else if (!hasGoodSuccessRate) {
			status = 'degraded'
			message = `Success rate is below 90% (${successRate.toFixed(2)})`
		} else if (!hasLowFailures) {
			status = 'degraded'
			message = 'High number of failed messages'
		}

		return {
			status,
			checks: {
				isProcessing,
				hasGoodSuccessRate,
				hasLowFailures,
			},
			message,
			timestamp: new Date().toISOString(),
		}
	}

	getSummary() {
		const metrics = this.getMetrics()

		return {
			processed: metrics.totalProcessed,
			success: metrics.totalSuccess,
			failed: metrics.totalFailed,
			rate:
				metrics.totalProcessed > 0
					? `${((metrics.totalSuccess / metrics.totalProcessed) * 100).toFixed(1)}%`
					: '0%',
			avgTime: `${metrics.averageProcessingTime}ms`,
		}
	}

	private calculateUptime(startedAt: Date) {
		const diff = Date.now() - startedAt.getTime()

		const seconds = Math.floor(diff / 1000)
		const minutes = Math.floor(seconds / 60)
		const hours = Math.floor(minutes / 60)
		const days = Math.floor(hours / 24)

		if (days > 0) {
			return `${days}d ${hours % 24}h ${minutes % 60}m`
		} else if (hours > 0) {
			return `${hours}h ${minutes % 60}m ${seconds % 60}s`
		} else if (minutes > 0) {
			return `${minutes}m ${seconds % 60}s`
		} else {
			return `${seconds}s`
		}
	}
}
