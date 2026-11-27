/**
 * S#1 - Agente Interactivo tipo Videollamada (100% Frontend, sin APIs externas)
 */
(() => {
  let voiceEnabled = true;

  // Base de conocimiento determinista: cada respuesta incluye pregunta de cierre y siguientes botones
  const KNOWLEDGE = {
    precio: {
      keywords: ['precio', 'cuesta', 'costo', 'valor', 'pagar', 'pago', '50', '50000', 'usdc', 'inversion', 'inversión'],
      answer: 'La licencia anual corporativa es de $50,000 USDC en un solo pago, sin mensualidades ocultas ni comisiones sobre tu facturación. Solo operamos con 4 cupos activos a la vez.',
      closing: '¿Tu operación actual ya invierte en adquisición o estás por escalar una nueva oferta?',
      options: [
        { label: 'Ya invertimos en pauta', intent: 'escalar' },
        { label: '¿Cómo es el contrato?', intent: 'contrato' },
        { label: 'Reservar cupo ahora ➔', intent: 'cerrar', cta: true }
      ]
    },
    seguridad: {
      keywords: ['meta', 'cuenta', 'seguridad', 'acceso', 'ban', 'bloqueo', 'control', 'datos', 'contraseña'],
      answer: 'Tú mantienes el 100% del control de tu cuenta publicitaria y tus activos. El sistema inyecta borradores estructurados cada 72 horas sin retener tus fondos ni exigir accesos riesgosos.',
      closing: '¿Quieres revisar cómo protegemos el acuerdo legalmente o pasar directo a la activación?',
      options: [
        { label: 'Ver respaldo y contrato', intent: 'contrato' },
        { label: '¿Cuánto tarda en activar?', intent: 'tiempo' },
        { label: 'Ir a activación ➔', intent: 'cerrar', cta: true }
      ]
    },
    tiempo: {
      keywords: ['tiempo', 'tarda', 'rapido', 'rápido', 'dias', 'días', 'horas', 'implementacion', 'implementación', 'cuando'],
      answer: 'El alta biométrica, firma digital e inyección inicial toman menos de 10 minutos. Las campañas entran en protocolo de maduración con radar cada 4 horas y ciclos de actualización cada 72 horas.',
      closing: '¿Te gustaría activar tu licencia hoy mismo o prefieres validar el precio primero?',
      options: [
        { label: 'Validar precio y cupos', intent: 'precio' },
        { label: 'Seguridad de cuenta', intent: 'seguridad' },
        { label: 'Activar ahora ➔', intent: 'cerrar', cta: true }
      ]
    },
    contrato: {
      keywords: ['contrato', 'legal', 'garantia', 'garantía', 'terminos', 'términos', 'factura', 'respaldo'],
      answer: 'Todo queda respaldado con contrato digital firmado al instante, registrando ID único de cliente, IP, marca de tiempo y términos de uso corporativo antes de abrir tu panel.',
      closing: '¿Tienes alguna otra duda técnica o avanzamos al flujo de activación?',
      options: [
        { label: '¿Cuánto tarda todo?', intent: 'tiempo' },
        { label: '¿Cómo funciona la pauta?', intent: 'seguridad' },
        { label: 'Iniciar activación ➔', intent: 'cerrar', cta: true }
      ]
    },
    escalar: {
      keywords: ['escalar', 'roas', 'resultados', 'ventas', 'clientes', 'agencia', 'funciona'],
      answer: 'Perfecto. Al ya tener pauta activa, eliminas el tráfico vacío desde el primer ciclo de 72 horas y ahorras miles de dólares en pruebas manuales o igualas de agencias tradicionales.',
      closing: 'Con tu volumen actual, un solo ajuste paga la licencia. ¿Bloqueamos uno de los cupos disponibles?',
      options: [
        { label: 'Ver seguridad de cuenta', intent: 'seguridad' },
        { label: 'Ver contrato digital', intent: 'contrato' },
        { label: 'Bloquear mi cupo ➔', intent: 'cerrar', cta: true }
      ]
    },
    cerrar: {
      keywords: ['comprar', 'reservar', 'activar', 'listo', 'empezar', 'quiero', 'cupo'],
      answer: 'Excelente decisión. Te llevo directo a la pasarela de activación para seleccionar tu wallet, generar tu ID y firmar tu contrato.',
      closing: 'Redirigiendo al flujo de activación...',
      redirect: '/flujo.html',
      options: []
    },
    fallback: {
      answer: 'Buena pregunta. Para darte una respuesta exacta, nuestro sistema se enfoca en 3 pilares: licencia anual cerrada, control total de tu cuenta y despliegue en minutos.',
      closing: '¿Cuál de estos puntos te gustaría profundizar ahora?',
      options: [
        { label: 'Precio y cupos', intent: 'precio' },
        { label: 'Seguridad y Meta', intent: 'seguridad' },
        { label: 'Tiempos y contrato', intent: 'tiempo' },
        { label: 'Activar cupo ➔', intent: 'cerrar', cta: true }
      ]
    }
  };

  const INITIAL_OPTIONS = [
    { label: '¿Cuál es el precio?', intent: 'precio' },
    { label: 'Seguridad de mi cuenta', intent: 'seguridad' },
    { label: '¿Cuánto tarda activar?', intent: 'tiempo' },
    { label: 'Respaldo y contrato', intent: 'contrato' }
  ];

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
    speechEl.textContent = item.answer;
    closingEl.textContent = item.closing;
    renderOptions(item.options || []);
    hablar(`${item.answer} ${item.closing}`);

    if (item.redirect) {
      setTimeout(() => { window.location.href = item.redirect; }, 2200);
    }
  }

  function detectarIntencion(texto) {
    const clean = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [key, data] of Object.entries(KNOWLEDGE)) {
      if (!data.keywords) continue;
      if (data.keywords.some((kw) => clean.includes(kw.normalize('NFD').replace(/[\u0300-\u036f]/g, '')))) {
        return key;
      }
    }
    return 'fallback';
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
        // Calla al agente si estaba hablando antes de escucharte
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
        if (input) input.value = transcript; // Muestra brevemente lo que entendió

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
      btnMic.style.display = 'none'; // Oculta el botón si el navegador no soporta voz
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
