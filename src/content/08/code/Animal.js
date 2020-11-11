export default {
    "id": 1,
    "name": "Animal",
    "type": "svelte",
    "source": `<script>
    export let animal
    export let emoji
</script>

<p>{animal} - <span>{emoji}</span></p>

<style>
    span {
        font-size: 2rem;
    }
</style>
    `
}