import { useRef } from 'react';
import { BG_ASSET } from '../data/issues';

export function EmptyScreen() {
  const audioRef = useRef(null);

  function playSound() {
    audioRef.current?.play().catch((e) => console.warn('Could not play sound', e));
  }

  return (
    <div className="main-screen">
      <img className="bg-image" src={BG_ASSET} alt="" />
      <div className="bg-dim" />
      <div className="main-screen-content">
        <div className="main-title" style={{ fontSize: 36 }}>
          Тут нічого
        </div>
        <div className="main-subtitle" style={{ fontSize: 28 }}>
          немає
        </div>

        <button className="empty-sound-btn" onClick={playSound} title="???">
          <img src="/assets/pictures/hy.jpg" alt="" width={30} height={30} />
        </button>
      </div>

      <audio ref={audioRef} src="/assets/sounds/puk-v-ekho.wav" preload="auto" />
    </div>
  );
}
