export default {
  "id": 0,
  "name": "App",
  "type": "svelte",
  "source": `<script>
  // Edit this code to showcase something
  import Animal from './Animal.svelte'
  import data from './data.json'
</script>

{#each data as item}
  <Animal {...item} />
{/each}
`
}