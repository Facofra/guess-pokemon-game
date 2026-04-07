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
# GENERATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9]
GENERATIONS = [1]

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
    "ground": "Tierra",
}

TYPE_ES = {
    "normal": "Normal", "fire": "Fuego", "water": "Agua",
    "electric": "Eléctrico", "grass": "Planta", "ice": "Hielo",
    "fighting": "Lucha", "poison": "Veneno", "ground": "Tierra",
    "flying": "Volador", "psychic": "Psíquico", "bug": "Bicho",
    "rock": "Roca", "ghost": "Fantasma", "dragon": "Dragón",
    "dark": "Siniestro", "steel": "Acero", "fairy": "Hada",
}

GROWTH_RATE_ES = {
    "slow":                 "Lenta",
    "medium":               "Media",
    "fast":                 "Rápida",
    "medium-slow":          "Media-Lenta",
    "slow-then-very-fast":  "Errática",
    "fast-then-very-slow":  "Fluctuante",
}

COLOR_ES = {
    "black": "Negro", "blue": "Azul", "brown": "Marrón",
    "gray": "Gris", "green": "Verde", "pink": "Rosa",
    "purple": "Morado", "red": "Rojo", "white": "Blanco",
    "yellow": "Amarillo",
}

STAT_ES = {
    "hp": "PS", "attack": "Ataque", "defense": "Defensa",
    "special-attack": "Ataque Esp.", "special-defense": "Defensa Esp.",
    "speed": "Velocidad",
}

# IDs hardcodeados por categoría especial
STARTERS = {
    1, 2, 3,          # Bulbasaur line
    4, 5, 6,          # Charmander line
    7, 8, 9,          # Squirtle line
    152, 153, 154,    # Chikorita line
    155, 156, 157,    # Cyndaquil line
    158, 159, 160,    # Totodile line
    252, 253, 254,    # Treecko line
    255, 256, 257,    # Torchic line
    258, 259, 260,    # Mudkip line
    387, 388, 389,    # Turtwig line
    390, 391, 392,    # Chimchar line
    393, 394, 395,    # Piplup line
    495, 496, 497,    # Snivy line
    498, 499, 500,    # Tepig line
    501, 502, 503,    # Oshawott line
    650, 651, 652,    # Chespin line
    653, 654, 655,    # Fennekin line
    656, 657, 658,    # Froakie line
    722, 723, 724,    # Rowlet line
    725, 726, 727,    # Litten line
    728, 729, 730,    # Popplio line
    810, 811, 812,    # Grookey line
    813, 814, 815,    # Scorbunny line
    816, 817, 818,    # Sobble line
    906, 907, 908,    # Sprigatito line
    909, 910, 911,    # Fuecoco line
    912, 913, 914,    # Quaxly line
}

FOSSILS = {
    138, 139, 140, 141, 142,          # Gen 1
    345, 346, 347, 348,               # Gen 3
    408, 409, 410, 411,               # Gen 4
    564, 565, 566, 567,               # Gen 5
    696, 697, 698, 699,               # Gen 6
    880, 881, 882, 883,               # Gen 8
}

