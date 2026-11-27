/**
 * S#1 - Agente Interactivo tipo Videollamada (100% Frontend, sin APIs externas)
 * Conectado a js/guion-agente.js
 */
(() => {
  const GUION = window.GUION_AGENTE;
  if (!GUION) {
    console.error('Falta cargar /js/guion-agente.js antes de /js/agente.js');
    return;
  }

  const KNOWLEDGE = GUION.BLOQUES;
  const INITIAL_OPTIONS = GUION.OPCIONES_INICIALES;

  let voiceEnabled = true;
  let interacciones = 0;

  const orb = document.getElementById('agent-orb');
  const stateEl = document.getElementById('agent-state');
  const speechEl = document.getElementById('agent-speech');
  const closingEl = document.getElementById('agent-closing');
  const repliesEl = document.getElementById('quick-replies');

  function hablar(texto) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!voiceEnabled) return;

    const utter = new SpeechSynthesisUtterance(texto);
    utter.lang = 'es-ES';
    utter.rate = 1.03;

    utter.onstart = () => {
      orb.classList.add('speaking');
      stateEl.textContent = 'Agente hablando...';
    };
    utter.onend = () => {
      orb.classList.remove('speaking');
      stateEl.textContent = 'En línea • Escuchando';
    };
    utter.onerror = () => {
      orb.classList.remove('speaking');
      stateEl.textContent = 'En línea • Esperando consulta';
    };

    window.speechSynthesis.speak(utter);
  }

  function renderOptions(options) {
    repliesEl.innerHTML = options.map((opt) => `
      <button type="button" class="chip-btn ${opt.cta ? 'cta' : ''}" data-intent="${opt.intent}">
        ${opt.label}
      </button>
    `).join('');

    repliesEl.querySelectorAll('.chip-btn').forEach((btn) => {
      btn.addEventListener('click', () => responderPorIntent(btn.dataset.intent));
    });
  }

  function responderPorIntent(intentKey) {
    const item = KNOWLEDGE[intentKey] || KNOWLEDGE.fallback;
    interacciones++;

    // Tras 2+ preguntas técnicas, sube el tono a cierre agresivo automáticamente
    const closingText = (interacciones >= 3 && item.fase !== 'cierre' && !item.redirect)
      ? GUION.CIERRE_AGRESIVO_AUTO
      : item.closing;

    speechEl.textContent = item.answer;
    closingEl.textContent = closingText;
    renderOptions(item.options || []);
    hablar(`${item.answer} ${closingText}`);

    if (item.redirect) {
      setTimeout(() => { window.location.href = item.redirect; }, 2200);
    }
  }

  function detectarIntencion(texto) {
    const clean = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const palabras = clean.split(/\s+/).filter(Boolean);

    // Ignora palabras de relleno ("hola", "quisiera", "saber"...) para detectar la intención real
    const palabrasUtiles = palabras.filter((p) => !GUION.RELLENO.includes(p));
    const textoFiltrado = palabrasUtiles.length > 0 ? palabrasUtiles.join(' ') : clean;

    let mejorIntent = 'fallback';
    let maxPuntos = 0;

    for (const [key, data] of Object.entries(KNOWLEDGE)) {
      if (!data.keywords || data.keywords.length === 0) continue;
      let puntos = 0;

      for (const kw of data.keywords) {
        const kwClean = kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (textoFiltrado.includes(kwClean)) {
          puntos += (key === 'saludo_puro') ? 1 : 3;
        }
      }

      if (puntos > maxPuntos) {
        maxPuntos = puntos;
        mejorIntent = key;
      }
    }

    return mejorIntent;
  }

  document.addEventListener('DOMContentLoaded', () => {
    renderOptions(INITIAL_OPTIONS);

    // Enviar pregunta escrita
    document.getElementById('agent-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const input = document.getElementById('agent-input');
      const query = input.value.trim();
      if (!query) return;
      input.value = '';
      const intent = detectarIntencion(query);
      responderPorIntent(intent);
    });

    // RECONOCIMIENTO DE VOZ NATIVO (100% FRONTEND - ANDROID & IOS)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const btnMic = document.getElementById('btn-mic');

    if (SpeechRecognition && btnMic) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-ES';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      let isListening = false;

      btnMic.addEventListener('click', () => {
        if (isListening) {
          recognition.stop();
          return;
        }
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        orb.classList.remove('speaking');

        try {
          recognition.start();
        } catch (err) {
          stateEl.textContent = 'Toca el micrófono de nuevo';
        }
      });

      recognition.onstart = () => {
        isListening = true;
        btnMic.textContent = '⏹';
        btnMic.style.background = '#fff';
        btnMic.style.color = '#000';
        stateEl.textContent = '🎙️ Escuchando tu voz...';
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const input = document.getElementById('agent-input');
        if (input) input.value = transcript;

        const intent = detectarIntencion(transcript);
        setTimeout(() => {
          if (input) input.value = '';
          responderPorIntent(intent);
        }, 350);
      };

      recognition.onerror = (e) => {
        stateEl.textContent = e.error === 'not-allowed'
          ? 'Permiso de micrófono denegado'
          : 'No te escuché bien, intenta de nuevo';
      };

      recognition.onend = () => {
        isListening = false;
        btnMic.textContent = '🎤';
        btnMic.style.background = '#141414';
        btnMic.style.color = '#fff';
      };
    } else if (btnMic) {
      btnMic.style.display = 'none';
    }

    // Silenciar / Activar voz
    const btnVoice = document.getElementById('btn-toggle-voice');
    btnVoice.addEventListener('click', () => {
      voiceEnabled = !voiceEnabled;
      btnVoice.textContent = voiceEnabled ? '🔊 Voz: ON' : '🔇 Voz: OFF';
      if (!voiceEnabled && 'speechSynthesis' in window) window.speechSynthesis.cancel();
      orb.classList.remove('speaking');
    });

    // Volver al panel según el rol (ADMIN -> panel.html, SUPERVISOR -> flujo.html)
    document.getElementById('btn-back').addEventListener('click', () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      const sesion = typeof SodieBiometria !== 'undefined' ? SodieBiometria.obtenerSesion() : null;
      window.location.href = (sesion && sesion.role === 'ADMIN') ? '/panel.html' : '/flujo.html';
    });
  });
})();
