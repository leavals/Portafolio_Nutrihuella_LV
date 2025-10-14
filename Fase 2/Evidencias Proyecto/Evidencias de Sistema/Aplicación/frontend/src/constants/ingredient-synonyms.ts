/**
 * Normaliza el nombre de un ingrediente a su forma de clave:
 * - Convierte a minúsculas
 * - Elimina tildes (acentos gráficos en vocales)
 * - Convierte a singular en forma simple (quita plural en -s o -es, y maneja plurales en -ces -> -z)
 */
export function normalizeIngredientName(name: string): string {
    const lower = name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "");
    if (lower.endsWith("ces")) {
        // Plural terminado en "ces": reemplaza por "z" (ej: "maices" -> "maiz")
        return lower.slice(0, -3) + "z";
    } else if (lower.endsWith("es")) {
        // Plural terminado en "es": quita "es" (ej: "frijoles" -> "frijol")
        return lower.slice(0, -2);
    } else if (lower.endsWith("s")) {
        // Plural sencillo terminado en "s": quita la "s" final (ej: "zanahorias" -> "zanahoria")
        return lower.slice(0, -1);
    }
    return lower;
}

/**
 * Diccionario de sinónimos de ingredientes utilizados en alimentación de mascotas.
 * Cada entrada tiene como clave el nombre normalizado (minúsculas, sin tildes, singular) 
 * y como valor un array de nombres sinónimos en español (incluyendo variantes regionales).
 */
