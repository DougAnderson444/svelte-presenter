<script>
    export let css = ""
    export let hue = 0
    
    let main
	const handleScroll = ({ deltaY }) => {
		if (main.clientHeight >= main.scrollHeight) return
		main.scrollTo({
            top: deltaY,
            behaviour: 'smooth'
        })
    }
    
</script>

<svelte:window on:mousewheel={handleScroll}></svelte:window>

<div style="--hue: {hue}" class="page" bind:this={main}>
    <div class="{css}">
        <slot></slot>
    </div>
</div>

<style>
    .page {
        background-color: hsla(var(--hue), 100%, 50%, 50%);
        border: 2px solid hsl(var(--hue), 100%, 50%);
        border-radius: .5em;
        flex: 1 0;
        overflow: hidden;
        padding: .5rem .5rem;
        position: relative;
    }

    .page > :global(.column) {
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    .page > :global(.centered) {
        left: 50%;
        position: absolute;
        top: 50%;
        transform: translate(-50%, -50%);
    }

    .page > :global(.headed-double-column) {
        align-content: flex-start;
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        height: calc(100% - .5rem);
        gap: .5rem;
    }

    .page > :global(.headed-double-column > *:first-child) {
        flex: 1 0 100%;
    }
    .page > :global(.headed-double-column > *:not(:first-child)) {
        flex: 1 0 calc(50% - 1rem);
    }
    .page > div > :global(* + *) {
        margin-top: .5rem;
    }
    .page :global(ul) {
        list-style-type: none;
        padding-left: 1rem;
    }

    .page :global(li) {
        align-items: center;
        flex-direction: row;
        padding-left: .75rem;
        position: relative;
    }
    .page :global(li):before {
        background-color: hsl(var(--hue), 100%, 50%);
        border-radius: 50%;
        content: '';
        display: block;
        left: 0;
        height: .5rem;
        position: absolute;
        top: .375rem;
        width: .5rem;
    }
</style>