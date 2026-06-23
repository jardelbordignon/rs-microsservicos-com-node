import { Body, Controller, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Endpoint } from '../decorators/endpoint.decorator'
import { AuthService } from '../services/auth.service'

type TLoginDto = {
	email: string
	password: string
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	// @Post('login')
	// @HttpCode(HttpStatus.OK)
	// @ApiOperation({ summary: 'User login' })
	// @ApiResponse({ status: 200, description: 'Login successful' })
	// @ApiResponse({ status: 401, description: 'Invalid credentials' })
	// // @Throttle({ short: {} }) // use o default value defined in ThrottlerModule.forRootAsync
	// @Throttle({ short: { limit: 5, ttl: 60000 } }) // overwrite the default value to 5 attempts per minute
	@Endpoint({
		type: 'Post',
		path: 'login',
		summary: 'User login',
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
	async login(@Body() dto: TLoginDto) {
		return this.authService.login(dto)
	}

	// @Post('register')
	// @HttpCode(HttpStatus.CREATED)
	// @ApiOperation({ summary: 'User registration' })
	// @ApiResponse({ status: 201, description: 'Registration successful' })
	// @ApiResponse({ status: 400, description: 'Invalid registration data' })
	// @Throttle({ medium: { limit: 3, ttl: 60000 } })
	@Endpoint({
		type: 'Post',
		path: 'register',
		summary: 'User registration',
		responses: [
			{
				status: HttpStatus.CREATED,
				description: 'User registration',
			},
			{
				status: HttpStatus.BAD_REQUEST,
				description: 'Invalid registration data',
			},
		],
	})
	async register(@Body() dto: any) {
		return this.authService.register(dto)
	}
}
