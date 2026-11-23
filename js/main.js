/* ===== Entradas: añade aquí cada nueva publicación ===== */
const POSTS = [
  /* Entradas de ejemplo ocultas temporalmente (descomenta cuando quieras mostrarlas)
  {
    id: "ia-analisis",
    title: "Análisis técnico: [nombre del proyecto de IA]",
    date: "2026-11-21",
    desc: "Primer análisis técnico de un proyecto de IA: arquitectura, stack, evaluación y límites."
  },
  // Entradas de prueba: reemplázalas por tus proyectos reales
  {
    id: "rag-langchain",
    title: "RAG con LangChain y PostgreSQL",
    date: "2026-11-18",
    desc: "Prueba: búsqueda semántica sobre documentos con embeddings y pgvector."
  },
  {
    id: "cnn-imagenes",
    title: "Clasificador de imágenes con CNN",
    date: "2026-11-12",
    desc: "Prueba: red convolucional para clasificar imágenes, con métricas y errores comunes."
  },
  {
    id: "chatbot-claude",
    title: "Chatbot con la API de Claude",
    date: "2026-11-05",
    desc: "Prueba: arquitectura de un chatbot con memoria de conversación."
  },
  {
    id: "series-tiempo",
    title: "Predicción de demanda con series de tiempo",
    date: "2026-10-28",
    desc: "Prueba: modelos ARIMA y LSTM aplicados a datos de ventas."
  },
  {
    id: "deteccion-fraude",
    title: "Detección de fraude con aprendizaje automático",
    date: "2026-10-20",
    desc: "Prueba: clasificación con datos desbalanceados y evaluación con precisión y recall."
  }
  */
];

const $ = (s) => document.querySelector(s);

/* ===== Tema global (compartido entre todas las páginas) ===== */
function initTheme() {
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("theme");
    if (saved) root.dataset.theme = saved;
  } catch (e) {}

  const btn = $("#theme");
  if (btn) {
    btn.onclick = () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch (e) {}
    };
  }
}

initTheme();

