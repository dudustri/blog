import { Position } from "@xyflow/react";
import type { FlowSpec } from "@/app/components/FlowDiagram";

const BOX = {
  padding: 10,
  borderRadius: 10,
  // colours are css variables from globals.css so the diagram follows dark mode
  border: "1px solid var(--flow-line)",
  background: "var(--flow-box)",
  color: "var(--flow-text)",
  fontSize: 12,
  width: 190,
  textAlign: "center" as const,
};
const ACCENT = { ...BOX, border: "1.5px solid var(--accent)", background: "var(--flow-accent-bg)", color: "var(--accent)" };
// label pinned top-left, centred it collided with the incoming edge label
const GROUP = {
  borderRadius: 12,
  textAlign: "left" as const,
  verticalAlign: "top" as const,
  paddingLeft: 14,
  paddingTop: 8,
  border: "1px dashed var(--flow-line)",
  background: "transparent",
  fontSize: 11,
  color: "var(--flow-muted)",
};

// plain language on purpose. a reader should learn what the thing does, not
// just read its name back
export const ragnadudsFlow: FlowSpec = {
  height: 520,
  nodes: [
    // absolute positions, no parentId. the VM boundary is just a box sitting
    // behind everything, which avoids react flow's parent extent measuring.
    // rows run top to bottom so the default bottom-to-top handles route cleanly
    {
      id: "vm", position: { x: 0, y: 90 }, data: { label: "Oracle Cloud VM (ARM)" },
      width: 780, height: 440, selectable: false, draggable: false,
      style: { ...GROUP, width: 780, height: 440 },
    },
    { id: "friends", position: { x: 295, y: 0 }, data: { label: "Friends in DK and BR" }, width: 190, height: 40, style: ACCENT },
    { id: "fw", position: { x: 295, y: 145 }, data: { label: "iptables + security list" }, width: 190, height: 40, style: BOX },
    { id: "pre", position: { x: 40, y: 240 }, data: { label: "Pre-renewal servers" }, width: 190, height: 40, style: BOX },
    { id: "re", position: { x: 550, y: 240 }, data: { label: "Renewal servers" }, width: 190, height: 40, style: BOX },
    { id: "db", position: { x: 295, y: 350 }, data: { label: "MariaDB x2" }, width: 190, height: 40, style: BOX },
    { id: "caddy", position: { x: 40, y: 460 }, data: { label: "Caddy" }, width: 190, height: 40, style: ACCENT },
    { id: "status", position: { x: 550, y: 460 }, data: { label: "Status sidecar" }, width: 190, height: 40, style: ACCENT },
  ],
  edges: [
    { id: "e1", source: "friends", target: "fw", label: "game ports, HTTPS" },
    { id: "e2", source: "fw", target: "pre" },
    { id: "e3", source: "fw", target: "re" },
    { id: "e4", source: "fw", target: "caddy", label: "HTTPS", type: "smoothstep" },
    { id: "e5", source: "pre", target: "db", animated: false },
    { id: "e6", source: "re", target: "db", animated: false },
    { id: "e7", source: "db", target: "status", animated: false, label: "read only" },
    { id: "e8", source: "status", target: "caddy", label: "status.json", type: "smoothstep" },
  ],
  details: {
    friends: {
      title: "Friends in Denmark and Brazil",
      what: "The people the whole thing exists for. They run a patched game client and open the website in a browser.",
      facts: ["2 continents", "~6 players"],
    },
    fw: {
      title: "The front door",
      what: "Only the game ports and the web ports are open to the internet. Everything else is refused before it reaches a container.",
      facts: ["iptables", "Oracle security list", "SSH is key only"],
    },
    pre: {
      title: "The classic server",
      what: "The version of the game we played as kids. Three processes handle logging in, picking a character, and walking around the world.",
      facts: ["login + char + map", "packet version 2021"],
    },
    re: {
      title: "The modern server",
      what: "The same three processes again, compiled for a much newer client, so both eras can run side by side without touching each other.",
      facts: ["login + char + map", "packet version 2026"],
    },
    db: {
      title: "The databases",
      what: "Accounts, characters and everything they own. Reachable only from inside the machine, so there is no database port facing the internet at all.",
      facts: ["MariaDB", "one per era", "no public port"],
    },
    caddy: {
      title: "The web server",
      what: "Serves the site, gets its HTTPS certificate on its own, and refuses to hand anything over until the login cookie matches.",
      facts: ["auto HTTPS", "cookie gate", "client downloads"],
    },
    status: {
      title: "The status watcher",
      what: "Every 15 seconds it knocks on the game ports and asks each database one read-only question, then writes the answer to a file the website reads.",
      facts: ["every 15 s", "one query per database", "writes status.json"],
    },
  },
};

