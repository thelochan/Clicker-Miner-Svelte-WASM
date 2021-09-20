<script>

    import SideBarItems from "./SideBarItems.svelte"

    export let items;

</script>


<div class = "sectionSide">

    {#each items as item}
        <SideBarItems title={item.title} value={item.value} clickCB={item.onClick}/>
    {/each}

</div>