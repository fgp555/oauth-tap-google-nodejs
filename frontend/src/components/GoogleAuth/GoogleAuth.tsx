import { useGoogleAuth } from "./useGoogleAuth";

export default function GoogleAuth() {
  const { user, login, logout } = useGoogleAuth(
    "141961932626-3o5089pbjc7stqj2q13id15npf7lnukj.apps.googleusercontent.com",
  );

  return (
    <div className="flex items-center justify-center">
      {user ? (
        <div className="flex items-center gap-3 px-4 py-2 rounded-full shadow-md bg-white dark:bg-neutral-800">
          <img src={user.picture} alt="user" className="w-8 h-8 rounded-full" />

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
          onClick={login}
          className="flex items-center gap-3 px-5 py-2 rounded-full bg-black text-white border border-gray-700 hover:bg-gray-900 transition cursor-pointer"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" />
          Continue with Google
        </button>
      )}
    </div>
  );
}
