export default function LandingPage() {
  return (
    <div className="bg-gradient-to-br from-indigo-200 via-slate-100 to-white min-h-screen flex flex-col items-center justify-center">
        <div className="main-content3 text-center px-6 py-10 flex-1">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-indigo-900 mb-4">
            TRACS
            </h1>
            <h2 className="text-xl sm:text-2xl text-gray-700 font-medium mb-6">
            Timetable and Reporting Assistant for CUCEI Services
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto mb-6">
            Optimiza la administración de horarios y reportes en CUCEI con nuestra herramienta integral, fácil de usar y diseñada para mejorar la eficiencia del personal académico y administrativo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-indigo-800 font-semibold text-lg mb-2 text-center">Gestión de Horarios</h3>
                <p className="text-gray-600 text-sm">
                Visualiza horarios de clase de edificios y crea reservas para clase emergentes.
                </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-indigo-800 font-semibold text-lg mb-2 text-center">Reportes Eficientes</h3>
                <p className="text-gray-600 text-sm">
                Crea, consulta y administra reportes de incidencias de forma centralizada y con uso de filtros.
                </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <h3 className="text-indigo-800 font-semibold text-lg mb-2 text-center">Acceso Personalizado</h3>
                <p className="text-gray-600 text-sm">
                Docentes y personal administrativo pueden acceder a funcionalidades específicas según su rol.
                </p>
            </div>
            </div>

            <div className="mt-10">
            <a
                href="/calendar"
                className="inline-block bg-indigo-700 text-white font-semibold py-3 px-7 rounded-full hover:bg-indigo-800 transition shadow-sm hover:shadow-lg"
            >
                Empezar ahora
            </a>
            </div>
        </div>

      <footer className="w-full text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div>
                <h4 className="font-semibold text-white mb-2">Sobre TRACS</h4>
                <p className="text-gray-300">
                    TRACS es una herramienta desarrollada<br/>para facilitar la gestión de horarios y reportes<br/>de aulas en CUCEI.
                </p>
                </div>

                <div>
                <h4 className="font-semibold text-white mb-2">Enlaces útiles</h4>
                <ul className="text-gray-300 space-y-1">
                    <li><a href="/privacy" className="hover:underline text-lg font-medium">Política de privacidad</a></li>
                </ul>
                </div>

                <div>
                <h4 className="font-semibold text-white mb-2">Contacto</h4>
                <p className="text-gray-300">
                    CUCEI, Universidad de Guadalajara <br />
                    Guadalajara, Jalisco, México <br />
                    Emails: ozdy00@gmail.com & kugaona.kg@gmail.com
                </p>
                </div>
            </div>

            <div className="border-t border-slate-700 text-center text-xs text-gray-400 py-3 px-4">
                © {new Date().getFullYear()} TRACS - Todos los derechos reservados.
            </div>
        </footer>

    </div>
  );
}
