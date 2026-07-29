import React, { useState, useEffect, useRef, useCallback } from 'react';

const STORAGE_KEY = 'six-month-tracker-v1';

const C = {
  pink: '#FF78AC',
  pinkDark: '#E85D96',
  pinkSoft: '#FFE3EE',
  teal: '#A8D5E3',
  tealDark: '#7DBBD0',
  cream: '#F2F0EA',
  ink: '#3D2E36',
  inkSoft: '#9A8790',
  black: '#15101A',
  white: '#FFFFFF',
};

// ---------- date helpers ----------
const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayStr = () => toStr(new Date());
const yesterdayStr = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toStr(d);
};
const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const dayLabel = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short' });
const getLast7Days = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(toStr(d));
  }
  return days;
};
const getStatus = (start, end) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  if (e && today > e) return 'done';
  if (s && today < s) return 'upcoming';
  return 'active';
};
const trackerDateLabel = (tracker) => {
  if (tracker.start && tracker.end) return `${fmtDate(tracker.start)} – ${fmtDate(tracker.end)}`;
  if (tracker.end) return `Target: ${fmtDate(tracker.end)}`;
  if (tracker.start) return `Starts ${fmtDate(tracker.start)}`;
  return 'Ongoing';
};
const markStreak = (s) => {
  const today = todayStr();
  if (s.streak.lastDate === today) return s;
  const count = s.streak.lastDate === yesterdayStr() ? s.streak.count + 1 : 1;
  const longest = Math.max(s.streak.longest, count);
  return { ...s, streak: { count, longest, lastDate: today } };
};

// ---------- default data ----------
const DEFAULT_HABITS = [
  { id: 'h1', name: 'DSA Practice' },
  { id: 'h2', name: 'Web Dev (Sigma)' },
  { id: 'h3', name: 'Sudoku' },
  { id: 'h4', name: 'Schulte Table' },
  { id: 'h5', name: 'Gita / Reflection' },
];

const TRACKERS_DEF = {
  dsa: {
    name: 'DSA',
    icon: '🧩',
    start: null,
    end: null,
    topics: [
      { id: 'd1', name: 'Loops & Conditionals', done: true },
      { id: 'd2', name: 'Functions', done: true },
      { id: 'd3', name: 'Arrays & Pointers', done: true },
      { id: 'd4', name: 'Recursion', done: false },
      { id: 'd5', name: 'Sliding Window & Two Pointers', done: false },
      { id: 'd6', name: 'Linked Lists', done: false },
      { id: 'd7', name: 'Stacks & Queues', done: false },
      { id: 'd8', name: 'Trees', done: false },
      { id: 'd9', name: 'Graphs', done: false },
      { id: 'd10', name: 'Dynamic Programming', done: false },
    ],
  },
  webdev: {
    name: 'Web Development',
    icon: '💻',
    start: null,
    end: '2026-09-05',
    topics: [
      { id: 'w1', name: 'HTML & CSS', done: true },
      { id: 'w2', name: 'JS Basics (vars, loops, functions)', done: true },
      { id: 'w3', name: 'Objects, Map & Filter', done: true },
      { id: 'w4', name: 'DOM Manipulation & Events', done: false },
      { id: 'w5', name: 'ES6+ (destructuring, promises, async/await)', done: false },
      { id: 'w6', name: 'React Basics & Hooks', done: false },
      { id: 'w7', name: 'Next.js', done: false },
      { id: 'w8', name: 'Node.js & Express', done: false },
      { id: 'w9', name: 'Full-Stack Project', done: false },
      { id: 'w10', name: 'Deployment', done: false },
    ],
  },
  mysql: {
    name: 'MySQL',
    icon: '🗄️',
    start: '2026-06-15',
    end: '2026-06-23',
    topics: [
      { id: 'm1', name: 'Setup & Basics', done: false },
      { id: 'm2', name: 'CRUD Queries', done: false },
      { id: 'm3', name: 'Joins', done: false },
      { id: 'm4', name: 'Aggregate Functions & Group By', done: false },
      { id: 'm5', name: 'Subqueries', done: false },
      { id: 'm6', name: 'Indexes & Optimization', done: false },
      { id: 'm7', name: 'Database Design / Normalization', done: false },
      { id: 'm8', name: 'Mini Project', done: false },
    ],
  },
  php: {
    name: 'PHP',
    icon: '🐘',
    start: '2026-06-24',
    end: '2026-07-14',
    topics: [
      { id: 'p1', name: 'PHP Basics & Syntax', done: false },
      { id: 'p2', name: 'Forms & Superglobals', done: false },
      { id: 'p3', name: 'Sessions & Cookies', done: false },
      { id: 'p4', name: 'OOP in PHP', done: false },
      { id: 'p5', name: 'MySQL Integration (PDO)', done: false },
      { id: 'p6', name: 'File Handling', done: false },
      { id: 'p7', name: 'Laravel Basics', done: false },
      { id: 'p8', name: 'Mini Project', done: false },
    ],
  },
  socketio: {
    name: 'Socket.io',
    icon: '🔌',
    start: '2026-07-18',
    end: '2026-08-05',
    topics: [
      { id: 's1', name: 'WebSockets Intro', done: false },
      { id: 's2', name: 'Socket.io Setup', done: false },
      { id: 's3', name: 'Emit & Listen Events', done: false },
      { id: 's4', name: 'Rooms & Namespaces', done: false },
      { id: 's5', name: 'Real-time Chat App', done: false },
      { id: 's6', name: 'Broadcasting', done: false },
      { id: 's7', name: 'Express Integration', done: false },
      { id: 's8', name: 'Mini Project', done: false },
    ],
  },
  aiml: {
    name: 'AI / ML',
    icon: '🤖',
    start: '2026-10-01',
    end: null,
    topics: [
      { id: 'a1', name: 'Python for ML', done: false },
      { id: 'a2', name: 'NumPy & Pandas', done: false },
      { id: 'a3', name: 'Data Visualization', done: false },
      { id: 'a4', name: 'Linear & Logistic Regression', done: false },
      { id: 'a5', name: 'Classification Algorithms', done: false },
      { id: 'a6', name: 'Neural Network Basics', done: false },
      { id: 'a7', name: 'Mini Project', done: false },
    ],
  },
};

