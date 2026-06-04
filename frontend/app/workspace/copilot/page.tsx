'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { chatSeed, currentUser } from '@/lib/workspace/mockData';
import type { ChatMessage } from '@/lib/workspace/types';

const PROMPTS: { label: string; reply: string; href?: string }[] = [
  { label: 'Find me a desk near my team tomorrow', reply: 'I found 6 available desks in your service-line zone for tomorrow. Opening the booking map with them highlighted.', href: '/workspace/booking' },
  { label: 'Which floors are under-utilised this week?', reply: 'FL-5 averaged 38% and FL-3 wing B 41% this week — both candidates for consolidation. Opening the heatmap.', href: '/workspace/heatmap' },
  { label: 'Show today’s no-show desks', reply: 'There are open no-show alerts where booked desks stayed vacant past the grace window. Opening the no-show queue.', href: '/workspace/occupancy/no-shows' },
  { label: 'How much could we save by consolidating?', reply: 'Consolidating the two under-utilised wings could free ~1 floor — estimated annual saving is in the cost view.', href: '/workspace/cost' },
];

export default function CopilotPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(chatSeed);
  const [input, setInput] = useState('');

  function send(text: string, reply?: string, href?: string) {
    const t = text.trim();
    if (!t) return;
    const user: ChatMessage = { id: `m-${messages.length + 1}`, role: 'user', text: t, at: '' };
    const matched = PROMPTS.find((p) => p.label === t);
    const answer = reply ?? matched?.reply ?? 'I can help with desk booking, finding teammates, occupancy, no-shows, heatmaps and cost. Try one of the suggestions below.';
    const link = href ?? matched?.href;
    const bot: ChatMessage = { id: `m-${messages.length + 2}`, role: 'assistant', text: answer, at: '', actions: link ? [{ label: 'Open', href: link }] : undefined };
    setMessages((m) => [...m, user, bot]);
    setInput('');
  }

  return (
    <div className="ws-copilot">
      <div className="ws-copilot__head">
        <div className="module__icon tint-blue"><Icon name="robot" size={20} /></div>
        <div>
          <div className="section-title" style={{ margin: 0 }}>Workspace Copilot</div>
          <p className="sub-hint" style={{ margin: '2px 0 0' }}>Natural-language workspace assistant for {currentUser.name} · grounded on your access scope only</p>
        </div>
      </div>

      <div className="ws-chat">
        {messages.map((m) => (
          <div key={m.id} className={'ws-bubble ws-bubble--' + m.role}>
            {m.role === 'assistant' && <span className="ws-bubble__icon"><Icon name="robot" size={14} /></span>}
            <div>
              <div>{m.text}</div>
              {(m.actions ?? []).map((a) => (
                <button key={a.href} className="btn btn--ghost btn--sm" style={{ marginTop: 8 }} onClick={() => router.push(a.href)}>{a.label} <Icon name="chevronRight" size={13} /></button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ws-chips">
        {PROMPTS.map((p) => <button key={p.label} className="ws-chip" onClick={() => send(p.label)}>{p.label}</button>)}
      </div>

      <form className="ws-composer" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <input className="input" placeholder="Ask about desks, teammates, occupancy, cost…" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="btn btn--primary btn--sm" type="submit" disabled={!input.trim()}><Icon name="robot" size={15} /> Ask</button>
      </form>
      <p className="sub-hint" style={{ marginTop: 10 }}><Icon name="lock" size={13} /> Copilot answers are scoped to your role &amp; data permissions. It never reveals individual people-location beyond your authorisation.</p>
    </div>
  );
}
