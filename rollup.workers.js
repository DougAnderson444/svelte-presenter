import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';

export default {
	input: 'src/worker.js',
	output: {
		sourcemap: false,
		format: 'esm',
		name: 'app',
		file: 'docs/worker.js'
	},
	plugins: [
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
	],
	watch: {
		clearScreen: false
	}
}