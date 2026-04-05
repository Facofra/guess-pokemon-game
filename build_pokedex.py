"""
build_pokedex.py
Genera pokedex.json con los datos de los Pokémon de las generaciones elegidas.
Requiere: pip install requests
Uso:     python build_pokedex.py
"""

import json
import time
import sys
import requests

API = "https://pokeapi.co/api/v2"

# ── Configuración ─────────────────────────────────────────────────────────────
# Editá esta lista para elegir qué generaciones incluir.
# Generaciones disponibles: 1 al 9
GENERATIONS = [1, 2, 3]

# ── Traducciones ──────────────────────────────────────────────────────────────

SHAPE_ES = {
    "ball": "Esférico", "squiggle": "Sinuoso", "fish": "Pez",
    "arms": "Con brazos", "blob": "Amorfo", "upright": "Erguido",
    "legs": "Solo piernas", "quadruped": "Cuadrúpedo", "wings": "Con alas",
    "tentacles": "Tentáculos", "heads": "Cabezas", "humanoid": "Humanoide",
    "bug-wings": "Insecto alado", "armor": "Armadura",
}

HABITAT_ES = {
    "cave": "Cueva", "forest": "Bosque", "grassland": "Pradera",
    "mountain": "Montaña", "rare": "Raro", "rough-terrain": "Terreno accidentado",
    "sea": "Mar", "urban": "Ciudad", "waters-edge": "Orilla del agua",
}

EGG_ES = {
    "monster": "Monstruo", "water1": "Agua 1", "water2": "Agua 2",
    "water3": "Agua 3", "bug": "Bicho", "flying": "Volador",
    "field": "Tierra", "fairy": "Hada", "plant": "Planta",
    "humanshape": "Humanoide", "mineral": "Mineral",
    "indeterminate": "Amorfo", "ditto": "Ditto", "dragon": "Dragón",
    "no-eggs": "Sin huevos",
}

TYPE_ES = {
    "normal": "Normal", "fire": "Fuego", "water": "Agua",
    "electric": "Eléctrico", "grass": "Planta", "ice": "Hielo",
    "fighting": "Lucha", "poison": "Veneno", "ground": "Tierra",
    "flying": "Volador", "psychic": "Psíquico", "bug": "Bicho",
    "rock": "Roca", "ghost": "Fantasma", "dragon": "Dragón",
    "dark": "Siniestro", "steel": "Acero", "fairy": "Hada",
}

