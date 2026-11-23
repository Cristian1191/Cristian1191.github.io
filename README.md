# Sitio Web Personal y Sistema de Artículos Técnicos

Plataforma estática personal compatible con **GitHub Pages**, refactorizada de forma modular y equipada con un sistema de publicación de artículos técnicos y científicos escritos en **Markdown (`.md`)**, con soporte para fórmulas matemáticas **LaTeX (MathJax)**, resaltado de código (**Highlight.js**) y sanitización segura (**DOMPurify**).

## Estructura del proyecto

```text
Web personal/
├── index.html                          # Página principal (Blog y Sobre mí)
├── css/
│   ├── styles.css                      # Estilos originales de la página principal
│   └── articles.css                    # Estilos del catálogo y lector editorial
├── js/
│   ├── main.js                         # Lógica original + gestión global del tema
│   ├── articles.js                     # Catálogo, filtros, búsqueda y ordenamiento
│   └── article-reader.js               # Lector dinámico Markdown + LaTeX + código
├── articulos/
│   ├── index.html                      # Catálogo de artículos técnicos
│   ├── leer.html                       # Lector dinámico (?id=...)
│   ├── matematicas/
│   │   └── espacios-metricos.md        # Artículo de ejemplo
│   ├── machine-learning/
│   ├── inteligencia-artificial/
│   ├── computacion-cientifica/
│   └── programacion/
├── data/
│   └── articles.json                   # Registro central de artículos y metadatos
├── assets/
│   ├── images/                         # Portadas e imágenes para artículos
│   ├── icons/                          # Iconos
│   └── fonts/                          # Fuentes locales opcionales
└── README.md
```

## Cómo publicar un artículo nuevo

No necesitas crear archivos HTML nuevos. El proceso consta de dos pasos:

### 1. Crear el archivo Markdown

Crea un archivo `.md` dentro de la carpeta temática correspondiente en `articulos/`, por ejemplo:

```text
articulos/machine-learning/regresion-lineal.md
```

Puedes usar encabezados (`#` a `######`), negritas, cursivas, listas, tablas, citas, bloques de código, notas/advertencias y fórmulas LaTeX.

#### Notas y advertencias (Callouts)

```markdown
> [!NOTE]
> Nota informativa adicional.

> [!TIP]
> Consejo práctico.

> [!IMPORTANT]
> Concepto clave que conviene recordar.

> [!WARNING]
> Advertencia sobre un error común.

> [!CAUTION]
> Precaución importante.
```

*(También se aceptan etiquetas en español: `[!NOTA]`, `[!CONSEJO]`, `[!IMPORTANTE]`, `[!ADVERTENCIA]`, `[!PRECAUCION]`.)*

### 2. Registrar el artículo en `data/articles.json`

Agrega una nueva entrada al arreglo JSON en `data/articles.json`:

```json
[
  {
    "id": "regresion-lineal",
    "title": "Fundamentos de la regresión lineal",
    "description": "Formulación matemática, mínimos cuadrados e implementación en Python.",
    "category": "Machine Learning",
    "date": "2026-11-24",
    "author": "Cristian Bernal",
    "readingTime": 10,
    "cover": "assets/images/regresion-lineal.png",
    "path": "articulos/machine-learning/regresion-lineal.md",
    "tags": ["Machine Learning", "Estadística", "Python"]
  }
]
```

Campos disponibles:

| Campo | Obligatorio | Descripción |
| :--- | :---: | :--- |
| `id` | Sí | Identificador único para la URL (`articulos/leer.html?id=<id>`). Usa minúsculas y guiones. |
| `title` | Sí | Título principal del artículo. |
| `description` | Sí | Resumen breve mostrado en la tarjeta y el encabezado editorial. |
| `category` | Sí | Categoría para el filtro del catálogo (se generan dinámicamente). |
| `date` | Sí | Fecha en formato `YYYY-MM-DD`. |
| `author` | Sí | Nombre del autor. |
| `readingTime` | Opcional | Tiempo estimado de lectura en minutos (número). |
| `cover` | Opcional | Ruta relativa desde la raíz (ej. `assets/images/portada.png`). Dejar `""` si no tiene portada. |
| `path` | Sí | Ruta relativa al archivo `.md` desde la raíz del proyecto. |
| `tags` | Opcional | Lista de etiquetas para búsqueda y filtrado. |