/* ===== Inicialización exclusiva de la página principal ===== */
if ($("#postnav") && $("#postlist")) {
  /* Genera una página básica para cada entrada que no tenga su <article> propio */
  POSTS.forEach((p) => {
    if (document.getElementById("v-" + p.id)) return;
    const a = document.createElement("article");
    a.className = "view prose";
    a.id = "v-" + p.id;
    a.innerHTML = `<h1 class="title">${p.title}</h1>
    <div class="hero"><span>ANÁLISIS</span><b>${p.title}</b></div>
    <p>${p.desc}</p>
    <h2 id="${p.id}-resumen">Resumen</h2><p class="ph">[Escribe aquí el resumen del proyecto.]</p>
    <h2 id="${p.id}-arquitectura">Arquitectura</h2><p class="ph">[Describe los componentes y cómo se conectan.]</p>
    <h2 id="${p.id}-conclusiones">Conclusiones</h2><p class="ph">[Qué aprendiste y qué harías después.]</p>
    <div class="pager"><a href="#/"><small>Volver</small>Todas las entradas</a></div>`;
    document.getElementById("foot").before(a);
  });

  const views = document.querySelectorAll(".view");
  const fmt = (d) =>
    new Date(d + "T00:00").toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  /* Menú lateral y lista del inicio */
  $("#postnav").innerHTML = POSTS.map(
    (p) =>
      `<li data-t="${p.title.toLowerCase()}"><a href="#/${p.id}" data-id="${p.id}">${p.title}</a></li>`
  ).join("");

  $("#postlist").innerHTML = POSTS.map(
    (p) =>
      `<li><h3><a href="#/${p.id}">${p.title}</a></h3><div class="meta">${fmt(p.date)}</div><p>${p.desc}</p></li>`
  ).join("");

  document.querySelectorAll("#side .grp > button").forEach((btn) => {
    btn.onclick = (e) => e.currentTarget.parentElement.classList.toggle("closed");
  });

  /* Carga dinámica de artículos técnicos desde data/articles.json en la portada y barra lateral */
  async function loadHomeArticles() {
    const navEl = $("#articlenav");
    const listEl = $("#home-articles");
    if (!navEl && !listEl) return;

    try {
      const res = await fetch("data/articles.json", { cache: "no-cache" });
      if (!res.ok) return;
      const articles = await res.json();
      if (!Array.isArray(articles) || !articles.length) return;

      const sorted = [...articles].sort(
        (a, b) => new Date((b.date || "1970-01-01") + "T00:00") - new Date((a.date || "1970-01-01") + "T00:00")
      );

      if (navEl) {
        navEl.innerHTML =
          sorted
            .map(
              (a) =>
                `<li data-t="${(a.title || "").toLowerCase()}"><a href="articulos/leer.html?id=${encodeURIComponent(a.id)}">${a.title}</a></li>`
            )
            .join("") +
          `<li><a href="articulos/index.html" style="color: var(--accent); font-weight: 600;">Ver catálogo completo →</a></li>`;
      }

      if (listEl) {
        listEl.innerHTML = sorted
          .map(
            (a) =>
              `<li><h3><a href="articulos/leer.html?id=${encodeURIComponent(a.id)}">${a.title}</a></h3><div class="meta">${fmt(a.date)} · ${a.category || "Artículo"}${a.readingTime ? ` · ${a.readingTime} min` : ""}</div><p>${a.description || ""}</p></li>`
          )
          .join("");
      }
    } catch (e) {}
  }

  loadHomeArticles();

  /* Búsqueda */
  const qInput = $("#q");
  if (qInput) {
    qInput.addEventListener("input", (e) => {
      const t = e.target.value.toLowerCase();
      document
        .querySelectorAll("#postnav li, #articlenav li[data-t]")
        .forEach((li) => li.classList.toggle("hide", !!t && !li.dataset.t.includes(t)));
    });
    addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        qInput.focus();
      }
    });
  }

  /* Mapa local: nodo central y satélites */
  function drawMap(n) {
    const cx = 100,
      cy = 85,
      R = 62,
      cols = ["#2b9bff", "#ff5d5d", "#ffb02b", "#2be08c", "#8a7bff"];
    let s = "";
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2,
        x = cx + Math.cos(a) * R,
        y = cy + Math.sin(a) * R;
      s += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="currentColor" stroke-opacity=".18"/><circle cx="${x}" cy="${y}" r="3" fill="${cols[i % 5]}"/>`;
    }
    s += `<circle cx="${cx}" cy="${cy}" r="9" fill="none" stroke="var(--accent)" stroke-width="2"/><circle cx="${cx}" cy="${cy}" r="4.5" fill="#2b9bff"/>`;
    $("#mapsvg").innerHTML = s;
    $("#mapcount").textContent = n + " páginas enlazadas";
  }

  /* Índice automático con resaltado al desplazarse */
  let spy;
  function buildToc(view) {
    const box = $("#tocitems");
    box.innerHTML = "";
    const hs = view.querySelectorAll("h2[id],h3[id]");
    hs.forEach((h) => {
      const a = document.createElement("a");
      a.href = "#" + h.id;
      a.textContent = h.textContent;
      if (h.tagName === "H3") a.className = "sub";
      a.onclick = (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: "smooth" });
      };
      box.appendChild(a);
    });
    $("#toc").style.display = hs.length ? "" : "none";
    if (spy) spy.disconnect();
    spy = new IntersectionObserver(
      (es) => {
        es.forEach((en) => {
          if (en.isIntersecting) {
            box
              .querySelectorAll("a")
              .forEach((a) =>
                a.classList.toggle("on", a.getAttribute("href") === "#" + en.target.id)
              );
          }
        });
      },
      { rootMargin: "-70px 0px -70% 0px" }
    );
    hs.forEach((h) => spy.observe(h));
  }

  /* Enrutador por hash */
  function route() {
    const id = location.hash.replace(/^#\/?/, "") || "home";
    const key =
      id === "home" || id === "sobre-mi"
        ? id
        : POSTS.find((p) => p.id === id)
          ? id
          : "home";
    const viewId = key === "home" ? "v-home" : key === "sobre-mi" ? "v-sobre-mi" : "v-" + key;
    views.forEach((v) => v.classList.toggle("on", v.id === viewId));
    const post = POSTS.find((p) => p.id === key);
    const home = `<a href="#/" aria-label="Inicio"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 12h3v9h5v-6h4v6h5v-9h3z"/></svg></a>`;
    $("#crumbs").innerHTML =
      key === "home"
        ? home + `<span>›</span><span class="cur">Blog</span>`
        : key === "sobre-mi"
          ? home + `<span>›</span><span class="cur">Sobre mí</span>`
          : home +
            `<span>›</span><a href="#/">Blog</a><span>›</span><span class="cur">${post.title.length > 34 ? post.title.slice(0, 34) + "…" : post.title}</span>`;
    document
      .querySelectorAll("#side li a")
      .forEach((a) => a.classList.toggle("on", a.dataset.id === key));
    document.querySelectorAll("#top nav a").forEach((a) => {
      if (a.dataset.nav === "about") {
        a.classList.toggle("on", key === "sobre-mi");
      } else if (a.dataset.nav === "blog") {
        a.classList.toggle("on", key !== "sobre-mi");
      }
    });
    document.title =
      (post ? post.title : key === "sobre-mi" ? "Sobre mí" : "Blog") + " | Cristian J.";
    drawMap(Math.max(POSTS.length + 2, 12));
    buildToc(document.getElementById(viewId));
    scrollTo(0, 0);
  }

  addEventListener("hashchange", route);
  route();
}
