// ──────────────────────────────────────────────
//  POKÉMON GUESSING GAME  –  script.js
// ──────────────────────────────────────────────
const IS_LOCAL = window.location.protocol === 'file:'

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
// pokedex.js debe cargarse antes que script.js en index.html
// y expone la variable global POKEDEX_DATA

// IDs se derivan de pokedex.json al cargar
let ALL_IDS = [];

// ──────────────────────────────────────────────
//  DATA (loaded from pokedex.json)
// ──────────────────────────────────────────────
let   pokeList  = [];        // [ { id, name } ]   populated on load
let   pokeDataMap = {};      // name/id → processed data
let   categoryIndex = {};    // category → value → [names]

// ──────────────────────────────────────────────
//  CATEGORY DEFINITIONS  (metadata only)
// ──────────────────────────────────────────────
const CATEGORY_META = {
    'Tipo 1': {
        desc: 'El tipo principal del Pokémon (primer tipo de la lista).',
        example: 'Charmander → Fuego · Bulbasaur → Planta'
    },
    'Tipo 2': {
        desc: 'El segundo tipo del Pokémon. Si no tiene segundo tipo, se considera "Sin tipo 2".',
        example: 'Gyarados → Volador · Mewtwo → Sin tipo 2'
    },
    'Generación': {
        desc: 'La generación en la que fue introducido el Pokémon.',
        example: null, // se genera dinámicamente al cargar el JSON
    },
    'Color': {
        desc: 'El color principal del Pokémon según la Pokédex.',
        example: 'Charmander → Rojo · Bulbasaur → Verde · Pikachu → Amarillo'
    },
    'Forma del cuerpo': {
        desc: 'La forma general del cuerpo del Pokémon (bípedo, cuadrúpedo, serpentino, etc.).',
        example: 'Charizard → Con alas · Arcanine → Cuadrúpedo'
    },
    'Grupo de huevo 1': {
        desc: 'El grupo de huevo principal. Determina con qué Pokémon puede reproducirse.',
        example: 'Charizard → Dragón · Pikachu → Tierra · Snorlax → Monstruo'
    },
    'Grupo de huevo 2': {
        desc: 'El segundo grupo de huevo, si el Pokémon tiene dos. Si no tiene, se considera "Sin grupo 2".',
        example: 'Bulbasaur → Monstruo / Planta · Squirtle → Solo Water 1'
    },
    'Etapa evolutiva': {
        desc: 'La posición en la cadena de evolución: Básico (no evoluciona de ningún otro), Etapa 1 (primera evolución), Etapa 2 (segunda evolución).',
        example: 'Bulbasaur → Básico · Ivysaur → Etapa 1 · Venusaur → Etapa 2'
    },
    'Legendario/Mítico': {
        desc: 'Indica si el Pokémon es legendario, mítico o ninguno de los dos.',
        example: 'Mewtwo → Legendario · Mew → Mítico · Charizard → Normal'
    },
    'Hábitat': {
        desc: 'El hábitat natural del Pokémon según la Pokédex. Algunos Pokémon no tienen hábitat definido.',
        example: 'Squirtle → Agua · Geodude → Montaña · Eevee → Ciudad'
    },
    'Especie': {
        desc: 'La categoría de especie del Pokémon según la Pokédex.',
        example: 'Pikachu → Pokémon Ratón · Charizard → Pokémon Llama'
    },
    'Stat más alta': {
        desc: 'La estadística base más alta del Pokémon.',
        example: 'Alakazam → Ataque Esp. · Machamp → Ataque · Snorlax → PS'
    },
    'Forma alternativa': {
        desc: 'Indica si el Pokémon tiene formas alternativas o variantes regionales.',
        example: 'Meowth → Sí (forma de Galar) · Pikachu → Sí · Rattata → No'
    },
    'Starter': {
        desc: 'Indica si el Pokémon es uno de los Pokémon iniciales que se pueden elegir al comenzar el juego.',
        example: 'Bulbasaur → Sí · Charmander → Sí · Pidgey → No'
    },
    'Bebé': {
        desc: 'Indica si el Pokémon es una forma bebé que se obtiene mediante cría.',
        example: 'Pichu → Sí · Cleffa → Sí · Pikachu → No'
    },
    'Fósil': {
        desc: 'Indica si el Pokémon se obtiene a partir de un fósil.',
        example: 'Kabuto → Sí · Aerodactyl → Sí · Squirtle → No'
    },
    'Método evolutivo': {
        desc: 'Cómo llegó el Pokémon a su forma actual. Sin preevolución si es forma base.',
        example: 'Pikachu → Amistad · Charizard → Nivel · Gengar → Intercambio · Vaporeon → Piedra'
    },
};

