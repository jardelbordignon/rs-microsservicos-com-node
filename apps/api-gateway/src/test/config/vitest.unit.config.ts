//import swc from 'unplugin-swc'
import { defineConfig, type ViteUserConfig } from 'vitest/config'

export const viteUserConfig: ViteUserConfig = {
	// plugins: [
	// 	swc.vite({
	// 		module: { type: 'es6' },
	// 	}),
	// ],
	resolve: {
		tsconfigPaths: true,
	},
	test: {
		environment: 'node',
		globals: true,
		setupFiles: ['src/test/config/vitest.unit.setup.ts'],
		include: ['src/**/*.spec.ts'],
	},
}

export default defineConfig(viteUserConfig)
