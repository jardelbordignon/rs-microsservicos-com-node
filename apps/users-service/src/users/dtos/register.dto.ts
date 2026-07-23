import { IsEmail, IsEnum, IsString, MaxLength, MinLength } from 'class-validator'
import { UserRole } from '../entities/user.entity'

export class RegisterDto {
	@IsEmail({}, { message: 'O e-mail deve ser válido' })
	email: string

	@IsString({ message: 'A senha deve ser uma string' })
	@MinLength(6, { message: 'A senha deve ter pelo menos 6 caracteres' })
	password: string

	@IsString({ message: 'O primeiro nome deve ser uma string' })
	@MaxLength(100, { message: 'O primeiro nome deve ter no máximo 100 caracteres' })
	firstName: string

	@IsString({ message: 'O sobrenome deve ser uma string' })
	@MaxLength(100, { message: 'O sobrenome deve ter no máximo 100 caracteres' })
	lastName: string

	@IsEnum(UserRole, { message: 'O papel deve ser "seller" ou "buyer"' })
	role: UserRole
}
