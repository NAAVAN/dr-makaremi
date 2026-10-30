---
name: flipbook
description: Use @drawcall/flipbook in Three.js scenes. Trigger when an agent needs to add, configure, animate, or debug KTX2 flipbook billboard effects such as flames, explosions, particles, impacts, or sprite-sheet VFX with the Flipbook class.
---

# @drawcall/flipbook

Use `@drawcall/flipbook` for lightweight Three.js billboard effects loaded from KTX2 sprite sheets. Get ready-to-use flipbook assets from `@drawcall/market`.

A pre-rendered sprite sheet is the right choice for art-directed effects — explosions, flames, magic, impacts — where it looks far better than code-built particles and costs almost nothing at runtime. For procedural, parametric bursts instead (sparks thrown along a surface normal, physics debris, a count/direction that varies per event), use the pooled particles. The two compose: a flipbook explosion plus a procedural debris burst reads better than either alone.

## Install

```sh
pnpm add @drawcall/flipbook three
```

`three` is a peer dependency.

## Basic Use

```ts
import { Flipbook } from "@drawcall/flipbook";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";

const ktx2Loader = new KTX2Loader()
  .setTranscoderPath("/basis/")
  .detectSupport(renderer);
Flipbook.setKtx2Loader(ktx2Loader);

const flame = new Flipbook("/flame.ktx2", {
  height: 0.6,
  origin: "bottom-center",
  billboard: "cylindrical"
});

scene.add(flame);
await flame.ready;

function animate(deltaSeconds: number) {
  flame.update(deltaSeconds);
}
```

Use `new Flipbook(url, options)` when the asset URL is known up front. Use `new Flipbook(options).load(url)` or `.setData(bytes)` when loading is controlled elsewhere.

> `KTX2Loader` needs the Basis transcoder files (`basis_transcoder.js` + `.wasm`) served at the path you pass to `setTranscoderPath`. They are not bundled — copy them from `three/examples/jsm/libs/basis/` into your served static dir (e.g. `public/basis/`). Without them, Basis-compressed `.ktx2` files fail to decode and nothing renders — the most common "flipbook shows nothing" cause.

## Get Assets

Prefer `@drawcall/market` for flipbook assets:

```sh
npx @drawcall/market search --type flipbook "flame"
```

Use the downloaded `.ktx2` file as the `Flipbook` URL, for example `new Flipbook("/effects/flame.ktx2")`.

## KTX2 Requirements

The KTX2 may be Basis-compressed KTX2 loaded through Three.js `KTX2Loader`, or
uncompressed `R8G8B8A8`.

Required metadata:

- `flipbook.columns`
- `flipbook.rows`

Optional metadata:

- `flipbook.aspectRatio`, defaults to the per-frame texture aspect ratio
- `flipbook.frames`, defaults to `columns * rows`
- `flipbook.duration`, defaults to `frames / 24`
- `flipbook.playbackRate`, defaults to `1`
- `flipbook.billboard`, supports `spherical`, `cylindrical`, and `none`

## Options

- `height`: world-space plane height; width comes from `aspectRatio`
- `origin`: use `"bottom-center"` for flames, torches, impacts, and ground-anchored effects
- `billboard`: use `"spherical"` for free-facing sprites, `"cylindrical"` for upright Y-axis sprites, and `"none"` for manually oriented meshes
- `playbackRate`: multiply the asset playback speed
- `loop`: set `false` for one-shot effects like explosions
- `autoPlay`: set `false` when triggering manually
- `opacity`: material opacity multiplier
- `randomStart`: keep `true` for many looping effects so instances do not sync

## Common Patterns

One-shot impact:

```ts
const impact = new Flipbook("/impact.ktx2", {
  autoPlay: false,
  loop: false,
  origin: "bottom-center"
});

impact.restart();
```

Many looping particles:

```ts
const sparks = positions.map((position) => {
  const spark = new Flipbook("/spark.ktx2", {
    height: 0.25,
    randomStart: true
  });

  spark.position.copy(position);
  scene.add(spark);
  return spark;
});

function animate(deltaSeconds: number) {
  for (const spark of sparks) spark.update(deltaSeconds);
}
```

## Debugging

- If nothing appears, await `flipbook.ready` and check the URL response.
- If frames are wrong, inspect `flipbook.columns`, `flipbook.rows`, and `flipbook.frames` metadata.
- If the sprite faces oddly, switch between `spherical`, `cylindrical`, and `none`.
- If the effect floats or sinks, adjust `origin` before adjusting mesh position.
- If one-shot effects loop, set `loop: false`.
