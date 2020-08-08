<script>
    import { createEventDispatcher, tick } from 'svelte'

    const dispatch = createEventDispatcher()
    const prev = () => dispatch('prev')
    const next = () => dispatch('next')

    const handlekey = async (ev) => {
        ev.key === 'ArrowRight' && next()
        ev.key === 'ArrowLeft' && prev()
    }
</script>

<style>
    div {
        background: var(--nav-background);
        display: flex;
        flex-direction: row;
        position: fixed;
        bottom: 0;
        opacity: 0;
        padding: 1rem 0;
        width: 100%;
    }

    div:focus-within,
    div:hover {
        opacity: 1;
    }

    span {
        flex: 1 0;
    }

    button {
        background: transparent;
        border-color: transparent;
        border-style: solid;
        border-width: 40px;
        cursor: pointer;
        width: 0;
        height: 0;
    }
    button:first-child {
        border-right-color: var(--nav-button-color);
    }

    button:last-child {
        border-left-color: var(--nav-button-color);
    }
</style>

<svelte:window on:keyup={handlekey}></svelte:window>

<div>
	<button on:click={prev}></button>
    <span></span>
	<button on:click={next}></button>
</div>