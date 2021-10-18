<script>

    import initMinerWasm from '../wasm/mine.wasm'
    import miners from '../wasm/mine.js'
    import {onMount} from 'svelte'

    import {rotations} from "./stores/Rotations.js"
    import {score} from "./stores/Score.js"
    import Score from "./Score.svelte"
    import Miner from './Miner.svelte'
    import Clicker from './Clicker.svelte'
    import {io} from "socket.io-client"
    

    let state;
    $:source = $rotations[$rotations.length -1] || "clicker-game"

    let miner = () => {}
    let socket;

    onMount(async () =>{
        socket = io("localhost:3000");
        socket.on("connect", (socket)=>{
            console.log(socket)
        })

       

        socket.on("disconnect", ()=>{
            console.log(socket)
        })

        socket.on("e5c7ffac26fed654fe62045898f55b551a0dc120badf3d116bcd364418f3ec16", (data) =>{
            console.log("Recieved message for room, ", data)
        })

        const mWasn =  miners({
            locateFile: () =>{
                return initMinerWasm;
            }
        })
         miner = await mWasn
    })

    let upgradeCost = 10;
    let upgrades = 0;

 
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


      </Miner>

  
    
</body>





</main>

<style>
	 .sectionMain {
            float: center;
            height: 500px;
           background-image: url(../images/space.jpeg)
        
           
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

        
  

        .shopButton #nameAndCost p {
            margin: 0px;
            width: 60%;
        }

        .unselectable {
            user-select: none;
        }

</style>