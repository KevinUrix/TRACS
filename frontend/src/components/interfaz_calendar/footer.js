export default function Footer() {

return (
  <footer className="w-full text-white mt-auto bottom-0 footer">
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
          <li><a href="/privacy" className="hover:underline text-lg font-medium" target="_blank">Política de privacidad</a></li>
          <li><a href="/terms" className="hover:underline text-lg font-medium" target="_blank">Términos y condiciones</a></li>
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
      © {new Date().getFullYear()} TRACS - Licenciado bajo MIT.
    </div>
  </footer>
);
}