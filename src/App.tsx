import { AtmosphereProvider } from './hooks/useAtmosphere';
import { AtmosphereSwitcher } from './components/UI/AtmosphereSwitcher';

function App() {
  return (
    <AtmosphereProvider>
      <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-10 bg-amber-900/60 backdrop-blur-sm border-b border-amber-700 p-3 flex justify-between items-center">
          <h1 className="text-xl font-serif tracking-wide text-amber-50">🖋️ AMBIENT · IDE</h1>
          <AtmosphereSwitcher />
        </header>
        <main className="flex-1 p-6">
          <div className="max-w-4xl mx-auto bg-white/30 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-amber-300">
            <h2 className="text-2xl font-serif text-amber-900">Пергамент готов</h2>
            <p className="mt-2 text-amber-800">Меняй атмосферу – фон и оттенки меняются.</p>
          </div>
        </main>
        <footer className="text-center text-amber-800/60 text-sm p-2">© 2025 · ambient ide</footer>
      </div>
    </AtmosphereProvider>
  );
}

export default App;