// Nombre en español para formas de cuerpo
const SHAPE_ES = {
    'ball': 'Esférico',
    'squiggle': 'Sinuoso',
    'fish': 'Pez',
    'arms': 'Con brazos',
    'blob': 'Amorfo',
    'upright': 'Erguido',
    'legs': 'Solo piernas',
    'quadruped': 'Cuadrúpedo',
    'wings': 'Con alas',
    'tentacles': 'Tentáculos',
    'heads': 'Cabezas',
    'humanoid': 'Humanoide',
    'bug-wings': 'Insecto alado',
    'armor': 'Armadura',
};

// Nombre en español para hábitats
const HABITAT_ES = {
    'cave': 'Cueva',
    'forest': 'Bosque',
    'grassland': 'Pradera',
    'mountain': 'Montaña',
    'rare': 'Raro',
    'rough-terrain': 'Terreno accidentado',
    'sea': 'Mar',
    'urban': 'Ciudad',
    'waters-edge': 'Orilla del agua',
};

// Nombre en español para grupos de huevo
const EGG_ES = {
    'monster': 'Monstruo',
    'water1': 'Agua 1',
    'water2': 'Agua 2',
    'water3': 'Agua 3',
    'bug': 'Bicho',
    'flying': 'Volador',
    'field': 'Tierra',
    'fairy': 'Hada',
    'plant': 'Planta',
    'humanshape': 'Humanoide',
    'mineral': 'Mineral',
    'indeterminate': 'Amorfo',
    'ditto': 'Ditto',
    'dragon': 'Dragón',
    'no-eggs': 'Sin huevos',
    'ground': 'Tierra',
};

// Tipos en español
const TYPE_ES = {
    'normal':'Normal','fire':'Fuego','water':'Agua','electric':'Eléctrico',
    'grass':'Planta','ice':'Hielo','fighting':'Lucha','poison':'Veneno',
    'ground':'Tierra','flying':'Volador','psychic':'Psíquico','bug':'Bicho',
    'rock':'Roca','ghost':'Fantasma','dragon':'Dragón','dark':'Siniestro',
    'steel':'Acero','fairy':'Hada'
};

const COLOR_ES = {
    'black':'Negro','blue':'Azul','brown':'Marrón','gray':'Gris',
    'green':'Verde','pink':'Rosa','purple':'Morado','red':'Rojo',
    'white':'Blanco','yellow':'Amarillo'
};

// ──────────────────────────────────────────────
//  LOAD FROM JSON
// ──────────────────────────────────────────────
function loadPokedex() {
    if (typeof POKEDEX_DATA === 'undefined') {
        throw new Error('pokedex.js no está cargado. Ejecutá build_pokedex.py primero.');
    }
    const data = POKEDEX_DATA;

    categoryIndex = data.category_index;

    for (const entry of data.pokemon) {
        pokeDataMap[entry.name]          = entry;
        pokeDataMap[String(entry.id)]    = entry;
    }
    pokeList = data.pokemon.map(p => ({ id: p.id, name: p.name }));
    ALL_IDS  = data.pokemon.map(p => p.id);

    // Genera el ejemplo dinámico de Generación para el glosario
    // y construye los botones de selección de gen
    const genGroups = {};
    for (const p of data.pokemon) {
        const gen = p.categories['Generación'];
        if (!genGroups[gen]) genGroups[gen] = { min: p.id, max: p.id };
        else { genGroups[gen].min = Math.min(genGroups[gen].min, p.id); genGroups[gen].max = Math.max(genGroups[gen].max, p.id); }
    }
    CATEGORY_META['Generación'].example = Object.entries(genGroups)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([gen, { min, max }]) => `${gen}: #${min}-${max}`)
        .join(' · ');

    // Botones de gen — activas por defecto: Gen 1, Gen 2, Gen 3
    const DEFAULT_GENS = new Set(['Gen 1', 'Gen 2', 'Gen 3']);
    const genBtnsContainer = document.getElementById('genButtons');
    const sortedGens = Object.keys(genGroups).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    genBtnsContainer.innerHTML = sortedGens.map(gen => {
        const active = DEFAULT_GENS.has(gen) ? ' active' : '';
        return `<button class="gen-btn${active}" data-gen="${gen}">${gen}</button>`;
    }).join('');
    genBtnsContainer.querySelectorAll('.gen-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('active');
            document.getElementById('genError').style.display = 'none';
        });
    });
}

