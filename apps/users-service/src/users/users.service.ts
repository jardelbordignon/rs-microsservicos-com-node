import { ConflictException, Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcryptjs'
import { Repository } from 'typeorm'
import { RegisterDto } from './dtos/register.dto'
import { User, UserRole, UserStatus } from './entities/user.entity'

@Injectable()
export class UsersService {
	constructor(
		@InjectRepository(User)
		private usersRepository: Repository<User>,
	) {}

	async findByEmail(email: string): Promise<User | null> {
		return this.usersRepository.findOneBy({ email })
	}

	async register(registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
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

		const { password: _, ...userWithoutPassword } = user
		return userWithoutPassword
	}
}
