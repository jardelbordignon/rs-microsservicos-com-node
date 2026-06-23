import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common'
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Throttle } from '@nestjs/throttler'
import { AuthService } from '../services/auth.service'

type TLoginDto = {
	email: string
	password: string
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'User login' })
	@ApiResponse({ status: 200, description: 'Login successful' })
	@ApiResponse({ status: 401, description: 'Invalid credentials' })
	// @Throttle({ short: {} }) // use o default value defined in ThrottlerModule.forRootAsync
	@Throttle({ short: { limit: 5, ttl: 60000 } }) // overwrite the default value to 5 attempts per minute
	async login(@Body() dto: TLoginDto) {
		return this.authService.login(dto)
	}

	@Post('register')
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'User registration' })
	@ApiResponse({ status: 201, description: 'Registration successful' })
	@ApiResponse({ status: 400, description: 'Invalid registration data' })
	@Throttle({ medium: { limit: 3, ttl: 60000 } })
	async register(@Body() dto: any) {
		return this.authService.register(dto)
	}
}
