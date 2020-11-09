import Prism from 'prismjs'
import 'prism-svelte'

import fs from 'fs'
import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';

import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
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

function buildPages() {
	const components = fs.readdirSync('src/pages/content')
	const imports = components.map((c, i) => `import Page${i} from './content/${c}/index.svx'`)
	const pages = components.map((c, i) => `Page${i}`)

	return `
	${imports.join('\n')}
	export default [${pages.join(',')}]
	`
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
			__PAGES__: () => buildPages()
		}),
		svelte({
			dev: !production,
			extensions: ['.svelte', '.svx'],
			css: css => {
				css.write('bundle.css');
			},
			preprocess: mdsvex({
				layout: "./src/pages/layout.svelte"
			})
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
