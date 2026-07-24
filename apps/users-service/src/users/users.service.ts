import {
	ConflictException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { Repository } from 'typeorm'
import { LoginDto } from './dtos/login.dto'
import { RegisterDto } from './dtos/register.dto'
import { User, UserRole, UserStatus } from './entities/user.entity'

type UserResponse = Omit<User, 'password'>

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
		private jwtService: JwtService,
	) {}

	async findByEmail(email: string): Promise<User | null> {
		return this.usersRepository.findOneBy({ email })
	}

	async findById(id: string): Promise<User | null> {
		return this.usersRepository.findOneBy({ id })
	}

	async register(registerDto: RegisterDto): Promise<UserResponse> {
		const { email, password, firstName, lastName, role } = registerDto

		const existingUser = await this.findByEmail(email)
		if (existingUser) {
			throw new ConflictException('E-mail já cadastrado')
		}

		const hashedPassword = await bcrypt.hash(password, 10)

		const userData = this.usersRepository.create({
			email,
			password: hashedPassword,
			firstName,
			lastName,
			role: role as UserRole,
			status: UserStatus.ACTIVE,
		})

		const user = await this.usersRepository.save(userData)

		return this.sanitizeUser(user)
	}

	async login(loginDto: LoginDto): Promise<{ user: UserResponse; token: string }> {
		const { email, password } = loginDto

		const user = await this.findByEmail(email)
		if (!user) {
			throw new UnauthorizedException('Credenciais inválidas')
		}

		const isPasswordValid = await bcrypt.compare(password, user.password)
		if (!isPasswordValid) {
			throw new UnauthorizedException('Credenciais inválidas')
		}

		if (user.status !== UserStatus.ACTIVE) {
			throw new UnauthorizedException('Conta inativa')
		}

		const payload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		}

		const token = this.jwtService.sign(payload, {
			expiresIn: '24h',
		})

		return { user: this.sanitizeUser(user), token }
	}

	async getProfile(userId: string): Promise<UserResponse> {
		const user = await this.findById(userId)

		if (!user) {
			throw new UnauthorizedException('Usuário autenticado não encontrado')
		}

		return this.sanitizeUser(user)
	}

	async getActiveSellers(): Promise<UserResponse[]> {
		const users = await this.usersRepository.find({
			where: {
				role: UserRole.SELLER,
				status: UserStatus.ACTIVE,
			},
		})

		return users.map((user) => this.sanitizeUser(user))
	}

	async getUserById(id: string): Promise<UserResponse> {
		const user = await this.findById(id)

		if (!user) {
			throw new NotFoundException('Usuário não encontrado')
		}

		return this.sanitizeUser(user)
	}

	private sanitizeUser(user: User): UserResponse {
		const { password: _, ...userWithoutPassword } = user
		return userWithoutPassword
	}
}
