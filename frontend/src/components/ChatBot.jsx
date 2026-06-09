import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { useLang } from '../context/LangContext';
import { useAuth } from '../context/AuthContext';
import { LibFull } from './LibSVG';
import api from '../api/client';

export default function ChatBot() {
  const { t, idioma } = useLang();
  const { user } = useAuth();
  const [open, setOpen]       = useState(false);
  const [msgs, setMsgs]       = useState([]);
  const [input, setInput]     = useState('');
  const [loading, setLoading] = useState(false);
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  const firstName = user?.nombre?.split(' ')[0] || '';

  useEffect(() => {
    if (open && msgs.length === 0) {
      const welcome = t('chat_welcome', { name: firstName ? `, ${firstName}` : '' });
      setMsgs([{ role: 'model', text: welcome }]);
    }
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');

    const next = [...msgs, { role: 'user', text }];
    setMsgs(next);
    setLoading(true);

    const history = next
      .slice(1)      // skip welcome
      .slice(0, -1)  // skip current user msg (sent as `message`)
      .map(m => ({ role: m.role, parts: [{ text: m.text }] }));

    try {
      const { data } = await api.post('/chat', { message: text, history });
      setMsgs(prev => [...prev, { role: 'model', text: data.reply }]);
    } catch {
      setMsgs(prev => [...prev, { role: 'model', text: t('chat_error') }]);
    } finally {
      setLoading(false);
    }
  };

  const onKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {open && (
        <div className="chat-panel" style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border2)',
          boxShadow: '0 24px 64px rgba(0,0,0,.55)',
        }}>
          {/* Header */}
          <div style={{
            padding: '14px 16px',
            background: 'linear-gradient(135deg, #0d3526 0%, #0a2a1f 100%)',
            borderRadius: '22px 22px 0 0',
            borderBottom: '1px solid var(--border2)',
            display: 'flex', alignItems: 'center', gap: 11,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%',
              background: 'var(--green)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 16px rgba(29,158,117,.5)',
            }}>
              <LibFull size={30} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: -.3 }}>Lib</div>
              <div style={{ fontSize: 11, color: 'var(--green2)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                {t('chat_subtitle')}
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green2)', display: 'inline-block', boxShadow: '0 0 6px var(--green2)' }} />
              </div>
            </div>
            <button onClick={() => setOpen(false)} style={{
              background: 'rgba(255,255,255,.07)', border: 'none', cursor: 'pointer',
              color: 'var(--text3)', width: 30, height: 30, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.07)'}
            >
              <X size={15} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-msgs">
            {msgs.map((m, i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                gap: 8, alignItems: 'flex-end',
              }}>
                {m.role === 'model' && (
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: 'var(--green)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <LibFull size={21} />
                  </div>
                )}
                <div style={{
                  maxWidth: '76%',
                  padding: '10px 13px',
                  borderRadius: m.role === 'user'
                    ? '16px 16px 4px 16px'
                    : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'var(--green)' : 'var(--bg4)',
                  color: m.role === 'user' ? '#fff' : 'var(--text)',
                  fontSize: 13, lineHeight: 1.55,
                  wordBreak: 'break-word',
                  boxShadow: m.role === 'user'
                    ? '0 2px 12px rgba(29,158,117,.25)'
                    : 'none',
                }}>
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: 'var(--green)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <LibFull size={21} />
                </div>
                <div style={{
                  padding: '13px 16px', background: 'var(--bg4)',
                  borderRadius: '16px 16px 16px 4px',
                  display: 'flex', gap: 5, alignItems: 'center',
                }}>
                  <span className="dot-bounce" style={{ '--d': '0s' }} />
                  <span className="dot-bounce" style={{ '--d': '.15s' }} />
                  <span className="dot-bounce" style={{ '--d': '.3s' }} />
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: '10px 12px',
            borderTop: '1px solid var(--border2)',
            display: 'flex', gap: 8, alignItems: 'flex-end',
            background: 'var(--bg2)',
            borderRadius: '0 0 22px 22px',
          }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKey}
              placeholder={t('chat_placeholder')}
              rows={1}
              style={{
                flex: 1, resize: 'none',
                background: 'var(--bg3)',
                border: '1px solid var(--border2)',
                borderRadius: 13, padding: '10px 13px',
                color: 'var(--text)', fontSize: 13,
                fontFamily: 'var(--font)', outline: 'none',
                lineHeight: 1.45, maxHeight: 90, overflowY: 'auto',
                transition: 'border-color .15s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--green)'}
              onBlur={e => e.target.style.borderColor = 'var(--border2)'}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                width: 40, height: 40, borderRadius: 12, border: 'none',
                background: input.trim() && !loading ? 'var(--green)' : 'var(--bg4)',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', transition: 'all .2s', flexShrink: 0,
                boxShadow: input.trim() ? '0 2px 12px rgba(29,158,117,.3)' : 'none',
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        className="chat-fab"
        onClick={() => setOpen(v => !v)}
        style={{
          background: open
            ? 'var(--bg3)'
            : 'linear-gradient(135deg, #1D9E75 0%, #0d7a59 100%)',
          border: `2px solid ${open ? 'var(--border2)' : 'rgba(93,202,165,.4)'}`,
          boxShadow: open ? 'none' : '0 6px 24px rgba(29,158,117,.45)',
        }}
      >
        {open
          ? <X size={22} color="var(--text3)" />
          : <LibFull size={40} />
        }
      </button>
    </>
  );
}
