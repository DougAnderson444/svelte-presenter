import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs'
import livereload from 'rollup-plugin-livereload'
import { terser } from 'rollup-plugin-terser'

import json from '@rollup/plugin-json'
import replace from '@rollup/plugin-replace'
import { mdsvex } from 'mdsvex'

import pageBuilder from './plugins/page-builder'

const production = !process.env.ROLLUP_WATCH
const layoutDir = '/src/node_modules/svelte-presenter/layouts'

function serve() {
	let server
	
	function toExit() {
		if (server) server.kill(0)
	}

	return {
		writeBundle() {
			if (server) return
			server = require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
				stdio: ['ignore', 'inherit', 'inherit'],
				shell: true
			})

			process.on('SIGTERM', toExit)
			process.on('exit', toExit)
		}
	}
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
		pageBuilder(),
		replace({
			__PAGES__: () => buildPages()
		}),
		svelte({
			dev: !production,
			extensions: ['.svelte', '.svx'],
			css: css => {
				css.write('bundle.css')
			},
			preprocess: mdsvex({
				layout: {
					"centered": `${layoutDir}/Centered.svelte`,
					"column": `${layoutDir}/Column.svelte`,
					"double-column": `${layoutDir}/DoubleColumn.svelte`,
					_: `${layoutDir}/Default.svelte`
				}
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
		exclude: ['src/pages.js'],
		clearScreen: false
	}
}
