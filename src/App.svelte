<script>
	import pages from './pages'
	
	let index = 0;

	const next = () => index !== pages.length - 1 && index++
	const prev = () => index !== 0 && index--

	const handlekey = async (ev) => {
        ev.key === 'ArrowRight' && next()
        ev.key === 'ArrowLeft' && prev()
	}
	
</script>

<style>
	button {
		background-color: white;
		border: 2px solid #c0c0c0;
		border-radius: .5rem;
		bottom: 1rem;
		color: black;
		padding: .5rem 1rem;
		position: fixed;
	}

	button:active,
	button:focus,
	button:hover {
		background-color: #c0c0c0;
	}
	.prev { left: 2rem; }
	.next { right: 2rem; }
</style>

<svelte:window on:keyup={handlekey}></svelte:window>

<svelte:component this={pages[index]} />

{#if index !== 0}
	<button class="prev" on:click="{prev}">&lt; Previous</button>
{/if}

{#if index !== pages.length - 1}
	<button class="next" on:click="{next}">Next &gt;</button>
{/if}