const JOURNAL_QUESTIONS = [
  { id: 'hardest', label: "What's the hardest thing I did today?" },
  { id: 'happy', label: 'What made me happy today?' },
  { id: 'senses', label: 'Did I listen to my senses today?' },
  { id: 'best', label: 'Did I give my best today?' },
  { id: 'oneThing', label: 'One thing I did that made me happy' },
  { id: 'lesson', label: 'Lesson for today' },
];

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'journal', label: 'Journal' },
];

const initialState = () => ({
  todos: [],
  streak: { count: 0, longest: 0, lastDate: null },
  studyHours: {},
  habits: DEFAULT_HABITS,
  habitLog: {},
  trackers: TRACKERS_DEF,
  books: {},
  journal: {},
});

// ---------- shared styles ----------
const card = {
  background: C.white,
  borderRadius: 20,
  padding: 20,
  boxShadow: '0 4px 20px rgba(61,46,54,0.07)',
};
const sectionTitle = {
  fontFamily: "'Fredoka', sans-serif",
  fontWeight: 600,
  fontSize: 17,
  color: C.ink,
  marginBottom: 14,
};
const inputStyle = {
  border: `2px solid ${C.cream}`,
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 14,
  outline: 'none',
  background: C.white,
  color: C.ink,
  flex: 1,
  minWidth: 0,
};
const btn = (bg, color = C.white) => ({
  background: bg,
  color,
  border: 'none',
  borderRadius: 10,
  padding: '10px 16px',
  fontWeight: 800,
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
});
const iconBtnStyle = (disabled) => ({
  background: disabled ? C.cream : C.white,
  color: disabled ? C.inkSoft : C.ink,
  border: `2px solid ${disabled ? C.cream : C.teal}`,
  borderRadius: 10,
  padding: '8px 14px',
  fontWeight: 700,
  fontSize: 13,
  cursor: disabled ? 'default' : 'pointer',
  opacity: disabled ? 0.5 : 1,
});
const tabStyle = (active) => ({
  background: active ? C.pink : C.white,
  color: active ? C.white : C.ink,
  border: 'none',
  borderRadius: 999,
  padding: '10px 18px',
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
});

