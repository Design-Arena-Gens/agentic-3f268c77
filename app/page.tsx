'use client';

import { useState } from 'react';

interface EmailResult {
  id: string;
  from: string;
  subject: string;
  date: string;
  classification: 'marketing' | 'important';
  action: string;
  reason: string;
  unsubscribeLink?: string;
}

export default function Home() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<EmailResult[]>([]);
  const [status, setStatus] = useState<{ type: 'processing' | 'success' | 'error', message: string } | null>(null);
  const [stats, setStats] = useState({ total: 0, marketing: 0, important: 0, unsubscribed: 0 });

  const [config, setConfig] = useState({
    provider: 'gmail',
    email: '',
    password: '',
    imapHost: 'imap.gmail.com',
    imapPort: '993',
    maxEmails: '50',
    autoUnsubscribe: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setResults([]);
    setStatus({ type: 'processing', message: 'Connecting to email server and analyzing emails...' });

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`Failed to analyze emails: ${response.statusText}`);
      }

      const data = await response.json();
      setResults(data.results);
      setStats(data.stats);
      setStatus({
        type: 'success',
        message: `Analyzed ${data.stats.total} emails. Found ${data.stats.marketing} marketing emails.`
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'An error occurred'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="container">
      <h1>📧 Email Unsubscribe Agent</h1>
      <p className="subtitle">AI-powered agent to identify and unsubscribe from marketing emails</p>

      <form onSubmit={handleSubmit} className="form-section">
        <div className="form-group">
          <label>Email Provider</label>
          <select
            value={config.provider}
            onChange={(e) => {
              const provider = e.target.value;
              let imapHost = 'imap.gmail.com';
              if (provider === 'outlook') imapHost = 'outlook.office365.com';
              else if (provider === 'yahoo') imapHost = 'imap.mail.yahoo.com';
              setConfig({ ...config, provider, imapHost });
            }}
          >
            <option value="gmail">Gmail</option>
            <option value="outlook">Outlook</option>
            <option value="yahoo">Yahoo</option>
            <option value="custom">Custom IMAP</option>
          </select>
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={config.email}
            onChange={(e) => setConfig({ ...config, email: e.target.value })}
            placeholder="your.email@example.com"
            required
          />
        </div>

        <div className="form-group">
          <label>Password / App Password</label>
          <input
            type="password"
            value={config.password}
            onChange={(e) => setConfig({ ...config, password: e.target.value })}
            placeholder="Your password or app-specific password"
            required
          />
          <p className="help-text">For Gmail, use an App Password. For Outlook, use your regular password.</p>
        </div>

        {config.provider === 'custom' && (
          <>
            <div className="form-group">
              <label>IMAP Host</label>
              <input
                type="text"
                value={config.imapHost}
                onChange={(e) => setConfig({ ...config, imapHost: e.target.value })}
                placeholder="imap.example.com"
              />
            </div>
            <div className="form-group">
              <label>IMAP Port</label>
              <input
                type="number"
                value={config.imapPort}
                onChange={(e) => setConfig({ ...config, imapPort: e.target.value })}
                placeholder="993"
              />
            </div>
          </>
        )}

        <div className="form-group">
          <label>Maximum Emails to Analyze</label>
          <input
            type="number"
            value={config.maxEmails}
            onChange={(e) => setConfig({ ...config, maxEmails: e.target.value })}
            min="1"
            max="500"
          />
          <p className="help-text">Analyzing more emails takes longer but is more thorough</p>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={config.autoUnsubscribe}
              onChange={(e) => setConfig({ ...config, autoUnsubscribe: e.target.checked })}
              style={{ width: 'auto', marginRight: '8px' }}
            />
            Automatically unsubscribe from marketing emails
          </label>
          <p className="help-text">When enabled, the agent will click unsubscribe links automatically</p>
        </div>

        <button type="submit" className="button" disabled={processing}>
          {processing ? 'Analyzing Emails...' : 'Start Analysis'}
        </button>
      </form>

      {status && (
        <div className={`status ${status.type}`}>
          {processing && <span className="spinner"></span>}
          {status.message}
        </div>
      )}

      {stats.total > 0 && (
        <div className="stats">
          <div className="stat-card">
            <h3>{stats.total}</h3>
            <p>Total Analyzed</p>
          </div>
          <div className="stat-card">
            <h3>{stats.marketing}</h3>
            <p>Marketing Emails</p>
          </div>
          <div className="stat-card">
            <h3>{stats.important}</h3>
            <p>Important Emails</p>
          </div>
          <div className="stat-card">
            <h3>{stats.unsubscribed}</h3>
            <p>Unsubscribed</p>
          </div>
        </div>
      )}

      {results.length > 0 && (
        <div className="results">
          <h2>Analysis Results</h2>
          {results.map((email) => (
            <div key={email.id} className={`email-card ${email.classification}`}>
              <div className="email-header">
                <div className="email-info">
                  <h3>{email.subject}</h3>
                  <p>From: {email.from}</p>
                  <p>Date: {new Date(email.date).toLocaleString()}</p>
                </div>
                <span className={`badge ${email.classification}`}>
                  {email.classification === 'marketing' ? '🚫 Marketing' : '✅ Important'}
                </span>
              </div>
              <div className="email-action">
                <strong>Action:</strong> {email.action}
                <br />
                <strong>Reason:</strong> {email.reason}
                {email.unsubscribeLink && (
                  <>
                    <br />
                    <strong>Unsubscribe Link:</strong>{' '}
                    <a href={email.unsubscribeLink} target="_blank" rel="noopener noreferrer">
                      Click to unsubscribe
                    </a>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
