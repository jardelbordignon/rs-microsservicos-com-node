import { ApiProperty } from '@nestjs/swagger'
import { IsOptional, IsString } from 'class-validator'
import { LoginDto } from './login.dto'

enum Role {
  USER = 'user',
  ADMIN = 'admin',
  SELLER = 'seller',
}

export class RegisterDto extends LoginDto {
	@ApiProperty({
		description: 'User name',
		example: 'John Doe',
	})
	@IsString()
	name: string

	@ApiProperty({
		description: 'User role',
		example: 'user',
	})
	@IsOptional()
	@IsString()
	role?: Role = Role.USER
}
