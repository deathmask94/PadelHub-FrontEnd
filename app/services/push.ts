import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import { apiFetch } from "./auth";

let listenersReady = false;
let registering = false;

function sendTokenToBackend(token: string) {
  apiFetch("/api/push-tokens", {
    method: "POST",
    body: JSON.stringify({ token, platform: "android" }),
  }).catch(() => {}); // best-effort: si falla, se reintenta en el proximo registro
}

function setupListeners() {
  if (listenersReady) return;
  listenersReady = true;

  PushNotifications.addListener("registration", (token) => {
    sendTokenToBackend(token.value);
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.error("[PUSH] Error de registro:", err);
  });
}

// Solo tiene efecto dentro del APK (Android nativo vía Capacitor); en el
// navegador web las push notifications son otro mecanismo (VAPID + service
// worker) que no está implementado, así que se omite silenciosamente.
export async function registerPushNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (registering) return;
  registering = true;

  try {
    setupListeners();

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== "granted") return;

    await PushNotifications.register();
  } catch (e) {
    console.error("[PUSH] No se pudo registrar:", e);
  } finally {
    registering = false;
  }
}
