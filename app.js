// ── EmojiChat — app.js ──────────────────────────────────────────────────────

const AVATARS = ['😎','🐱','🦊','🐸','🐼','🦋','🐺','🦅','🐙','🎃','👾','🤖'];

const CATS = [
  { icon: '😊', label: 'Caras', emojis: ['😀','😂','🥹','😍','🥰','😎','🤩','🥳','😤','😭','😱','🤔','🤗','😏','😴','🥺','😇','🤣','😅','😬','🙃','😋','😜','🤪','🫠'] },
  { icon: '👋', label: 'Gestos', emojis: ['👋','🤙','👍','👎','👏','🙌','🤝','✌️','🤞','💪','🫶','🖐️','👆','🫵','🤘','👌','🤌','🫰','✊','🤛','🤜','💅','🦾','🫱','🫲'] },
  { icon: '❤️', label: 'Amor', emojis: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','💔','❤️‍🔥','💕','💞','💓','💗','💖','💘','💝','💟','❣️','💌','💋','😘','🫀','💑','👫'] },
  { icon: '🐶', label: 'Animales', emojis: ['🐶','🐱','🦊','🐸','🐼','🐨','🦁','🐯','🐮','🐷','🐔','🐧','🦆','🦉','🐺','🦝','🐻','🐰','🐹','🐭','🐴','🦄','🦋','🐝','🐙'] },
  { icon: '🍕', label: 'Comida', emojis: ['🍕','🍔','🌮','🍜','🍣','🍦','🎂','🍰','🥐','🍩','🍿','🥤','🍺','🧃','☕','🍷','🥗','🍱','🥙','🧆','🍛','🥘','🍲','🥞','🧇'] },
  { icon: '🌟', label: 'Símbolos', emojis: ['⭐','🌟','✨','💫','🔥','💥','🌈','☀️','🌙','❄️','⚡','🌊','🎉','🎊','🎈','🎁','🔮','💎','🪄','🎭','🎪','🎯','🏆','🥇','🎀'] },
  { icon: '😂', label: 'Memes', emojis: ['😂','💀','🗿','🤡','👀','🫠','🥴','😵','🤯','🧠','🫡','🤫','😶‍🌫️','🫣','🙈','🙉','🙊','🤥','😈','👿','💩','🤖','👻','☠️','🫨'] },
  { icon: '⚽', label: 'Deporte', emojis: ['⚽','🏀','🎾','🏈','⚾','🎱','🏐','🥊','🎯','🏆','🥇','🥈','🥉','🎽','🛹','🏄','🤸','⛷️','🏋️','🤼','🏇','🧗','🏊','🚴','🤺'] },
];

// ── Estado global ────────────────────────────────────────────────────────────
let supabaseClient = null;
let currentUser = null;
let draft = '';
let activeCat = 0;
let onlineChannel = null;
let onlineUsers = new Set();

// ── Credenciales (guardadas en localStorage) ─────────────────────────────────
function getCreds() {
  return {
    url: localStorage.getItem('sb_url') || '',
    key: localStorage.getItem('sb_key') || '',
  };
}
function saveCreds(url, key) {
  localStorage.setItem('sb_url', url.trim());
  localStorage.setItem('sb_key', key.trim());
}

// ── Pantallas ────────────────────────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ── Toast ────────────────────────────────────────────────────────────────────
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 2800);
}

// ── Pantalla JOIN ────────────────────────────────────────────────────────────
function initJoinScreen() {
  const input = document.getElementById('username-input');
  const btn   = document.getElementById('join-btn');
  const opts  = document.getElementById('avatar-options');
  let selectedAvatar = AVATARS[0];

  // Renderizar avatares
  AVATARS.forEach((av, i) => {
    const el = document.createElement('button');
    el.className = 'avatar-opt' + (i === 0 ? ' selected' : '');
    el.textContent = av;
    el.addEventListener('click', () => {
      document.querySelectorAll('.avatar-opt').forEach(o => o.classList.remove('selected'));
      el.classList.add('selected');
      selectedAvatar = av;
    });
    opts.appendChild(el);
  });

  // Recuperar nombre anterior
  const savedName = localStorage.getItem('ec_username') || '';
  const savedAvatar = localStorage.getItem('ec_avatar') || '';
  if (savedName) { input.value = savedName; btn.disabled = false; }
  if (savedAvatar) {
    selectedAvatar = savedAvatar;
    document.querySelectorAll('.avatar-opt').forEach(el => {
      el.classList.toggle('selected', el.textContent === savedAvatar);
    });
  }

  input.addEventListener('input', () => { btn.disabled = input.value.trim().length < 1; });
  input.addEventListener('keydown', e => { if (e.key === 'Enter' && !btn.disabled) btn.click(); });

  btn.addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) return;
    currentUser = { name, avatar: selectedAvatar };
    localStorage.setItem('ec_username', name);
    localStorage.setItem('ec_avatar', selectedAvatar);
    initChat();
  });

  document.getElementById('open-setup').addEventListener('click', e => {
    e.preventDefault();
    showScreen('screen-setup');
  });
}

// ── Pantalla SETUP ────────────────────────────────────────────────────────────
function initSetupScreen() {
  const { url, key } = getCreds();
  if (url) document.getElementById('sb-url').value = url;
  if (key) document.getElementById('sb-key').value = key;

  document.getElementById('back-from-setup').addEventListener('click', () => showScreen('screen-join'));

  document.getElementById('save-creds').addEventListener('click', () => {
    const url = document.getElementById('sb-url').value.trim();
    const key = document.getElementById('sb-key').value.trim();
    if (!url || !key) { toast('Completá los dos campos'); return; }
    saveCreds(url, key);
    toast('✅ Credenciales guardadas');
    setTimeout(() => showScreen('screen-join'), 800);
  });
}

