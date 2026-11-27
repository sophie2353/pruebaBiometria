/**
 * S#1 - Agente de Soporte Técnico Push (js/soporte-push.js)
 * Conecta panel.html (ADMIN) y flujo.html (SUPERVISOR) con el backend de prueba.
 */
(() => {
  // 👇 PEGA AQUÍ LA URL DE TU BACKEND DE PRUEBA EN RENDER (sin barra al final)
  const API_URL = 'https://TU-BACKEND-DE-PRUEBA.onrender.com';

  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  function setStatus(elId, msg) {
    const el = document.getElementById(elId);
    if (el) el.textContent = msg;
  }

  // 1. SUSCRIBIR DISPOSITIVO A NOTIFICACIONES PUSH (VAPID)
  async function activarPush(role, statusElId) {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus(statusElId, '❌ Este navegador no soporta Push (en iOS instálala primero en inicio).');
        return;
      }

      setStatus(statusElId, '⏳ Solicitando permiso de notificaciones...');
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus(statusElId, '❌ Permiso denegado.');
        return;
      }

      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const keyRes = await fetch(`${API_URL}/api/push/public-key`);
      const { publicKey } = await keyRes.json();

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey)
      });

      const subRes = await fetch(`${API_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, subscription })
      });

      const data = await subRes.json();
      setStatus(
        statusElId,
        data.ok ? `✅ Push activo para ${role} (llega incluso con pantalla bloqueada).` : '❌ Error al guardar suscripción.'
      );
    } catch (err) {
      setStatus(statusElId, `❌ Error Push: ${err.message}`);
    }
  }

  // 2. SUPERVISOR: SIMULAR FALLO -> AVISA A ADMIN POR PUSH
  async function reportarErrorSupervisor() {
    const btn = document.getElementById('btn-sup-sim-error');
    const statusId = 'sup-support-status';

    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ REPARANDO MÓDULO...';
    }
    setStatus(statusId, '⚠️ Fallo detectado. Enviando alerta Push al Administrador...');

    try {
      const clientId = document.getElementById('dash-id-pill')?.textContent || 'SUP-#01';
      const res = await fetch(`${API_URL}/api/support/incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          moduleName: 'Botón Activar Campaña',
          detail: 'Error 500 simulado en frontend/backend'
        })
      });

      const data = await res.json();
      if (data.ok) {
        setStatus(
          statusId,
          '🛠️ Está fallando el módulo de campañas. Puedes bloquear el teléfono: te avisaremos por notificación Push en cuanto quede resuelto.'
        );
      }
    } catch (err) {
      setStatus(statusId, '❌ No se pudo conectar con el backend de soporte.');
      if (btn) {
        btn.disabled = false;
        btn.textContent = '⚠️ Simular Error de Botón';
      }
    }
  }

  // 3. ADMIN: MARCAR RESUELTO -> BOTÓN PASA A ACTIVATE + PUSH AL SUPERVISOR
  async function resolverErrorAdmin() {
    const statusId = 'adm-support-status';
    setStatus(statusId, '⏳ Liberando módulo y enviando Push al Supervisor...');

    try {
      const res = await fetch(`${API_URL}/api/support/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.ok) {
        setStatus(
          statusId,
          data.supNotified
            ? '✅ Resuelto: Botón en ACTIVATE y Push enviado al Supervisor.'
            : '✅ Resuelto: Botón en ACTIVATE (el Supervisor aún no activó Push en su teléfono).'
        );
      }
    } catch (err) {
      setStatus(statusId, '❌ Error conectando con el backend de soporte.');
    }
  }

  // 4. SINCRONIZAR ESTADO DEL BOTÓN EN SUPERVISOR (si entra tras recibir el Push)
  async function sincronizarEstadoSupervisor() {
    const btn = document.getElementById('btn-sup-sim-error');
    if (!btn) return;

    try {
      const res = await fetch(`${API_URL}/api/support/status`);
      const data = await res.json();
      if (!data.ok) return;

      if (data.buttonState === 'ERROR') {
        btn.disabled = true;
        btn.textContent = '⏳ REPARANDO MÓDULO...';
        setStatus('sup-support-status', `🛠️ En reparación (${data.lastError}). Te avisaremos por Push al resolverse.`);
      } else {
        btn.disabled = false;
        btn.textContent = '⚠️ Simular Error de Botón';
      }
    } catch {
      // Silencioso si el backend está dormido en Render
    }
  }

  // CONEXIÓN AUTOMÁTICA DE BOTONES AL CARGAR LA PÁGINA
  document.addEventListener('DOMContentLoaded', () => {
    // Botones de ADMIN (panel.html)
    document.getElementById('btn-adm-enable-push')?.addEventListener('click', () => {
      activarPush('ADMIN', 'adm-support-status');
    });
    document.getElementById('btn-adm-resolve-error')?.addEventListener('click', resolverErrorAdmin);

    // Botones de SUPERVISOR (flujo.html)
    document.getElementById('btn-sup-enable-push')?.addEventListener('click', () => {
      activarPush('SUPERVISOR', 'sup-support-status');
    });
    document.getElementById('btn-sup-sim-error')?.addEventListener('click', reportarErrorSupervisor);

    // Revisa el estado inicial y cada 8s por si Admin resuelve con la pantalla abierta
    if (document.getElementById('btn-sup-sim-error')) {
      sincronizarEstadoSupervisor();
      setInterval(sincronizarEstadoSupervisor, 8000);
    }
  });
})();