// ---------- small shared components ----------
function ProgressBar({ pct, label, color = C.pink }) {
  return (
    <div>
      {label && <div style={{ fontSize: 12, color: C.inkSoft, marginBottom: 6 }}>{label}</div>}
      <div style={{ height: 10, background: C.cream, borderRadius: 8, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: color,
            borderRadius: 8,
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}

function StreakBadge({ streak, markedToday, onMark }) {
  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${C.black}, #241726)`,
        borderRadius: 20,
        padding: '22px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        animation: 'pulseGlow 3s ease-in-out infinite',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ fontSize: 36, animation: 'flicker 2s ease-in-out infinite' }}>🔥</div>
        <div>
          <div
            style={{
              fontFamily: "'Fredoka', sans-serif",
              fontSize: 38,
              fontWeight: 700,
              color: C.pink,
              lineHeight: 1,
              textShadow: `0 0 18px ${C.pink}aa`,
            }}
          >
            {streak.count}
          </div>
          <div style={{ color: '#F2D9E5', fontSize: 12, marginTop: 2, letterSpacing: 0.5 }}>
            DAY STREAK{streak.longest > streak.count ? ` · BEST ${streak.longest}` : ''}
          </div>
        </div>
      </div>
      <button
        onClick={onMark}
        disabled={markedToday}
        style={{
          background: markedToday ? 'transparent' : C.pink,
          color: markedToday ? C.pink : C.black,
          border: `2px solid ${C.pink}`,
          borderRadius: 999,
          padding: '10px 20px',
          fontWeight: 800,
          fontSize: 13,
          cursor: markedToday ? 'default' : 'pointer',
        }}
      >
        {markedToday ? '✓ Marked Today' : 'Mark Today Done'}
      </button>
    </div>
  );
}

// ---------- Today tab ----------
function TodoBox({ todos, update }) {
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return;
    update((s) => ({ ...s, todos: [...s.todos, { id: 't' + Date.now(), text: text.trim(), done: false }] }));
    setText('');
  };
  const toggle = (id) =>
    update((s) => ({ ...s, todos: s.todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) }));
  const remove = (id) => update((s) => ({ ...s, todos: s.todos.filter((t) => t.id !== id) }));
  const clearDone = () => update((s) => ({ ...s, todos: s.todos.filter((t) => !t.done) }));
  const doneCount = todos.filter((t) => t.done).length;

  return (
    <div style={card}>
      <div style={sectionTitle}>🎯 Daily Target</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a target for today..."
          style={inputStyle}
        />
        <button onClick={add} style={btn(C.pink)}>
          Add
        </button>
      </div>
      {todos.length === 0 && (
        <div style={{ color: C.inkSoft, fontSize: 14 }}>No targets yet — add your first one above.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {todos.map((t) => (
          <div
            key={t.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: t.done ? C.pinkSoft : C.cream,
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <input
              type="checkbox"
              checked={t.done}
              onChange={() => toggle(t.id)}
              style={{ width: 18, height: 18, accentColor: C.pink }}
            />
            <span
              style={{
                flex: 1,
                textDecoration: t.done ? 'line-through' : 'none',
                color: t.done ? C.inkSoft : C.ink,
                fontSize: 14,
              }}
            >
              {t.text}
            </span>
            <button
              onClick={() => remove(t.id)}
              style={{ background: 'none', border: 'none', color: C.inkSoft, cursor: 'pointer', fontSize: 18 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      {todos.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <div style={{ fontSize: 13, color: C.inkSoft }}>
            {doneCount}/{todos.length} done
          </div>
          {doneCount > 0 && (
            <button onClick={clearDone} style={{ ...btn(C.teal, C.ink), padding: '6px 12px', fontSize: 12 }}>
              Clear done
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function StudyHoursCard({ studyHours, update }) {
  const [val, setVal] = useState('');
  const [date, setDate] = useState(todayStr());
  const log = () => {
    const h = parseFloat(val);
    if (isNaN(h) || h < 0) return;
    update((s) => ({ ...s, studyHours: { ...s.studyHours, [date]: h } }));
    setVal('');
  };
  const days = getLast7Days();
  const maxH = Math.max(8, ...days.map((d) => studyHours[d] || 0));

  return (
    <div style={card}>
      <div style={sectionTitle}>📚 Study Hours</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ ...inputStyle, flex: '1 1 130px' }} />
        <input
          type="number"
          min="0"
          step="0.5"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          placeholder="Hours"
          style={{ ...inputStyle, flex: '1 1 90px' }}
        />
        <button onClick={log} style={btn(C.teal, C.ink)}>
          Log
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 130, padding: '0 4px' }}>
        {days.map((d) => {
          const h = studyHours[d] || 0;
          const pct = Math.min(100, (h / maxH) * 100);
          const isToday = d === todayStr();
          return (
            <div key={d} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%' }}>
              <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
                <div
                  style={{
                    width: '70%',
                    height: `${pct}%`,
                    minHeight: h > 0 ? 6 : 0,
                    background: isToday ? C.pink : C.teal,
                    borderRadius: '8px 8px 4px 4px',
                    transition: 'height 0.3s ease',
                    position: 'relative',
                  }}
                >
                  {h > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -18,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 11,
                        color: C.inkSoft,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}h
                    </div>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.inkSoft, fontWeight: isToday ? 800 : 400 }}>{dayLabel(d)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function HabitsCard({ habits, habitLog, update }) {
  const [newHabit, setNewHabit] = useState('');
  const today = todayStr();
  const todayLog = habitLog[today] || {};

  const toggle = (id) =>
    update((s) => ({
      ...s,
      habitLog: {
        ...s.habitLog,
        [today]: { ...(s.habitLog[today] || {}), [id]: !((s.habitLog[today] || {})[id]) },
      },
    }));
  const addHabit = () => {
    if (!newHabit.trim()) return;
    update((s) => ({ ...s, habits: [...s.habits, { id: 'h' + Date.now(), name: newHabit.trim() }] }));
    setNewHabit('');
  };
  const removeHabit = (id) => update((s) => ({ ...s, habits: s.habits.filter((h) => h.id !== id) }));

  const doneCount = habits.filter((h) => todayLog[h.id]).length;
  const pct = habits.length ? Math.round((doneCount / habits.length) * 100) : 0;

  return (
    <div style={card}>
      <div style={sectionTitle}>✅ Daily Habits</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {habits.map((h) => (
          <div
            key={h.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: todayLog[h.id] ? C.pinkSoft : C.cream,
              borderRadius: 12,
              padding: '10px 12px',
            }}
          >
            <input
              type="checkbox"
              checked={!!todayLog[h.id]}
              onChange={() => toggle(h.id)}
              style={{ width: 18, height: 18, accentColor: C.pink }}
            />
            <span style={{ flex: 1, fontSize: 14 }}>{h.name}</span>
            <button
              onClick={() => removeHabit(h.id)}
              style={{ background: 'none', border: 'none', color: C.inkSoft, cursor: 'pointer', fontSize: 18 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
        <input
          value={newHabit}
          onChange={(e) => setNewHabit(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addHabit()}
          placeholder="Add a habit..."
          style={inputStyle}
        />
        <button onClick={addHabit} style={btn(C.pink)}>
          Add
        </button>
      </div>
      <ProgressBar pct={pct} label={`Today: ${doneCount}/${habits.length}`} />
    </div>
  );
}

function TodayTab({ state, update }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <TodoBox todos={state.todos} update={update} />
      <StudyHoursCard studyHours={state.studyHours} update={update} />
      <HabitsCard habits={state.habits} habitLog={state.habitLog} update={update} />
    </div>
  );
}

// ---------- Roadmap tab ----------
function TrackerCard({ trackerKey, tracker, update }) {
  const [open, setOpen] = useState(false);
  const total = tracker.topics.length;
  const done = tracker.topics.filter((t) => t.done).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const status = getStatus(tracker.start, tracker.end);
  const toggleTopic = (id) =>
    update((s) => ({
      ...s,
      trackers: {
        ...s.trackers,
        [trackerKey]: {
          ...s.trackers[trackerKey],
          topics: s.trackers[trackerKey].topics.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
        },
      },
    }));

  const statusStyle = {
    done: { bg: C.teal, text: 'Completed', color: C.ink },
    active: { bg: C.pink, text: 'In Progress', color: C.white },
    upcoming: { bg: C.cream, text: 'Upcoming', color: C.inkSoft },
  }[status];

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div>
          <div style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 17 }}>
            {tracker.icon} {tracker.name}
          </div>
          <div style={{ fontSize: 12, color: C.inkSoft, marginTop: 2 }}>{trackerDateLabel(tracker)}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              background: statusStyle.bg,
              color: statusStyle.color,
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 999,
            }}
          >
            {statusStyle.text}
          </span>
          <span style={{ color: C.inkSoft }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      <div style={{ marginTop: 12 }}>
        <ProgressBar pct={pct} label={`${done}/${total} topics · ${pct}%`} />
      </div>
      {open && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {tracker.topics.map((t) => (
            <label
              key={t.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                padding: '6px 8px',
                borderRadius: 8,
                background: t.done ? C.pinkSoft : C.cream,
              }}
            >
              <input
                type="checkbox"
                checked={t.done}
                onChange={() => toggleTopic(t.id)}
                style={{ width: 16, height: 16, accentColor: C.pink }}
              />
              <span style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? C.inkSoft : C.ink }}>{t.name}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function RoadmapTab({ trackers, update }) {
  const all = Object.values(trackers);
  const totalTopics = all.reduce((a, t) => a + t.topics.length, 0);
  const doneTopics = all.reduce((a, t) => a + t.topics.filter((x) => x.done).length, 0);
  const overallPct = totalTopics ? Math.round((doneTopics / totalTopics) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={card}>
        <div style={sectionTitle}>🗺️ 6-Month Roadmap</div>
        <ProgressBar pct={overallPct} label={`Overall: ${doneTopics}/${totalTopics} topics · ${overallPct}%`} color={C.teal} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {Object.entries(trackers).map(([key, tr]) => (
          <TrackerCard key={key} trackerKey={key} tracker={tr} update={update} />
        ))}
      </div>
    </div>
  );
}

// ---------- Monthly tab ----------
function HabitHeatmap({ habitLog, habits }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const numDays = new Date(year, month + 1, 0).getDate();
  const totalHabits = habits.length || 1;
  let totalPct = 0;
  let countedDays = 0;
  const cells = [];
  for (let day = 1; day <= numDays; day++) {
    const dStr = `${year}-${pad(month + 1)}-${pad(day)}`;
    const log = habitLog[dStr] || {};
    const doneCount = habits.filter((h) => log[h.id]).length;
    const pct = totalHabits ? doneCount / totalHabits : 0;
    const isFuture = new Date(dStr) > now;
    if (!isFuture && Object.keys(log).length > 0) {
      totalPct += pct;
      countedDays++;
    }
    cells.push({ day, pct, isFuture, isToday: dStr === todayStr() });
  }
  const monthAvg = countedDays ? Math.round((totalPct / countedDays) * 100) : 0;

  return (
    <div style={card}>
      <div style={sectionTitle}>🗓️ Monthly Habit Progress</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 14 }}>
        {cells.map((c) => (
          <div
            key={c.day}
            title={`${Math.round(c.pct * 100)}%`}
            style={{
              aspectRatio: '1',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              background: c.isFuture ? C.cream : `rgba(255,120,172,${0.15 + c.pct * 0.75})`,
              color: c.pct > 0.5 ? C.white : C.inkSoft,
              border: c.isToday ? `2px solid ${C.pink}` : '1px solid transparent',
              fontWeight: c.isToday ? 800 : 400,
            }}
          >
            {c.day}
          </div>
        ))}
      </div>
      <ProgressBar pct={monthAvg} label={`Average completion this month: ${monthAvg}%`} color={C.teal} />
    </div>
  );
}

function BooksCard({ books, update }) {
  const [month, setMonth] = useState(todayStr().slice(0, 7));
  const [title, setTitleField] = useState('');
  const [author, setAuthor] = useState('');
  const monthBooks = books[month] || [];

  const addBook = () => {
    if (!title.trim()) return;
    update((s) => ({
      ...s,
      books: { ...s.books, [month]: [...(s.books[month] || []), { id: 'b' + Date.now(), title: title.trim(), author: author.trim() }] },
    }));
    setTitleField('');
    setAuthor('');