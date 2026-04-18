import { useState, useRef, useEffect } from 'react';

const VOICES = {
  arita: { name: '有田和正', principle: '構造破壊・おもしろ発見。子どもの「おもしろい」をつかむ。崩せ、常識の裏側、意外な事実で既成概念を壊せ' },
  kuzuhara: { name: '葛原祥太', principle: 'QNKS（Q(問い・意見を割る)→N(思い出す・背景想起)→K(組み立て・比較・関係)→S(整理・理由付け表現)。思考の筋道を見えるかたちで。' },
  munezane: { name: '宗實直樹', principle: '再現性。誰がやっても成立する授業の形。活動と評価が一致しているか。時間配分が現実的か。' },
  tamura: { name: '田村学', principle: '概念化。事実の現れで結びつける。抽象度を上げる。よりよい方向に到達させる。知識を概念として再構成されているか。' },
  nasu: { name: '奈須正裕', principle: '学びの質を。子どもが自分で動き出す、資質・能力として存在するか。教師主導の効率から、学習者の主体性へ。' },
};

const STEP_DEFINITIONS = {
  1: { key: 'concern', label: '悩み整理', desc: '何に困っているか、言語化する' },
  2: { key: 'aim', label: '学び', desc: '子どもにどうなってほしい・何に出会わせたいか' },
  3: { key: 'question', label: '問い', desc: '意見を割る本質的な問いをつくる' },
  4: { key: 'design', label: '授業設計', desc: '導入・展開・交流・まとめ' },
  5: { key: 'evaluation', label: '評価', desc: 'めあて・A評価・S評価' },
  6: { key: 'output', label: '成果物', desc: 'Canva草稿まで' },
};

const buildSystemPrompt = (step, sessionInfo) => {
  const common = `あなたは授業共創ラボの思考エンジンです。単なる相談相手ではありません。教師の思考を深め、既成の授業観を壊し、再設計まで伴走する存在です。

【絶対の禁則】
- 一気に完成案を出さない。段階的に深める。
- 「相談っぽく」なるな。思考を揺さぶる。
- 「そうですね」「素晴らしいですね」の顔の返しは禁止。
- 教師の最初のアイデアは多くの場合「既成概念の再生産」か「構造が薄い」

【存在する二つの声】
- 有田和正：${VOICES.arita.principle}
- 葛原祥太：${VOICES.kuzuhara.principle}
- 宗實直樹：${VOICES.munezane.principle}
- 田村学：${VOICES.tamura.principle}
- 奈須正裕：${VOICES.nasu.principle}

これらは統合された一人格ではない。局面ごとに前面に出る声が変わる。必要に応じて「有田なら――」「葛原のQNKSで言えば――」のように、どの視点から語っているかを明示してください。

【授業情報】
学年：${sessionInfo.grade || '未設定'}
教科：${sessionInfo.subject || '未設定'}
単元：${sessionInfo.unit || '未設定'}
教師の困りごと：${sessionInfo.concern || '未設定'}
子どもにどうなってほしい：${sessionInfo.goal || '未設定'}
`;

  const stepGuidance = {
    1: `\n【現在のステップ：悩み整理】\n教師が述べた悩みを、そのまま受け取らない。\n- この悩みは、子どもの事実に根ざしているか？教師の都合ではないか？\n- 「難しい」と言うとき、「何が難しい」のか、具体の場面を引き出す。\n- 悩みの裏にある授業観を一つ、仮説として返す。\nまだ解決策は出さない。問い直しで終える。`,
    2: `\n【現在のステップ：学びの目標】\n「子どもにどうなってほしい」を深掘りする。\n- この目標は、教科書の目標を言い換えただけではないか？\n- 田村学の視点で：この単元で到達させたい「概念」は何か？事実ではなく概念。\n- 奈須の視点で：これは教師が達成させる姿か、子どもが自ら獲得する姿か。\n目標を一つに絞る問いを返す。`,
    3: `\n【現在のステップ：問いづくり】\n葛原祥太のQNKSのQ――「意見を割る問い」をつくる段階。\n- 有田の視点で：教師の最初の問いは、たいてい「答えが一つに収束する」か「あいまい」。崩す。\n- 問いが割れるための条件：①事実が複数ある ②価値判断が分かれる ③子どもの生活と接続する\n問いの案を2〜3個、割れる根拠を添えて提示する。`,
    4: `\n【現在のステップ：授業設計】\nここで初めて1時間の流れを構築する。QNKSを骨格に。\n- 導入（Q提示）／展開（N：資料・事実の思い出し）／交流（K：組み立て・比較）／まとめ（S：整理・表現）\n- 宗實の視点で：時間配分が現実的か。45分なら導入7分・展開15分・交流15分・まとめ8分など。\n- 各活動にQNKSタグを付ける。\n- 発問は必ず3つ以上、具体の言葉で書く。\n出力は構造化された授業案の形で。`,
    5: `\n【現在のステップ：評価】\nめあて・A評価・S評価を作る。\n- めあて：子どもの言葉で書く。「〜について考える」ではなく「〜の視点から説明できる」\n- A評価：概ねの到達、具体の行動・記述で。\n- S評価：概念化に至った姿。田村学の視点を強く効かせる。\n- 授業の活動と評価が一致しているか。宗實の視点で点検する。ズレがあれば指摘する。`,
    6: `\n【現在のステップ：Canva草稿】\nスライド草稿を生成する。各スライドに：\n- タイトル\n- キャッチ\n- 本文（子どもに見せる言葉）\n- 図解案（どんな図を入れるか）\n- メモ（教師用の補足）\n- QNKSタグ（Q/N/K/Sのどれか）\n6〜8枚程度で1時間分。`,
  };

  return common + (stepGuidance[step] || '');
};

