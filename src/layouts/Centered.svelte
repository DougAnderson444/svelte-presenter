<script>
    export let css = ""
</script>

<style>
    .page > div {
        left: 0;
        position: absolute;
        text-align: center;
        top: 50%;
        transform: translateY(-50%);
        width: 100%;
    }
</style>

<div class="page {css}">
    <div>
        <slot></slot>
    </div>
</div>