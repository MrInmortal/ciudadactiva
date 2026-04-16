function getCurrentAuthorityUser() {
  return JSON.parse(localStorage.getItem("user"));
}

function requireAuthority() {
  const user = getCurrentAuthorityUser();

  if (!user || (user.rol !== "autoridad" && user.rol !== "admin")) {
    alert("No tienes permisos para entrar aquí.");
    window.location.href = "foro.html";
    return null;
  }

  return user;
}

function requireAdmin() {
  const user = getCurrentAuthorityUser();

  if (!user || user.rol !== "admin") {
    alert("Solo un administrador puede entrar aquí.");
    window.location.href = "dashboard-autoridad.html";
    return null;
  }

  return user;
}

function renderAuthoritySidebar(activePage) {
  const user = getCurrentAuthorityUser();
  if (!user) return;

  const rolesLink =
    user.rol === "admin"
      ? `<a href="dashboard-roles.html" class="${activePage === "roles" ? "active" : ""}">
                <span class="nav-icon">👥</span>
                <span>Roles</span>
           </a>`
      : "";

  const mount = document.getElementById("authoritySidebarMount");
  if (!mount) return;

  mount.className = "authority-sidebar-shell";

  mount.innerHTML = `
        <div class="authority-mobile-overlay" id="authorityMobileOverlay"></div>

        <aside class="authority-sidebar" id="authoritySidebar">
            <div class="authority-sidebar-top">
                <div class="authority-brand">
<div class="authority-brand-logo">
    <img src="/img/redi.png" alt="CiudadActiva">
</div>
                    <div>
                        <strong>CiudadActiva</strong>
                        <small>Panel de Autoridades</small>
                    </div>
                </div>

                <button class="authority-sidebar-close" id="authoritySidebarClose" type="button" aria-label="Cerrar menú">
                    ×
                </button>
            </div>

            <div class="authority-userbox">
                <div class="authority-user-avatar">
                    ${(user.nombre || "U").charAt(0).toUpperCase()}
                </div>
                <div class="authority-userbox-text">
                    <div class="authority-userbox-name">${escapeHTML(user.nombre)} ${escapeHTML(user.apellido || "")}</div>
                    <div class="authority-userbox-role">${capitalizar(user.rol || "ciudadano")}</div>
                </div>
            </div>

            <div class="authority-section-label">Navegación</div>

            <nav class="authority-nav">
                <a href="dashboard-autoridad.html" class="${activePage === "dashboard" ? "active" : ""}">
                    <span class="nav-icon">📊</span>
                    <span>Dashboard</span>
                </a>

                <a href="dashboard-reportes.html" class="${activePage === "reportes" ? "active" : ""}">
                    <span class="nav-icon">📝</span>
                    <span>Reportes</span>
                </a>

                ${rolesLink}
            </nav>

            <div class="authority-sidebar-spacer"></div>

            <div class="authority-sidebar-bottom">
                <button class="theme-toggle-btn authority-theme-btn" type="button" data-theme-toggle>🌙 Modo oscuro</button>
                <a href="foro.html" class="btn-login authority-side-btn">Volver al foro</a>
                <a href="perfil.html" class="btn-login authority-side-btn">Mi perfil</a>
                <button class="btn-primary authority-side-btn" type="button" onclick="cerrarSesion()">Cerrar sesión</button>
            </div>
        </aside>
    `;

  inicializarSidebarMovil();
}

function renderAuthorityMobileTop(title) {
  const mount = document.getElementById("authorityMobileTop");
  if (!mount) return;

  mount.innerHTML = `
        <div class="authority-mobile-top">
            <div class="authority-mobile-left">
                <button class="authority-burger" id="authorityBurger" type="button" aria-label="Abrir menú">
                    ☰
                </button>

                <div>
                    <h1 class="authority-page-title authority-page-title-mobile">${title}</h1>
                </div>
            </div>

            <button class="theme-toggle-btn authority-mobile-theme" type="button" data-theme-toggle>🌙</button>
        </div>
    `;

  const burger = document.getElementById("authorityBurger");
  if (burger) {
    burger.addEventListener("click", abrirSidebarMovil);
  }
}

function inicializarSidebarMovil() {
  const closeBtn = document.getElementById("authoritySidebarClose");
  const overlay = document.getElementById("authorityMobileOverlay");

  if (closeBtn) {
    closeBtn.addEventListener("click", cerrarSidebarMovil);
  }

  if (overlay) {
    overlay.addEventListener("click", cerrarSidebarMovil);
  }
}

function abrirSidebarMovil() {
  const sidebar = document.getElementById("authoritySidebar");
  const overlay = document.getElementById("authorityMobileOverlay");

  if (sidebar) sidebar.classList.add("open");
  if (overlay) overlay.classList.add("open");
  document.body.classList.add("authority-lock");
}

function cerrarSidebarMovil() {
  const sidebar = document.getElementById("authoritySidebar");
  const overlay = document.getElementById("authorityMobileOverlay");

  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("open");
  document.body.classList.remove("authority-lock");
}

function cerrarSesion() {
  localStorage.removeItem("user");
  window.location.href = "login.html";
}

function capitalizar(texto) {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatearFecha(fecha) {
  if (!fecha) return "-";
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return "-";

  return d.toLocaleDateString("es-DO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHTML(valor) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
