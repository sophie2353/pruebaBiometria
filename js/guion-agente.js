/**
 * S#1 - Base de Guiones del Agente (Entrada, Intermedio y Cierre Agresivo)
 * Puedes agregar hasta 400+ bloques aquí sin tocar agente.js
 */
window.GUION_AGENTE = {
  // Palabras de relleno que el motor ignora si el cliente dice "hola quisiera saber sobre..."
  RELLENO: [
    'hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'quisiera', 'quiero',
    'saber', 'sobre', 'acerca', 'dime', 'puedes', 'decir', 'como', 'funciona',
    'el', 'la', 'los', 'las', 'un', 'una', 'de', 'del', 'que', 'es', 'por', 'favor'
  ],

  OPCIONES_INICIALES: [
    { label: '¿Cuál es el precio?', intent: 'precio_base' },
    { label: 'Seguridad de mi cuenta', intent: 'seguridad_meta' },
    { label: '¿Cuánto tarda activar?', intent: 'tiempo_despliegue' },
    { label: 'Respaldo y contrato', intent: 'contrato_legal' }
  ],

  // Cierre agresivo automático que se inyecta tras 2+ preguntas técnicas
  CIERRE_AGRESIVO_AUTO: 'Ya validaste lo técnico y solo quedan 2 cupos activos este mes. ¿Bloqueamos tu acceso ahora mismo o lo dejamos pasar?',

  BLOQUES: {
    // ================= FASE: ENTRADA =================
    saludo_puro: {
      fase: 'entrada',
      keywords: ['hola', 'buenas', 'que tal', 'hey', 'saludos'],
      answer: 'Bienvenido a S#1. Estás hablando directo con el módulo técnico de activación.',
      closing: 'Para no hacerte perder tiempo: ¿quieres validar precio, seguridad de cuenta o tiempos de despliegue?',
      options: [
        { label: 'Precio y cupos', intent: 'precio_base' },
        { label: 'Seguridad de cuenta', intent: 'seguridad_meta' },
        { label: 'Activar cupo ➔', intent: 'cierre_directo', cta: true }
      ]
    },

    // ================= FASE: INTERMEDIO =================
    precio_base: {
      fase: 'intermedio',
      keywords: ['precio', 'cuesta', 'costo', 'valor', '50000', '50k', 'usdc', 'inversion', 'pagar'],
      answer: 'La licencia anual corporativa es de $50,000 USDC en un solo pago. Sin mensualidades ni comisiones sobre tus ventas.',
      closing: '¿Tu empresa ya factura en alto volumen o estás estructurando una oferta nueva?',
      options: [
        { label: 'Ya facturamos alto', intent: 'cierre_volumen' },
        { label: 'Ver contrato legal', intent: 'contrato_legal' },
        { label: 'Reservar cupo ahora ➔', intent: 'cierre_directo', cta: true }
      ]
    },

    seguridad_meta: {
      fase: 'intermedio',
      keywords: ['meta', 'facebook', 'cuenta', 'seguridad', 'ban', 'bloqueo', 'acceso', 'control'],
      answer: 'Mantienes el 100% del control de tu cuenta publicitaria y tus fondos. El sistema inyecta borradores cada 72 horas sin accesos invasivos.',
      closing: '¿Revisamos el contrato digital o pasamos directo a activar tu licencia?',
      options: [
        { label: 'Ver contrato digital', intent: 'contrato_legal' },
        { label: 'Tiempos de despliegue', intent: 'tiempo_despliegue' },
        { label: 'Activar ahora ➔', intent: 'cierre_directo', cta: true }
      ]
    },

    tiempo_despliegue: {
      fase: 'intermedio',
      keywords: ['tiempo', 'tarda', 'rapido', 'dias', 'horas', 'implementacion', 'cuando', 'arranca'],
      answer: 'El alta biométrica, firma digital e inyección inicial toman menos de 10 minutos. El radar opera cada 4 horas y los ciclos cada 72 horas.',
      closing: '¿Tienes tu wallet lista para activar hoy mismo?',
      options: [
        { label: 'Ver precio y cupos', intent: 'precio_base' },
        { label: 'Sí, activar ahora ➔', intent: 'cierre_directo', cta: true }
      ]
    },

    contrato_legal: {
      fase: 'intermedio',
      keywords: ['contrato', 'legal', 'garantia', 'terminos', 'factura', 'respaldo', 'seguro'],
      answer: 'Todo queda blindado con contrato digital instantáneo: registra tu ID único, wallet, IP y marca de tiempo antes de abrir tu panel.',
      closing: '¿Te queda alguna objeción real o cerramos tu cupo de una vez?',
      options: [
        { label: 'Ver seguridad de cuenta', intent: 'seguridad_meta' },
        { label: 'Cerrar cupo ahora ➔', intent: 'cierre_directo', cta: true }
      ]
    },

    // ================= FASE: CIERRE AGRESIVO =================
    cierre_volumen: {
      fase: 'cierre',
      keywords: ['facturamos', 'escalar', 'roas', 'agencia', 'ventas', 'alto', 'volumen'],
      answer: 'Entonces sabes exactamente cuánto dinero se quema probando campañas manuales. Un solo ajuste del primer ciclo de 72 horas paga la licencia anual completa.',
      closing: 'No hay motivo para esperar al mes que viene. ¿Activamos tu cupo ahora?',
      options: [
        { label: 'Bloquear mi cupo ➔', intent: 'cierre_directo', cta: true },
        { label: 'Ver contrato primero', intent: 'contrato_legal' }
      ]
    },

    cierre_directo: {
      fase: 'cierre',
      keywords: ['comprar', 'reservar', 'activar', 'listo', 'empezar', 'cupo', 'wallet', 'pagar ya'],
      answer: 'Perfecto. Te llevo directo a la pasarela para elegir tu wallet, generar tu ID y firmar el contrato.',
      closing: 'Abriendo terminal de activación...',
      redirect: '/flujo.html',
      options: []
    },

    fallback: {
      fase: 'intermedio',
      keywords: [],
      answer: 'Entendido. Para ir al grano: S#1 opera bajo licencia anual cerrada, control total de tu cuenta y despliegue en 10 minutos.',
      closing: '¿Qué punto quieres validar para tomar la decisión hoy?',
      options: [
        { label: 'Precio y cupos', intent: 'precio_base' },
        { label: 'Seguridad y Meta', intent: 'seguridad_meta' },
        { label: 'Activar cupo ➔', intent: 'cierre_directo', cta: true }
      ]
    }
  }
};
