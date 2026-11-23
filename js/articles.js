/* ==========================================================================
   Catálogo de Artículos (articulos/index.html)
   Carga data/articles.json y gestiona filtros, búsqueda y ordenamiento.
   ========================================================================== */

(function () {
  const SITE_ROOT = "../";
  const DATA_URL = SITE_ROOT + "data/articles.json";

  const state = {
    articles: [],
    category: "Todas",
    tag: "",
    query: "",
    sort: "desc"
  };

  const els = {
    grid: document.getElementById("articles-grid"),
    categories: document.getElementById("category-filters"),
    activeFilters: document.getElementById("active-filters"),
    resultsCount: document.getElementById("results-count"),
    search: document.getElementById("article-search"),
    sort: document.getElementById("sort-select"),
    loading: document.getElementById("catalog-loading"),
    empty: document.getElementById("empty-state"),
    error: document.getElementById("error-state"),
    errorMsg: document.getElementById("error-message"),
    clearBtn: document.getElementById("clear-filters")
  };

  if (!els.grid) return;

  function resolveSitePath(relPath) {
    if (!relPath) return "";
    if (/^(https?:|data:|\/\/)/i.test(relPath)) return relPath;
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

  function normalizeText(str) {
    return String(str || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
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

  function readInitialParams() {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("category");
    const tag = params.get("tag");
    const q = params.get("q");
    if (cat) state.category = cat;
    if (tag) state.tag = tag;
    if (q) {
      state.query = q;
      if (els.search) els.search.value = q;
    }
  }

  function renderCategories() {
    const uniqueCats = Array.from(
      new Set(state.articles.map((a) => a.category).filter(Boolean))
    );
    const categories = ["Todas", ...uniqueCats];

    if (!categories.includes(state.category)) {
      state.category = "Todas";
    }

    els.categories.innerHTML = categories
      .map((cat) => {
        const isActive = cat === state.category;
        return `<button type="button" class="cat-pill${isActive ? " active" : ""}" data-category="${escapeHtml(cat)}" aria-pressed="${isActive}">${escapeHtml(cat)}</button>`;
      })
      .join("");

    els.categories.querySelectorAll(".cat-pill").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.category = btn.dataset.category;
        renderCategories();
        renderArticles();
      });
    });
  }

  function renderActiveFilters() {
    const chips = [];
    if (state.tag) {
      chips.push(
        `<span class="filter-chip">Etiqueta: ${escapeHtml(state.tag)} <button type="button" data-clear="tag" aria-label="Quitar filtro de etiqueta">×</button></span>`
      );
    }
    if (state.query.trim()) {
      chips.push(
        `<span class="filter-chip">Búsqueda: “${escapeHtml(state.query.trim())}” <button type="button" data-clear="query" aria-label="Quitar búsqueda">×</button></span>`
      );
    }
    els.activeFilters.innerHTML = chips.join("");

    els.activeFilters.querySelectorAll("button[data-clear]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.dataset.clear === "tag") state.tag = "";
        if (btn.dataset.clear === "query") {
          state.query = "";
          if (els.search) els.search.value = "";
        }
        renderArticles();
      });
    });
  }

  function getFilteredArticles() {
    const qNorm = normalizeText(state.query.trim());
    const tagNorm = normalizeText(state.tag);

    const filtered = state.articles.filter((article) => {
      if (state.category !== "Todas" && article.category !== state.category) {
        return false;
      }

      const tags = Array.isArray(article.tags) ? article.tags : [];
      if (tagNorm && !tags.some((t) => normalizeText(t) === tagNorm)) {
        return false;
      }

      if (qNorm) {
        const haystack = normalizeText(
          [article.title, article.description, article.category, ...tags].join(" ")
        );
        if (!haystack.includes(qNorm)) return false;
      }

      return true;
    });

    filtered.sort((a, b) => {
      const da = new Date((a.date || "1970-01-01") + "T00:00:00").getTime();
      const db = new Date((b.date || "1970-01-01") + "T00:00:00").getTime();
      return state.sort === "asc" ? da - db : db - da;
    });

    return filtered;
  }

  function renderCard(article) {
    const url = `leer.html?id=${encodeURIComponent(article.id)}`;
    const coverSrc = resolveSitePath(article.cover);
    const tags = Array.isArray(article.tags) ? article.tags : [];
    const readingTime = article.readingTime
      ? `${article.readingTime} min de lectura`
      : "";

    const coverHtml = coverSrc
      ? `<a class="article-card-cover" href="${url}" tabindex="-1" aria-hidden="true">
           <img src="${escapeHtml(coverSrc)}" alt="${escapeHtml(article.title)}" loading="lazy" onerror="this.parentElement.remove()">
         </a>`
      : "";

    const tagsHtml = tags.length
      ? `<div class="tag-list">${tags
          .map(
            (tag) =>
              `<button type="button" class="tag-pill" data-tag="${escapeHtml(tag)}">#${escapeHtml(tag)}</button>`
          )
          .join("")}</div>`
      : "";

    return `
      <article class="article-card">
        ${coverHtml}
        <div class="article-card-body">
          <div class="article-card-meta">
            <span class="badge-category">${escapeHtml(article.category || "General")}</span>
            ${article.date ? `<span>·</span><time datetime="${escapeHtml(article.date)}">${escapeHtml(formatDate(article.date))}</time>` : ""}
            ${readingTime ? `<span>·</span><span>${escapeHtml(readingTime)}</span>` : ""}
          </div>
          <h2 class="article-card-title">
            <a href="${url}">${escapeHtml(article.title)}</a>
          </h2>
          <p class="article-card-desc">${escapeHtml(article.description || "")}</p>
          ${tagsHtml}
          <div class="article-card-footer">
            <span class="article-card-author">${escapeHtml(article.author || "Cristian J.")}</span>
            <a class="read-link" href="${url}">Leer artículo →</a>
          </div>
        </div>
      </article>
    `;
  }

  function renderArticles() {
    renderActiveFilters();
    const list = getFilteredArticles();

    els.resultsCount.textContent =
      list.length === 1 ? "1 artículo" : `${list.length} artículos`;

    if (list.length === 0) {
      els.grid.hidden = true;
      els.empty.hidden = false;
      return;
    }

    els.empty.hidden = true;
    els.grid.hidden = false;
    els.grid.innerHTML = list.map(renderCard).join("");

    els.grid.querySelectorAll(".tag-pill[data-tag]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.tag = btn.dataset.tag;
        renderArticles();
      });
    });
  }

  function bindEvents() {
    if (els.search) {
      els.search.addEventListener("input", (e) => {
        state.query = e.target.value;
        renderArticles();
      });

      window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
          e.preventDefault();
          els.search.focus();
        }
      });
    }

    if (els.sort) {
      els.sort.addEventListener("change", (e) => {
        state.sort = e.target.value;
        renderArticles();
      });
    }

    if (els.clearBtn) {
      els.clearBtn.addEventListener("click", () => {
        state.category = "Todas";
        state.tag = "";
        state.query = "";
        if (els.search) els.search.value = "";
        renderCategories();
        renderArticles();
      });
    }
  }

  async function init() {
    readInitialParams();
    bindEvents();

    try {
      const response = await fetch(DATA_URL, { cache: "no-cache" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} al cargar el catálogo.`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error("El formato de data/articles.json debe ser un arreglo JSON.");
      }

      state.articles = data;
      els.loading.hidden = true;
      renderCategories();
      renderArticles();
    } catch (err) {
      els.loading.hidden = true;
      els.grid.hidden = true;
      els.empty.hidden = true;
      els.error.hidden = false;
      if (els.errorMsg) {
        els.errorMsg.textContent =
          err && err.message
            ? err.message
            : "No se pudo obtener la lista de artículos.";
      }
    }
  }

  init();
})();
