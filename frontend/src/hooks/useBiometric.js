import { startRegistration, startAuthentication } from '@simplewebauthn/browser';
import api from '../api/client';

export function useBiometric() {
  const isSupported = () =>
    window.PublicKeyCredential !== undefined &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

  const isPlatformAvailable = async () => {
    if (!isSupported()) return false;
    return window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  };

  // Registrar huella/Face ID del dispositivo (usuario ya autenticado)
  const registerBiometric = async () => {
    const optRes = await api.post('/webauthn/register/options');
    const attResp = await startRegistration(optRes.data);
    await api.post('/webauthn/register/verify', attResp);
    return true;
  };

  // Login con biometría (sin contraseña)
  const loginWithBiometric = async (email) => {
    const optRes = await api.post('/webauthn/auth/options', { email });
    const assertResp = await startAuthentication(optRes.data);
    const verifyRes = await api.post('/webauthn/auth/verify', { email, response: assertResp });
    return verifyRes.data; // { token, user }
  };

  return { isSupported, isPlatformAvailable, registerBiometric, loginWithBiometric };
}
