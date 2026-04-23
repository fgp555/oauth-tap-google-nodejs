import { useEffect, useState, useRef } from "react";

const CLIENT_ID = "141961932626-3o5089pbjc7stqj2q13id15npf7lnukj.apps.googleusercontent.com";

type User = {
  name: string;
  email: string;
  picture: string;
};

export default function GoogleAuth() {
  const [user, setUser] = useState<User | null>(null);
  const isLoggedInRef = useRef(false);

  // 🔹 Load session
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      isLoggedInRef.current = true;
    }
  }, []);

  // 🔹 One Tap init + fallback
  useEffect(() => {
    if (user) return;

    const initGoogle = () => {
      if (!window.google) return;

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.prompt(() => {
        if (isLoggedInRef.current) return;
      });
    };

    const handleCredentialResponse = (response: any) => {
      const payload = JSON.parse(atob(response.credential.split(".")[1]));

      const userData: User = {
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
      };

      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      isLoggedInRef.current = true;
    };

    const interval = setInterval(() => {
      if (window.google) {
        clearInterval(interval);
        initGoogle();
      }
    }, 200);

    return () => clearInterval(interval);
  }, [user]);

  // 🔹 Login manual (TU BOTÓN CUSTOM)
  const loginWithGoogle = () => {
    if (!window.google) return;

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: "openid email profile",
      callback: async (tokenResponse: any) => {
        const userInfo = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        }).then((res) => res.json());

        const userData: User = {
          name: userInfo.name,
          email: userInfo.email,
          picture: userInfo.picture,
        };

        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);
        isLoggedInRef.current = true;
      },
    });
    client.requestAccessToken();
  };

  // 🔹 Logout
  const logout = () => {
    localStorage.removeItem("user");
    window.google?.accounts.id.disableAutoSelect();
    isLoggedInRef.current = false;
    setUser(null);
  };

  // 🔹 UI
  return (
    <div className="flex justify-center">
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
          className="flex items-center justify-center gap-3 px-5 py-2 rounded-full bg-white text-black shadow hover:shadow-md transition border border-gray-200 cursor-pointer"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          <span className="text-sm font-medium">Continue with Google</span>
        </button>
      )}
    </div>
  );
}
