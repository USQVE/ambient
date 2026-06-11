import { useEffect, useRef } from 'react';
import { useAtmosphere } from './useAtmosphere';
import { soundGenerator } from '../lib/soundGenerator';

export const useAtmosphereSound = () => {
  const { atmosphere } = useAtmosphere();
  const prevAtmo = useRef(atmosphere);
  const droneStarted = useRef(false);

  useEffect(() => {
    // Запускаем дрон при первом монтировании (тихий фон)
    if (!droneStarted.current) {
      soundGenerator.startAmbientDrone();
      droneStarted.current = true;
    }

    // При смене атмосферы — звук перелистывания и меняем гул
    if (prevAtmo.current !== atmosphere) {
      soundGenerator.playPageFlip();
      // Меняем частоту гула в зависимости от атмосферы
      let freq = 80;
      if (atmosphere === 'horror') freq = 60;
      if (atmosphere === 'meditative') freq = 100;
      if (atmosphere === 'pop-science') freq = 120;
      soundGenerator.setDroneVolume(freq / 80);
      prevAtmo.current = atmosphere;
    }
  }, [atmosphere]);

  // Функция для вызова резонанса (например, при росте функционала)
  const playResonance = (intensity: number = 0.5) => {
    soundGenerator.playResonance(intensity);
  };

  return { playResonance };
};
