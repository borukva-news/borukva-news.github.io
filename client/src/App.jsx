import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NewsHomePage } from './pages/NewsHomePage';
import { MainScreen } from './pages/MainScreen';
import { EmptyScreen } from './pages/EmptyScreen';
import { IssuePage } from './pages/IssuePage';
import { UvIssuePage } from './pages/UvIssuePage';
import { CharacterCardPage } from './pages/CharacterCardPage';
import { CharacterCatalogPage } from './pages/CharacterCatalogPage';
import NewspaperGenerator from './components/NewspaperGenerator';
import './styles.css';

const MAINTENANCE = false;

function Maintenance() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'url(assets/pictures/bg/bg_borukva-monochrome.png) no-repeat center center',
    }}>
      <h1 style={{ color: '#ff4d4f'  }}>⚙️ Сайт в техобслуговуванні</h1>
      <p style={{ color: '#8B0000'}}>Ми проводимо планове технічне обслуговування. Будь ласка, зайдіть пізніше.</p>
    </div>
  );
}


// Ports the GoRouter route table from lib/main.dart 1:1.
export default function App() {
  return (
    MAINTENANCE ? (
      <Maintenance />
    ) : (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<NewsHomePage />} />
          <Route path="/feed" element={<NewsHomePage feedPage />} />
          <Route path="/generator" element={<NewspaperGenerator />} />
          <Route path="/RULE34" element={<MainScreen />} />
          <Route path="/empty" element={<EmptyScreen />} />
          <Route path="/atRmklps" element={<IssuePage issueKey="09_02-14_02" />} />
          <Route path="/qizmvUxp" element={<IssuePage issueKey="15_02-21_02" />} />
          <Route path="/pLxqnrvt" element={<IssuePage issueKey="22_02-28_02" />} />
          <Route path="/qbE34klm" element={<IssuePage issueKey="kchbnk" />} />
          <Route path="/x9t2q7wb" element={<IssuePage issueKey="01_03-14_03" />} />
          <Route path="/inter1" element={<IssuePage issueKey="inter1" />} />
          <Route path="/k7m2q9vz" element={<IssuePage issueKey="15_03-29_03" />} />
          <Route path="/l9bf3n0p" element={<UvIssuePage />} />
          <Route path="/characters" element={<CharacterCatalogPage />} />
          <Route path="/skins" element={<CharacterCardPage />} />
          <Route path="*" element={<NewsHomePage />} />
        </Routes>
      </BrowserRouter>
    )
  );
}
