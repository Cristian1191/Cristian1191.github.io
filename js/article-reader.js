/* ==========================================================================
   Lector Dinámico de Artículos Markdown (articulos/leer.html)
   Pipeline: Fetch .md -> Protección LaTeX -> Marked.js -> DOMPurify
             -> Restauración LaTeX -> Highlight.js -> TOC -> MathJax
   ========================================================================== */

(function () {
  const SITE_ROOT = "../";
  const DATA_URL = SITE_ROOT + "data/articles.json";

  const els = {
    progress: document.getElementById("reading-progress"),
    crumbs: document.getElementById("reader-crumbs"),
    loading: document.getElementById("reader-loading"),
    error: document.getElementById("reader-error"),
    errorTitle: document.getElementById("reader-error-title"),
    errorDesc: document.getElementById("reader-error-desc"),
    article: document.getElementById("reader-article"),
    category: document.getElementById("article-category"),
    date: document.getElementById("article-date"),
    readingTime: document.getElementById("article-reading-time"),
    title: document.getElementById("article-title"),
    description: document.getElementById("article-description"),
    author: document.getElementById("article-author"),
    tags: document.getElementById("article-tags"),
    coverWrap: document.getElementById("article-cover-wrap"),
    cover: document.getElementById("article-cover"),
    content: document.getElementById("article-content"),
    tocCard: document.getElementById("reader-toc-card"),
    tocItems: document.getElementById("reader-toc-items"),
    mobileToc: document.getElementById("mobile-toc"),
    mobileTocList: document.getElementById("mobile-toc-list"),
    relatedSection: document.getElementById("related-section"),
    relatedGrid: document.getElementById("related-grid")
  };

  if (!els.content) return;

  function resolveSitePath(relPath) {
    if (!relPath) return "";
    if (/^(https?:|data:|\/\/|#|mailto:)/i.test(relPath)) return relPath;
    if (relPath.startsWith("../")) return relPath;
    return SITE_ROOT + relPath.replace(/^\/+/, "").replace(/^\.\//, "");
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(dateStr) {
    if (!dateStr) return "";
    const parsed = new Date(dateStr + "T00:00:00");
    if (Number.isNaN(parsed.getTime())) return dateStr;
    return parsed.toLocaleDateString("es-PE", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  function slugify(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-") || "seccion";
  }

  function showError(title, message) {
    els.loading.hidden = true;
    els.article.hidden = true;
    els.error.hidden = false;
    els.errorTitle.textContent = title;
    els.errorDesc.textContent = message;
    document.title = title + " | Cristian J.";
  }

  /* ------------------------------------------------------------------------
     Protección de fórmulas LaTeX antes de Marked.js y DOMPurify
     Evita que guiones bajos (_), asteriscos (*) o saltos de línea (\\)
     sean alterados por el parser Markdown.
     ------------------------------------------------------------------------ */
  function renderMarkdownSafely(markdownText) {
    const codeTokens = [];
    const mathTokens = [];

    let text = markdownText.replace(/\r\n/g, "\n");

    // 1. Extraer bloques de código cercados (``` o ~~~) para no tocar $ o \( dentro de código
    text = text.replace(/(^|\n)(```|~~~)[^\n]*\n[\s\S]*?\n\2(?=\n|$)/g, (match) => {
      const idx = codeTokens.length;
      codeTokens.push(match);
      return `\nCODEBLOCKPLACEHOLDER${idx}END\n`;
    });

    // 2. Extraer código en línea (`...`)
    text = text.replace(/(`+)([\s\S]*?)\1/g, (match) => {
      const idx = codeTokens.length;
      codeTokens.push(match);
      return `CODEINLINEPLACEHOLDER${idx}END`;
    });

    // 3. Extraer ecuaciones en bloque: $$...$$ y \[...\]
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match) => {
      const idx = mathTokens.length;
      mathTokens.push(match);
      return `\n\nMATHBLOCKPLACEHOLDER${idx}END\n\n`;
    });

    text = text.replace(/\\\[([\s\S]+?)\\\]/g, (match) => {
      const idx = mathTokens.length;
      mathTokens.push(match);
      return `\n\nMATHBLOCKPLACEHOLDER${idx}END\n\n`;
    });

    // 4. Extraer fórmulas en línea: \(...\) y $...$
    text = text.replace(/\\\(([\s\S]+?)\\\)/g, (match) => {
      const idx = mathTokens.length;
      mathTokens.push(match);
      return `MATHINLINEPLACEHOLDER${idx}END`;
    });

    text = text.replace(/(?<!\\)\$(?!\s)((?:\\.|[^$\n])+?)(?<!\s)\$/g, (match) => {
      const idx = mathTokens.length;
      mathTokens.push(match);
      return `MATHINLINEPLACEHOLDER${idx}END`;
    });

    // 5. Restaurar bloques y fragmentos de código antes de ejecutar Marked.js
    text = text.replace(/CODEINLINEPLACEHOLDER(\d+)END/g, (_, i) => codeTokens[Number(i)]);
    text = text.replace(/\n?CODEBLOCKPLACEHOLDER(\d+)END\n?/g, (_, i) => codeTokens[Number(i)]);

    // 6. Convertir Markdown a HTML con Marked.js
    if (typeof window.marked === "undefined") {
      throw new Error("Marked.js no está disponible.");
    }

    const rawHtml = window.marked.parse(text, {
      gfm: true,
      breaks: false
    });

    // 7. Sanitizar HTML con DOMPurify para evitar inyección de scripts
    if (typeof window.DOMPurify === "undefined") {
      throw new Error("DOMPurify no está disponible.");
    }

    let safeHtml = window.DOMPurify.sanitize(rawHtml, {
      USE_PROFILES: { html: true },
      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus"]
    });

    // 8. Restaurar fórmulas matemáticas escapando caracteres HTML peligrosos
    safeHtml = safeHtml.replace(/MATHBLOCKPLACEHOLDER(\d+)END/g, (_, i) =>
      escapeHtml(mathTokens[Number(i)])
    );
    safeHtml = safeHtml.replace(/MATHINLINEPLACEHOLDER(\d+)END/g, (_, i) =>
      escapeHtml(mathTokens[Number(i)])
    );

    return safeHtml;
  }

  /* ------------------------------------------------------------------------
     Postprocesamiento del DOM sanitizado
     ------------------------------------------------------------------------ */
  function removeDuplicateH1(container) {
    const first = container.firstElementChild;
    if (first && first.tagName === "H1") {
      first.remove();
    }
  }

  function enhanceCallouts(container) {
    const map = {
      NOTE: { cls: "callout-note", label: "Nota" },
      NOTA: { cls: "callout-note", label: "Nota" },
      TIP: { cls: "callout-tip", label: "Consejo" },
      CONSEJO: { cls: "callout-tip", label: "Consejo" },
      IMPORTANT: { cls: "callout-important", label: "Importante" },
      IMPORTANTE: { cls: "callout-important", label: "Importante" },
      WARNING: { cls: "callout-warning", label: "Advertencia" },
      ADVERTENCIA: { cls: "callout-warning", label: "Advertencia" },
      CAUTION: { cls: "callout-caution", label: "Precaución" },
      PRECAUCION: { cls: "callout-caution", label: "Precaución" }
    };

    container.querySelectorAll("blockquote").forEach((bq) => {
      const firstP = bq.querySelector("p");
      if (!firstP) return;

      const match = firstP.innerHTML.match(/^\s*\[!(NOTE|NOTA|TIP|CONSEJO|IMPORTANT|IMPORTANTE|WARNING|ADVERTENCIA|CAUTION|PRECAUCION)\]\s*(?:<br\s*\/?>|\n)?/i);
      if (!match) return;

      const key = match[1].toUpperCase();
      const info = map[key];
      if (!info) return;

      firstP.innerHTML = firstP.innerHTML.slice(match[0].length).trim();
      if (!firstP.innerHTML) firstP.remove();

      const wrapper = document.createElement("div");
      wrapper.className = `callout ${info.cls}`;

      const titleEl = document.createElement("span");
      titleEl.className = "callout-title";
      titleEl.textContent = info.label;
      wrapper.appendChild(titleEl);

      while (bq.firstChild) {
        wrapper.appendChild(bq.firstChild);
      }

      bq.replaceWith(wrapper);
    });
  }

  function enhanceMediaAndLinks(container) {
    container.querySelectorAll("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (src) {
        img.setAttribute("src", resolveSitePath(src));
      }
      img.loading = "lazy";
      img.decoding = "async";
    });

    container.querySelectorAll("a[href]").forEach((a) => {
      const href = a.getAttribute("href") || "";
      if (/^https?:\/\//i.test(href)) {
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    });

    container.querySelectorAll("table").forEach((table) => {
      if (table.parentElement && table.parentElement.classList.contains("tablewrap")) {
        return;
      }
      const wrap = document.createElement("div");
      wrap.className = "tablewrap";
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });
  }

  async function copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }

  function enhanceCodeBlocks(container) {
    container.querySelectorAll("pre").forEach((pre) => {
      const code = pre.querySelector("code");
      if (!code) return;

      const rawCode = code.textContent || "";
      const langMatch = code.className.match(/language-([a-z0-9_+-]+)/i);
      let langLabel = langMatch ? langMatch[1] : "";

      if (typeof window.hljs !== "undefined") {
        try {
          window.hljs.highlightElement(code);
          if (!langLabel && code.result && code.result.language) {
            langLabel = code.result.language;
          }
        } catch (e) { }
      }

      const wrapper = document.createElement("div");
      wrapper.className = "code-block";

      const header = document.createElement("div");
      header.className = "code-header";

      const langSpan = document.createElement("span");
      langSpan.className = "code-lang";
      langSpan.textContent = langLabel || "código";

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "copy-btn";
      copyBtn.textContent = "Copiar";
      copyBtn.setAttribute("aria-label", "Copiar código al portapapeles");

      copyBtn.addEventListener("click", async () => {
        try {
          await copyToClipboard(rawCode);
          copyBtn.textContent = "Copiado ✓";
          copyBtn.classList.add("copied");
          setTimeout(() => {
            copyBtn.textContent = "Copiar";
            copyBtn.classList.remove("copied");
          }, 1800);
        } catch (e) {
          copyBtn.textContent = "Error";
          setTimeout(() => {
            copyBtn.textContent = "Copiar";
          }, 1800);
        }
      });

      header.appendChild(langSpan);
      header.appendChild(copyBtn);

      pre.parentNode.insertBefore(wrapper, pre);
      wrapper.appendChild(header);
      wrapper.appendChild(pre);
    });
  }

  function buildToc(container) {
    const headings = Array.from(container.querySelectorAll("h2, h3"));
    const usedIds = new Map();

    els.tocItems.innerHTML = "";
    els.mobileTocList.innerHTML = "";

    if (!headings.length) {
      els.tocCard.hidden = true;
      els.mobileToc.hidden = true;
      return;
    }

    headings.forEach((h) => {
      const base = slugify(h.textContent);
      const count = usedIds.get(base) || 0;
      usedIds.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count}`;
      h.id = id;

      const makeLink = () => {
        const a = document.createElement("a");
        a.href = "#" + id;
        a.textContent = h.textContent;
        if (h.tagName === "H3") a.className = "sub";
        a.addEventListener("click", (e) => {
          e.preventDefault();
          h.scrollIntoView({ behavior: "smooth" });
          if (els.mobileToc.open) els.mobileToc.open = false;
        });
        return a;
      };

      els.tocItems.appendChild(makeLink());
      els.mobileTocList.appendChild(makeLink());
    });

    els.tocCard.hidden = false;
    els.mobileToc.hidden = false;
    els.mobileToc.dataset.hasItems = "true";

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const targetHref = "#" + entry.target.id;
            els.tocItems
              .querySelectorAll("a")
              .forEach((a) => a.classList.toggle("on", a.getAttribute("href") === targetHref));
          }
        });
      },
      { rootMargin: "-76px 0px -70% 0px" }
    );

    headings.forEach((h) => spy.observe(h));
  }

  function prepareMermaidBlocks(container) {
    container
      .querySelectorAll("pre > code.language-mermaid, pre > code.lang-mermaid")
      .forEach((code) => {
        const div = document.createElement("div");
        div.className = "mermaid";
        div.textContent = code.textContent;
        code.parentElement.replaceWith(div);
      });
  }

  async function renderMermaid(container) {
    if (typeof window.mermaid === "undefined") return;
    const nodes = container.querySelectorAll(".mermaid");
    if (!nodes.length) return;

    const isLight = document.documentElement.dataset.theme === "light";
    window.mermaid.initialize({
      startOnLoad: false,
      theme: isLight ? "default" : "dark",
      securityLevel: "strict"
    });

    try {
      await window.mermaid.run({ nodes });
    } catch (err) {
      console.error("Error al renderizar diagramas Mermaid:", err);
    }
  }

  async function typesetMath(container) {
    const maxWaitMs = 6000;
    const start = Date.now();

    while (
      (!window.MathJax || typeof window.MathJax.typesetPromise !== "function") &&
      Date.now() - start < maxWaitMs
    ) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (window.MathJax && typeof window.MathJax.typesetPromise === "function") {
      if (window.MathJax.startup && window.MathJax.startup.promise) {
        await window.MathJax.startup.promise;
      }
      await window.MathJax.typesetPromise([container]);
    }
  }

  function renderRelated(current, allArticles) {
    const others = allArticles.filter((a) => a.id !== current.id);
    if (!others.length) {
      els.relatedSection.hidden = true;
      return;
    }

    const currentTags = new Set((current.tags || []).map((t) => t.toLowerCase()));
    const scored = others
      .map((a) => {
        let score = a.category === current.category ? 3 : 0;
        (a.tags || []).forEach((t) => {
          if (currentTags.has(t.toLowerCase())) score += 1;
        });
        return { article: a, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.article);

    els.relatedGrid.innerHTML = scored
      .map(
        (a) => `
          <a class="related-card" href="leer.html?id=${encodeURIComponent(a.id)}">
            <small>${escapeHtml(a.category || "Artículo")}</small>
            <strong>${escapeHtml(a.title)}</strong>
            <span>${escapeHtml(formatDate(a.date))}${a.readingTime ? ` · ${a.readingTime} min` : ""}</span>
          </a>
        `
      )
      .join("");

    els.relatedSection.hidden = false;
  }

  function initReadingProgress() {
    if (!els.progress) return;
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const pct = docHeight > 0 ? Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)) : 0;
      els.progress.style.width = pct.toFixed(2) + "%";
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
  }

  function populateHeader(article) {
    document.title = `${article.title} | Cristian J.`;

    const shortTitle =
      article.title.length > 40 ? article.title.slice(0, 40) + "…" : article.title;
    els.crumbs.innerHTML = `
      <a href="../index.html" aria-label="Inicio">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3 2 12h3v9h5v-6h4v6h5v-9h3z" />
        </svg>
      </a>
      <span>›</span>
      <a href="index.html">Artículos</a>
      ${article.category ? `<span>›</span><a href="index.html?category=${encodeURIComponent(article.category)}">${escapeHtml(article.category)}</a>` : ""}
      <span>›</span>
      <span class="cur">${escapeHtml(shortTitle)}</span>
    `;

    els.category.textContent = article.category || "General";
    els.category.href = `index.html?category=${encodeURIComponent(article.category || "")}`;

    els.date.textContent = formatDate(article.date);
    els.date.dateTime = article.date || "";
    els.readingTime.textContent = article.readingTime
      ? `${article.readingTime} min de lectura`
      : "";

    els.title.textContent = article.title;
    els.description.textContent = article.description || "";
    els.description.hidden = !article.description;

    els.author.textContent = article.author ? `Por ${article.author}` : "";

    const tags = Array.isArray(article.tags) ? article.tags : [];
    els.tags.innerHTML = tags
      .map(
        (tag) =>
          `<a class="tag-pill" href="index.html?tag=${encodeURIComponent(tag)}">#${escapeHtml(tag)}</a>`
      )
      .join("");

    const coverSrc = resolveSitePath(article.cover);
    if (coverSrc) {
      els.cover.src = coverSrc;
      els.cover.alt = article.title;
      els.cover.onerror = () => {
        els.coverWrap.hidden = true;
      };
      els.coverWrap.hidden = false;
    } else {
      els.coverWrap.hidden = true;
    }
  }

  async function init() {
    const params = new URLSearchParams(window.location.search);
    const articleId = (params.get("id") || "").trim();

    if (!articleId) {
      showError(
        "No se especificó ningún artículo",
        "Selecciona una publicación desde el catálogo para leerla."
      );
      return;
    }

    let articles = [];
    try {
      const res = await fetch(DATA_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      articles = await res.json();
    } catch (err) {
      showError(
        "Error al cargar el catálogo",
        "No fue posible leer el registro central de artículos (data/articles.json)."
      );
      return;
    }

    const article = Array.isArray(articles)
      ? articles.find((item) => item.id === articleId)
      : null;

    if (!article) {
      showError(
        "Artículo no registrado",
        `No existe ninguna publicación con el identificador "${articleId}" en el catálogo.`
      );
      return;
    }

    let markdown = "";
    try {
      const mdUrl = resolveSitePath(article.path);
      const mdRes = await fetch(mdUrl, { cache: "no-cache" });
      if (!mdRes.ok) {
        throw new Error(`HTTP ${mdRes.status}`);
      }
      markdown = await mdRes.text();
    } catch (err) {
      showError(
        "Archivo Markdown no disponible",
        `No se pudo cargar el archivo fuente del artículo (${article.path}). Verifica que el archivo exista en el repositorio.`
      );
      return;
    }

    try {
      populateHeader(article);
      const safeHtml = renderMarkdownSafely(markdown);
      els.content.innerHTML = safeHtml;

      removeDuplicateH1(els.content);
      enhanceCallouts(els.content);
      enhanceMediaAndLinks(els.content);
      prepareMermaidBlocks(els.content);
      enhanceCodeBlocks(els.content);
      buildToc(els.content);
      renderRelated(article, articles);

      els.loading.hidden = true;
      els.article.hidden = false;

      initReadingProgress();
      await renderMermaid(els.content);
      await typesetMath(els.content);
    } catch (err) {
      showError(
        "Error al renderizar el artículo",
        err && err.message
          ? err.message
          : "Ocurrió un problema inesperado al procesar el contenido Markdown."
      );
    }
  }

  init();
})();