const LR = { sourcePosition: Position.Right, targetPosition: Position.Left };
const RL = { sourcePosition: Position.Left, targetPosition: Position.Right };

// every arrow here is one duds.sh command
export const ragnadudsRelease: FlowSpec = {
  height: 460,
  nodes: [
    { id: "pc", position: { x: -20, y: 20 }, data: { label: "My PC (amd64)" }, width: 280, height: 400, selectable: false, draggable: false, style: { ...GROUP, width: 280, height: 400 } },
    { id: "vm", position: { x: 540, y: 20 }, data: { label: "Oracle Cloud VM (arm64)" }, width: 280, height: 400, selectable: false, draggable: false, style: { ...GROUP, width: 280, height: 400 } },
    { id: "buildx", position: { x: 0, y: 60 }, data: { label: "docker buildx + QEMU" }, width: 240, height: 40, style: BOX, ...LR },
    { id: "ghcr", position: { x: 290, y: 60 }, data: { label: "GHCR" }, width: 220, height: 40, style: ACCENT, ...LR },
    { id: "pull", position: { x: 560, y: 60 }, data: { label: "docker compose pull" }, width: 240, height: 40, style: BOX, ...LR },
    { id: "cfg", position: { x: 0, y: 160 }, data: { label: "Per host config folder" }, width: 240, height: 40, style: BOX, ...LR },
    { id: "mounts", position: { x: 560, y: 160 }, data: { label: "Runtime mounts" }, width: 240, height: 40, style: BOX, ...LR },
    { id: "dumps", position: { x: 0, y: 260 }, data: { label: "Backups on my PC" }, width: 240, height: 40, style: BOX, ...RL },
    { id: "cron", position: { x: 560, y: 260 }, data: { label: "cron every 6 hours" }, width: 240, height: 40, style: BOX, ...RL },
    { id: "accfile", position: { x: 0, y: 360 }, data: { label: "Local accounts file" }, width: 240, height: 40, style: BOX, ...LR },
    { id: "accounts", position: { x: 560, y: 360 }, data: { label: "Game accounts" }, width: 240, height: 40, style: BOX, ...LR },
  ],
  edges: [
    { id: "r1", source: "buildx", target: "ghcr", label: "release" },
    { id: "r2", source: "ghcr", target: "pull" },
    { id: "r3", source: "cfg", target: "mounts", label: "up vm, rsync over ssh" },
    { id: "r4", source: "cron", target: "dumps", label: "backup, mariadb-dump" },
    { id: "r5", source: "accfile", target: "accounts", label: "accounts, SQL over ssh" },
  ],
  details: {
    buildx: { title: "Build once, on my machine", what: "One build produces images for both my laptop and the ARM server, so the two never drift apart.", facts: ["amd64 + arm64", "QEMU"] },
    ghcr: { title: "A private shelf for the images", what: "Every build is tagged twice, once as latest and once with the exact commit it came from. Rolling back is picking the older tag.", facts: [":latest", ":<git sha>", "read only token on the VM"] },
    pull: { title: "The server only downloads", what: "No source code, no compiler, no build tools on the server. It pulls finished images and runs them.", facts: ["no source on the VM"] },
    cfg: { title: "Secrets stay here", what: "Rates, game scripts and passwords live in a folder on my machine, never inside an image and never in git.", facts: ["per host", "git ignored"] },
    mounts: { title: "Config arrives at boot", what: "The settings are mounted in when a container starts, so changing a drop rate is a copy and a restart rather than a rebuild.", facts: ["no rebuild"] },
    cron: { title: "Backups run themselves", what: "Every six hours the server dumps both databases and keeps a week of them.", facts: ["every 6 h", "7 days kept"] },
    dumps: { title: "And land on my laptop", what: "One command pulls the dumps down, so the only copy is never on the same machine as the server.", facts: ["one command"] },
    accfile: { title: "Accounts as a plain list", what: "A file I edit by hand. Nobody signs up, I just add a line for a friend.", facts: ["git ignored"] },
    accounts: { title: "Applied without a web form", what: "The list is turned into SQL and applied over ssh. Running it twice changes nothing, which is the point.", facts: ["idempotent"] },
  },
};

