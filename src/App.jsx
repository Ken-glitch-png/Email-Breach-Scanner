import { useState } from 'react';
import BreachCheck from './components/BreachCheck.jsx';
import FileScanner from './components/FileScanner.jsx';
import TempMail from './components/TempMail.jsx';

const TABS = [
  { id: 'breach', label: 'Breach Check' },
  { id: 'scan', label: 'File Scanner' },
  { id: 'tempmail', label: 'Temp Mail' },
];

export default function App() {
  const [active, setActive] = useState('breach');

  return (
    <div className="page">
      <div className="brandbar">
        <div className="mark">S</div>
        <span>Sinta</span>
      </div>

      <h1>Stay <em>a step ahead</em> of scams and leaks</h1>
      <p className="sub">Check your email, your passwords, and suspicious links — then scan files and get a disposable inbox, all in one place.</p>

      <div className="tabbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`tab ${active === t.id ? 'active' : ''}`}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {active === 'breach' && <BreachCheck />}
        {active === 'scan' && <FileScanner />}
        {active === 'tempmail' && <TempMail />}
      </div>

      <footer>
        Not a replacement for official advice — if money or a government ID was involved, report to the{' '}
        <a href="https://www.pnpacg.ph/" target="_blank" rel="noopener noreferrer">PNP Anti-Cybercrime Group</a>{' '}
        or the{' '}
        <a href="https://www.privacy.gov.ph/" target="_blank" rel="noopener noreferrer">National Privacy Commission</a>.
      </footer>
    </div>
  );
}
