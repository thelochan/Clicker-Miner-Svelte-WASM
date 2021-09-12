# Clicker-Miner-Svelte-WASM



For the Svelte App: npx degit sveltejs/template ./
npm install (Dependencies)
npm run dev (To start a dev server)


For EMSDK:
cd emsdk -> source ./emsdk_env.sh (To set emsdk env in the terminal)
cd back into project directory


For WASM:
cd to WASM folder
emcc ./main.cpp ./sha256.cpp -I . -o mine.js -DENABLE_WASM=true -s NO_EXIT_RUNTIME=1 -s ALLOW_MEMORY_GROWTH=1 -s "EXPORTED_FUNCTIONS= ['_mine']"       --->(*_mine)








