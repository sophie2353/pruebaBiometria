/**
 * Módulo WebAuthn Biométrico Portátil (pruebaBiometria -> SODIE v4)
 * Dispara el sensor nativo del dispositivo (huella / Face ID)
 */
const SodieBiometria = (() => {
  const STORAGE_KEY_PREFIX = 'sodie_bio_cred_';
  const SESSION_KEY = 'sodie_bio_session';

  function bufferToBase64(buffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }

  function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
  }

  function generarChallenge() {
    const arr = new Uint8Array(32);
    window.crypto.getRandomValues(arr);
    return arr;
  }

  function resolverRol(userId) {
    const clean = (userId || '').trim().toUpperCase();
    if (clean === 'ADMIN') return 'ADMIN';
    if (clean.startsWith('SUPERVISOR') || clean.startsWith('SUP-')) return 'SUPERVISOR';
    return 'CLIENT';
  }

  async function soportarBiometriaLocal() {
    if (!window.PublicKeyCredential) return false;
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  // 1. REGISTRO DE HUELLA / FACE ID
  async function registrar(userId = 'ADMIN') {
    try {
      const disponible = await soportarBiometriaLocal();
      if (!disponible) {
        return { ok: false, error: 'Sensor biométrico no disponible (requiere HTTPS y pantalla bloqueada).' };
      }

      const cleanId = userId.trim().toUpperCase();
      const userBytes = new TextEncoder().encode(cleanId);

      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: generarChallenge(),
          rp: {
            name: 'SODIE V4',
            id: window.location.hostname
          },
          user: {
            id: userBytes,
            name: cleanId,
            displayName: cleanId
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 }
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred'
          },
          timeout: 60000,
          attestation: 'none'
        }
      });

      const credIdB64 = bufferToBase64(credential.rawId);
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${cleanId}`, credIdB64);

      return { ok: true, userId: cleanId, credentialId: credIdB64 };
    } catch (err) {
      return { ok: false, error: err.message || 'Registro cancelado.' };
    }
  }

  // 2. VALIDACIÓN DIRECTA (BANNER BIOMÉTRICO)
  async function validar(userId = 'ADMIN') {
    try {
      const cleanId = userId.trim().toUpperCase();
      const savedCredId = localStorage.getItem(`${STORAGE_KEY_PREFIX}${cleanId}`);

      if (!savedCredId) {
        return { ok: false, error: `No hay huella registrada para ${cleanId}. Regístrala primero.` };
      }

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: generarChallenge(),
          rpId: window.location.hostname,
          allowCredentials: [{
            id: base64ToBuffer(savedCredId),
            type: 'public-key',
            transports: ['internal']
          }],
          userVerification: 'required',
          timeout: 60000
        }
      });

      if (!assertion) return { ok: false, error: 'Validación fallida.' };

      const role = resolverRol(cleanId);
      const sessionData = { userId: cleanId, role, verifiedAt: Date.now() };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));

      return { ok: true, userId: cleanId, role };
    } catch (err) {
      return { ok: false, error: err.message || 'Validación cancelada.' };
    }
  }

  function obtenerSesion() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  }

  function cerrarSesion() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  return { registrar, validar, obtenerSesion, cerrarSesion };
})();
