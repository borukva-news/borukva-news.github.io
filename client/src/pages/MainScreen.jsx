import { useNavigate } from 'react-router-dom';
import { MAIN_MENU_BUTTONS, BG_ASSET } from '../data/issues';

export function MainScreen() {
  const navigate = useNavigate();
  return (
    <div className="main-screen">
      <img className="bg-image" src={BG_ASSET} alt="" />
      <div className="bg-dim" />
      <div className="main-screen-content">
        <div className="main-title">Borukva</div>
        <div className="main-subtitle">News</div>

        <div className="main-menu-buttons">
          {MAIN_MENU_BUTTONS.map((btn) => (
            <button key={btn.route} className="menu-btn" onClick={() => navigate(btn.route)}>
              {btn.label}
              <span className="menu-btn-arrow">&gt;</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
