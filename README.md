# Clicker-Miner-Svelte-WASM



For the Svelte App: npx degit sveltejs/template ./
npm install (Dependencies)
npm run dev (To start a dev server)


For EMSDK:
cd emsdk -> source ./emsdk_env.sh (To set emsdk env in the terminal)
cd back into project directory


For WASM:
cd to WASM folder

For WASM: cd to WASM folder emcc --bind ./main.cpp ./sha256.cpp -s WASM=1 -o ./mine.js -s 'ENVIRONMENT="web"' -s USE_ES6_IMPORT_META=0 -s EXPORT_ES6=1 -s MODULARIZE=1

emcc -pthread -s PROXY_TO_PTHREAD ./main.cpp ./sha256.cpp -s WASM=1 -o ./mine.js -s 'ENVIRONMENT="worker"' -s USE_ES6_IMPORT_META=0 -s EXPORT_ES6=1 -s MODULARIZE=1 (Threads syntax )

Change the ENVIRONMENT to worker (ENVIRONMENT='worker') with the -pthread syntax (#thread header in the cpp file) 


Connect to 21e8 node.
Socket.io client connected to the node(21e8), 
From POSTMAN: GET to join rooms, POST(Mine) to send a request. 
Mine request after both connected using keyword. Test WebRTC. 1st Miner connected to front end via (socket.io) updates every job mine sent from  2nd miner to the 1st via webRTC 

