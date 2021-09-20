import { writable } from 'svelte/store'

let _score = JSON.parse(localStorage.getItem("score")) || ""

export const score = writable(_score);

score.subscribe(value =>{
    localStorage.setItem("score", JSON.stringify(value))
})