COLOR_ES = {
    "black": "Negro", "blue": "Azul", "brown": "Marrón",
    "gray": "Gris", "green": "Verde", "pink": "Rosa",
    "purple": "Morado", "red": "Rojo", "white": "Blanco",
    "yellow": "Amarillo",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def get(url, retries=3):
    for attempt in range(retries):
        try:
            r = requests.get(url, timeout=15)
            r.raise_for_status()
            return r.json()
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise

# Rango de IDs nacionales por generación (primer ID, último ID inclusivo)
GEN_RANGES = {
    1: (1,   151),
    2: (152, 251),
    3: (252, 386),
    4: (387, 493),
    5: (494, 649),
    6: (650, 721),
    7: (722, 809),
    8: (810, 905),
    9: (906, 1025),
}

def gen_from_id(pid):
    for gen, (start, end) in GEN_RANGES.items():
        if start <= pid <= end:
            return f"Gen {gen}"
    return "?"

def ids_for_generations(gens):
    ids = []
    for gen in sorted(gens):
        if gen not in GEN_RANGES:
            print(f"Advertencia: Gen {gen} no reconocida, ignorada.")
            continue
        start, end = GEN_RANGES[gen]
        ids.extend(range(start, end + 1))
    return ids

def evolution_stage(chain, target_name):
    """Returns 'Básico', 'Etapa 1' or 'Etapa 2'."""
    if chain["species"]["name"] == target_name:
        return "Básico"
    for evo1 in chain.get("evolves_to", []):
        if evo1["species"]["name"] == target_name:
            return "Etapa 1"
        for evo2 in evo1.get("evolves_to", []):
            if evo2["species"]["name"] == target_name:
                return "Etapa 2"
    return "Básico"

def capitalize(s):
    return s[0].upper() + s[1:] if s else "?"

# ── Main ──────────────────────────────────────────────────────────────────────

def build_pokedex():
    evo_cache = {}   # url → chain data
    pokemon_list = []

    all_ids = ids_for_generations(GENERATIONS)
    total = len(all_ids)
    print(f"Generaciones: {sorted(GENERATIONS)} → {total} Pokémon (IDs: {all_ids[0]}-{all_ids[-1]})")

    for i, pid in enumerate(all_ids, 1):
        print(f"\r[{i}/{total}] Fetching #{pid}...", end="", flush=True)

        poke    = get(f"{API}/pokemon/{pid}")
        species = get(f"{API}/pokemon-species/{pid}")

        # Evolution chain (cached per URL)
        evo_url = species["evolution_chain"]["url"]
        if evo_url not in evo_cache:
            evo_data = get(evo_url)
            evo_cache[evo_url] = evo_data
        chain = evo_cache[evo_url]["chain"]
        stage = evolution_stage(chain, poke["name"])

        types = [t["type"]["name"] for t in poke["types"]]
        egg_groups = [g["name"] for g in species["egg_groups"]]

        legend = "Normal"
        if species["is_legendary"]: legend = "Legendario"
        if species["is_mythical"]:  legend = "Mítico"

        color_key = species.get("color", {}).get("name", "")
        shape_key = species.get("shape", {}).get("name", "")
        habitat_key = (species.get("habitat") or {}).get("name", "")

        entry = {
            "id":     pid,
            "name":   poke["name"],
            "sprite": f"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{pid}.png",
            "categories": {
                "Tipo 1":           TYPE_ES.get(types[0], capitalize(types[0])) if types else "?",
                "Tipo 2":           TYPE_ES.get(types[1], capitalize(types[1])) if len(types) > 1 else "Sin tipo 2",
                "Generación":       gen_from_id(pid),
                "Color":            COLOR_ES.get(color_key, capitalize(color_key)) if color_key else "?",
                "Forma del cuerpo": SHAPE_ES.get(shape_key, capitalize(shape_key)) if shape_key else "?",
                "Grupo de huevo 1": EGG_ES.get(egg_groups[0], capitalize(egg_groups[0])) if egg_groups else "?",
                "Grupo de huevo 2": EGG_ES.get(egg_groups[1], capitalize(egg_groups[1])) if len(egg_groups) > 1 else "Sin grupo 2",
                "Etapa evolutiva":  stage,
                "Legendario/Mítico": legend,
                "Hábitat":          HABITAT_ES.get(habitat_key, capitalize(habitat_key)) if habitat_key else "Desconocido",
            }
        }
        pokemon_list.append(entry)

    print(f"\nFetched {len(pokemon_list)} Pokémon. Building index...")

    # ── Build category index: category → value → [names] ──────────────────────
    category_index = {}
    for entry in pokemon_list:
        for cat, val in entry["categories"].items():
            if cat not in category_index:
                category_index[cat] = {}
            if val not in category_index[cat]:
                category_index[cat][val] = []
            category_index[cat][val].append(entry["name"])

    # ── Output como .js (compatible con file:// y GitHub Pages) ──────────────
    output = {
        "pokemon":        pokemon_list,
        "category_index": category_index,
    }

    out_path = "pokedex.js"
    payload  = json.dumps(output, ensure_ascii=False, separators=(",", ":"))
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(f"const POKEDEX_DATA = {payload};")

    size_kb = len(payload) / 1024
    print(f"Done! Written to {out_path} ({size_kb:.1f} KB)")
    print(f"Category values per category:")
    for cat, vals in category_index.items():
        print(f"  {cat}: {sorted(vals.keys())}")


if __name__ == "__main__":
    build_pokedex()
