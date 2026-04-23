import GoogleOneTap from "./GoogleOneTap";

export default function Navbar() {
  return (
    <header className="w-full bg-white dark:bg-neutral-900 shadow-sm sticky top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* 🔹 LEFT */}
        <div className="flex items-center gap-8">
          <div className="font-bold text-lg text-gray-800 dark:text-white">MyApp</div>

          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-600 dark:text-gray-300">
            <a href="#inicio" className="hover:text-black dark:hover:text-white transition cursor-pointer">
              Inicio
            </a>
            <a href="#servicios" className="hover:text-black dark:hover:text-white transition cursor-pointer">
              Servicios
            </a>
            <a href="#contacto" className="hover:text-black dark:hover:text-white transition cursor-pointer">
              Contacto
            </a>
            <a href="#acerca" className="hover:text-black dark:hover:text-white transition cursor-pointer">
              Acerca de
            </a>
          </nav>
        </div>

        {/* 🔹 RIGHT (auth completamente encapsulado) */}
        <div className="flex items-center gap-3">
          <GoogleOneTap />
        </div>
      </div>
    </header>
  );
}
