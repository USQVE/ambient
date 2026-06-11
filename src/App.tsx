import { AtmosphereProvider } from './hooks/useAtmosphere';
import { AtmosphereSwitcher } from './components/UI/AtmosphereSwitcher';
import { PaperTexture } from './components/Atoms/PaperTexture';
import { EditableFormula } from './components/Molecules/EditableFormula';
import { SimulationDashboard } from './components/Organisms/SimulationDashboard';
import { useAtmosphereSound } from './hooks/useAtmosphereSound';

function App() {
  useAtmosphereSound(); // фоновый гул + звуки смены атмосферы

  return (
    <AtmosphereProvider>
      <PaperTexture>
        <div className="min-h-screen flex flex-col relative z-10">
          <header className="sticky top-0 z-20 bg-amber-900/60 backdrop-blur-sm border-b border-amber-700 p-3 flex justify-between items-center">
            <h1 className="text-xl font-serif tracking-wide text-amber-50">🖋️ AMBIENT · IDE</h1>
            <AtmosphereSwitcher />
          </header>
          <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-amber-50/40 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-amber-300">
              <h2 className="text-2xl font-serif text-amber-900 border-l-4 border-amber-700 pl-3 mb-4">
                Лаборатория формул
              </h2>
              <div className="space-y-3">
                <EditableFormula initialFormula="∫_{Ω} f dμ = ℒ(f)" />
                <EditableFormula initialFormula="Φ*(R) = sup_{φ∈C_c} ..." />
                <EditableFormula initialFormula="κ(H) = dim_H H" />
              </div>
            </div>
            <div className="bg-amber-50/40 backdrop-blur-sm rounded-xl p-6 shadow-2xl border border-amber-300">
              <SimulationDashboard />
            </div>
          </main>
          <footer className="text-center text-amber-800/50 text-sm p-2">© 2025 · ambient ide — теория «Амбиент» в действии</footer>
        </div>
      </PaperTexture>
    </AtmosphereProvider>
  );
}

export default App;
