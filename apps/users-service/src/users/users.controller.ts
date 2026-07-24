import {
	Body,
	Controller,
	HttpStatus,
	Param,
	ParseUUIDPipe,
	Req,
} from '@nestjs/common'
import { Endpoint } from '@repo/utils'
import { Public } from '../auth/decorators/public.decorator'
import { LoginDto } from './dtos/login.dto'
import { RegisterDto } from './dtos/register.dto'
import { UsersService } from './users.service'

type AuthenticatedRequest = {
	user: {
		id: string
		email: string
		role: string
	}
}

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
	@Public()
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
	@Public()
	async login(@Body() loginDto: LoginDto) {
		return this.usersService.login(loginDto)
	}

	@Endpoint({
		type: 'Get',
		path: 'profile',
		summary: 'Buscar perfil do usuário autenticado',
		responses: [
			{ status: HttpStatus.OK, description: 'Perfil retornado com sucesso' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou inválido' },
		],
	})
	async getProfile(@Req() req: AuthenticatedRequest) {
		return this.usersService.getProfile(req.user.id)
	}

	@Endpoint({
		type: 'Get',
		path: 'sellers',
		summary: 'Listar vendedores ativos',
		responses: [
			{
				status: HttpStatus.OK,
				description: 'Lista de vendedores retornada com sucesso',
			},
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou inválido' },
		],
	})
	async getSellers() {
		return this.usersService.getActiveSellers()
	}

	@Endpoint({
		type: 'Get',
		path: ':id',
		summary: 'Buscar usuário por ID',
		responses: [
			{ status: HttpStatus.OK, description: 'Usuário retornado com sucesso' },
			{ status: HttpStatus.UNAUTHORIZED, description: 'Token ausente ou inválido' },
			{ status: HttpStatus.NOT_FOUND, description: 'Usuário não encontrado' },
		],
	})
	async getUserById(@Param('id', new ParseUUIDPipe()) id: string) {
		return this.usersService.getUserById(id)
	}
}
