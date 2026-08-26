import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { NewsHomePage } from './pages/NewsHomePage';
import { MainScreen } from './pages/MainScreen';
import { EmptyScreen } from './pages/EmptyScreen';
import { IssuePage } from './pages/IssuePage';
import { UvIssuePage } from './pages/UvIssuePage';
import { CharacterCardPage } from './pages/CharacterCardPage';
import { CharacterCatalogPage } from './pages/CharacterCatalogPage';
import './styles.css';

// Ports the GoRouter route table from lib/main.dart 1:1.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NewsHomePage />} />
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
  );
}
