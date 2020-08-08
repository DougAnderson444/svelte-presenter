<script>
	import Navigation from './components/Navigation.svelte'

	import pages from './pages'
	
	let index = 0;

	const next = () => index !== pages.length - 1 && index++
	const prev = () => index !== 0 && index--
</script>

<style>
</style>

<Navigation on:next={next} on:prev={prev} />

<svelte:component this={pages[index]} />
