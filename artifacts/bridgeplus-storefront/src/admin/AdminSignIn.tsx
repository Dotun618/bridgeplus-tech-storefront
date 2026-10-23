import { useState, type FormEvent } from 'react';
import { AlertCircle, ArrowRight, LockKeyhole } from 'lucide-react';
import type { AdminSignInProps } from './types';
import './admin.css';

export function AdminSignIn({ loading, error, onSignIn }: AdminSignInProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLocalError('');
    try {
      await onSignIn(email.trim(), password);
    } catch (reason) {
      setLocalError(reason instanceof Error ? reason.message : 'Sign in was unsuccessful. Please try again.');
    }
  }

  return (
    <main className="bp-admin admin-login">
      <section className="admin-login-aside" aria-label="BridgePlus Tech administration">
        <div className="admin-login-brand">
          <span className="admin-brand-mark" aria-hidden="true">B</span>
          <span className="admin-brand-name">BridgePlus <span>Tech</span></span>
        </div>
        <div className="admin-login-copy">
          <p className="admin-kicker">CATALOGUE ADMINISTRATION</p>
          <h1>Keep every<br />listing <em>clear.</em></h1>
          <p>A considered workspace for the products customers see, with every change ready to inspect before it goes live.</p>
        </div>
        <p className="admin-login-aside-foot">BridgePlus Tech · Trusted operator access</p>
      </section>
      <section className="admin-login-main">
        <div className="admin-login-card">
          <p className="admin-kicker">OPERATOR ACCESS</p>
          <h2>Sign in to your catalogue</h2>
          <p className="admin-login-intro">Use your BridgePlus operator account to manage public listings and product imagery.</p>
          {(error || localError) && <div className="admin-alert" role="alert"><AlertCircle size={16} aria-hidden="true" /><span>{localError || error}</span></div>}
          <form className="admin-form" onSubmit={submit}>
            <div className="admin-field">
              <label htmlFor="admin-email">Email address</label>
              <input id="admin-email" className="admin-control" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@bridgeplus.tech" data-testid="input-email" />
            </div>
            <div className="admin-field">
              <label htmlFor="admin-password">Password</label>
              <input id="admin-password" className="admin-control" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" data-testid="input-password" />
            </div>
            <button className="admin-button primary full" type="submit" disabled={loading} data-testid="button-submit">
              {loading ? 'Signing in…' : 'Sign in'} {!loading && <ArrowRight size={15} aria-hidden="true" />}
            </button>
          </form>
          <p className="admin-login-footnote"><LockKeyhole size={13} aria-hidden="true" style={{ verticalAlign: '-2px', marginRight: 5 }} /> Private operator access only. Admin registration is not available.</p>
        </div>
      </section>
    </main>
  );
}
