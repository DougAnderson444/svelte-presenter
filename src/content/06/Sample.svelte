<script>
    let count = 0
</script>

<button on:click={() => count++}>{count}</button>

<style>
    button {
        border-radius: 2rem;
        cursor: pointer;
        margin: 1rem 0;
        padding: .5rem 1rem;
        width: 100px;
    }
</style>