BABIES = {
    172, 173, 174, 175, 236, 238, 239, 240, 298, 360,   # Gen 2-3
    406, 433, 438, 439, 440, 446, 447, 458,              # Gen 4
    848,                                                  # Gen 8
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

def get_genus_es(species):
    """Devuelve el género del Pokémon en español (ej: 'Pokémon Ratón')."""
    for entry in species.get("genera", []):
        if entry["language"]["name"] == "es":
            return entry["genus"]
    # Fallback a inglés si no hay traducción
    for entry in species.get("genera", []):
        if entry["language"]["name"] == "en":
            return entry["genus"]
    return "?"

def get_highest_stat(poke):
    """Devuelve el nombre en español de la stat base más alta."""
    stats = {s["stat"]["name"]: s["base_stat"] for s in poke["stats"]}
    best = max(stats, key=stats.get)
    return STAT_ES.get(best, best)

def has_alternative_forms(species):
    """True si el Pokémon tiene más de una variedad (formas alternas/regionales)."""
    return len(species.get("varieties", [])) > 1

def has_mega(species):
    """True si el Pokémon tiene una mega evolución."""
    return any("mega" in v["pokemon"]["name"] for v in species.get("varieties", []))

# Pokémon cuya evolución es especial pero la API no lo refleja correctamente
SPECIAL_EVO_IDS = {
    266,  # Silcoon   — personalidad (gen 3)
    268,  # Cascoon   — personalidad (gen 3)
    292,  # Shedinja  — aparece al evolucionar Nincada con espacio en equipo
    458,  # Mantyke   — necesita Remoraid en el equipo (party_species)
    865,  # Sirfetch'd — tres golpes críticos en una batalla
    869,  # Alcremie  — giro de joystick + hora del día
}

def classify_single_detail(d):
    """
    Clasifica un único evolution_detail en una de las categorías posibles.
    Retorna un string con el método.
    """
    trigger = (d.get("trigger") or {}).get("name", "")

    if trigger == "trade":
        return "Intercambio"

    if trigger == "use-item":
        item_name = (d.get("item") or {}).get("name", "") or ""
        if item_name.endswith("-stone"):
            return "Piedra"
        return "Especial"

    if trigger == "shed":
        # Shedinja — pero ya está en SPECIAL_EVO_IDS, por si acaso
        return "Especial"

    if trigger == "level-up":
        # Condiciones especiales que no encajan en categorías simples
        special_flags = [
            d.get("min_beauty"),
            d.get("min_affection"),
            d.get("min_damage_taken"),
            d.get("min_steps"),
            d.get("min_move_count"),
            d.get("relative_physical_stats") is not None and d.get("relative_physical_stats") != "",
            d.get("needs_overworld_rain"),
            d.get("turn_upside_down"),
            d.get("party_species"),
            d.get("party_type"),
        ]
        # Condiciones que sí tienen categoría propia
        if d.get("min_happiness"):
            return "Amistad"
        if d.get("location"):
            return "Lugar especial"
        if d.get("known_move") or d.get("known_move_type"):
            return "Aprender movimiento"
        # Si cualquier flag especial está activo, es Especial
        if any(special_flags):
            return "Especial"
        return "Nivel"

    # Cualquier otro trigger (spin, three-critical-hits, etc.)
    return "Especial"


def get_evo_methods(chain, target_name, pid):
    """
    Devuelve una lista de métodos evolutivos únicos por los que el Pokémon
    puede llegar a su forma actual. Lista porque algunos tienen múltiples
    caminos (ej: Glaceon por piedra o por lugar especial).
    """
    # Excepciones hardcodeadas: la API no refleja correctamente su mecanismo
    if pid in SPECIAL_EVO_IDS:
        return ["Especial"]

    # Busca recursivamente el nodo del target
    def find_node(node, target):
        for evo in node.get("evolves_to", []):
            if evo["species"]["name"] == target:
                return evo
            result = find_node(evo, target)
            if result is not None:
                return result
        return None

    # Si es forma base, no tiene preevolución
    if chain["species"]["name"] == target_name:
        return ["Sin preevolución"]

    node = find_node(chain, target_name)
    if not node:
        return ["Sin preevolución"]

    details_list = node.get("evolution_details", [])
    if not details_list:
        return ["Sin preevolución"]

    # Clasificar cada detail y deduplicar manteniendo orden
    methods = []
    seen = set()
    for d in details_list:
        m = classify_single_detail(d)
        if m not in seen:
            seen.add(m)
            methods.append(m)

    return methods if methods else ["Especial"]

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
                "Tipo 1":             TYPE_ES.get(types[0], capitalize(types[0])) if types else "?",
                "Tipo 2":             TYPE_ES.get(types[1], capitalize(types[1])) if len(types) > 1 else "Sin tipo 2",
                "Generación":         gen_from_id(pid),
                "Color":              COLOR_ES.get(color_key, capitalize(color_key)) if color_key else "?",
                "Forma del cuerpo":   SHAPE_ES.get(shape_key, capitalize(shape_key)) if shape_key else "?",
                "Grupo de huevo 1":   EGG_ES.get(egg_groups[0], capitalize(egg_groups[0])) if egg_groups else "?",
                "Grupo de huevo 2":   EGG_ES.get(egg_groups[1], capitalize(egg_groups[1])) if len(egg_groups) > 1 else "Sin grupo 2",
                "Etapa evolutiva":    stage,
                "Legendario/Mítico":  legend,
                "Hábitat":            HABITAT_ES.get(habitat_key, capitalize(habitat_key)) if habitat_key else "Desconocido",
                "Especie":            get_genus_es(species),
                "Stat más alta":      get_highest_stat(poke),
                "Forma alternativa":  "Sí" if has_alternative_forms(species) else "No",
                "Starter":            "Sí" if pid in STARTERS else "No",
                "Bebé":               "Sí" if pid in BABIES or species.get("is_baby") else "No",
                "Fósil":              "Sí" if pid in FOSSILS else "No",
                "Mega":               "Sí" if has_mega(species) else "No",
                "Curva de experiencia": GROWTH_RATE_ES.get(species.get("growth_rate", {}).get("name", ""), capitalize(species.get("growth_rate", {}).get("name", "?"))),
                "Método evolutivo":   get_evo_methods(chain, poke["name"], pid),
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
            # val puede ser string o lista (ej: Método evolutivo)
            values = val if isinstance(val, list) else [val]
            for v in values:
                if v not in category_index[cat]:
                    category_index[cat][v] = []
                category_index[cat][v].append(entry["name"])

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
