import type { FlowSpec } from "@/app/components/FlowDiagram";
import { ACCENT, BOX, GROUP } from "@/app/data/ragnadudsFlow";

// every diagram runs top to bottom, the default handles only route cleanly that way

// the path a packet takes, from the browser tab to the room's game server
export const csdudsFlow: FlowSpec = {
  height: 600,
  nodes: [
    {
      id: "host", position: { x: 0, y: 110 }, data: { label: "My machine (docker compose, host network)" },
      width: 780, height: 470, selectable: false, draggable: false,
      style: { ...GROUP, width: 780, height: 470 },
    },
    { id: "browser", position: { x: 295, y: 0 }, data: { label: "Browser tab" }, width: 190, height: 40, style: ACCENT },
    { id: "caddy", position: { x: 40, y: 170 }, data: { label: "Caddy" }, width: 190, height: 40, style: BOX },
    { id: "api", position: { x: 40, y: 290 }, data: { label: "Go backend: lobby API" }, width: 190, height: 40, style: BOX },
    { id: "relay", position: { x: 550, y: 170 }, data: { label: "Go backend: WebRTC relay" }, width: 190, height: 40, style: ACCENT },
    { id: "rooms", position: { x: 40, y: 400 }, data: { label: "Room manager" }, width: 190, height: 40, style: BOX },
    { id: "hlds", position: { x: 550, y: 510 }, data: { label: "Game servers, one per room" }, width: 190, height: 40, style: BOX },
  ],
  edges: [
    { id: "t1", source: "browser", target: "caddy", label: "page, engine, maps" },
    { id: "t2", source: "browser", target: "relay", label: "WebRTC data channel" },
    { id: "t3", source: "caddy", target: "api", label: "/api" },
    { id: "t4", source: "api", target: "rooms", animated: false },
    { id: "t5", source: "rooms", target: "hlds", label: "start, RCON, stop", type: "smoothstep", animated: false },
    { id: "t6", source: "relay", target: "hlds", label: "UDP" },
  ],
  details: {
    browser: {
      title: "The whole game runs in the tab",
      what: "The real Half-Life engine with the Counter-Strike client, compiled to WebAssembly and drawn with WebGL 2. It thinks it is talking to a normal server over UDP, and never finds out it is not.",
      facts: ["Xash3D FWGS", "cs16-client", "WebAssembly"],
    },
    caddy: {
      title: "The web server",
      what: "Hands out the page, the engine and the game files. Files are named after their own hash, so the browser keeps them forever and a new build simply gets a new name.",
      facts: ["immutable cache", "zstd + gzip", "/api goes to Go"],
    },
    api: {
      title: "The lobby",
      what: "Lists rooms, creates them, checks names, and decides who may kick, add bots or close a server. Every address gets rate limits and a cap on live rooms.",
      facts: ["REST", "host token", "admin cookie"],
    },
    relay: {
      title: "The UDP bridge",
      what: "Browsers cannot send raw UDP, so each player opens one WebRTC data channel to this relay. It is unordered and never retries, just like UDP, and every packet is passed to the room's server as is.",
      facts: ["pion", "ICE lite", "one UDP port"],
    },
    rooms: {
      title: "The one owner of rooms",
      what: "Starts a game server per room on its own port, checks it is ready, asks it for the player list every few seconds, and stops it once nobody has played for an hour.",
      facts: ["one goroutine per room", "status over RCON"],
    },
    hlds: {
      title: "Plain Counter-Strike servers",
      what: "ReHLDS with ReGameDLL, Metamod-R, ReUnion and AMX Mod X. ReUnion is what lets players in without Steam. Each player arrives from their own local address, so the server tells them apart.",
      facts: ["ports 27015 and up", "127.10.x.y per player", "no Steam"],
    },
  },
};

// what happens to a room from the create button to the last player leaving
export const csdudsRoom: FlowSpec = {
  height: 640,
  nodes: [
    { id: "create", position: { x: 180, y: 0 }, data: { label: "Create server" }, width: 220, height: 40, style: ACCENT },
    { id: "starting", position: { x: 180, y: 110 }, data: { label: "Starting" }, width: 220, height: 40, style: BOX },
    { id: "ready", position: { x: 180, y: 220 }, data: { label: "Ready and listed" }, width: 220, height: 40, style: ACCENT },
    { id: "playing", position: { x: 0, y: 330 }, data: { label: "Playing" }, width: 220, height: 40, style: BOX },
    { id: "stopping", position: { x: 180, y: 440 }, data: { label: "Stopping" }, width: 220, height: 40, style: BOX },
    { id: "gone", position: { x: 180, y: 560 }, data: { label: "Gone, port free again" }, width: 220, height: 40, style: BOX },
    { id: "failed", position: { x: 500, y: 220 }, data: { label: "Start failed" }, width: 220, height: 40, style: BOX },
  ],
  edges: [
    { id: "l1", source: "create", target: "starting", label: "port reserved" },
    { id: "l2", source: "starting", target: "ready", label: "RCON answers, mode checked" },
    { id: "l3", source: "starting", target: "failed", label: "crash or 30 s timeout" },
    { id: "l4", source: "ready", target: "playing", label: "someone joins" },
    { id: "l5", source: "playing", target: "stopping", label: "1 h empty, host or admin" },
    { id: "l8", source: "ready", target: "stopping", label: "nobody joined for 1 h" },
    { id: "l6", source: "stopping", target: "gone" },
    { id: "l7", source: "failed", target: "gone", animated: false },
  ],
  details: {
    create: { title: "Someone clicks create", what: "The lobby checks the map really exists for that mode and the options are ones the mode allows, then grabs a free port. No free port means no room.", facts: ["10 modes", "~300 maps", "6 ports by default"] },
    starting: { title: "A game server boots", what: "A fresh server process starts on that port with the mode's config. The backend keeps asking it a question until it answers.", facts: ["hlds_linux", "own process group"] },
    ready: { title: "Proved it is the right mode", what: "Answering is not enough. Every mode sets one setting to a known value, and the room is only listed once the server reads that value back.", facts: ["probe cvar", "mode.cfg"] },
    failed: { title: "Did not come up", what: "If the server crashes or the check never passes, the creator gets a clear error instead of a room that looks alive and is not.", facts: ["504 start_failed"] },
    playing: { title: "The room is live", what: "Every few seconds the backend asks for the player list. That feeds the lobby, the players page, and the host controls in the overlay.", facts: ["status every 5 s", "kick, bots, map votes"] },
    stopping: { title: "Time to close", what: "An hour with no humans, the host closing it, the admin, or a server that stops answering. Bots building a map's navigation freeze it for a while, so that last one waits two minutes.", facts: ["SIGTERM, then SIGKILL"] },
    gone: { title: "Cleaned up", what: "Unlisted, every WebRTC session to it closed, and the port goes back in the pool for the next room.", facts: ["sessions closed", "port released"] },
  },
};

