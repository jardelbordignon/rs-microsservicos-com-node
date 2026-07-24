import { Body, Controller, Headers, HttpStatus, Req } from '@nestjs/common'
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger'
import { Endpoint } from '@repo/utils'
import type { FastifyRequest } from 'fastify'
import { Public } from '@/auth/decorators/public.decorator'
import { LoginDto } from './dtos/login.dto'
import { RegisterDto } from './dtos/register.dto'
import { UsersService } from './users.service'

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
	constructor(private readonly usersService: UsersService) {}

	@Public()
	@Endpoint({
		type: 'Post',
		path: 'login',
		summary: 'User login',
		description: 'Authenticates the user and returns a JWT token',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Login Successful',
			},
			{
				status: HttpStatus.UNAUTHORIZED,
				description: 'Invalid credentials',
			},
		],
		throttle: {
			name: 'short',
			limit: 5,
			ttl: 60000,
		},
	})
	async login(@Body() dto: LoginDto) {
		return this.usersService.login(dto)
	}

	@Public()
	@Endpoint({
		type: 'Post',
		path: 'register',
		summary: 'User registration',
		description: 'Creates a new user account on the system',
		responses: [
			{
				status: HttpStatus.CREATED,
				description: 'User registration completed successfully',
				schema: {
					type: 'object',
					properties: {
						id: { type: 'string' },
						email: { type: 'string' },
						firstName: { type: 'string' },
						lastName: { type: 'string' },
						role: { type: 'string', enum: ['seller', 'buyer'] },
						status: { type: 'string' },
						createdAt: { type: 'string', format: 'date-time' },
						updatedAt: { type: 'string', format: 'date-time' },
					},
				},
			},
			{
				status: HttpStatus.BAD_REQUEST,
				description: 'Invalid registration data',
			},
			{
				status: HttpStatus.CONFLICT,
				description: 'Email already registered',
			},
		],
	})
	async register(@Body() dto: RegisterDto) {
		return this.usersService.register(dto)
	}

	@Endpoint({
		type: 'Get',
		path: 'profile',
		summary: 'Get authenticated user profile',
		responses: [
			{ status: HttpStatus.OK, description: 'User profile returned successfully' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Missing or invalid token' },
		],
	})
	async getProfile(
		@Req() req: FastifyRequest,
		@Headers('authorization') authorization?: string,
	) {
		return this.usersService.getProfile(req.user, authorization)
	}

	@Endpoint({
		type: 'Get',
		path: 'sellers',
		summary: 'List active sellers',
		responses: [
			{ status: HttpStatus.OK, description: 'Sellers returned successfully' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Missing or invalid token' },
		],
	})
	async getSellers(
		@Req() req: FastifyRequest,
		@Headers('authorization') authorization?: string,
	) {
		return this.usersService.getSellers(req.user, authorization)
	}
}
