import { SetMetadata } from '@nestjs/common'

export const IS_PUBLIC_KEY = 'isPublic'

/**
 * @description Decorator to set the route as public
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true)
