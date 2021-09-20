import { writable } from 'svelte/store'

let _rotations = JSON.parse(localStorage.getItem("rotations")) || []

export const rotations = writable(_rotations);

rotations.subscribe(value =>{
    localStorage.setItem("rotations", JSON.stringify(value))
})