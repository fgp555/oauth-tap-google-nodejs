import { useEffect, useState } from "react";

const CLIENT_ID = "141961932626-3o5089pbjc7stqj2q13id15npf7lnukj.apps.googleusercontent.com";

type User = {
  id: string;
  name: string;
  email: string;
  picture: string;
};

export default function GoogleAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [client, setClient] = useState<any>(null);

  // 🔹 cargar sesión
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  // 🔥 helper backend
  const sendToBackend = async (body: any) => {
    const res = await fetch("http://localhost:3000/auth/google", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error("Auth failed");
    }

    localStorage.setItem("user", JSON.stringify(data.user));
    setUser(data.user);
  };

  // =========================
  // 🔐 ONE TAP (credential)
  // =========================
  useEffect(() => {
    if (user) return;

    const initOneTap = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
      });

      window.google.accounts.id.prompt();
    };

    const handleCredential = async (response: any) => {
      try {
        await sendToBackend({
          credential: response.credential,
        });
      } catch (err) {
        console.error("One Tap error:", err);
      }
    };

    const interval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(interval);
        initOneTap();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [user]);

  // =========================
  // 🔑 POPUP (code)
  // =========================
  useEffect(() => {
    const waitForGoogle = () => {
      const interval = setInterval(() => {
        if (window.google?.accounts?.oauth2) {
          clearInterval(interval);

          const codeClient = window.google.accounts.oauth2.initCodeClient({
            client_id: CLIENT_ID,
            scope: "openid email profile",
            ux_mode: "popup",
            callback: handleAuthCode,
          });

          setClient(codeClient);
        }
      }, 100);
    };

    waitForGoogle();
  }, []);

  const handleAuthCode = async (response: any) => {
    try {
      await sendToBackend({
        code: response.code,
      });
    } catch (err) {
      console.error("Popup login error:", err);
    }
  };

  // 🔹 botón custom → popup
  const loginWithGoogle = () => {
    if (!client) return;
    client.requestCode();
  };

  // 🔹 logout
  const logout = () => {
    localStorage.removeItem("user");
    window.google?.accounts.id.disableAutoSelect(); // importante
    setUser(null);
  };

  // =========================
  // 🔹 UI
  // =========================
  return (
    <div className="flex items-center justify-center">
      {user ? (
        <div className="flex items-center gap-3 px-4 py-2 rounded-full shadow-md bg-white dark:bg-neutral-800">
          <img src={user.picture} className="w-8 h-8 rounded-full" />
          <span className="text-sm text-gray-800 dark:text-white">{user.name}</span>

          <button
            onClick={logout}
            className="ml-2 text-red-500 hover:text-red-600 transition cursor-pointer"
            title="Logout"
          >
            <i className="fa-solid fa-right-from-bracket text-sm"></i>
          </button>
        </div>
      ) : (
        <button
          onClick={loginWithGoogle}
          className="flex items-center gap-3 px-5 py-2 rounded-full bg-black text-white border border-gray-700 hover:bg-gray-900 transition cursor-pointer"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
          Continue with Google
        </button>
      )}
    </div>
  );
}
