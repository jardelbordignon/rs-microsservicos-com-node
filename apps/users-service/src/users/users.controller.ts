import { Body, Controller, HttpStatus } from '@nestjs/common'
import { Endpoint } from '@repo/utils'
import { LoginDto } from './dtos/login.dto'
import { RegisterDto } from './dtos/register.dto'
import { UsersService } from './users.service'

@Controller('users')
export class UsersController {
	constructor(private usersService: UsersService) {}

	@Endpoint({
		type: 'Post',
		path: 'register',
		summary: 'Registrar um usuário',
		responses: [
			{ status: HttpStatus.CREATED, description: 'Usuário criado com sucesso' },
			{ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos' },
			{ status: HttpStatus.CONFLICT, description: 'E-mail já cadastrado' },
		],
	})
	async register(@Body() registerDto: RegisterDto) {
		return this.usersService.register(registerDto)
	}

	@Endpoint({
		type: 'Post',
		path: 'login',
		summary: 'Login de usuário',
		responses: [
			{ status: HttpStatus.OK, description: 'Login realizado com sucesso' },
			{ status: HttpStatus.BAD_REQUEST, description: 'Dados inválidos' },
			{
				status: HttpStatus.UNAUTHORIZED,
				description: 'Credenciais inválidas ou conta inativa',
			},
		],
	})
	async login(@Body() loginDto: LoginDto) {
		return this.usersService.login(loginDto)
	}
}
