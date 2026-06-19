import { HttpModuleAsyncOptions, HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import { serviceConfig } from 'src/config/gateway.config'

type TServiceName = keyof typeof serviceConfig

type TProxyRequestProps = {
	serviceName: TServiceName
	method: string
	path: string
	data?: any
	headers?: any
	userInfo?: any
}

@Injectable()
export class ProxyService {
	private readonly logger = new Logger(ProxyService.name)

	constructor(private readonly httpService: HttpService) {}

	async proxyRequest(props: TProxyRequestProps): Promise<any> {
		const { data, serviceName, path, method, headers, userInfo } = props

		const service = serviceConfig[serviceName]
		const url = `${service.url}${path}`

		this.logger.log(`Proxying ${method} request to ${serviceName}: ${url}`)

		try {
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

			return response
		} catch (error) {
			this.logger.error(
				`Error proxying ${method} request to ${serviceName}: ${url}`,
			)
			throw error
		}
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
}
