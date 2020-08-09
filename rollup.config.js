import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import { mdsvex } from 'mdsvex'
import replace from '@rollup/plugin-replace'
import fs from 'fs'

function buildIndex() {
	const components = fs.readdirSync('src/pages')
	const imports = components.map((c, i) => `import Page${i} from './pages/${c}'`)
	const array = components.map((c, i) => `Page${i}`)

	console.log(components)

	return `
	${imports.join('\n')}

	const pages = [${array.join(',')}]
	`
}

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
		replace({
			__PAGES__: () => buildIndex(),
			__DATE__: () => new Date()
		}),
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