// ── Inicializar Supabase ──────────────────────────────────────────────────────
function initSupabase() {
  const { url, key } = getCreds();
  if (!url || !key) return false;
  try {
    supabaseClient = supabase.createClient(url, key);
    return true;
  } catch(e) {
    console.error('Supabase init error:', e);
    return false;
  }
}

// ── Chat ──────────────────────────────────────────────────────────────────────
async function initChat() {
  showScreen('screen-chat');
  buildComposer();
  updatePreview();

  const ok = initSupabase();
  const status = document.getElementById('chat-status');

  if (!ok) {
    status.textContent = 'Sin conexión — configurá Supabase';
    toast('⚙️ Configurá Supabase para conectarte');
    return;
  }

  status.textContent = 'Conectando…';

  try {
    // Cargar mensajes recientes
    await loadRecentMessages();

    // Suscribirse a nuevos mensajes en tiempo real
    supabaseClient
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new;
        const isMe = msg.username === currentUser.name && msg.avatar === currentUser.avatar;
        renderMessage(msg, isMe);
      })
      .subscribe(s => {
        if (s === 'SUBSCRIBED') {
          status.textContent = 'Conectado';
          status.classList.add('connected');
        }
      });

    // Canal de presencia (quién está en línea)
    onlineChannel = supabaseClient.channel('online-users', {
      config: { presence: { key: currentUser.name } }
    });

    onlineChannel
      .on('presence', { event: 'sync' }, () => {
        const state = onlineChannel.presenceState();
        onlineUsers = new Set(Object.keys(state));
        document.getElementById('online-count').textContent = onlineUsers.size + ' en línea';
      })
      .subscribe(async s => {
        if (s === 'SUBSCRIBED') {
          await onlineChannel.track({ name: currentUser.name, avatar: currentUser.avatar, online_at: new Date().toISOString() });
        }
      });

  } catch(e) {
    status.textContent = 'Error de conexión';
    toast('❌ Error al conectar. Revisá las credenciales');
    console.error(e);
  }

  // Enviar mensaje
  document.getElementById('send-btn').addEventListener('click', sendMessage);
  document.getElementById('del-btn').addEventListener('click', deleteLast);
}

// ── Cargar mensajes recientes ────────────────────────────────────────────────
async function loadRecentMessages() {
  const { data, error } = await supabaseClient
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) { console.error(error); return; }
  if (data && data.length > 0) {
    document.getElementById('messages-empty').style.display = 'none';
    data.forEach(msg => {
      const isMe = msg.username === currentUser.name && msg.avatar === currentUser.avatar;
      renderMessage(msg, isMe);
    });
  }
}

// ── Renderizar mensaje ────────────────────────────────────────────────────────
function renderMessage(msg, isMe) {
  const empty = document.getElementById('messages-empty');
  if (empty) empty.style.display = 'none';

  const time = new Date(msg.created_at);
  const timeStr = time.getHours().toString().padStart(2,'0') + ':' + time.getMinutes().toString().padStart(2,'0');

  const div = document.createElement('div');
  div.className = `msg ${isMe ? 'me' : 'other'}`;
  div.innerHTML = `
    <div class="msg-meta">
      <span class="msg-avatar">${msg.avatar}</span>
      <span class="msg-name">${escapeHtml(msg.username)}</span>
    </div>
    <div class="msg-bubble">${escapeHtml(msg.emojis)}</div>
    <div class="msg-time">${timeStr}</div>
  `;

  const msgs = document.getElementById('messages');
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

// ── Enviar mensaje ────────────────────────────────────────────────────────────
async function sendMessage() {
  if (!draft.trim()) return;
  const emojis = draft;
  draft = '';
  updatePreview();

  if (!supabaseClient) {
    // Modo demo sin backend: mostrar localmente
    renderMessage({ username: currentUser.name, avatar: currentUser.avatar, emojis, created_at: new Date().toISOString() }, true);
    return;
  }

  const { error } = await supabaseClient.from('messages').insert({
    username: currentUser.name,
    avatar: currentUser.avatar,
    emojis,
  });

  if (error) { toast('❌ No se pudo enviar'); console.error(error); }
}

// ── Composer ─────────────────────────────────────────────────────────────────
function buildComposer() {
  // Tabs
  const tabs = document.getElementById('cat-tabs');
  tabs.innerHTML = '';
  CATS.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'cat-tab' + (i === 0 ? ' active' : '');
    btn.textContent = c.icon;
    btn.title = c.label;
    btn.addEventListener('click', () => switchCat(i));
    tabs.appendChild(btn);
  });

  renderCatEmojis(0);
}

function switchCat(i) {
  activeCat = i;
  document.querySelectorAll('.cat-tab').forEach((t, idx) => t.classList.toggle('active', idx === i));
  renderCatEmojis(i);
}

function renderCatEmojis(i) {
  const grid = document.getElementById('emoji-grid');
  grid.innerHTML = '';
  CATS[i].emojis.forEach(e => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.textContent = e;
    btn.addEventListener('click', () => addEmoji(e));
    grid.appendChild(btn);
  });
}

function addEmoji(e) {
  draft += e;
  updatePreview();
}

function deleteLast() {
  const segs = [...new Intl.Segmenter().segment(draft)];
  segs.pop();
  draft = segs.map(s => s.segment).join('');
  updatePreview();
}

function updatePreview() {
  const el = document.getElementById('preview');
  const btn = document.getElementById('send-btn');
  el.textContent = draft;
  el.dataset.empty = draft.length === 0 ? 'true' : 'false';
  btn.disabled = draft.trim().length === 0;
}

// ── Utilidades ────────────────────────────────────────────────────────────────
function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initJoinScreen();
  initSetupScreen();
  showScreen('screen-join');
});