export const INGREDIENT_DEFAULT_KEYWORDS: { [key: string]: string[] } = {
    // ** Proteínas de origen animal **
    "pollo": [
        "pollo", "carne de pollo", "pollo fresco", "pollo crudo", "pollo deshidratado", "harina de pollo"
    ],
    "res": [
        "res", "carne de res", "vacuno", "carne de vaca", "vaca", "ternera", "carne de ternera", "carne vacuna", "harina de res"
    ],
    "cerdo": [
        "cerdo", "carne de cerdo", "puerco", "carne de puerco", "chancho", "carne de chancho", "marrano", "lechón"
    ],
    "pavo": [
        "pavo", "carne de pavo", "guajolote", "chompipe", "pisco"  // Diferentes nombres para pavo:contentReference[oaicite:0]{index=0}
    ],
    "pato": [
        "pato", "carne de pato"
    ],
    "cordero": [
        "cordero", "carne de cordero", "borrego", "oveja"
    ],
    "conejo": [
        "conejo", "carne de conejo"
    ],
    "venado": [
        "venado", "carne de venado", "ciervo"
    ],
    "bufalo": [
        "búfalo", "bufalo", "carne de búfalo", "bisonte", "carne de bisonte"
    ],
    "pescado": [
        "pescado", "carne de pescado", "pescado azul", "pescado blanco"
    ],
    "salmon": [
        "salmón", "salmon", "carne de salmón", "harina de salmón"
    ],
    "atun": [
        "atún", "atun", "carne de atún"
    ],
    "sardina": [
        "sardina", "sardinas"
    ],
    "bacalao": [
        "bacalao"
    ],
    "trucha": [
        "trucha"
    ],
    "merluza": [
        "merluza"
    ],
    "arenque": [
        "arenque"
    ],
    "anchoveta": [
        "anchoveta", "anchoa"
    ],
    "tilapia": [
        "tilapia"
    ],
    "huevo": [
        "huevo", "huevos", "blanquillo"
    ],
    "visceras": [
        "vísceras", "visceras", "menudencias", "menudos", "menudillos", "achuras"
    ],
    "higado": [
        "hígado", "higado", "hígado de res", "hígado de pollo"
    ],
    "rinon": [
        "riñón", "riñones", "rinon", "riñón de res", "riñón de pollo"
    ],
    // ** Grasas y aceites (origen animal y vegetal) **
    "grasa de pollo": [
        "grasa de pollo", "grasa avícola", "grasa de ave"
    ],
    "grasa de res": [
        "grasa de res", "grasa vacuna", "sebo de res", "sebo vacuno"
    ],
    "grasa de cerdo": [
        "grasa de cerdo", "manteca de cerdo"
    ],
    "aceite de salmon": [
        "aceite de salmón", "aceite de salmon", "aceite de pescado"
    ],
    "aceite de pescado": [
        "aceite de pescado", "aceite de hígado de bacalao"
    ],
    "aceite de oliva": [
        "aceite de oliva"
    ],
    "aceite de girasol": [
        "aceite de girasol", "aceite de maravilla"  // Sinónimo regional para aceite de girasol:contentReference[oaicite:1]{index=1}
    ],
    "aceite de coco": [
        "aceite de coco"
    ],
    "aceite de linaza": [
        "aceite de linaza", "aceite de lino"
    ],
    "aceite de canola": [
        "aceite de canola", "aceite de colza"
    ],
    // ** Proteínas de origen vegetal (legumbres, frutos secos) **
    "frijol": [
        "frijol", "fríjol", "frijoles", "habichuela", "judía", "judías", "poroto", "porotos", "frejol", "fréjol", "frisol", "frísol", "caraota"
    ], // Nombres regionales para el frijol:contentReference[oaicite:2]{index=2}:contentReference[oaicite:3]{index=3}
    "soja": [
        "soja", "soya"
    ],
    "lenteja": [
        "lenteja", "lentejas"
    ],
    "garbanzo": [
        "garbanzo", "garbanzos"
    ],
    "guisante": [
        "guisante", "guisantes", "chícharo", "chícharos", "arveja", "arvejas", "alverja", "petipuá", "petipúa"
    ], // Sinónimos de guisante en distintos países:contentReference[oaicite:4]{index=4}
    "haba": [
        "haba", "habas"
    ],
    "cacahuete": [
        "cacahuete", "cacahuate", "maní", "mani", "cacahuetes", "maníes"
    ], // Sinónimos de cacahuete/maní en diferentes regiones
    "linaza": [
        "linaza", "semilla de lino", "semillas de lino"
    ],
    "guisante verde": [
        "guisante verde", "guisantes verdes", "chícharo verde", "arveja verde"  // (por claridad; normalmente ya cubierto en guisante)
    ],
    // ** Cereales y granos (carbohidratos) **
    "arroz": [
        "arroz", "arroz integral", "arroz blanco"
    ],
    "maiz": [
        "maíz", "maiz", "choclo", "elote", "jojoto", "millo"
    ], // Nombres regionales para el maíz:contentReference[oaicite:5]{index=5}:contentReference[oaicite:6]{index=6}
    "trigo": [
        "trigo"
    ],
    "cebada": [
        "cebada"
    ],
    "avena": [
        "avena"
    ],
    "centeno": [
        "centeno"
    ],
    "sorgo": [
        "sorgo", "maicillo"
    ],
    "mijo": [
        "mijo"
    ],
    "quinoa": [
        "quinua", "quinoa", "quínoa"
    ],
    "amaranto": [
        "amaranto", "kiwicha"
    ],
    "yuca": [
        "yuca", "mandioca"
    ],
    "tapioca": [
        "tapioca", "almidón de yuca", "almidón de mandioca"
    ],
    // ** Tubérculos y verduras **
    "papa": [
        "papa", "patata"
    ],
    "camote": [
        "camote", "batata", "boniato", "papa dulce", "patata dulce", "moniato"
    ], // Variantes del camote/boniato:contentReference[oaicite:7]{index=7}:contentReference[oaicite:8]{index=8}
    "zanahoria": [
        "zanahoria", "zanahorias"
    ],
    "calabaza": [
        "calabaza", "zapallo", "auyama", "ahuyama", "ayote"
    ], // Distintos nombres para calabaza:contentReference[oaicite:9]{index=9}:contentReference[oaicite:10]{index=10}
    "calabacin": [
        "calabacín", "calabacin", "calabacita", "zapallo italiano", "zapallito italiano", "zucchini"
    ],
    "brocoli": [
        "brócoli", "brocoli", "brécol"
    ],
    "coliflor": [
        "coliflor"
    ],
    "repollo": [
        "repollo", "col"
    ],
    "espinaca": [
        "espinaca", "espinacas"
    ],
    "acelga": [
        "acelga", "acelgas"
    ],
    "pepino": [
        "pepino", "pepinillo"
    ],
    "tomate": [
        "tomate", "jitomate"
    ],
    "lechuga": [
        "lechuga"
    ],
    "judia verde": [
        "judía verde", "judias verdes", "ejote", "ejotes", "vainita", "vainitas", "vainica", "chaucha", "chauchas", "poroto verde", "porotos verdes", "habichuela verde", "habichuelas verdes", "alubia verde", "bajoca"
    ], // Sinónimos regionales para judía verde (ejote):contentReference[oaicite:11]{index=11}
    "remolacha": [
        "remolacha", "betabel", "betarraga", "beterraga", "beteraba"
    ], // Nombres para remolacha en distintos países:contentReference[oaicite:12]{index=12}
    "boniato": [
        "boniato", "batata", "camote", "patata dulce"
    ], // (Cubierto en camote, incluido por separado por conveniencia)
    // ** Frutas **
    "manzana": [
        "manzana"
    ],
    "platano": [
        "plátano", "platano", "banana", "banano", "guineo", "cambur"
    ], // Sinónimos de plátano/banana según región:contentReference[oaicite:13]{index=13}
    "pera": [
        "pera"
    ],
    "naranja": [
        "naranja", "china"
    ], // En el Caribe (PR, RD) la naranja dulce se llama "china"
    "mandarina": [
        "mandarina"
    ],
    "limon": [
        "limón", "limon", "lima"
    ],
    "arandano azul": [
        "arándano", "arándano azul", "mortiño"
    ], // Arándano azul (blueberry), mortiño en algunos países andinos:contentReference[oaicite:14]{index=14}
    "arandano rojo": [
        "arándano rojo", "arándano agrio", "oxicoco", "cranberry"
    ],
    "fresa": [
        "fresa", "frutilla"
    ],
    "mora": [
        "mora", "zarzamora"
    ],
    "frambuesa": [
        "frambuesa"
    ],
    "coco": [
        "coco"
    ],
    "platano macho": [
        "plátano macho", "plátano para freír", "plátano verde"
    ],
    "uva": [
        "uva", "uvas"
    ],
    // ** Suplementos, vitaminas y minerales **
    "vitamina a": [
        "vitamina A", "retinol"
    ],
    "vitamina b1": [
        "vitamina B1", "tiamina"
    ],
    "vitamina b2": [
        "vitamina B2", "riboflavina"
    ],
    "vitamina b3": [
        "vitamina B3", "niacina", "vitamina PP"
    ],
    "vitamina b5": [
        "vitamina B5", "ácido pantoténico"
    ],
    "vitamina b6": [
        "vitamina B6", "piridoxina"
    ],
    "vitamina b7": [
        "vitamina B7", "biotina", "vitamina H"
    ],
    "vitamina b9": [
        "vitamina B9", "ácido fólico", "folato"
    ],
    "vitamina b12": [
        "vitamina B12", "cobalamina"
    ],
    "vitamina c": [
        "vitamina C", "ácido ascórbico"
    ],
    "vitamina d": [
        "vitamina D", "colecalciferol", "vitamina D3"
    ],
    "vitamina e": [
        "vitamina E", "tocoferol"
    ],
    "vitamina k": [
        "vitamina K", "filoquinona", "menaquinona"
    ],
    "calcio": [
        "calcio"
    ],
    "fosforo": [
        "fósforo", "fosforo"
    ],
    "magnesio": [
        "magnesio"
    ],
    "potasio": [
        "potasio"
    ],
    "sodio": [
        "sodio"
    ],
    "sal": [
        "sal", "cloruro de sodio"
    ],
    "hierro": [
        "hierro"
    ],
    "cobre": [
        "cobre"
    ],
    "zinc": [
        "zinc", "cinc"
    ],
    "manganeso": [
        "manganeso"
    ],
    "selenio": [
        "selenio"
    ],
    "yodo": [
        "yodo"
    ],
    "omega 3": [
        "omega 3", "omega-3", "ácidos grasos omega-3"
    ],
    "omega 6": [
        "omega 6", "omega-6", "ácidos grasos omega-6"
    ],
    "taurina": [
        "taurina"
    ],
    "carnitina": [
        "L-carnitina", "carnitina"
    ],
    "glucosamina": [
        "glucosamina", "sulfato de glucosamina"
    ],
    "condroitina": [
        "condroitina", "sulfato de condroitina"
    ],
    "msm": [
        "MSM", "metilsulfonilmetano"
    ],
    "probioticos": [
        "probióticos", "probiótico", "probioticos"
    ],
    "prebioticos": [
        "prebióticos", "prebiótico", "prebioticos"
    ],
    "levadura de cerveza": [
        "levadura de cerveza", "levadura", "extracto de levadura"
    ]
};

/**
 * Devuelve la lista de sinónimos normalizados por defecto para un nombre de ingrediente dado.
 * @param rawName Nombre crudo del ingrediente (puede incluir mayúsculas, tildes, plural, etc.)
 * @returns Array de sinónimos (incluyendo el nombre normalizado principal) si se encuentra, o array vacío si no existe en el diccionario.
 */
export function getDefaultIngredientKeywords(rawName: string): string[] {
    const key = normalizeIngredientName(rawName);
    return INGREDIENT_DEFAULT_KEYWORDS[key] ?? [];
}
