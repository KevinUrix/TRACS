export default function PolicyButton() {

  return (
    <div className="relative group">
        <a
          href="/privacy"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-indigo-700 hover:bg-indigo-600 text-white font-medium rounded-full py-2 px-4 shadow-md transition duration-200 flex items-center justify-center"
        >
          <b>Política de privacidad 📜</b>
        </a>
        <span className="absolute left-1/2 translate-x-[-50%] top-full mt-2 text-sm bg-gray-700 text-white px-3 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10 span-info">
            Políticas de privacidad.
        </span>
    </div>
  );
}