import { HttpService } from '@nestjs/axios'
import {
	HttpException,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { firstValueFrom } from 'rxjs'
import { getServiceConfig } from '@/config/gateway.config'
import type {
	IAuthDto,
	IAuthResponse,
	IRegisterDto,
	IRegisterResponse,
	IUserInfo,
	IUserSession,
} from '@/interfaces/auth.interface'
import { ProxyService } from '@/proxy/service/proxy.service'

@Injectable()
export class UsersService {
	constructor(
		private readonly httpService: HttpService,
		private readonly jwtService: JwtService,
		private readonly proxyService: ProxyService,
	) {}

	async validateJwtToken(token: string): Promise<IUserInfo> {
		try {
			return this.jwtService.verify(token)
		} catch {
			throw new UnauthorizedException('Invalid JWT token')
		}
	}

	async validateSessionToken(sessionToken: string): Promise<IUserSession> {
		const service = getServiceConfig().users

		try {
			const { data } = await firstValueFrom(
				this.httpService.get<IUserSession>(
					`${service.url}/sessions/validate/${sessionToken}`,
					{ timeout: service.timeout },
				),
			)
			return data
		} catch {
			throw new UnauthorizedException('Invalid session token')
		}
	}

	async login(dto: IAuthDto): Promise<IAuthResponse> {
		const service = getServiceConfig().users

		try {
			const { data } = await firstValueFrom(
				this.httpService.post(`${service.url}/users/login`, dto, {
					timeout: service.timeout,
				}),
			)
			return data
		} catch {
			throw new UnauthorizedException('Invalid login credentials')
		}
	}

	async register(data: IRegisterDto): Promise<IRegisterResponse> {
		const service = getServiceConfig().users

		try {
			const { data: response } = await firstValueFrom(
				this.httpService.post<IRegisterResponse>(
					`${service.url}/users/register`,
					data,
					{
						timeout: service.timeout,
					},
				),
			)

			return response
		} catch (error) {
			const responseError = error as {
				response?: {
					status: number
					data?: {
						message?: string | string[]
					}
				}
			}

			if (responseError.response) {
				const message = responseError.response.data?.message ?? 'Registration failed'
				throw new HttpException(message, responseError.response.status)
			}

			throw new InternalServerErrorException('Registration service unavailable')
		}
	}

	async getProfile(userInfo?: IUserInfo, authorization?: string) {
		return this.proxyService.proxyRequest({
			serviceName: 'users',
			method: 'GET',
			path: '/users/profile',
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}

	async getSellers(userInfo?: IUserInfo, authorization?: string) {
		return this.proxyService.proxyRequest({
			serviceName: 'users',
			method: 'GET',
			path: '/users/sellers',
			headers: authorization ? { Authorization: authorization } : {},
			userInfo,
		})
	}
}
