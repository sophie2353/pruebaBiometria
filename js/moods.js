(() => {
  const THEMES = ['original', 'purple-dark', 'glass-mint'];
  const LABELS = {
    'original': '⚫ Original',
    'purple-dark': '🟣 Oscuro',
    'glass-mint': '🟢 Glass'
  };

  function aplicarTema(theme) {
    const valid = THEMES.includes(theme) ? theme : 'original';
    document.documentElement.setAttribute('data-theme', valid);
    localStorage.setItem('sodie_mood', valid);
    const btn = document.getElementById('btn-mood-toggle');
    if (btn) btn.textContent = LABELS[valid];
  }

  document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('sodie_mood') || 'original';
    aplicarTema(saved);

    // Crea un botón discreto en la esquina inferior o usa el tuyo propio
    const btn = document.getElementById('btn-mood-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const current = localStorage.getItem('sodie_mood') || 'original';
        const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
        aplicarTema(next);
      });
    }
  });
})();