const callGemini = async (messages, systemPrompt, apiKey) => {
  const contents = messages.map(m => ({
    role: m.role === 'ai' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 2000, temperature: 0.7 },
      }),
    }
  );
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error: ${response.status}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.map(p => p.text).join('\n') || '';
};

const STORAGE_KEY = 'jugyo-kyoso-sessions-v1';
const API_KEY_STORAGE = 'jugyo-kyoso-apikey';

const loadSessions = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch { return []; }
};
const saveSessions = (sessions) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
};

export default function JugyoKyosoLab() {
  const [screen, setScreen] = useState('top');
  const [sessions, setSessions] = useState(() => loadSessions());
  const [currentSession, setCurrentSession] = useState(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(API_KEY_STORAGE) || '');

  useEffect(() => { saveSessions(sessions); }, [sessions]);

  if (!apiKey) {
    return <ApiKeyScreen onSave={(k) => { localStorage.setItem(API_KEY_STORAGE, k); setApiKey(k); }} />;
  }

  return (
    <div className="min-h-screen" style={{
      background: '#f5f1e8',
      fontFamily: '"Shippori Mincho", "Noto Serif JP", Georgia, serif',
      color: '#1a1a1a',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;500;700;800&family=Noto+Sans+JP:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; }
        .sans { font-family: "Noto Sans JP", sans-serif; }
        .mono { font-family: "JetBrains Mono", monospace; }
        .paper-grain {
          background-image:
            radial-gradient(circle at 20% 30%, rgba(139,69,19,0.03) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(139,69,19,0.02) 0%, transparent 50%);
        }
        .rule-thick { border-top: 4px double #1a1a1a; }
        .rule-thin { border-top: 1px solid #1a1a1a; }
        .tag {
          display: inline-block; padding: 2px 8px; font-size: 10px; font-weight: 700;
          letter-spacing: 0.1em; border: 1px solid currentColor;
          font-family: "JetBrains Mono", monospace;
        }
        .btn-primary {
          background: #1a1a1a; color: #f5f1e8; padding: 14px 28px;
          font-family: "Shippori Mincho", serif; font-weight: 700; font-size: 15px;
          border: none; cursor: pointer; letter-spacing: 0.1em;
          transition: all 0.2s ease;
        }
        .btn-primary:hover { background: #c8472e; }
        .btn-primary:disabled { background: #999; cursor: not-allowed; }
        .btn-secondary {
          background: transparent; color: #1a1a1a; padding: 10px 20px;
          border: 1px solid #1a1a1a; font-family: "Noto Sans JP"; font-size: 13px;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-secondary:hover { background: #1a1a1a; color: #f5f1e8; }
        .btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
        input, textarea, select {
          width: 100%; padding: 12px; background: #faf8f2;
          border: none; border-bottom: 2px solid #1a1a1a;
          font-family: "Noto Sans JP", sans-serif; font-size: 15px;
          color: #1a1a1a; outline: none;
        }
        input:focus, textarea:focus, select:focus { background: #fff; }
        textarea { min-height: 80px; resize: vertical; }
        .msg-user {
          background: #1a1a1a; color: #f5f1e8; padding: 16px 20px;
          margin-left: 60px;
        }
        .msg-ai {
          background: #fff; padding: 20px 24px;
          margin-right: 60px;
          border-left: 4px solid #c8472e;
          white-space: pre-wrap; line-height: 1.8;
        }
        .step-dot {
          width: 32px; height: 32px; border: 2px solid #1a1a1a;
          display: flex; align-items: center; justify-content: center;
          font-family: "JetBrains Mono", monospace; font-weight: 700; font-size: 13px;
          background: #f5f1e8; flex-shrink: 0;
        }
        .step-dot.active { background: #c8472e; color: #fff; border-color: #c8472e; }
        .step-dot.done { background: #1a1a1a; color: #f5f1e8; }
        .loading-dots::after {
          content: '...'; animation: dots 1.5s infinite;
        }
        @keyframes dots {
          0%, 20% { content: '.'; }
          40% { content: '..'; }
          60%, 100% { content: '...'; }
        }
      `}</style>

      {screen === 'top' && (
        <TopScreen
          sessions={sessions}
          onNew={() => setScreen('form')}
          onOpen={(s) => { setCurrentSession(s); setScreen('chat'); }}
          onDelete={(id) => setSessions(sessions.filter(s => s.id !== id))}
          onResetKey={() => { localStorage.removeItem(API_KEY_STORAGE); setApiKey(''); }}
        />
      )}
      {screen === 'form' && (
        <FormScreen
          onCancel={() => setScreen('top')}
          onSubmit={(info) => {
            const newSession = {
              id: Date.now(),
              ...info,
              messages: [],
              step: 1,
              draft: {},
              createdAt: new Date().toISOString(),
            };
            setSessions([newSession, ...sessions]);
            setCurrentSession(newSession);
            setScreen('chat');
          }}
        />
      )}
      {screen === 'chat' && currentSession && (
        <ChatScreen
          session={currentSession}
          apiKey={apiKey}
          onUpdate={(updated) => {
            setCurrentSession(updated);
            setSessions(sessions.map(s => s.id === updated.id ? updated : s));
          }}
          onBack={() => setScreen('top')}
        />
      )}
    </div>
  );
}

function ApiKeyScreen({ onSave }) {
  const [key, setKey] = useState('');
  return (
    <div style={{
      minHeight: '100vh', background: '#f5f1e8', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '"Shippori Mincho", serif',
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;700;800&family=Noto+Sans+JP:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; } body { margin: 0; }
        .sans { font-family: "Noto Sans JP", sans-serif; }
        .mono { font-family: "JetBrains Mono", monospace; }
      `}</style>
      <div style={{ maxWidth: 520, width: '100%', padding: '0 24px' }}>
        <div className="mono" style={{ fontSize: 11, color: '#c8472e', letterSpacing: '0.2em', marginBottom: 12 }}>
          SETUP
        </div>
        <h1 style={{ fontSize: 40, fontWeight: 800, margin: '0 0 8px', lineHeight: 1.2 }}>
          Gemini APIキー<br/>を設定する
        </h1>
        <p className="sans" style={{ fontSize: 13, color: '#666', lineHeight: 1.8, margin: '16px 0 32px' }}>
          このサイトはあなたのブラウザだけで動きます。<br/>
          APIキーはこのデバイスのみに保存され、外部に送信されません。<br/>
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer"
            style={{ color: '#c8472e' }}>Google AI Studio</a> で無料取得できます。
        </p>
        <input
          type="password"
          value={key}
          onChange={e => setKey(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && key.trim() && onSave(key.trim())}
          placeholder="AIza..."
          style={{
            width: '100%', padding: 14, background: '#fff',
            border: 'none', borderBottom: '2px solid #1a1a1a',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 14,
            outline: 'none', marginBottom: 16,
          }}
        />
        <button
          onClick={() => key.trim() && onSave(key.trim())}
          disabled={!key.trim()}
          style={{
            background: key.trim() ? '#1a1a1a' : '#999',
            color: '#f5f1e8', padding: '14px 32px', border: 'none',
            fontFamily: '"Shippori Mincho", serif', fontWeight: 700,
            fontSize: 15, cursor: key.trim() ? 'pointer' : 'not-allowed',
            letterSpacing: '0.1em',
          }}
        >
          設定して始める →
        </button>
      </div>
    </div>
  );
}

function TopScreen({ sessions, onNew, onOpen, onDelete, onResetKey }) {
  return (
    <div className="paper-grain" style={{ minHeight: '100vh', padding: '40px 48px' }}>
      <header style={{ maxWidth: 1100, margin: '0 auto 60px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
          <span className="mono" style={{ fontSize: 11, letterSpacing: '0.2em' }}>NO.001 — 思考と授業の工房</span>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.2em' }}>{new Date().toLocaleDateString('ja-JP')}</span>
            <button onClick={onResetKey} className="mono" style={{
              background: 'none', border: 'none', fontSize: 10, color: '#999',
              cursor: 'pointer', letterSpacing: '0.1em',
            }}>APIキー変更</button>
          </div>
        </div>
        <div className="rule-thick" style={{ marginBottom: 24 }} />
        <h1 style={{
          fontSize: 'clamp(48px, 8vw, 96px)', fontWeight: 800, lineHeight: 1,
          margin: 0, letterSpacing: '-0.02em',
        }}>
          授業共創<span style={{ color: '#c8472e' }}>ラボ</span>
        </h1>
        <div style={{ display: 'flex', gap: 32, marginTop: 20, alignItems: 'flex-end' }}>
          <p className="sans" style={{ fontSize: 15, lineHeight: 1.8, margin: 0, maxWidth: 560, color: '#333' }}>
            単なる相談ツールではない。思考を深め、構造を壊し、再設計する。
            有田和正・葛原祥太・宗實直樹・田村学・奈須正裕――
            五人の声が束になって、あなたの授業を揺さぶる。
          </p>
          <div className="mono" style={{ fontSize: 11, color: '#666', whiteSpace: 'nowrap' }}>
            Q → N → K → S
          </div>
        </div>
        <div className="rule-thin" style={{ marginTop: 40 }} />
      </header>

      <main style={{ maxWidth: 1100, margin: '0 auto' }}>
        <section style={{ marginBottom: 72 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <span className="tag" style={{ color: '#c8472e' }}>ACTION</span>
            <h2 style={{ fontSize: 28, margin: 0, fontWeight: 700 }}>授業を相談する</h2>
          </div>
          <div style={{
            background: '#1a1a1a', color: '#f5f1e8', padding: '48px 40px',
            display: 'grid', gridTemplateColumns: '1fr auto', gap: 32, alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: 20, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                「子どもの事実」から始めよう。<br/>
                あなたの悩みを、そのまま受け取らない対話が待っている。
              </p>
            </div>
            <button className="btn-primary" onClick={onNew} style={{
              background: '#c8472e', fontSize: 16, padding: '18px 36px',
            }}>
              新しい相談を始める →
            </button>
          </div>
        </section>

        <section>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24 }}>
            <span className="tag">ARCHIVE</span>
            <h2 style={{ fontSize: 28, margin: 0, fontWeight: 700 }}>これまでの共創</h2>
            <span className="mono" style={{ fontSize: 12, color: '#666', marginLeft: 'auto' }}>
              {sessions.length} 件
            </span>
          </div>
          {sessions.length === 0 ? (
            <div style={{
              padding: '60px 40px', textAlign: 'center', border: '1px dashed #999',
              color: '#666', fontStyle: 'italic',
            }}>
              まだ一度も対話は始まっていない。
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 2, background: '#1a1a1a' }}>
              {sessions.map(s => (
                <div key={s.id} style={{
                  background: '#faf8f2', padding: '20px 24px',
                  display: 'grid', gridTemplateColumns: 'auto 1fr auto auto auto', gap: 20, alignItems: 'center',
                  transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.background = '#faf8f2'}>
                  <span className="mono" style={{ fontSize: 11, color: '#999' }}>
                    #{String(s.id).slice(-4)}
                  </span>
                  <div onClick={() => onOpen(s)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                      {s.unit || '無題の単元'}
                    </div>
                    <div className="sans" style={{ fontSize: 12, color: '#666' }}>
                      {s.grade} / {s.subject}
                    </div>
                  </div>
                  <span className="tag">STEP {s.step}/6</span>
                  <span onClick={() => onOpen(s)} style={{ color: '#c8472e', cursor: 'pointer' }}>開く →</span>
                  <button
                    onClick={() => { if (window.confirm('このセッションを削除しますか？')) onDelete(s.id); }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', fontSize: 12 }}>
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <footer style={{ marginTop: 120, paddingTop: 32, borderTop: '1px solid #1a1a1a' }}>
          <div className="mono" style={{ fontSize: 10, color: '#666', letterSpacing: '0.1em', textAlign: 'center' }}>
            — 思考を深める · 構造を壊す · 再設計する · 成果物まで —
          </div>
        </footer>
      </main>
    </div>
  );
}

function FormScreen({ onCancel, onSubmit }) {
  const [form, setForm] = useState({ grade: '', subject: '', unit: '', concern: '', goal: '' });
  const canSubmit = form.grade && form.subject && form.unit;

  return (
    <div className="paper-grain" style={{ minHeight: '100vh', padding: '40px 48px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button onClick={onCancel} className="mono" style={{
          background: 'none', border: 'none', cursor: 'pointer', fontSize: 12,
          color: '#666', marginBottom: 32,
        }}>← 戻る</button>

        <div style={{ marginBottom: 48 }}>
          <span className="tag" style={{ color: '#c8472e' }}>NEW SESSION</span>
          <h1 style={{ fontSize: 44, fontWeight: 800, margin: '16px 0 8px', lineHeight: 1.2 }}>
            何について<br/>考えたいですか。
          </h1>
          <p className="sans" style={{ color: '#666', fontSize: 14, margin: 0 }}>
            正確に書く必要はありません。曖昧な悩みほど、揺さぶりがいがある。
          </p>
        </div>

        <div style={{ display: 'grid', gap: 32 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <Field label="学年" required>
              <select value={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })}>
                <option value="">選択</option>
                {['小1','小2','小3','小4','小5','小6','中1','中2','中3','高1','高2','高3'].map(g =>
                  <option key={g} value={g}>{g}</option>)}
              </select>
            </Field>
            <Field label="教科" required>
              <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })}>
                <option value="">選択</option>
                {['国語','社会','算数・数学','理科','生活','音楽','図工・美術','家庭','体育・保健体育','外国語','道徳','総合'].map(s =>
                  <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="単元名" required>
            <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
              placeholder="例：わり算の筆算／江戸幕府の成立／物語文「ごんぎつね」" />
          </Field>
          <Field label="困っていること" hint="何が難しいか、具体の場面で">
            <textarea value={form.concern} onChange={e => setForm({ ...form, concern: e.target.value })}
              placeholder="例：子どもが活動には乗るが深まらない。考えを書かせると教科書の答えになる。" />
          </Field>
          <Field label="子どもにどうなってほしい" hint="到達させたい姿、抽象でも構わない">
            <textarea value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}
              placeholder="例：「当たり前」を疑う視点を持ってほしい。自分の言葉で概念を語れるように。" />
          </Field>
        </div>

        <div style={{ marginTop: 48, display: 'flex', gap: 16, alignItems: 'center' }}>
          <button className="btn-primary" disabled={!canSubmit} onClick={() => onSubmit(form)}>
            対話を始める
          </button>
          <span className="sans" style={{ fontSize: 12, color: '#666' }}>
            {!canSubmit && '学年・教科・単元は必須です'}
          </span>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
        <label style={{ fontSize: 14, fontWeight: 700, letterSpacing: '0.05em' }}>{label}</label>
        {required && <span className="mono" style={{ fontSize: 10, color: '#c8472e' }}>REQUIRED</span>}
        {hint && <span className="sans" style={{ fontSize: 12, color: '#888' }}>— {hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ChatScreen({ session, apiKey, onUpdate, onBack }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rightTab, setRightTab] = useState('step');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input, step: session.step, ts: Date.now() };
    const newMessages = [...session.messages, userMsg];
    onUpdate({ ...session, messages: newMessages });
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const systemPrompt = buildSystemPrompt(session.step, session);
      const reply = await callGemini(newMessages, systemPrompt, apiKey);
      const aiMsg = { role: 'ai', content: reply, step: session.step, ts: Date.now() };
      onUpdate({ ...session, messages: [...newMessages, aiMsg] });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const generateDraft = async (type) => {
    setLoading(true);
    setError(null);
    try {
      const prompts = {
        lesson: '【授業案生成】これまでの対話を踏まえて、1時間分の授業案を構造化して出力してください。導入・展開・交流・まとめの各フェーズに、活動・発問・時間配分・QNKSタグを明記。発問は具体の言葉で3つ以上。',
        eval: '【評価生成】これまでの対話と授業案を踏まえて、めあて・A評価・S評価を子どもの言葉で出力してください。A評価は概ねの到達、S評価は概念化に至った姿。',
        canva: '【Canva草稿生成】授業で使うスライド草稿を6〜8枚、以下の形式で出力してください。\n【スライドN】\nタイトル：\nキャッチ：\n本文：\n図解案：\nメモ：\nQNKS：',
      };
      const userMsg = { role: 'user', content: prompts[type], step: session.step, ts: Date.now(), meta: 'generate' };
      const newMessages = [...session.messages, userMsg];
      onUpdate({ ...session, messages: newMessages });
      const systemPrompt = buildSystemPrompt(session.step, session);
      const reply = await callGemini(newMessages, systemPrompt, apiKey);
      const aiMsg = { role: 'ai', content: reply, step: session.step, ts: Date.now(), meta: type };
      const newDraft = { ...session.draft, [type]: reply };
      onUpdate({ ...session, messages: [...newMessages, aiMsg], draft: newDraft });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'grid', gridTemplateColumns: '260px 1fr 340px' }}>
      <aside style={{ background: '#1a1a1a', color: '#f5f1e8', padding: '24px 20px', overflowY: 'auto' }}>
        <button onClick={onBack} className="mono" style={{
          background: 'none', border: 'none', color: '#999', cursor: 'pointer',
          fontSize: 11, marginBottom: 24, padding: 0,
        }}>← 一覧へ</button>

        <div className="mono" style={{ fontSize: 10, color: '#c8472e', letterSpacing: '0.2em', marginBottom: 8 }}>
          SESSION #{String(session.id).slice(-4)}
        </div>
        <h2 style={{ fontSize: 22, margin: '0 0 20px', fontWeight: 700, lineHeight: 1.3 }}>
          {session.unit}
        </h2>

        <div style={{ display: 'grid', gap: 16, fontSize: 13 }}>
          <InfoRow label="学年" value={session.grade} />
          <InfoRow label="教科" value={session.subject} />
          {session.concern && <InfoRow label="困りごと" value={session.concern} multiline />}
          {session.goal && <InfoRow label="目指す姿" value={session.goal} multiline />}
        </div>

        <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #333' }}>
          <div className="mono" style={{ fontSize: 10, color: '#999', letterSpacing: '0.2em', marginBottom: 12 }}>
            思考の五つの声
          </div>
          {Object.values(VOICES).map(v => (
            <div key={v.name} style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>
              · {v.name}
            </div>
          ))}
        </div>
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', background: '#f5f1e8', overflow: 'hidden' }}>
        <div style={{
          padding: '16px 32px', borderBottom: '1px solid #1a1a1a',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#faf8f2',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="mono" style={{ fontSize: 11, color: '#666' }}>STEP {session.step}/6</span>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
              {STEP_DEFINITIONS[session.step].label}
            </h3>
            <span className="sans" style={{ fontSize: 12, color: '#666' }}>
              — {STEP_DEFINITIONS[session.step].desc}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-secondary"
              onClick={() => onUpdate({ ...session, step: session.step - 1 })}
              disabled={session.step <= 1}
              style={{ padding: '6px 12px', fontSize: 12, opacity: session.step <= 1 ? 0.4 : 1 }}>
              ← 前
            </button>
            <button className="btn-secondary"
              onClick={() => onUpdate({ ...session, step: session.step + 1 })}
              disabled={session.step >= 6}
              style={{ padding: '6px 12px', fontSize: 12, opacity: session.step >= 6 ? 0.4 : 1 }}>
              次 →
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
          {session.messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
              <div style={{ fontSize: 60, marginBottom: 16, opacity: 0.2 }}>Q</div>
              <p className="sans" style={{ fontSize: 14, lineHeight: 1.8 }}>
                このステップは「{STEP_DEFINITIONS[session.step].label}」です。<br/>
                悩みや考えていることをそのまま書いてください。揺さぶりが始まります。
              </p>
            </div>
          )}
          <div style={{ display: 'grid', gap: 20, maxWidth: 820, margin: '0 auto' }}>
            {session.messages.map((m, i) => (
              <div key={i}>
                {m.role === 'user' ? (
                  <div className="msg-user">
                    <div className="mono" style={{ fontSize: 10, opacity: 0.6, marginBottom: 6 }}>
                      YOU · STEP {m.step}
                    </div>
                    <div className="sans" style={{ fontSize: 14, lineHeight: 1.7 }}>{m.content}</div>
                  </div>
                ) : (
                  <div className="msg-ai">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                      <span className="mono" style={{ fontSize: 10, color: '#c8472e', letterSpacing: '0.15em' }}>
                        思考エンジン · STEP {m.step}
                      </span>
                      {m.meta && m.meta !== 'generate' && (
                        <span className="tag" style={{ color: '#c8472e', fontSize: 9 }}>{m.meta.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="sans" style={{ fontSize: 14 }}>{m.content}</div>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="msg-ai">
                <span className="mono" style={{ fontSize: 11, color: '#c8472e' }}>
                  思考中<span className="loading-dots" />
                </span>
              </div>
            )}
            {error && (
              <div style={{
                background: '#ffe8e5', padding: 16, borderLeft: '4px solid #c8472e',
                fontSize: 13, color: '#333',
              }}>
                <strong>エラー：</strong> {error}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div style={{ padding: '20px 32px', borderTop: '1px solid #1a1a1a', background: '#faf8f2' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send(); }}
                placeholder={`「${STEP_DEFINITIONS[session.step].label}」について書く... (Ctrl+Enterで送信)`}
                style={{ flex: 1, minHeight: 50, background: '#fff', borderBottom: '2px solid #1a1a1a' }}
                disabled={loading}
              />
              <button className="btn-primary" onClick={send} disabled={loading || !input.trim()}>
                送る
              </button>
            </div>
          </div>
        </div>
      </main>

      <aside style={{ background: '#faf8f2', borderLeft: '1px solid #1a1a1a', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a' }}>
          {[
            { k: 'step', l: 'ステップ' },
            { k: 'draft', l: '生成物' },
            { k: 'canva', l: 'Canva' },
          ].map(t => (
            <button key={t.k} onClick={() => setRightTab(t.k)}
              className="sans"
              style={{
                flex: 1, padding: '14px 8px', border: 'none', cursor: 'pointer',
                background: rightTab === t.k ? '#1a1a1a' : 'transparent',
                color: rightTab === t.k ? '#f5f1e8' : '#1a1a1a',
                fontSize: 12, fontWeight: 700, letterSpacing: '0.05em',
              }}>
              {t.l}
            </button>
          ))}
        </div>

        <div style={{ padding: 20, flex: 1, overflowY: 'auto' }}>
          {rightTab === 'step' && (
            <div>
              <div className="mono" style={{ fontSize: 10, color: '#666', letterSpacing: '0.2em', marginBottom: 16 }}>
                SIX STEPS
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {Object.entries(STEP_DEFINITIONS).map(([n, s]) => {
                  const num = parseInt(n);
                  const state = num < session.step ? 'done' : num === session.step ? 'active' : '';
                  return (
                    <div key={n} onClick={() => onUpdate({ ...session, step: num })}
                      style={{
                        display: 'flex', gap: 12, padding: 10, cursor: 'pointer',
                        background: num === session.step ? '#fff' : 'transparent',
                        borderLeft: num === session.step ? '3px solid #c8472e' : '3px solid transparent',
                      }}>
                      <div className={`step-dot ${state}`}>{num}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700 }}>{s.label}</div>
                        <div className="sans" style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 32, padding: 16, background: '#1a1a1a', color: '#f5f1e8' }}>
                <div className="mono" style={{ fontSize: 10, color: '#c8472e', letterSpacing: '0.2em', marginBottom: 8 }}>
                  QNKS
                </div>
                <div style={{ fontSize: 11, lineHeight: 1.8 }}>
                  <div><strong>Q</strong> 問い（意見を割る）</div>
                  <div><strong>N</strong> 思い出す（背景想起）</div>
                  <div><strong>K</strong> 組み立て（比較・関係）</div>
                  <div><strong>S</strong> 整理（理由付け表現）</div>
                </div>
              </div>
            </div>
          )}

          {rightTab === 'draft' && (
            <div>
              <div className="mono" style={{ fontSize: 10, color: '#666', letterSpacing: '0.2em', marginBottom: 16 }}>
                GENERATE
              </div>
              <div style={{ display: 'grid', gap: 10, marginBottom: 24 }}>
                <button className="btn-secondary" onClick={() => generateDraft('lesson')} disabled={loading}
                  style={{ textAlign: 'left', padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>授業案を作る →</div>
                  <div className="sans" style={{ fontSize: 11, color: '#666', marginTop: 2 }}>1時間の流れ・発問・QNKS</div>
                </button>
                <button className="btn-secondary" onClick={() => generateDraft('eval')} disabled={loading}
                  style={{ textAlign: 'left', padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>評価を作る →</div>
                  <div className="sans" style={{ fontSize: 11, color: '#666', marginTop: 2 }}>めあて・A評価・S評価</div>
                </button>
                <button className="btn-secondary" onClick={() => generateDraft('canva')} disabled={loading}
                  style={{ textAlign: 'left', padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Canva草稿を作る →</div>
                  <div className="sans" style={{ fontSize: 11, color: '#666', marginTop: 2 }}>スライド6〜8枚分</div>
                </button>
              </div>

              <div className="mono" style={{ fontSize: 10, color: '#666', letterSpacing: '0.2em', marginBottom: 12 }}>
                DRAFTS
              </div>
              {Object.keys(session.draft).length === 0 ? (
                <div className="sans" style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
                  まだ生成されていません。
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                  {Object.entries(session.draft).map(([k, v]) => (
                    <details key={k} style={{ background: '#fff', padding: 12, fontSize: 12 }}>
                      <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
                        {k === 'lesson' ? '授業案' : k === 'eval' ? '評価' : 'Canva草稿'}
                      </summary>
                      <pre className="sans" style={{
                        whiteSpace: 'pre-wrap', margin: '10px 0 0', fontSize: 11,
                        lineHeight: 1.7, fontFamily: 'inherit',
                      }}>{v}</pre>
                    </details>
                  ))}
                </div>
              )}
            </div>
          )}

          {rightTab === 'canva' && (
            <div>
              <div className="mono" style={{ fontSize: 10, color: '#666', letterSpacing: '0.2em', marginBottom: 16 }}>
                CANVA DRAFT
              </div>
              {session.draft.canva ? (
                <div style={{
                  background: '#fff', padding: 16, fontSize: 12, lineHeight: 1.7,
                  whiteSpace: 'pre-wrap', fontFamily: 'inherit', maxHeight: '70vh', overflowY: 'auto',
                }}>
                  {session.draft.canva}
                  <button
                    className="btn-secondary"
                    onClick={() => navigator.clipboard.writeText(session.draft.canva)}
                    style={{ marginTop: 16, width: '100%', fontSize: 11, padding: '8px' }}
                  >
                    コピーして Canva へ
                  </button>
                </div>
              ) : (
                <div className="sans" style={{ fontSize: 12, color: '#999', fontStyle: 'italic' }}>
                  「生成物」タブで Canva草稿を作ってください。
                </div>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function InfoRow({ label, value, multiline }) {
  return (
    <div>
      <div className="mono" style={{ fontSize: 9, color: '#999', letterSpacing: '0.2em', marginBottom: 2 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: multiline ? 'pre-wrap' : 'normal' }}>
        {value}
      </div>
    </div>
  );
}
