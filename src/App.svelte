<script>
	import { tick } from 'svelte'
	import { tweened } from 'svelte/motion'
	import { fly } from 'svelte/transition'
	import { Carousel } from 'renderless-svelte'
	import Navigation from 'components/Navigation.svelte'
	import pages from './pages/pages.js'

	let current = tweened(0, { duration: 500 })
	$: currentIndex = Math.floor($current)

	let innerHeight
	let direction = 1

	const changePage = async idx => {
		direction = idx > currentIndex ? 1 : -1
		await tick()
		current.set(idx, {
			duration: Math.abs(idx - currentIndex) > 1 ? 500 : 0
		})
	}

	const handleKey = ({ key }) => {
		switch(key) {
			case 'ArrowUp': currentIndex !== 0 && changePage(currentIndex-1); return;
			case 'ArrowDown': currentIndex !== pages.length - 1 && changePage(currentIndex+1); return; 
		}
	}
</script>

<svelte:window bind:innerHeight="" on:keyup={handleKey}></svelte:window>

<Carousel items={pages} {currentIndex} let:setIndex let:payload>
	<Navigation {pages} setIndex={idx => changePage(idx)} {currentIndex} />
	<main>
	{#key payload}
		<div 
        	in:fly={{ y: direction*innerHeight, duration: 1000 }} 
        	out:fly={{ y: direction*(0-innerHeight), duration: 1000 }}>	
			<svelte:component this={payload}></svelte:component>
		</div>
	{/key}
</main>
</Carousel>

<style>
	main {
		display: flex;
		flex: 1;
		position: relative;
	}
	div {
		display: flex;
		height: 100%;
		overflow: hidden;
		position: absolute;
		width: 100%;
	}
</style>