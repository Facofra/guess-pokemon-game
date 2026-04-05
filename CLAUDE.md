# Pokemon Guess Game

A Wordle-style Pokemon guessing game in Spanish. No framework, no build tool, no dependencies — pure vanilla HTML/CSS/JS served as static files. Works with `file://` and on GitHub Pages.

## Project structure

```
index.html         — layout and markup
styles.css         — all styles and CSS variables
script.js          — all game logic (single PokemonGame class)
pokedex.js         — generated data file (run build_pokedex.py to create)
build_pokedex.py   — fetches data from PokeAPI and writes pokedex.js
cosas.env          — personal notes (gitignored)
```

## Data pipeline

Pokemon data is **not fetched at runtime**. Instead, run `build_pokedex.py` once locally to generate `pokedex.js`, which is then loaded as a static script tag.

- `build_pokedex.py` — fetches all data from PokeAPI, builds the full dataset, writes `pokedex.js`
- `pokedex.js` — exposes a single global `POKEDEX_DATA = { pokemon: [...], category_index: {...} }`

**Configuring generations:** edit `GENERATIONS = [1, 2, 3]` at the top of `build_pokedex.py`. Supports gens 1–9. The rest of the code (script.js) adapts automatically — nothing is hardcoded.

`index.html` loads `pokedex.js` before `script.js`.

## Architecture

**script.js** is organized as:
- Global constants and translation maps (`TYPE_ES`, `COLOR_ES`, `SHAPE_ES`, `HABITAT_ES`, `EGG_ES`, `CATEGORY_META`)
- `loadPokedex()` — reads `POKEDEX_DATA` into `pokeList`, `pokeDataMap`, `ALL_IDS`, `categoryIndex`; also generates the dynamic "Generación" glossary example
- `getPokemonData(idOrName)` — synchronous lookup from `pokeDataMap`
- `PokemonGame` class — handles all state, UI rendering, and game flow

**External resources:**
- `https://pokeapi.co/api/v2` — used only at build time (Python script), not at runtime
- `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png` — sprites (loaded at runtime)

## Game mechanics

- Secret Pokemon is randomly selected from whichever IDs are in `pokedex.js`
- Player guesses by typing a name or ID number; autocomplete dropdown shows all remaining (non-guessed) Pokemon with scroll
- Selecting from dropdown immediately submits the guess (no need to click Adivinar)
- Each guess reveals categories that match between the guess and the secret
- **Fácil (Easy):** all newly shared categories revealed each guess, unlimited attempts
- **Difícil (Hard):** only the single most discriminating shared category revealed per guess, max 10 attempts
- Win condition: guessing the exact secret Pokemon
- Categories: Tipo 1, Tipo 2, Generación, Color, Forma del cuerpo, Grupo de huevo 1, Grupo de huevo 2, Etapa evolutiva, Legendario/Mítico, Hábitat

### Table rendering
- Secret Pokemon column always shown (silhouette / black sprite until won/lost); revealed category cells show the value even while hidden
- Guessed Pokemon cells: matching categories show the value with green highlight; non-matching show `·`
- Color category values are rendered in their actual color using CSS variables (`--color-red`, `--color-blue`, etc.)

## CSS conventions

- CSS custom properties defined on `:root` in `styles.css` — always use variables, never hardcode colors
- Pokemon body color variables: `--color-black`, `--color-blue`, `--color-brown`, `--color-gray`, `--color-green`, `--color-pink`, `--color-purple`, `--color-red`, `--color-white`, `--color-yellow`
- Dark theme with blue/red/yellow Pokeball palette
- Two fonts: `Press Start 2P` (headers/badges) and `Nunito` (body text)
- Responsive breakpoint at 600px

## Important notes

- `*.env` files are gitignored — do not commit them
- `pokedex.js` is a generated file (not hand-edited)
- All user-facing text is in Spanish
- Pokemon names used internally (`pokeDataMap` keys) are lowercase English as returned by PokeAPI
- `capitalize()` is used for display only — never capitalize before lookups
