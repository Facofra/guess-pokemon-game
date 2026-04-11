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

Pokemon data is **not fetched at runtime**. Run `build_pokedex.py` once locally to generate `pokedex.js`, loaded as a static script tag before `script.js`.

- `pokedex.js` exposes one global: `POKEDEX_DATA = { pokemon: [...], category_index: {...} }`
- `pokemon` — array of `{ id, name, sprite, categories: { ... } }`
- `category_index` — `{ "Tipo 1": { "Fuego": ["charmander", ...], ... }, ... }` — used to rank category usefulness by candidate count

**Configuring generations:** edit `GENERATIONS = [...]` at the top of `build_pokedex.py`. Supports gens 1–9. `script.js` adapts automatically — no hardcoded ID ranges anywhere.

## Architecture

**script.js** globals:
- Translation maps: `TYPE_ES`, `COLOR_ES`, `SHAPE_ES`, `HABITAT_ES`, `EGG_ES`, `STAT_ES`, `CATEGORY_META`
- `pokeList` — `[{ id, name }]` for all Pokemon in the JSON
- `pokeDataMap` — `name/id → full entry object`
- `ALL_IDS` — all IDs from the JSON
- `categoryIndex` — reference to `POKEDEX_DATA.category_index`

**`loadPokedex()`** — reads `POKEDEX_DATA` (synchronous, no fetch), populates all globals, builds gen-selector buttons dynamically, generates the "Generación" glossary example.

**`getPokemonData(idOrName)`** — synchronous lookup from `pokeDataMap`.

**`PokemonGame` class** — all state, UI, and game flow. Key state:
- `this.activeIds` — IDs filtered by selected generations for the current game
- `this.revealedCategories` — ordered list of revealed category names (sorted by usefulness)
- `this.secretPokemon` / `this.guessedList` / `this.difficulty` / `this.attemptCount`

**External resources:**
- PokeAPI — build time only (Python script), never at runtime
- `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png` — sprites at runtime

## Game mechanics

- On the start screen the player selects **difficulty** and **generations** (toggleable buttons, default Gen 1/2/3, at least one required)
- Secret Pokemon is randomly picked from `this.activeIds` (only selected gens)
- Autocomplete dropdown shows all non-guessed Pokemon from active gens; filters by name or ID number; selecting from dropdown immediately submits the guess
- Each guess compares all categories between guess and secret; matching ones get revealed
- **Fácil:** all newly shared categories revealed per guess, unlimited attempts
- **Difícil:** only the single most useful shared category revealed per guess, max 10 attempts
- **Category ordering:** revealed categories are always sorted by `category_index` candidate count ascending (fewest candidates = most useful = shown first). Applied after every guess in both modes.
- **"Most useful" in hard mode:** of all newly shared unrevealed categories, picks the one with fewest candidates in `category_index`
- Win: guessing the exact secret Pokemon. Loss: hard mode reaching 10 attempts.

## Categories

All 17 categories stored per Pokemon in `pokedex.js`:

| Category | Values |
|---|---|
| Tipo 1 / Tipo 2 | Spanish type names, or "Sin tipo 2" |
| Generación | "Gen 1" … "Gen 9" |
| Color | Spanish color names |
| Forma del cuerpo | Spanish shape names |
| Grupo de huevo 1 / 2 | Spanish egg group names, or "Sin grupo 2" |
| Etapa evolutiva | "Básico", "Etapa 1", "Etapa 2" |
| Legendario | "Normal", "Legendario", "Mítico" |
| Hábitat | Spanish habitat names, or "Desconocido" |
| Especie | Spanish genus from Pokédex (e.g. "Pokémon Ratón") |
| Stat más alta | "PS", "Ataque", "Defensa", "Ataque Esp.", "Defensa Esp.", "Velocidad" |
| Forma alternativa | "Sí" / "No" |
| Starter | "Sí" / "No" — full evo lines hardcoded in `STARTERS` set |
| Bebé | "Sí" / "No" — hardcoded in `BABIES` set + `species.is_baby` |
| Fósil | "Sí" / "No" — hardcoded in `FOSSILS` set |
| Método evolutivo | "Sin preevolución", "Nivel", "Piedra", "Intercambio", "Amistad", "Lugar especial", "Aprender movimiento", "Especial" |

Boolean categories (Forma alternativa, Starter, Bebé, Fósil) render as ✔/✘ in the table.

**Hardcoded exceptions in `build_pokedex.py`:**
- `SPECIAL_EVO_IDS` = {266, 268, 292, 458, 865, 869} — forced to "Especial" because PokeAPI doesn't reflect their true mechanics

## Table rendering

- Secret Pokemon column: shown as black silhouette with blur effect until game ends. Blur starts at 12px and decreases linearly each guess — reaches 0 at attempt 8 (easy) or attempt 10/final (hard). Revealed category cells show the actual value even while still hidden.
- Guessed Pokemon cells: matching categories render identically to the secret column (same badge style, no extra green border). Non-matching show `·`.
- Color values rendered in their actual color via CSS variables `--color-{key}`.
- Type values use `.type-badge.type-{key}` colored spans.

## CSS conventions

- CSS custom properties on `:root` — always use variables, never hardcode colors
- Pokemon body color vars: `--color-black/blue/brown/gray/green/pink/purple/red/white/yellow`
- Boolean category colors: `.bool-yes` (green), `.bool-no` (red)
- Dark theme: blue/red/yellow Pokéball palette
- Fonts: `Press Start 2P` (headers/badges), `Nunito` (body)
- Responsive breakpoint at 600px — on mobile: action-row (Salir/Reiniciar) on top, input-row (badges + input + Adivinar) below, closer to the table
- `.game-controls` uses `display:block` (set via inline style in JS when showing)

## Important notes

- `*.env` files are gitignored — do not commit them
- `pokedex.js` is generated — never hand-edit it
- All user-facing text is in Spanish
- Pokemon names in `pokeDataMap` are lowercase English (as returned by PokeAPI) — never capitalize before lookups
- `capitalize()` is for display only
- Translation maps (`EGG_ES`, `SHAPE_ES`, etc.) are kept in sync between `build_pokedex.py` and `script.js` — if you add a value to one, add it to the other