### Lista de verificación si un artículo nuevo no aparece

1. **Verifica que `path` coincida exactamente con el nombre del archivo `.md`** (letra por letra, respetando guiones y minúsculas). Por ejemplo, si el archivo es `articulos/inteligencia-artificial/del-texto-al-contexto.md`, el campo `"path"` debe ser idéntico; un error tipográfico (como `del-text-al-contexto.md`) provocará un error 404 al abrirlo.
2. **Valida la sintaxis de `data/articles.json`**: asegúrate de no dejar comas sobrantes al final de un objeto o arreglo y de cerrar todas las comillas y llaves. Si el JSON tiene un error de sintaxis, el catálogo no podrá cargarse.
3. **Usa un servidor local (Live Server o `python -m http.server`)** abierto desde la carpeta raíz del proyecto (`Web personal/`), nunca abriendo el HTML directamente con `file://`.
4. **Dónde se muestran los artículos**: aparecen automáticamente en la sección **Artículos técnicos** de la portada (`index.html`), en la barra lateral izquierda y en el catálogo completo (`articulos/index.html`). Recarga con `Ctrl + Shift + R` si el navegador conserva caché.

## Cómo agregar imágenes

1. Guarda la imagen en `assets/images/` (por ejemplo `assets/images/espacios-metricos.png`).
2. Para usarla como **portada**, coloca `"cover": "assets/images/espacios-metricos.png"` en `data/articles.json`.
3. Para insertarla **dentro del artículo Markdown**, usa la ruta relativa desde la raíz del sitio:

```markdown
![Representación de una bola abierta](assets/images/bola-abierta.png)
```

El lector resuelve automáticamente las rutas relativas para que funcionen tanto en desarrollo local como en subdirectorios de GitHub Pages (`https://usuario.github.io/repositorio/`).

## Cómo escribir ecuaciones LaTeX

El lector procesa expresiones matemáticas con **MathJax 3** protegiéndolas antes de ejecutar Marked.js y DOMPurify.

- **En línea**: usa `\(...\)` o `$...$`

```markdown
La función cuadrática \(f(x) = x^2 + 2x + 1\) es continua en \(\mathbb{R}\).
```

- **En bloque (ecuación centrada)**: usa `$$...$$` o `\[...\]`

```markdown
$$
P(A \mid B) = \frac{P(B \mid A)P(A)}{P(B)}
$$
```

Las ecuaciones largas disponen de desplazamiento horizontal automático en pantallas pequeñas.

## Resaltado de código

Indica el lenguaje tras las tres comillas invertidas:

````markdown
```python
def distancia(x, y):
    return abs(x - y)
```
````

Soporta Python, JavaScript, TypeScript, HTML, CSS, SQL, C, C++, Java, Bash, JSON, YAML, Markdown, entre otros. Cada bloque incluye etiqueta de lenguaje y botón para copiar el código.

## Prueba local

Dado que el catálogo y el lector cargan `data/articles.json` y los archivos `.md` mediante `fetch()`, es necesario abrir el proyecto con un servidor HTTP local (no con `file://`):

```bash
# Con Python 3
python -m http.server 8000
```

Luego abre `http://localhost:8000/` en tu navegador.

## Publicación en GitHub Pages

1. Sube tus cambios al repositorio:

```bash
git add .
git commit -m "Publicar nuevo artículo"
git push origin main
```

2. En GitHub, ve a **Settings → Pages**.
3. En **Source**, selecciona **Deploy from a branch**, elige la rama `main` y la carpeta `/ (root)`.
4. Guarda los cambios. Todas las rutas del proyecto son relativas, por lo que funcionará tanto en `https://usuario.github.io/` como en `https://usuario.github.io/nombre-repositorio/`.
