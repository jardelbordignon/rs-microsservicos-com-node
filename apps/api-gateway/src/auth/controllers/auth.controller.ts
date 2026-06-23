import { Body, Controller, HttpStatus } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { Endpoint } from '../decorators/endpoint.decorator'
import { LoginDto } from '../dtos/login.dto'
import { RegisterDto } from '../dtos/register.dto'
import { AuthService } from '../services/auth.service'

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
	async login(@Body() dto: LoginDto) {
		return this.authService.login(dto)
	}

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
	async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto)
	}
}
