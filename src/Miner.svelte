<script>

    import initMinerWasm from '../wasm/mine.wasm'
    import miner from '../wasm/mine.js'
    import {onMount} from 'svelte'
    import {sha256} from "js-sha256"
    import {score} from "./stores/Score"
    import {rotations} from "./stores/Rotations"

    export let _mine = () =>{};



    onMount(async () =>{
        const mWasn =  miner({
            locateFile: () =>{
                return initMinerWasm;
            }
        })
         _mine = (await mWasn)._mine
    })

    const mine = (keyword, target) =>{
        const nonce = _mine(keyword, "", target, "rotate")
        // const source = sha256(keyword)
        const datahash = sha256("")
        const rotation = sha256(`${keyword}${datahash}${nonce}`)
        if(rotation > $score ){
            score.set(rotation)
        }

        rotations.update(arr =>{
            console.log(arr)
            arr.push(rotation)
            return arr
        })
    }

</script>

<slot mine={mine}></slot>
