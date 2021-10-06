<script>
export let mine =  () => {}; 
export let source

let imgclass = ''

const handleKeydown = (event) => {
    if (event.code === "Space"){
        imgclass = "imgsmall"
        mine(source, "21e8")
    }
};

</script>

<svelte:window on:keyup={() => imgclass = ''} on:keydown={handleKeydown}/>

<div class="{imgclass} clickerContainer unselectable"> 
    <img src="./images/chip.png" alt= "CPU" height="256px" width="256px" on:click={(amount) => mine(source, "21e8")}>
</div>




<div>



    <table>
        <tr style="color: white;"> PC STATS</tr>
        <tr>
          <th style="color: white;">PC: MacOS</th>
          
        </tr>
        <tr>
          <th style="color: white;">Target: 21e8</th>
          
        </tr>
        <tr>
          <th style="color: white;">Rotation: 0</th>
          
        </tr>
        <tr>
            <th style="color: white;">Nonce: </th>
            
         
      </table>
      
</div>

<style>
    .clickerContainer img:hover { transform: scale(1.15);}

    .clickerContainer img:active { transform: scale(0.9); }

    
    .imgsmall { transform: scale(0.9);}

    
</style>
