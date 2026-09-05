import { useState } from 'react';
import { checkBreach, ApiError as BreachApiError } from '../api/breachApi.js';
import { checkUrl, ApiError as UrlApiError } from '../api/urlApi.js';
import { checkPasswordExposure, ApiError as PwApiError } from '../api/passwordApi.js';

function maskEmail(email) {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const shown = user.slice(0, Math.min(2, user.length));
  return `${shown}${'•'.repeat(Math.max(user.length - shown.length, 3))}@${domain}`;
}

const SEVERITY_LABEL = { critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low' };

function SeverityBadge({ level }) {
  if (!level) return null;
  return <span className={`badge badge-${level}`}>{SEVERITY_LABEL[level] || level}</span>;
}

function BreachDetail({ breach }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="breach-item">
      <button className="breach-item-head" onClick={() => setOpen((o) => !o)}>
        <span className="breach-name">{breach.name}{breach.date ? ` · ${String(breach.date).slice(0, 4)}` : ''}</span>
        <SeverityBadge level={breach.severity} />
      </button>
      {open && (
        <div className="breach-item-body">
          {breach.exposedData?.length > 0 && (
            <div className="exposed-tags">
              {breach.exposedData.map((d, i) => <span key={i} className="exposed-tag">{d}</span>)}
            </div>
          )}
          <ul className="steps">
            {breach.remediation.map((step, i) => <li key={i}>{step}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

function EmailChecker() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await checkBreach(trimmed));
    } catch (err) {
      setError(err instanceof BreachApiError ? err.message : 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sub-tool">
      <h3>Email breach check</h3>
      <form onSubmit={handleSubmit}>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="juan.delacruz@gmail.com" required disabled={loading} />
        <button type="submit" disabled={loading}>{loading ? '...' : 'Check'}</button>
      </form>

      {loading && <div className="loading show">checking public breach records …</div>}
      {error && <div className="inline-error">{error}</div>}

      {result && !result.breached && (
        <div className="receipt">
          <div className="r-head"><div className="mark">Result</div><div className="verdict safe">No breach found</div></div>
          <div className="r-body"><div className="r-row"><span className="k">Email</span><span className="v">{maskEmail(result.email)}</span></div></div>
        </div>
      )}

      {result && result.breached && (
        <div className="receipt">
          <div className="r-head">
            <div className="mark">Result</div>
            <div className="verdict danger">Found in {result.breaches.length} breach{result.breaches.length > 1 ? 'es' : ''}</div>
            <div style={{ marginTop: 8 }}><SeverityBadge level={result.overallSeverity} /></div>
          </div>
          <div className="r-body">
            <div className="r-row"><span className="k">Email</span><span className="v">{maskEmail(result.email)}</span></div>
            <div className="breach-list-detailed">
              {result.breaches.map((b, i) => <BreachDetail key={i} breach={b} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function UrlChecker() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await checkUrl(trimmed));
    } catch (err) {
      setError(err instanceof UrlApiError ? err.message : 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sub-tool">
      <h3>Suspicious link check</h3>
      <form onSubmit={handleSubmit}>
        <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://suspicious-site.example/login" required disabled={loading} />
        <button type="submit" disabled={loading}>{loading ? '...' : 'Check'}</button>
      </form>

      {loading && <div className="loading show">checking URL reputation …</div>}
      {error && <div className="inline-error">{error}</div>}

      {result && (
        <div className="receipt">
          <div className="r-head">
            <div className="mark">Result</div>
            <div className={`verdict ${result.verdict === 'clean' ? 'safe' : result.verdict === 'unknown' ? 'err' : 'danger'}`}>
              {result.verdict === 'malicious' && 'Malicious'}
              {result.verdict === 'suspicious' && 'Suspicious'}
              {result.verdict === 'clean' && 'Clean'}
              {result.verdict === 'unknown' && 'Unknown — just submitted'}
            </div>
          </div>
          <div className="r-body">
            {result.status === 'analyzed' ? (
              <>
                <div className="r-row"><span className="k">Malicious</span><span className="v">{result.malicious}</span></div>
                <div className="r-row"><span className="k">Suspicious</span><span className="v">{result.suspicious}</span></div>
                <div className="r-row"><span className="k">Harmless</span><span className="v">{result.harmless}</span></div>
              </>
            ) : (
              <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', margin: 0 }}>{result.message}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PasswordChecker() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await checkPasswordExposure(password));
    } catch (err) {
      setError(err instanceof PwApiError ? err.message : 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
      setPassword('');
    }
  }

  return (
    <div className="sub-tool">
      <h3>Password exposure check</h3>
      <p className="sub" style={{ marginBottom: 14 }}>
        Your password is hashed in your browser and never sent anywhere — only a short, shared
        fragment of the hash is used to look it up. Read more about k-Anonymity if you're curious.
      </p>
      <form onSubmit={handleSubmit}>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter a password to check" required disabled={loading} autoComplete="off" />
        <button type="submit" disabled={loading}>{loading ? '...' : 'Check'}</button>
      </form>

      {loading && <div className="loading show">hashing locally, checking exposure …</div>}
      {error && <div className="inline-error">{error}</div>}

      {result && (
        <div className="receipt">
          <div className="r-head">
            <div className="mark">Result</div>
            <div className={`verdict ${result.exposed ? 'danger' : 'safe'}`}>
              {result.exposed ? 'This password has been exposed' : 'Not found in known leaks'}
            </div>
          </div>
          {result.exposed && (
            <div className="r-body">
              <div className="r-row"><span className="k">Seen in leaks</span><span className="v">{result.count.toLocaleString()} times</span></div>
              <ul className="steps">
                <li>Stop using this password anywhere, immediately.</li>
                <li>Use a unique, randomly-generated password for every account — a password manager makes this painless.</li>
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BreachCheck() {
  return (
    <div className="tool-panel">
      <h2>Check your exposure</h2>
      <p className="sub">Email breaches, leaked passwords, and suspicious links — all in one place.</p>
      <EmailChecker />
      <PasswordChecker />
      <UrlChecker />
    </div>
  );
}
