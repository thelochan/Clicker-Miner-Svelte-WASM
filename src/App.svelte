<script>

    import initMiner from '../wasm/mine.wasm'
    import {onMount} from 'svelte'
    let state;
    let miner = () => {}


    let wasmExports = null;

let wasmMemory = new WebAssembly.Memory({initial: 256, maximum: 256});


let wasmTable = new WebAssembly.Table({
    'initial': 1,
    'maximum': 1,
    'element': 'anyfunc'
});

let asmLibraryArg = { 
    "__handle_stack_overflow": ()=>{},
    "emscripten_resize_heap": ()=>{},
    "__lock": ()=>{}, 
    "__unlock": ()=>{},
    "memory": wasmMemory, 
    "table": wasmTable 
};


    var importObject = {
    imports : {
    main: function(arg) {
      console.log(arg);
      var info = {
    'env': asmLibraryArg,
    'wasi_snapshot_preview1': asmLibraryArg

    }
  }
}
    }

    onMount(async () =>{
        // console.log(initMiner)
        // miner = await initMiner()
        // miner['constructor']
        // console.log(miner)
        initMiner().then((instance ) => {
  console.log(instance);
});
    })

    let score= 0;
    let upgradeCost = 10;
    let upgrades = 0;

    function buyUpgrade() {
        if (score >= upgradeCost){
            score = score - upgradeCost;
            upgrades = upgrades+1;
            upgradeCost = Math.round(upgradeCost * 1.5);

            score = score;
            upgradeCost = upgradeCost;
            upgrades = upgrades;
        }
    }

    function addToScore(amount) {
        score = score + amount;
        score = score;
        miner.mine("hello", "h", "21e8", 1)
    }


</script>

<main>
    <title>Chip Clicker</title>

<body>
    <div class = "sectionMain">
        <center>
        <div class = "scoreContainer unselectable">
    <span id="score">0</span> Chips <br>

    <br> 
    <div class = "clickerContainer unselectable"> <img src="./images/chip.png" alt= "CPU" height="256px" width="256px" on:click={(amount) => addToScore(amount)}>
    </div>
    </center>
</div>


<div class = "sectionSide">
    <table class = "upgradeButton" on:click={buyUpgrade}>
        <tr> <td id="nameAndCost"> <p>UPGRADES</p> {upgrades} </td></tr>
         <tr> <td id="nameAndCost"> <p>Look up</p></td>  </tr>
        <tr> <td id="nameAndCost"> <p>Web RTC</p></td> </tr>
        <tr> <td id="nameAndCost"> <p>Blah</p></td>    </tr>
        <tr> <td id="nameAndCost"> <p>Blah 2 </p></td>  </tr>
        <tr> <td id="nameAndCost"> <p>Dark Blah Returns</p></td>  </tr>
        <tr> <td id="nameAndCost"> <p>GPU Stats</p></td> </tr>
            
        

    </table>
</div>  

    <script>
       
   

    </script>
</main>

<style>
	 .sectionMain {
            float: left;
            width: 80%;
        }

        .sectionSide {
            float: right;
            width: 10%;

        }

        .scoreContainer {
            background-color: rgb(238, 238, 238, 0.6);
            width: 50%;
            padding: 10px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;


        }

        .clickerContainer img {
            position: relative;
            transition: all .2s ease-in-out;
            
        }

        .clickerContainer img:hover { transform: scale(1.15);}
        .clickerContainer img:active { transform: scale(0.9); }

  /*   .shopButton {
            background-color: #b5b5b5;
            transition: all 0.2s ease-in-out;
            border-radius: 10px;
            width: 100%;
            margin: 10px 0px 10px 0px;
        }

        .shopButton :hover {
            background-color: #c7c7c7;
            transition: all .2s ease-in-out;
        } */

        .shopButton #nameAndCost p {
            margin: 0px;
            width: 60%;
        }

        .unselectable {
            user-select: none;
        }

</style>