// one docker compose up --build, from pinned sources to two images
export const csdudsBuild: FlowSpec = {
  height: 420,
  nodes: [
    { id: "steam", position: { x: 0, y: 0 }, data: { label: "SteamCMD, anonymous" }, width: 200, height: 40, style: BOX },
    { id: "addons", position: { x: 240, y: 0 }, data: { label: "pins.txt downloads" }, width: 200, height: 40, style: BOX },
    { id: "maps", position: { x: 480, y: 0 }, data: { label: "Map mirror + GameBanana" }, width: 200, height: 40, style: BOX },
    { id: "src", position: { x: 720, y: 0 }, data: { label: "Engine submodules + patches" }, width: 200, height: 40, style: BOX },
    { id: "pack", position: { x: 480, y: 140 }, data: { label: "package-assets" }, width: 200, height: 40, style: ACCENT },
    { id: "emcc", position: { x: 720, y: 140 }, data: { label: "Emscripten" }, width: 200, height: 40, style: ACCENT },
    { id: "backend", position: { x: 120, y: 300 }, data: { label: "backend image" }, width: 200, height: 40, style: BOX },
    { id: "caddyimg", position: { x: 600, y: 300 }, data: { label: "caddy image" }, width: 200, height: 40, style: BOX },
  ],
  edges: [
    { id: "b1", source: "steam", target: "pack" },
    { id: "b2", source: "maps", target: "pack" },
    { id: "b3", source: "steam", target: "backend", label: "server files" },
    { id: "b4", source: "addons", target: "backend", label: "ReHLDS, AMXX, plugins" },
    { id: "b5", source: "pack", target: "caddyimg", label: "pk3 bundles" },
    { id: "b6", source: "pack", target: "backend", label: "map list" },
    { id: "b7", source: "src", target: "emcc" },
    { id: "b8", source: "emcc", target: "caddyimg", label: "wasm" },
  ],
  details: {
    steam: { title: "The game files, legally fetched", what: "The dedicated server is downloaded anonymously during the build. It needs a few attempts before SteamCMD admits it is done, so the build simply retries until it says so.", facts: ["app 90", "steam_legacy beta"] },
    addons: { title: "Everything else, pinned", what: "ReHLDS, ReGameDLL, Metamod-R, ReUnion, AMX Mod X and the GunGame sounds. One list with a URL and a sha256 each. A wrong hash fails the build.", facts: ["backend/docker/pins.txt", "sha256 checked"] },
    maps: { title: "Where the extra maps come from", what: "A CS 1.6 server mirror pinned to one git commit, plus a list of GameBanana maps fetched once with a script. Only map data is kept, never plugins or binaries.", facts: ["~300 maps", "names lowercased"] },
    src: { title: "The engine, from source", what: "Xash3D FWGS and cs16-client as git submodules pinned to one commit each, with a handful of small patches for the browser build. No prebuilt engine files.", facts: ["12 patches", "Dependabot weekly"] },
    pack: { title: "The map checker", what: "Reads every map and checks that each texture and model it needs is really there. A broken community map is left out. A broken stock map fails the build.", facts: ["base bundle + one pk3 per map", "manifest.json"] },
    emcc: { title: "C to WebAssembly", what: "The official Emscripten image compiles the engine, the renderer, the CS client and the menu. Only what the page needs is built, no server code and no bots.", facts: ["pinned by digest", "WebGL 2"] },
    backend: { title: "The game server image", what: "The Go binary plus a ready game server tree with every mode config and our plugins. It runs as an unprivileged user.", facts: ["Debian slim", "cs-backend"] },
    caddyimg: { title: "The web image", what: "The lobby page, the engine under a hash of its files, the team pictures and every map bundle, ready to be cached forever.", facts: ["caddy 2.11", "/assets + /engine"] },
  },
};
