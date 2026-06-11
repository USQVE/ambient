import { useAtmosphere } from '../../hooks/useAtmosphere';

export const AtmosphereSwitcher = () => {
  const { atmosphere, setAtmosphere } = useAtmosphere();
  const atmos = [
    { id: 'classic', label: '📜 Классика', desc: 'Пергамент и чернила' },
    { id: 'horror', label: '🕯️ Хоррор', desc: 'Треск свечи, кровавые кляксы' },
    { id: 'meditative', label: '🧘 Медитация', desc: 'Мягкий свет, каллиграфия' },
    { id: 'pop-science', label: '📡 Научпоп', desc: 'Синий оттенок, графики' },
  ] as const;
  return (
    <div className="flex gap-2 bg-amber-900/50 p-1 rounded-full backdrop-blur-sm">
      {atmos.map((a) => (
        <button
          key={a.id}
          onClick={() => setAtmosphere(a.id)}
          className={`px-3 py-1 text-sm rounded-full transition-all ${
            atmosphere === a.id
              ? 'bg-amber-200 text-amber-900 shadow-md'
              : 'text-amber-200 hover:bg-amber-800'
          }`}
          title={a.desc}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
};