// the client was the hard part
export const ragnadudsClient: FlowSpec = {
  height: 480,
  nodes: [
    { id: "exe", position: { x: 180, y: 0 }, data: { label: "Official client exe" }, width: 260, height: 40, style: BOX },
    { id: "patched", position: { x: 180, y: 110 }, data: { label: "Patched exe" }, width: 260, height: 40, style: BOX },
    { id: "boot", position: { x: 180, y: 230 }, data: { label: "What it loads at boot" }, width: 260, height: 40, style: BOX },
    { id: "loader", position: { x: 180, y: 360 }, data: { label: "itemInfo.lub becomes a loader" }, width: 260, height: 40, style: ACCENT },
    { id: "packet", position: { x: 520, y: 110 }, data: { label: "Packet version must match" }, width: 240, height: 40, style: BOX },
    { id: "shop", position: { x: 520, y: 230 }, data: { label: "Cash shop price bug" }, width: 240, height: 40, style: BOX },
  ],
  edges: [
    { id: "c1", source: "exe", target: "patched", label: "WARP patch session" },
    { id: "c2", source: "patched", target: "boot", label: "boot" },
    { id: "c3", source: "boot", target: "loader", label: "the fix" },
    { id: "c4", source: "patched", target: "packet", animated: false, type: "smoothstep" },
    { id: "c5", source: "boot", target: "shop", animated: false, type: "smoothstep" },
  ],
  details: {
    exe: { title: "A game client from another era", what: "A 32 bit Windows program, in Korean, that checks it has not been tampered with and refuses to talk to anything it was not built for.", facts: ["2026 build", "32 bit"] },
    patched: { title: "Persuaded to cooperate", what: "Patched to read loose files before its own archives, to stop checking for tampering, and to point at our server instead of the official one. The patch steps are version controlled like code.", facts: ["WARP", "local files first", "no anti cheat"] },
    boot: { title: "What it actually reads", what: "Its own archives, then a single compiled file holding every item name. The English translation sits right next to that file and is never opened.", facts: ["GRF 0x200 / 0x300", "32 bit Lua bytecode"] },
    loader: { title: "The trick that fixed it", what: "That one file was replaced with a tiny program. It runs the original, lays the English names over the top, then adds our own items. The client never notices.", facts: ["27,000+ items", "0.5 s", "tested in a 32 bit Lua container"] },
    packet: { title: "The date has to line up", what: "The client and the server have to agree on the exact build date, or they cannot speak at all. So each server was compiled to match its client.", facts: ["2021 for classic", "2026 for renewal"] },
    shop: { title: "One price read as 544194803", what: "The client expected a preview image in every shop entry. The server was not sending one, so everything after the first item was read from the wrong place. One compile flag fixed it.", facts: ["one compile flag", "source untouched"] },
  },
};

// this very site
export const blogArchitecture: FlowSpec = {
  height: 460,
  nodes: [
    { id: "content", position: { x: 160, y: 0 }, data: { label: "content/*.json" }, width: 240, height: 40, style: BOX },
    { id: "data", position: { x: 160, y: 100 }, data: { label: "Typed data modules" }, width: 240, height: 40, style: BOX },
    { id: "pages", position: { x: 160, y: 200 }, data: { label: "App Router pages" }, width: 240, height: 40, style: ACCENT },
    { id: "static", position: { x: 160, y: 340 }, data: { label: "Static HTML, CSS, JS" }, width: 240, height: 40, style: BOX },
    { id: "client", position: { x: 500, y: 200 }, data: { label: "Client components" }, width: 240, height: 40, style: BOX },
    { id: "worker", position: { x: 500, y: 340 }, data: { label: "Cloudflare Worker" }, width: 240, height: 40, style: BOX },
  ],
  edges: [
    { id: "b1", source: "content", target: "data" },
    { id: "b2", source: "data", target: "pages" },
    { id: "b3", source: "pages", target: "static", label: "next build" },
    { id: "b4", source: "pages", target: "client", animated: false, type: "smoothstep", label: "renders" },
    { id: "b5", source: "client", target: "worker", label: "contact form", type: "smoothstep" },
  ],
  details: {
    content: { title: "Everything is a JSON file", what: "Posts, projects, countries, activities. No database and no admin panel, I edit a file and the site changes.", facts: ["no CMS"] },
    data: { title: "Read once, typed once", what: "Each file is loaded through a small module that gives it a shape, so a typo in the JSON breaks the build instead of the page.", facts: ["app/data/*.ts"] },
    pages: { title: "Pages are built, not served", what: "Every route is rendered ahead of time. There is no server deciding anything when you visit.", facts: ["Next.js App Router"] },
    static: { title: "The whole site is files", what: "The output is plain files on a CDN. Nothing to keep running, nothing to patch, nothing to pay for.", facts: ["output: export", "GitHub Pages"] },
    client: { title: "The parts that move", what: "The physics banners, the globe, the pizza plot and the diagram you are reading. These are the only pieces that ship JavaScript.", facts: ["Matter.js", "three.js", "React Flow"] },
    worker: { title: "The one moving part", what: "A static site cannot send an email, so the contact form posts to a small worker that checks a captcha and forwards the message.", facts: ["Turnstile guarded"] },
  },
};
