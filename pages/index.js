import { useState, useEffect } from 'react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [msg, setMsg] = useState('');
  const [blocks, setBlocks] = useState([]);

  async function fetchBlocks() {
    if (!email) return;
    const res = await fetch(`/api/block?email=${encodeURIComponent(email)}`);
    const j = await res.json();
    if (res.ok) setBlocks(j);
  }

  useEffect(()=>{ fetchBlocks(); }, [email]);

  async function createBlock(e) {
    e.preventDefault();
    const token = localStorage.getItem('SUPABASE_ACCESS_TOKEN'); // optional
    const headers = {'Content-Type':'application/json'};
    if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch('/api/block', {
      method: 'POST',
      headers,
      body: JSON.stringify({ startTime: start, endTime: end })
    });
    const data = await res.json();
    if (!res.ok) setMsg(JSON.stringify(data));
    else {
      setMsg('Created: ' + data.id);
      fetchBlocks();
    }
  }

  return (
    <main style={{padding:20, fontFamily:'system-ui, sans-serif'}}>
      <h1>Quiet Hours Scheduler (Advanced)</h1>
      <form onSubmit={createBlock} style={{display:'grid', gap:8, maxWidth:540}}>
        <label>Email
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
        </label>
        <label>Start (ISO)
          <input value={start} onChange={e=>setStart(e.target.value)} placeholder="2025-09-20T10:00:00Z" />
        </label>
        <label>End (ISO)
          <input value={end} onChange={e=>setEnd(e.target.value)} placeholder="2025-09-20T11:00:00Z" />
        </label>
        <button type="submit">Create Block</button>
      </form>

      <p>{msg}</p>

      <h2>Your Blocks</h2>
      <ul>
        {blocks.map(b=>(
          <li key={b._id}>Start: {new Date(b.startTime).toLocaleString()} — End: {new Date(b.endTime).toLocaleString()} — reminded: {String(b.reminderSent)}</li>
        ))}
      </ul>
    </main>
  );
}
