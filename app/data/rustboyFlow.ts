import type { FlowSpec } from "@/app/components/FlowDiagram";
import { ACCENT, BOX } from "@/app/data/ragnadudsFlow";

// an arrow means "is needed by", the way cargo sees it
export const rustboyCrates: FlowSpec = {
  height: 460,
  nodes: [
    { id: "core", position: { x: 300, y: 0 }, data: { label: "rustboy-core" }, width: 190, height: 40, style: ACCENT },
    { id: "splash", position: { x: 40, y: 120 }, data: { label: "rustboy-splash" }, width: 190, height: 40, style: BOX },
    { id: "frontend", position: { x: 300, y: 240 }, data: { label: "rustboy-frontend" }, width: 190, height: 40, style: BOX },
    { id: "desktop", position: { x: 40, y: 380 }, data: { label: "rustboy-desktop" }, width: 190, height: 40, style: BOX },
    { id: "wasm", position: { x: 560, y: 380 }, data: { label: "rustboy-wasm" }, width: 190, height: 40, style: BOX },
  ],
  edges: [
    { id: "c1", source: "core", target: "splash" },
    { id: "c2", source: "core", target: "frontend", label: "the console" },
    { id: "c3", source: "splash", target: "frontend", label: "title screen" },
    { id: "c4", source: "frontend", target: "desktop", label: "one shared loop" },
    { id: "c5", source: "frontend", target: "wasm" },
  ],
  details: {
    core: {
      title: "The console itself",
      what: "CPU, screen, sound chip, timer, buttons and cartridge. It never opens a file, never reads a clock and never draws anything. You hand it a game, ask for a frame, and get a picture back.",
      facts: ["zero dependencies", "pure Rust", "271 unit tests"],
    },
    splash: {
      title: "The title screen",
      what: "A photo kept in the repo gets cropped, recoloured and shrunk to 160 by 144 at compile time, then the words are stamped on top. The image library only runs on my machine during the build. The browser just gets raw pixels.",
      facts: ["build.rs", "image + color_quant at build time only", "fades in and out"],
    },
    frontend: {
      title: "The loop both apps share",
      what: "A tiny trait says what a platform must do: tell the time, give a buffer to paint, show it. Everything else, like when to show the title screen or when to write a save, lives here once.",
      facts: ["Host trait", "saves 1 s after the first write"],
    },
    desktop: {
      title: "The desktop app",
      what: "A window that scales the tiny screen up, reads the keyboard and keeps the save file next to the game. Same code on an Intel laptop and an ARM one.",
      facts: ["winit + pixels", "640 x 576 window", "x86_64 and aarch64"],
    },
    wasm: {
      title: "The browser version",
      what: "The same core compiled to WebAssembly. It paints a canvas every animation frame, takes a game from a file picker and keeps saves in the browser. The crate also has a small file server so I can try it locally.",
      facts: ["wasm-pack", "~160 KB of wasm", "saves in localStorage"],
    },
  },
};

// one frame, from the host asking to the picture coming back
export const rustboyLoop: FlowSpec = {
  height: 640,
  nodes: [
    // one column top to bottom, the default handles route that cleanly
    { id: "host", position: { x: 300, y: 0 }, data: { label: "Host asks for a frame" }, width: 190, height: 40, style: ACCENT },
    { id: "front", position: { x: 300, y: 100 }, data: { label: "Title screen or game?" }, width: 190, height: 40, style: BOX },
    { id: "cpu", position: { x: 300, y: 200 }, data: { label: "CPU (SM83)" }, width: 190, height: 40, style: BOX },
    { id: "bus", position: { x: 300, y: 300 }, data: { label: "Bus: tick(4) per access" }, width: 190, height: 40, style: ACCENT },
    { id: "ppu", position: { x: 0, y: 430 }, data: { label: "Screen (PPU)" }, width: 170, height: 40, style: { ...BOX, width: 170 } },
    { id: "timer", position: { x: 200, y: 430 }, data: { label: "Timer" }, width: 170, height: 40, style: { ...BOX, width: 170 } },
    { id: "apu", position: { x: 400, y: 430 }, data: { label: "Sound (APU)" }, width: 170, height: 40, style: { ...BOX, width: 170 } },
    { id: "cart", position: { x: 600, y: 430 }, data: { label: "Cartridge + MBC" }, width: 170, height: 40, style: { ...BOX, width: 170 } },
    { id: "picture", position: { x: -10, y: 550 }, data: { label: "A finished 160 x 144 picture" }, width: 190, height: 40, style: ACCENT },
  ],
  edges: [
    { id: "l1", source: "host", target: "front", label: "every refresh" },
    { id: "l2", source: "front", target: "cpu", label: "run_frame" },
    { id: "l3", source: "cpu", target: "bus", label: "read / write" },
    { id: "l4", source: "bus", target: "ppu" },
    { id: "l5", source: "bus", target: "timer" },
    { id: "l6", source: "bus", target: "apu" },
    { id: "l7", source: "bus", target: "cart" },
    { id: "l8", source: "ppu", target: "picture", label: "frame_ready" },
  ],
  details: {
    host: {
      title: "The platform knocks",
      what: "The desktop window or the browser tab decides when a new picture is due, about 60 times a second, and asks for one.",
      facts: ["59.73 frames a second", "requestAnimationFrame in the browser"],
    },
    front: {
      title: "Splash first, then the game",
      what: "For the first eight seconds the title screen paints the frame. Any button skips it. After that every frame comes from the console.",
      facts: ["8 s title screen", "any button skips it"],
    },
    cpu: {
      title: "The processor",
      what: "Runs the game one instruction at a time, and checks for interrupts in between. It keeps going until the screen says the picture is done, so it never counts cycles itself.",
      facts: ["~500 instructions", "4,194,304 ticks a second", "double speed on the Color"],
    },
    bus: {
      title: "Time moves here",
      what: "Every single memory read or write first moves the whole machine forward four ticks, then the value arrives. That is how the screen and the timer stay in step with the CPU, even halfway through an instruction.",
      facts: ["tick(4)", "70,224 ticks a frame"],
    },
    ppu: {
      title: "The screen chip",
      what: "Builds the picture one pixel per tick while the CPU keeps running, then raises the VBlank interrupt and flags the frame as ready.",
      facts: ["pixel FIFO", "154 lines of 456 ticks"],
    },
    timer: {
      title: "The timer",
      what: "A counter games use for timing and randomness. It raises an interrupt when it overflows, with the same small reload delay as the real chip.",
      facts: ["DIV and TIMA", "falling edge detection"],
    },
    apu: {
      title: "The sound chip",
      what: "Four channels: two square waves, one drawn wave shape and one noise generator. The core already turns them into samples. Getting those to your speakers is what I am doing now.",
      facts: ["48,000 samples a second", "work in progress"],
    },
    cart: {
      title: "The cartridge",
      what: "The game's ROM plus a small chip that swaps which 16 KB slice the CPU can see. Some carts also carry save memory with a battery, and one kind carries a clock.",
      facts: ["MBC1, MBC3, MBC5", "MBC3 clock", "battery saves"],
    },
    picture: {
      title: "Handed back",
      what: "160 by 144 pixels, four bytes each. The host copies them to a window or a canvas and asks again.",
      facts: ["92,160 bytes"],
    },
  },
};
