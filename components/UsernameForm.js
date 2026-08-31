'use client';

import { useState } from 'react';
import { createClient } from '../lib/supabase/client';

// Comments show this instead of the visitor's real Google name - this
// audience is often military/government-adjacent, so name privacy matters.
// Required before commenting, enforced server-side in
// check_comment_before_insert() (supabase/migrations/0009_usernames.sql);
// this form is just the way to set one.
export default function UsernameForm({ initialUsername }) {
  const [username, setUsername] = useState(initialUsername);
  const [saved, setSaved] = useState(initialUsername);
  const [justSaved, setJustSaved] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | saving
  const [error, setError] = useState(null);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!username.trim() || username === saved || status === 'saving') return;

    setStatus('saving');
    setError(null);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc('set_username', { new_username: username });
    setStatus('idle');

    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    setSaved(username);
    setJustSaved(true);
  }

  return (
    <form onSubmit={handleSubmit} className="username-form">
      <label htmlFor="username" className="username-form__label">
        Username
      </label>
      <div className="username-form__row">
        <input
          id="username"
          type="text"
          value={username}
          onChange={(event) => {
            setUsername(event.target.value);
            setJustSaved(false);
            setError(null);
          }}
          maxLength={20}
          placeholder="Choose a username"
          className="username-form__input"
        />
        <button
          type="submit"
          className="username-form__submit"
          disabled={status === 'saving' || !username.trim() || username === saved}
        >
          {status === 'saving' ? 'Saving…' : 'Save'}
        </button>
      </div>
      <p className="username-form__help">
        3–20 characters: letters, numbers, and underscores. This is what other readers see on
        your comments — your real name is never shown.
      </p>
      {error && <p className="username-form__error">{error}</p>}
      {justSaved && !error && <p className="username-form__saved">Saved.</p>}
    </form>
  );
}
