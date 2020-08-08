import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import { mdsvex } from 'mdsvex'

const production = !process.env.ROLLUP_WATCH;

function serve() {
	let server;
	
	function toExit() {
		if (server) server.kill(0);
	}

	return {
		writeBundle() {
			if (server) return;
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			});

			process.on('SIGTERM', toExit);
			process.on('exit', toExit);
		}
	};
}

export default {
	input: 'src/main.js',
	output: {
		sourcemap: true,
		format: 'iife',
		name: 'app',
		file: 'docs/build/bundle.js'
	},
	plugins: [
		json(),
		svelte({
			dev: !production,
			extensions: ['.svelte', '.svx'],
			css: css => {
				css.write('docs/build/bundle.css');
			},
			preprocess: [
				mdsvex({
					layout: {
						centered: './src/layouts/Centered.svelte',
						paged: './src/layouts/Paged.svelte',
						_: "./src/layouts/Default.svelte"
					}
				})
			]
		}),
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		!production && serve(),
		!production && livereload('docs'),
		production && terser()
	],
	watch: {
		clearScreen: false
	}
};
