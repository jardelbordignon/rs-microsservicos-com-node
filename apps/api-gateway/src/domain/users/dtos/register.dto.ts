import { ApiProperty } from '@nestjs/swagger'
import { IsEnum, IsString, MaxLength } from 'class-validator'
import { ERole, type IRegisterDto } from '@/interfaces/auth.interface'
import { LoginDto } from './login.dto'

export class RegisterDto extends LoginDto implements IRegisterDto {
	@ApiProperty({
		description: 'User first name',
		example: 'John',
	})
	@IsString()
	@MaxLength(100)
	firstName: string

	@ApiProperty({
		description: 'User last name',
		example: 'Doe',
	})
	@IsString()
	@MaxLength(100)
	lastName: string

	@ApiProperty({
		description: 'User role',
		example: 'buyer',
		enum: ERole,
	})
	@IsEnum(ERole)
	role: ERole
}
