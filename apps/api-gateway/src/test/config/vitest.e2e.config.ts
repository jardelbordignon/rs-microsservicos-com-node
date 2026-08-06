import { defineConfig } from 'vitest/config'
import { viteUserConfig } from './vitest.unit.config.js'

export default defineConfig({
	...viteUserConfig,
	test: {
		...viteUserConfig.test,
		setupFiles: [
			'src/test/config/vitest.unit.setup.ts',
			'src/test/config/vitest.e2e.setup.ts',
		],
		include: ['test/e2e/**/*.test.ts', 'src/**/*.test.ts'],
		testTimeout: 30000,
		hookTimeout: 30000,
	},
})
