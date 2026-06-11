import { useState, useEffect, createContext, useContext } from 'react';

type Atmosphere = 'classic' | 'horror' | 'meditative' | 'pop-science';

const AtmosphereContext = createContext<{
  atmosphere: Atmosphere;
  setAtmosphere: (a: Atmosphere) => void;
}>({ atmosphere: 'classic', setAtmosphere: () => {} });

export const AtmosphereProvider = ({ children }: { children: React.ReactNode }) => {
  const [atmosphere, setAtmosphere] = useState<Atmosphere>('classic');
  useEffect(() => {
    document.documentElement.setAttribute('data-atmo', atmosphere);
  }, [atmosphere]);
  return <AtmosphereContext.Provider value={{ atmosphere, setAtmosphere }}>{children}</AtmosphereContext.Provider>;
};

export const useAtmosphere = () => useContext(AtmosphereContext);
