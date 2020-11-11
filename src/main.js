import { App } from 'svelte-presenter';
import pages from './pages'

const app = new App({
	target: document.body,
	props: {
		pages,
		title: 'A Presentation'
	}
});

export default app;