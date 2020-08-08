<script>
    export let color = "white"
    
    let page

    const handlekey = async (ev) => {
        ev.key === 'PageUp' && page.scrollBy(0, -window.innerHeight)
        ev.key === 'PageDown' && page.scrollBy(0, window.innerHeight)
    }

</script>

<style>
    .page > :global(section) {
        padding: 2rem;
        min-height: 100vh;
        scroll-snap-align: start;
    }

    .page > :global(section > * + *) {
        margin-top: 1rem;
    }

    .page > :global(section:not(:last-child)) {
        border-bottom: 2px solid black;
    }
</style>

<svelte:window on:keyup={handlekey}></svelte:window>

<div bind:this="{page}" class="page {color}">
    <slot></slot>
</div>
