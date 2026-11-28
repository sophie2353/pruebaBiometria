/**
 * S#1 - Controlador de Moods (js/moods.js)
 * 0 clics: Original (abajo) -> 1 clic: Morado (medio) -> 2 clics: Glass/Menta (arriba) -> 3 clics: Original
 * En agente.html solo aplica el mood configurado sin mostrar el botón.
 */
(() => {
  const THEMES = ['original', 'purple-dark', 'glass-mint'];

  function aplicarTema(theme) {
    const valid = THEMES.includes(theme) ? theme : 'original';
    document.documentElement.setAttribute('data-theme', valid);
    localStorage.setItem('sodie_mood', valid);
  }

  // Aplica de inmediato para evitar parpadeos
  aplicarTema(localStorage.getItem('sodie_mood') || 'original');

  document.addEventListener('DOMContentLoaded', () => {
    const isAgente = window.location.pathname.includes('agente');
    if (isAgente) return; // El visitante en agente.html solo ve el mood ya configurado

    const rail = document.createElement('button');
    rail.type = 'button';
    rail.id = 'mood-vertical-switcher';
    rail.className = 'mood-vertical-rail';
    rail.title = 'Cambiar Mood (Original / Morado / Glass)';
    rail.innerHTML = '<span class="mood-vertical-thumb"></span>';

    rail.addEventListener('click', () => {
      const current = localStorage.getItem('sodie_mood') || 'original';
      const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
      aplicarTema(next);
    });

    document.body.appendChild(rail);
  });
})();
