import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import { CircuitBreakerService } from '@/common/circuit-breaker/circuit-breaker.service'
import { FallbackService } from '@/common/fallback/fallback.service'
import { serviceConfig } from '@/config/gateway.config'
import type { IUserInfo } from '@/interfaces/auth.interface'

type TServiceName = keyof typeof serviceConfig

type TProxyRequestProps = {
	serviceName: TServiceName
	method: string
	path: string
	data?: unknown
	headers?: Record<string, string>
	userInfo?: IUserInfo
}

type TProxyResponse = {
	data: unknown
	status: number
	statusText: string
	headers: Record<string, unknown>
}

@Injectable()
export class ProxyService {
	private readonly logger = new Logger(ProxyService.name)

	constructor(
		private readonly httpService: HttpService,
		private readonly circuitBreakerService: CircuitBreakerService,
		private readonly fallbackService: FallbackService,
	) {}

	async proxyRequest(
		props: TProxyRequestProps,
	): Promise<TProxyResponse | ReturnType<typeof this.createServiceFallback>> {
		const { data, serviceName, path, method, headers, userInfo } = props

		const service = serviceConfig[serviceName]
		const url = `${service.url}${path}`

		this.logger.log(`Proxying ${method} request to ${serviceName}: ${url}`)

		return this.circuitBreakerService.execute({
			key: `proxy-${serviceName}`,
			options: { failureThreshold: 3, timeout: 30000, resetTimeout: 30000 },
			operation: async () => {
				const enhancedHeaders = {
					...headers,
					'x-user-id': userInfo?.userId,
					'x-user-email': userInfo?.email,
					'x-user-role': userInfo?.role,
				}

				const response = await firstValueFrom(
					this.httpService.request({
						method: method.toLowerCase(),
						url,
						data,
						headers: enhancedHeaders,
						timeout: service.timeout,
					}),
				)

				if (method.toLowerCase() === 'get') {
					this.fallbackService.setCachedData(`${serviceName}-${path}`, response.data)
				}

				return response.data
			},
			fallback: () => this.createServiceFallback(serviceName, method, path),
		})
	}

	async getServiceHealth(serviceName: TServiceName) {
		try {
			const service = serviceConfig[serviceName]
			const { data } = await firstValueFrom(
				this.httpService.get(`${service.url}/health`, { timeout: 3000 }),
			)
			return { status: 'healthy', data }
		} catch (error) {
			return { status: 'unhealthy', error: error.message }
		}
	}

	private createServiceFallback(serviceName: string, method: string, path: string) {
		switch (method.toLowerCase()) {
			case 'users': {
				const message = `${path.includes('/auth/login') ? 'Authentication' : 'User'} service unavailable`
				return this.fallbackService.createErrorFallback('users', message)
			}
			case 'products':
				if (method.toLowerCase() === 'get') {
					return this.fallbackService.createCachedFallback(`products-${path}`, {
						products: [],
						total: 0,
						limit: 10,
					})
				}
				return this.fallbackService.createErrorFallback(
					'products',
					'Product service unavailable',
				)
			//case 'checkout':
			//case 'payments':
			default:
				return this.fallbackService.createErrorFallback(
					serviceName,
					`${serviceName} service unavailable`,
				)
		}
	}
}
