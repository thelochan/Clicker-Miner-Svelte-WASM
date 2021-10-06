<script>

    import initMinerWasm from '../wasm/mine.wasm'
    import miners from '../wasm/mine.js'
    import {onMount} from 'svelte'

    import {rotations} from "./stores/Rotations.js"
    import {score} from "./stores/Score.js"
    import Score from "./Score.svelte"
    import Miner from './Miner.svelte'
    import Clicker from './Clicker.svelte'

    let state;
    $:source = $rotations[$rotations.length -1] || "clicker-game"

    let miner = () => {}
    

    onMount(async () =>{
        const mWasn =  miners({
            locateFile: () =>{
                return initMinerWasm;
            }
        })
         miner = await mWasn
    })

    let upgradeCost = 10;
    let upgrades = 0;

    // function buyUpgrade() {
    //     if (score >= upgradeCost){
    //         score = score - upgradeCost;
    //         upgrades = upgrades+1;
    //         upgradeCost = Math.round(upgradeCost * 1.5);

    //         score = score;
    //         upgradeCost = upgradeCost;
    //         upgrades = upgrades;
    //     }
    // }

</script>

<main>
    <title>Chip Clicker In Space</title>

<body> 
    <Miner let:mine>

        <div class = "sectionMain">
            <center>
            <div class = "scoreContainer unselectable">
    
                <Score score={$score}/>

        <br>  
        <Clicker {mine} {source}/> 

                </center>
    </div>


    <!-- <div class = "sectionSide">
        <table class = "upgradeButton" on:click={buyUpgrade}>
            <tr> <td id="nameAndCost"> <p>UPGRADES</p> {upgrades} </td></tr>
            <tr> <td id="nameAndCost"> <p>Multiplier 1</p></td>  </tr>
            <tr> <td id="nameAndCost"> <p>Multiplier 2 </p></td> </tr>
            <tr> <td id="nameAndCost"> <p>Multiplier 3</p></td>    </tr>
            <tr> <td id="nameAndCost"> <p>Multiplier 4 </p></td>  </tr>
            <tr> <td id="nameAndCost"> <p>Firstname Lastname</p></td>  </tr>
            <tr> <td id="nameAndCost"> <p>GPU Stats</p></td> </tr>
                
            

        </table>
    </div>   -->
    </Miner>
    
</body>





</main>

<style>
	 .sectionMain {
            float: center;
            height: 500px;
           background-image: url(../images/space.jpeg)
        
           
        }

        .sectionSide {
            float: right;
            width: 10%;

        }

        .scoreContainer {
            
            width: 80%;
            padding: 10px;
            border-radius: 80px;
            font-size: 24px;
            font-weight: bold;


        }

        .clickerContainer img {
            position: relative;
            transition: all .2s ease-in-out;
            padding: 100px;
            
        }

        
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