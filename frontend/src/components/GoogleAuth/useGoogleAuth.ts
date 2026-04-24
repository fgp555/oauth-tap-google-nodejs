import { useEffect, useState } from "react";

type User = {
  id: string;
  name: string;
  email: string;
  picture: string;
};

export function useGoogleAuth(clientId: string) {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<any>(null);

  // =========================
  // 🔁 RESTORE SESSION
  // =========================
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("accessToken");

    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // =========================
  // 🔗 SEND TO BACKEND
  // =========================
  const sendToBackend = async (body: any) => {
    const res = await fetch("http://localhost:3000/api/oauth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.login) {
      throw new Error("Auth failed");
    }

    // ✅ guardar sesión completa
    localStorage.setItem("user", JSON.stringify(data.user));
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    setUser(data.user);
  };

  // =========================
  // ⏳ WAIT FOR GOOGLE SDK
  // =========================
  const waitForGoogle = () =>
    new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if ((window as any).google) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });

  // =========================
  // ONE TAP (credential)
  // =========================
  useEffect(() => {
    if (!clientId || user) return;

    (async () => {
      await waitForGoogle();

      const google = (window as any).google;

      if (!google?.accounts?.id) return;

      google.accounts.id.initialize({
        client_id: clientId,
        callback: async (res: any) => {
          try {
            await sendToBackend({ credential: res.credential });
          } catch (err) {
            console.error("One Tap Error:", err);
          }
        },
      });

      google.accounts.id.prompt();
    })();
  }, [user, clientId]);

  // =========================
  // POPUP (code)
  // =========================
  useEffect(() => {
    if (!clientId || user) return;

    (async () => {
      await waitForGoogle();

      const google = (window as any).google;

      if (!google?.accounts?.oauth2) return;

      const codeClient = google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: "openid email profile",
        ux_mode: "popup",
        callback: async (res: any) => {
          try {
            await sendToBackend({ code: res.code });
          } catch (err) {
            console.error("Popup Auth Error:", err);
          }
        },
      });

      setClient(codeClient);
    })();
  }, [clientId, user]);

  // =========================
  // LOGIN (manual button)
  // =========================
  const login = () => {
    if (!client) {
      console.warn("Google client not ready");
      return;
    }

    client.requestCode();
  };

  // =========================
  // LOGOUT
  // =========================
  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    const google = (window as any).google;
    google?.accounts?.id?.disableAutoSelect();

    setUser(null);
  };

  return { user, login, logout };
}