function getPokemonData(idOrName) {
    return pokeDataMap[String(idOrName).toLowerCase()] || pokeDataMap[String(idOrName)] || null;
}

function capitalize(str) {
    if (!str) return '?';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// ──────────────────────────────────────────────
//  GAME CLASS
// ──────────────────────────────────────────────
class PokemonGame {
    constructor() {
        this.difficulty      = null;
        this.maxAttempts     = 0;
        this.gameState       = 'selecting'; // selecting | playing | won | lost
        this.secretPokemon   = null;        // processed data object
        this.guessedList     = [];          // [{ data, categories }] in order
        this.revealedCategories = [];       // category names shown so far
        this.pinnedTooltip   = null;
        this.attemptCount    = 0;
        this.selectedAutoIdx = -1;

        this.initListeners();
        this.preload();
    }

    // ── PRE-LOAD ────────────────────────────────
    async preload() {
        const loading = document.getElementById('loadingScreen');
        const diffSel = document.getElementById('difficultySelection');
        const desc    = document.querySelector('.game-description');
        loading.style.display = 'block';
        diffSel.style.display = 'none';
        desc.style.display    = 'none';
        try {
            loadPokedex();
        } catch(e) {
            console.error('Error loading pokedex.json', e);
        }
        this.initGlossary();
        loading.style.display = 'none';
        diffSel.style.display = 'block';
        desc.style.display    = 'block';
    }

    // ── GLOSSARY ────────────────────────────────
    initGlossary() {
        const btn   = document.getElementById('glossaryBtn');
        const modal = document.getElementById('glossaryModal');
        const close = document.querySelector('.glossary-close');

        btn.addEventListener('click', e => { e.stopPropagation(); modal.classList.toggle('show'); });
        close.addEventListener('click', () => modal.classList.remove('show'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('show'); });

        const body = document.getElementById('glossaryBody');
        let html = '';
        for (const [name, meta] of Object.entries(CATEGORY_META)) {
            html += `<div class="glossary-category">
                <div class="glossary-category-title">${name}</div>
                <div class="glossary-category-desc">${meta.desc}</div>
                <div class="glossary-category-values"><strong>Ejemplo:</strong> ${meta.example}</div>
            </div>`;
        }
        body.innerHTML = html;
    }

    // ── EVENT LISTENERS ─────────────────────────
    initListeners() {
        document.getElementById('startGameBtn') .addEventListener('click', () => this.startGame());
        document.getElementById('stopBtn')      .addEventListener('click', () => this.stopGame());
        document.getElementById('surrenderBtn') .addEventListener('click', () => this.surrender());
        document.getElementById('restartBtn')   .addEventListener('click', () => this.restartGame());
        document.getElementById('guessBtn')     .addEventListener('click', () => this.makeGuess());
        if (IS_LOCAL) {
            document.getElementById('debugWrapper').style.display = 'flex';
            document.getElementById('debugCloseBtn').addEventListener('click', () => {
                document.getElementById('debugWrapper').style.display = 'none';
            });
        }

        const input = document.getElementById('pokemonInput');
        input.addEventListener('input',   () => this.onInput());
        input.addEventListener('focus',   () => this.onInput());
        input.addEventListener('click',   () => this.onInput());
        input.addEventListener('keydown', e  => this.onKeyDown(e));

        document.addEventListener('click', e => {
            if (!e.target.closest('.autocomplete-wrapper')) {
                this.hideAutocomplete();
            }
        });

        // Difficulty option click
        document.querySelectorAll('.difficulty-option').forEach(opt => {
            opt.addEventListener('click', () => {
                const radio = opt.querySelector('input[type=radio]');
                if (radio) radio.checked = true;
            });
        });
    }

    // ── AUTOCOMPLETE ────────────────────────────
    onInput() {
        const val = document.getElementById('pokemonInput').value.trim().toLowerCase();

        const guessed = new Set(this.guessedList.map(g => g.data.name));
        const activeSet = new Set(this.activeIds || ALL_IDS);
        const matches = pokeList
            .filter(p => activeSet.has(p.id) && !guessed.has(p.name) && (!val || p.name.startsWith(val) || p.name.includes(val) || String(p.id).startsWith(val)));

        if (!matches.length) { this.hideAutocomplete(); return; }

        this.selectedAutoIdx = -1;
        const list = document.getElementById('autocompleteList');
        list.innerHTML = matches.map((p, i) =>
            `<div class="autocomplete-item" data-name="${p.name}" data-idx="${i}">
                <span class="item-num">#${String(p.id).padStart(3,'0')}</span>
                <img src="${SPRITE_BASE}${p.id}.png" alt="" loading="lazy" onerror="this.style.display='none'">
                <span>${capitalize(p.name)}</span>
            </div>`
        ).join('');
        list.classList.add('show');

        list.querySelectorAll('.autocomplete-item').forEach(el => {
            el.addEventListener('mousedown', e => {
                e.preventDefault();
                document.getElementById('pokemonInput').value = el.dataset.name;
                this.hideAutocomplete();
                this.makeGuess();
            });
        });
    }

    onKeyDown(e) {
        const list  = document.getElementById('autocompleteList');
        const items = list.querySelectorAll('.autocomplete-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (!list.classList.contains('show')) { this.onInput(); return; }
            this.selectedAutoIdx = Math.min(this.selectedAutoIdx + 1, items.length - 1);
            this.highlightAuto(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            this.selectedAutoIdx = Math.max(this.selectedAutoIdx - 1, -1);
            this.highlightAuto(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (this.selectedAutoIdx >= 0 && items[this.selectedAutoIdx]) {
                document.getElementById('pokemonInput').value = items[this.selectedAutoIdx].dataset.name;
                this.hideAutocomplete();
            }
            this.makeGuess();
        } else if (e.key === 'Escape') {
            this.hideAutocomplete();
        }
    }

    highlightAuto(items) {
        items.forEach((el, i) => el.classList.toggle('selected', i === this.selectedAutoIdx));
        if (items[this.selectedAutoIdx]) {
            document.getElementById('pokemonInput').value = items[this.selectedAutoIdx].dataset.name;
            items[this.selectedAutoIdx].scrollIntoView({ block: 'nearest' });
        }
    }

    hideAutocomplete() {
        document.getElementById('autocompleteList').classList.remove('show');
        document.getElementById('autocompleteList').innerHTML = '';
        this.selectedAutoIdx = -1;
    }

    // ── GAME FLOW ───────────────────────────────
    async startGame() {
        // Validar generaciones seleccionadas
        const selectedGens = new Set(
            [...document.querySelectorAll('.gen-btn.active')].map(b => b.dataset.gen)
        );
        if (selectedGens.size === 0) {
            document.getElementById('genError').style.display = 'block';
            return;
        }

        const diff = document.querySelector('input[name="difficulty"]:checked')?.value || 'easy';
        this.difficulty  = diff;
        this.maxAttempts = diff === 'hard' ? 10 : 0;
        this.gameState   = 'playing';
        this.attemptCount = 0;
        this.guessedList = [];
        this.revealedCategories = [];
        this.activeIds = ALL_IDS.filter(id => {
            const p = getPokemonData(id);
            return p && selectedGens.has(p.categories['Generación']);
        });

        // Índice filtrado por generaciones activas — usado para candidateCount real
        this.activeCategoryIndex = {};
        for (const id of this.activeIds) {
            const p = getPokemonData(id);
            if (!p) continue;
            for (const [cat, val] of Object.entries(p.categories)) {
                if (!this.activeCategoryIndex[cat]) this.activeCategoryIndex[cat] = {};
                const vals = Array.isArray(val) ? val : [val];
                for (const v of vals) {
                    if (!this.activeCategoryIndex[cat][v]) this.activeCategoryIndex[cat][v] = [];
                    this.activeCategoryIndex[cat][v].push(p.name);
                }
            }
        }

        document.getElementById('difficultySelection').style.display = 'none';
        document.querySelector('.game-description').style.display    = 'none';
        document.getElementById('gameControls').style.display        = 'block';
        document.getElementById('matrixContainer').style.display     = 'block';
        document.getElementById('loadingScreen').style.display       = 'block';
        document.getElementById('matrixContainer').innerHTML         = '';

        try {
            // Pick secret Pokémon — debug override if IS_LOCAL and ID provided
            let id;
            if (IS_LOCAL) {
                const debugVal = document.getElementById('debugIdInput')?.value.trim();
                if (debugVal) {
                    const debugId = parseInt(debugVal, 10);
                    id = this.activeIds.includes(debugId) ? debugId : null;
                    if (!id) this.showMsg(`ID ${debugId} no está en las generaciones seleccionadas.`, 'warning');
                }
            }
            if (!id) id = this.activeIds[Math.floor(Math.random() * this.activeIds.length)];
            this.secretPokemon = getPokemonData(id);
            if (!this.secretPokemon) throw new Error(`No data for id ${id}`);
        } catch(e) {
            this.showMsg('Error cargando el Pokémon secreto. Reintentando...', 'warning');
            document.getElementById('loadingScreen').style.display = 'none';
            return;
        }

        document.getElementById('loadingScreen').style.display = 'none';
        this.updateCounter();
        this.updateDiffBadge();
        this.updateStatusBadge();
        this.renderMatrix();
        document.getElementById('surrenderBtn').style.visibility = 'hidden';
        this.showMsg('¡Juego iniciado! ¿Quién es ese Pokémon?', 'info');
    }

    stopGame() {
        this.gameState = 'selecting';
        this.secretPokemon = null;
        this.guessedList   = [];
        this.revealedCategories = [];
        this.attemptCount  = 0;

        this.removeGameTooltips();

        document.getElementById('difficultySelection').style.display = 'block';
        document.querySelector('.game-description').style.display    = 'block';
        document.getElementById('gameControls').style.display        = 'none';
        document.getElementById('matrixContainer').style.display     = 'none';
        document.getElementById('pokemonInput').value = '';
        document.getElementById('message').className  = 'message message-hidden';
        document.getElementById('message').innerHTML  = '&nbsp;';
    }

    restartGame() {
        const prev = this.difficulty;
        this.stopGame();
        // Re-set difficulty and start
        if (prev) {
            document.querySelector(`input[value="${prev}"]`).checked = true;
        }
        this.startGame();
    }

    surrender() {
        if (this.gameState !== 'playing') return;
        this.gameState = 'lost';
        this.updateStatusBadge();
        this.renderMatrix();
        this.showMsg(`🏳 Te rendiste. Era ${capitalize(this.secretPokemon.name)}.`, 'warning', false);
    }

    // ── GUESS ───────────────────────────────────
    makeGuess() {
        if (this.gameState !== 'playing') {
            this.showMsg('El juego no está activo.', 'warning'); return;
        }

        const input   = document.getElementById('pokemonInput');
        const rawName = input.value.trim().toLowerCase();
        if (!rawName) { this.showMsg('Escribe el nombre de un Pokémon.', 'warning'); return; }

        const activeSet = new Set(this.activeIds);
        const entry = pokeList.find(p => p.name === rawName && activeSet.has(p.id));
        if (!entry) { this.showMsg(`"${rawName}" no es un Pokémon válido de las generaciones seleccionadas.`, 'warning'); return; }

        if (this.guessedList.some(g => g.data.name === rawName)) {
            this.showMsg(`Ya intentaste con ${capitalize(rawName)}.`, 'warning'); return;
        }

        const guessData = getPokemonData(rawName);
        if (!guessData) {
            this.showMsg('Error cargando datos. Intentá de nuevo.', 'warning');
            return;
        }

        this.attemptCount++;
        this.updateCounter();
        input.value = '';
        this.hideAutocomplete();
        document.getElementById('surrenderBtn').style.visibility = 'visible';

        // Victory?
        if (guessData.id === this.secretPokemon.id) {
            this.guessedList.push({ data: guessData, isSecret: false });
            this.addNewCategories(guessData);
            this.gameState = 'won';
            this.updateStatusBadge();
            this.renderMatrix();
            this.showVictoryBanner();
            this.showMsg(`🎉 ¡Correcto! Era ${capitalize(this.secretPokemon.name)}!`, 'success', false);
            return;
        }

        // Defeat?
        if (this.difficulty === 'hard' && this.attemptCount >= this.maxAttempts) {
            this.guessedList.push({ data: guessData });
            this.addNewCategories(guessData);
            this.gameState = 'lost';
            this.updateStatusBadge();
            this.renderMatrix();
            this.showMsg(`😞 ¡Perdiste! El Pokémon secreto era ${capitalize(this.secretPokemon.name)}.`, 'warning', false);
            return;
        }

        // Normal guess
        const newCats = this.getSharedCategories(guessData);
        if (newCats.length === 0) {
            this.showMsg(`${capitalize(guessData.name)} no comparte ninguna categoría nueva.`, 'info');
        }
        this.guessedList.push({ data: guessData });
        this.addNewCategories(guessData);
        this.renderMatrix();
        const inputRow = document.querySelector('.input-row');
        if (inputRow) {
            const top = inputRow.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }

    // ── CATEGORY LOGIC ──────────────────────────
    getSharedCategories(guessData) {
        const shared = [];
        for (const cat of Object.keys(CATEGORY_META)) {
            // Si el secreto no tiene preevolución, omitir Método evolutivo
            // (ya está cubierto por Etapa evolutiva = "Básico")
            if (cat === 'Método evolutivo') {
                const sVal = this.secretPokemon.categories[cat];
                const sArr = Array.isArray(sVal) ? sVal : [sVal];
                if (sArr.includes('Sin preevolución')) continue;
            }
            const gVal = guessData.categories[cat];
            const sVal = this.secretPokemon.categories[cat];
            // Soporta listas (ej: Método evolutivo) — coincide si hay intersección
            const gArr = Array.isArray(gVal) ? gVal : [gVal];
            const sArr = Array.isArray(sVal) ? sVal : [sVal];
            if (gArr.some(v => sArr.includes(v))) {
                shared.push(cat);
            }
        }
        return shared;
    }

    addNewCategories(guessData) {
        const shared = this.getSharedCategories(guessData);
        const newShared = shared.filter(c => !this.revealedCategories.includes(c));
        const secretCats = this.secretPokemon.categories;

        const candidateCount = (cat) => {
            const sVal = secretCats[cat];
            const sArr = Array.isArray(sVal) ? sVal : [sVal];
            return Math.min(...sArr.map(v => this.activeCategoryIndex[cat]?.[v]?.length ?? Infinity));
        };

        if (this.difficulty === 'easy') {
            for (const c of newShared) this.revealedCategories.push(c);
        } else {
            if (newShared.length > 0) {
                const bestCat = newShared.reduce((best, c) =>
                    candidateCount(c) < candidateCount(best) ? c : best
                );
                this.revealedCategories.push(bestCat);
            }
        }

        // Reordenar todas las categorías reveladas: más útil (menos candidatos) arriba
        this.revealedCategories.sort((a, b) => candidateCount(a) - candidateCount(b));
    }

    // ── RENDER TABLE ────────────────────────────
    renderMatrix() {
        this.removeGameTooltips();
        const container = document.getElementById('matrixContainer');

        if (this.revealedCategories.length === 0 && this.guessedList.length === 0) {
            container.innerHTML = `<div class="empty-state">
                <img class="pokeball-spin" src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png" alt="pokeball">
                <p>Ingresa tu primer Pokémon para revelar las pistas</p>
            </div>`;
            return;
        }

        const showSecret = this.gameState === 'won' || this.gameState === 'lost';
        const cats = this.revealedCategories;

        // Build column list: secret first, then guesses newest-first
        const columns = [
            { data: this.secretPokemon, isSecret: true }
        ];
        const seen = new Set([this.secretPokemon.id]);
        for (let i = this.guessedList.length - 1; i >= 0; i--) {
            const g = this.guessedList[i];
            if (!seen.has(g.data.id)) {
                seen.add(g.data.id);
                columns.push({ data: g.data, isSecret: false });
            }
        }

        // ── Table header ──
        let html = `<table class="matrix-table"><thead><tr>
            <th>Categoría</th>`;

        // Blur: starts at MAX_BLUR, reaches 0 at the last allowed attempt
        const MAX_BLUR = 12;
        const blurSteps = this.difficulty === 'hard' ? this.maxAttempts : 8;
        const blurPx = showSecret
            ? 0
            : Math.max(0, MAX_BLUR - (this.attemptCount / blurSteps) * MAX_BLUR);

        for (const col of columns) {
            const isHidden = col.isSecret && !showSecret;
            const extraClass = col.isSecret ? `secret-col${isHidden ? ' hidden-secret' : ''}` : '';
            const displayName = isHidden ? '???' : capitalize(col.data.name);
            let imgStyle = '';
            if (isHidden) {
                imgStyle = `style="filter:brightness(0) blur(${blurPx.toFixed(1)}px);transition:filter 0.5s ease"`;
            }
            html += `<th class="${extraClass}">
                <div class="pokemon-header">
                    <img src="${col.data.sprite}" alt="${col.data.name}" ${imgStyle} loading="lazy">
                    <span class="poke-name">${displayName}</span>
                    <span class="poke-num">${isHidden ? '???' : '#'+String(col.data.id).padStart(3,'0')}</span>
                </div>
            </th>`;
        }
        html += `</tr></thead><tbody>`;

        // ── Table rows ──
        for (const cat of cats) {
            const desc = CATEGORY_META[cat];
            const tooltipId = `tooltip-${cat.replace(/\s+/g,'-').replace(/\//g,'-')}`;

            html += `<tr><td>
                <div class="category-cell">
                    <span class="category-name">${cat}</span>
                    <span class="info-icon" data-tooltip="${tooltipId}">ℹ️</span>
                </div>
            </td>`;

            for (const col of columns) {
                const isHidden = col.isSecret && !showSecret;
                const val = isHidden ? '?' : col.data.categories[cat];
                const secretVal = this.secretPokemon.categories[cat];
                const extraClass = col.isSecret ? 'secret-col' : '';

                let cellContent;
                if (isHidden) {
                    // categoría revelada → mostrar valor (se sabe porque coincidió)
                    // categoría no revelada → ocultar
                    const revealed = this.revealedCategories.includes(cat);
                    cellContent = revealed
                        ? this.renderValue(col.data.categories[cat], cat)
                        : `<span class="match-no">•</span>`;
                } else if (col.isSecret) {
                    cellContent = this.renderValue(val, cat);
                } else {
                    const gArr = Array.isArray(val) ? val : [val];
                    const sArr = Array.isArray(secretVal) ? secretVal : [secretVal];
                    const match = gArr.some(v => sArr.includes(v));
                    cellContent = match
                        ? this.renderValue(val, cat)
                        : `<span class="match-no" title="${val}">·</span>`;
                }
                html += `<td class="${extraClass}">${cellContent}</td>`;
            }
            html += `</tr>`;

            // Create tooltip element
            const tooltipEl = document.createElement('div');
            tooltipEl.className = 'tooltip';
            tooltipEl.id = tooltipId;
            tooltipEl.innerHTML = `<strong>${cat}</strong><br>${desc ? desc.desc : ''}`;
            document.body.appendChild(tooltipEl);
        }

        html += `</tbody></table>`;
        container.innerHTML = `<div class="matrix-scroll">${html}</div>`;
        this.initTooltips();
    }

    renderValue(val, cat) {
        // Listas (ej: Método evolutivo con múltiples caminos)
        if (Array.isArray(val)) {
            return val.map(v => this.renderValue(v, cat)).join('<span class="value-sep">/</span>');
        }
        if (cat === 'Tipo 1' || cat === 'Tipo 2') {
            const typeKey = Object.entries(TYPE_ES).find(([,v]) => v === val)?.[0];
            if (typeKey) return `<span class="type-badge type-${typeKey}">${val}</span>`;
        }
        if (cat === 'Generación') {
            return `<span class="gen-badge">${val}</span>`;
        }
        if (cat === 'Color') {
            const colorKey = Object.entries(COLOR_ES).find(([,v]) => v === val)?.[0];
            if (colorKey) return `<span class="value-label" style="color:var(--color-${colorKey})">${val}</span>`;
        }
        if (['Forma alternativa', 'Starter', 'Bebé', 'Fósil'].includes(cat)) {
            const yes = val === 'Sí';
            return yes
                ? `<span class="value-label bool-yes">✔</span>`
                : `<span class="value-label bool-no">✘</span>`;
        }
        if (cat === 'Legendario/Mítico' && val === 'Normal') {
            return `<span class="value-label bool-no">✘</span>`;
        }
        return `<span class="value-label">${val}</span>`;
    }

    // ── TOOLTIPS ────────────────────────────────
    initTooltips() {
        const icons = document.querySelectorAll('.matrix-table .info-icon');

        document.addEventListener('click', this._outsideClickHandler = (e) => {
            if (!e.target.closest('.info-icon') && !e.target.closest('.tooltip')) {
                if (this.pinnedTooltip) {
                    this.pinnedTooltip.classList.remove('show','pinned');
                    this.pinnedTooltip = null;
                }
            }
        });

        icons.forEach(icon => {
            const tooltipId = icon.dataset.tooltip;
            const tooltip   = document.getElementById(tooltipId);
            if (!tooltip) return;

            const position = () => {
                const r  = icon.getBoundingClientRect();
                const tr = tooltip.getBoundingClientRect();
                let left = r.right + 10;
                let top  = r.top + r.height/2 - tr.height/2;
                if (left + tr.width  > window.innerWidth - 10)  left = r.left - tr.width - 10;
                if (top < 10) top = 10;
                if (top + tr.height > window.innerHeight - 10)  top  = window.innerHeight - tr.height - 10;
                tooltip.style.left = left + 'px';
                tooltip.style.top  = top  + 'px';
            };

            icon.addEventListener('mouseenter', () => {
                if (this.pinnedTooltip !== tooltip) { tooltip.classList.add('show'); position(); }
            });
            icon.addEventListener('mouseleave', () => {
                if (!tooltip.classList.contains('pinned')) tooltip.classList.remove('show');
            });
            icon.addEventListener('click', e => {
                e.stopPropagation();
                if (this.pinnedTooltip && this.pinnedTooltip !== tooltip) {
                    this.pinnedTooltip.classList.remove('show','pinned');
                }
                if (tooltip.classList.contains('pinned')) {
                    tooltip.classList.remove('pinned');
                    this.pinnedTooltip = null;
                } else {
                    tooltip.classList.add('show','pinned');
                    position();
                    this.pinnedTooltip = tooltip;
                }
            });
        });
    }

    removeGameTooltips() {
        document.querySelectorAll('.tooltip:not([id*="difficulty"])').forEach(t => t.remove());
        if (this._outsideClickHandler) {
            document.removeEventListener('click', this._outsideClickHandler);
        }
        this.pinnedTooltip = null;
    }

    // ── UI HELPERS ──────────────────────────────
    updateCounter() {
        const el = document.getElementById('attemptCounter');
        if (this.difficulty === 'hard') {
            el.textContent = `Intentos: ${this.attemptCount}/${this.maxAttempts}`;
        } else {
            el.textContent = `Intentos: ${this.attemptCount}`;
        }
    }

    updateDiffBadge() {
        const el = document.getElementById('difficultyInfo');
        if (this.difficulty === 'easy') {
            el.textContent = '🌿 Fácil';
            el.className = 'badge badge-diff easy';
        } else {
            el.textContent = '🔥 Difícil';
            el.className = 'badge badge-diff hard';
        }
    }

    updateStatusBadge() {
        const el = document.getElementById('gameStatus');
        if (this.gameState === 'won') {
            el.textContent = '¡Ganaste!'; el.className = 'badge badge-status won';
        } else if (this.gameState === 'lost') {
            el.textContent = 'Perdiste';  el.className = 'badge badge-status lost';
        } else {
            el.textContent = ''; el.className = 'badge badge-status';
        }
    }

    showMsg(text, type, temporary = true) {
        const el = document.getElementById('message');
        el.textContent = text;
        el.className   = `message ${type} fade-in`;
        if (temporary) {
            setTimeout(() => {
                el.className = 'message message-hidden';
                el.innerHTML = '&nbsp;';
            }, 4000);
        }
    }

    showVictoryBanner() {
        const banner = document.getElementById('victoryBanner');
        banner.classList.add('show');
        setTimeout(() => banner.classList.remove('show'), 4000);
    }
}

// ──────────────────────────────────────────────
//  BOOT
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    new PokemonGame();
});
