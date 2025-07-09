// app.js - Robust, Modular Habit Tracker Logic

// Default user data
const defaultUser = {
  name: 'John Smith',
  level: 5,
  xp: 1245,
  streak: 12,
  habitsCount: 5,
  levelProgress: 65, // percent
};

// --- State Management ---
const HABITS_KEY = 'habitforge_habits';
const USER_KEY = 'habitforge_user';

function getHabits() {
  const data = localStorage.getItem(HABITS_KEY);
  return data ? JSON.parse(data) : [];
}
function setHabits(habits) {
  localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}
function getUser() {
  const data = localStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : { name: 'John Smith' };
}
function setUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// --- Modal Logic ---
function openHabitModal(mode = 'add', habit = null) {
  const modal = document.getElementById('addHabitModal');
  if (!modal) return;
  modal.classList.remove('hidden');
  document.getElementById('habitForm').reset();
  modal.dataset.mode = mode;
  if (mode === 'edit' && habit) {
    modal.dataset.editId = habit.id;
    document.getElementById('habitName').value = habit.name;
    document.getElementById('habitFrequency').value = habit.frequency;
    document.getElementById('habitTime').value = habit.time;
    document.getElementById('habitCategory').value = habit.category;
  } else {
    delete modal.dataset.editId;
  }
}
function closeHabitModal() {
  const modal = document.getElementById('addHabitModal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.getElementById('habitForm').reset();
}

// --- Render Habits ---
function renderHabits(containerId) {
  const habits = getHabits();
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (habits.length === 0) {
    container.innerHTML = '<div class="col-span-3 text-center text-gray-500">No habits yet. Add one!</div>';
    return;
  }
  habits.forEach(habit => {
    const card = document.createElement('div');
    card.className = 'habit-card bg-white rounded-xl shadow-md p-6 transition cursor-pointer';
    card.dataset.id = habit.id;
    card.innerHTML = `
      <div class="flex justify-between items-start mb-4">
        <div>
          <h3 class="font-bold text-lg">${habit.name}</h3>
          <p class="text-gray-500 text-sm">${habit.frequency === 'custom' ? 'Custom' : habit.frequency.charAt(0).toUpperCase() + habit.frequency.slice(1)}${habit.time ? ' at ' + habit.time : ''}</p>
        </div>
        <div class="${habit.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} px-2 py-1 rounded-full text-xs font-medium">
          ${habit.status.charAt(0).toUpperCase() + habit.status.slice(1)}
        </div>
      </div>
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="text-sm text-gray-600">Current Streak</p>
          <p class="font-bold text-indigo-600">${habit.streak || 0} days</p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Total XP</p>
          <p class="font-bold text-indigo-600">${habit.xp || 0}</p>
        </div>
      </div>
      <div class="flex justify-between items-center">
        <button class="complete-btn bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 transition">Mark Complete</button>
        <div class="flex space-x-2">
          <button class="edit-btn p-2 text-gray-500 hover:text-indigo-600 transition"><i class="fas fa-edit"></i></button>
          <button class="delete-btn p-2 text-gray-500 hover:text-red-600 transition"><i class="fas fa-trash-alt"></i></button>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

// --- Render Stats ---
function renderStats() {
  const habits = getHabits();
  const user = getUser();
  const totalXP = habits.reduce((sum, h) => sum + (h.xp || 0), 0);
  const level = 1 + Math.floor(totalXP / 500);
  const levelProgress = Math.floor((totalXP % 500) / 5);
  const streak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
  const habitsCount = habits.length;
  // Update DOM
  if (document.getElementById('profileName')) document.getElementById('profileName').textContent = user.name;
  if (document.getElementById('profileLevel')) document.getElementById('profileLevel').textContent = `Level ${level} Habit Builder`;
  if (document.getElementById('currentStreak')) document.getElementById('currentStreak').textContent = `${streak} days`;
  if (document.getElementById('totalXP')) document.getElementById('totalXP').textContent = totalXP.toLocaleString();
  if (document.getElementById('habitsCount')) document.getElementById('habitsCount').textContent = habitsCount;
  if (document.getElementById('levelProgressLabel')) document.getElementById('levelProgressLabel').textContent = `Level ${level} Progress`;
  if (document.getElementById('levelProgressPercent')) document.getElementById('levelProgressPercent').textContent = `${levelProgress}%`;
  if (document.getElementById('levelProgressBar')) document.getElementById('levelProgressBar').style.setProperty('--progress', `${levelProgress}%`);
}

// --- Event Delegation for Habit Actions ---
function setupHabitActions(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.onclick = function(e) {
    const card = e.target.closest('.habit-card');
    if (!card) return;
    const id = Number(card.dataset.id);
    if (e.target.closest('.complete-btn')) {
      completeHabit(id, card);
    } else if (e.target.closest('.edit-btn')) {
      const habit = getHabits().find(h => h.id === id);
      openHabitModal('edit', habit);
    } else if (e.target.closest('.delete-btn')) {
      deleteHabit(id);
    }
  };
}

// --- Habit Actions ---
function addHabit(habit) {
  const habits = getHabits();
  habit.id = Date.now();
  habit.streak = 0;
  habit.xp = 0;
  habit.status = 'active';
  habit.completedDates = [];
  habits.push(habit);
  setHabits(habits);
  rerenderAll();
}
function editHabit(id, updated) {
  let habits = getHabits();
  habits = habits.map(h => h.id === id ? { ...h, ...updated } : h);
  setHabits(habits);
  rerenderAll();
}
function deleteHabit(id) {
  let habits = getHabits();
  habits = habits.filter(h => h.id !== id);
  setHabits(habits);
  rerenderAll();
}
function completeHabit(id, card) {
  let habits = getHabits();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  habits = habits.map(h => {
    if (h.id === id) {
      h.streak = (h.streak || 0) + 1;
      h.xp = (h.xp || 0) + 30;
      if (!h.completedDates) h.completedDates = [];
      if (!h.completedDates.includes(today)) h.completedDates.push(today);
    }
    return h;
  });
  setHabits(habits);
  // UI feedback
  const btn = card.querySelector('.complete-btn');
  btn.textContent = 'Completed!';
  btn.classList.remove('bg-indigo-600', 'hover:bg-indigo-700');
  btn.classList.add('bg-green-500', 'hover:bg-green-600');
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = 'Mark Complete';
    btn.classList.remove('bg-green-500', 'hover:bg-green-600');
    btn.classList.add('bg-indigo-600', 'hover:bg-indigo-700');
    btn.disabled = false;
    rerenderAll();
  }, 2000);
  renderStats();
}

// --- Rerender Everything ---
function rerenderAll() {
  renderStats();
  if (document.getElementById('dashboardHabitsList')) {
    renderHabits('dashboardHabitsList');
    setupHabitActions('dashboardHabitsList');
  }
  if (document.getElementById('habitsList')) {
    renderHabits('habitsList');
    setupHabitActions('habitsList');
  }
  renderDashboardProgress();
}

// --- Modal Event Listeners ---
function setupModalListeners() {
  const addBtn = document.getElementById('addHabitBtn');
  const mobileBtn = document.getElementById('mobileAddBtn');
  const closeBtn = document.getElementById('closeModalBtn');
  const cancelBtn = document.getElementById('cancelHabitBtn');
  const modal = document.getElementById('addHabitModal');
  const form = document.getElementById('habitForm');
  if (addBtn) addBtn.onclick = () => openHabitModal('add');
  if (mobileBtn) mobileBtn.onclick = () => openHabitModal('add');
  if (closeBtn) closeBtn.onclick = closeHabitModal;
  if (cancelBtn) cancelBtn.onclick = closeHabitModal;
  if (modal) modal.onclick = (e) => { if (e.target === modal) closeHabitModal(); };
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const mode = modal.dataset.mode;
      const editId = modal.dataset.editId;
      const habit = {
        name: document.getElementById('habitName').value,
        frequency: document.getElementById('habitFrequency').value,
        time: document.getElementById('habitTime').value,
        category: document.getElementById('habitCategory').value,
      };
      if (mode === 'edit' && editId) {
        editHabit(Number(editId), habit);
      } else {
        addHabit(habit);
      }
      closeHabitModal();
    };
  }
}

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  safeRenderHabits();
  setupModalListeners();
  if (document.getElementById('progressNoData')) {
    renderProgressPage();
  } else if (document.getElementById('progressBars')) {
    renderDashboardProgress();
  }
  setupAIChat();
});

// --- Dashboard Progress Bars ---
function renderDashboardStaticProgress() {
  const habits = getHabits();
  // --- Progress Bars ---
  const now = new Date();
  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  const weekDates = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - ((now.getDay() + 7 - ((i + 1) % 7)) % 7));
    weekDates.push(d.toISOString().slice(0, 10));
  }
  const barIds = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
  weekDates.forEach((date, i) => {
    const percent = habits.length ? Math.round(habits.filter(h => h.completedDates && h.completedDates.includes(date)).length / habits.length * 100) : 0;
    const bar = document.getElementById('bar' + barIds[i]);
    const percentSpan = document.getElementById('bar' + barIds[i] + 'Percent');
    if (bar) {
      bar.style.width = percent + '%';
      bar.className = 'h-2.5 rounded-full ' + (percent >= 80 ? 'bg-green-500' : percent >= 60 ? 'bg-yellow-500' : percent > 0 ? 'bg-red-500' : 'bg-gray-200');
    }
    if (percentSpan) percentSpan.textContent = percent + '%';
  });
  // --- Pie Chart ---
  const categories = ['health', 'learning', 'mindfulness', 'productivity'];
  const pieIds = ['pieHealth', 'pieLearning', 'pieMindfulness', 'pieProductivity'];
  const legendIds = ['legendHealth', 'legendLearning', 'legendMindfulness', 'legendProductivity'];
  const counts = categories.map(cat => habits.filter(h => h.category === cat).length);
  const total = counts.reduce((a, b) => a + b, 0);
  // Prepare segments for sorting and layering
  let segments = categories.map((cat, i) => ({
    id: pieIds[i],
    legendId: legendIds[i],
    count: counts[i],
    color: '', // not used, but could be
    percent: total ? counts[i] / total : 0,
    label: cat
  }));
  // Sort segments by percent descending for correct layering
  segments = segments.filter(s => s.count > 0).sort((a, b) => b.percent - a.percent);
  // Calculate and apply clip-paths
  let startAngle = 0;
  segments.forEach((seg, idx) => {
    const pie = document.getElementById(seg.id);
    if (!pie) return;
    if (segments.length === 1) {
      // Only one segment: full circle
      pie.style.display = '';
      pie.style.clipPath = '';
      pie.style.zIndex = 10;
    } else {
      if (seg.percent === 0) {
        pie.style.display = 'none';
        return;
      }
      pie.style.display = '';
      const endAngle = startAngle + seg.percent * 360;
      // Calculate clip-path for the segment
      const largeArc = seg.percent > 0.5 ? 1 : 0;
      // SVG arc math for CSS polygon
      const x1 = 50 + 50 * Math.cos(Math.PI * 2 * startAngle / 360 - Math.PI / 2);
      const y1 = 50 + 50 * Math.sin(Math.PI * 2 * startAngle / 360 - Math.PI / 2);
      const x2 = 50 + 50 * Math.cos(Math.PI * 2 * endAngle / 360 - Math.PI / 2);
      const y2 = 50 + 50 * Math.sin(Math.PI * 2 * endAngle / 360 - Math.PI / 2);
      // For CSS polygon, approximate the arc with a triangle fan (for simplicity, use 2 points)
      pie.style.clipPath = `polygon(50% 50%, 50% 0%, ${x1}% ${y1}%, ${x2}% ${y2}%)`;
      pie.style.zIndex = 10 - idx; // Layer largest at the bottom
    }
    startAngle += seg.percent * 360;
  });
  // Hide unused segments
  pieIds.forEach(id => {
    if (!segments.find(s => s.id === id)) {
      const pie = document.getElementById(id);
      if (pie) pie.style.display = 'none';
    }
  });
  // Update legend and total
  segments.forEach(seg => {
    const legend = document.getElementById(seg.legendId);
    if (legend) legend.textContent = seg.count;
  });
  const pieTotal = document.getElementById('pieTotal');
  if (pieTotal) pieTotal.textContent = total;
}

function arcPolygon(cx, cy, r, startAngle, endAngle, steps = 16) {
  // Returns a polygon string approximating an arc from startAngle to endAngle (in radians)
  const points = [[cx, cy]];
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / steps);
    points.push([
      cx + r * Math.cos(angle),
      cy + r * Math.sin(angle)
    ]);
  }
  return 'polygon(' + points.map(([x, y]) => `${(x * 100).toFixed(2)}% ${(y * 100).toFixed(2)}%`).join(', ') + ')';
}

function renderDashboardDivPieChart() {
  // Pie segment divs: order is indigo, green, yellow, purple
  const pieDivs = [
    document.querySelector('.border-indigo-500'),
    document.querySelector('.border-green-500'),
    document.querySelector('.border-yellow-500'),
    document.querySelector('.border-purple-500')
  ];
  const legendSpans = [
    ...document.querySelectorAll('.ml-8 .flex.items-center span.text-sm')
  ];
  const centerCount = document.querySelector('.relative.w-40.h-40 .text-2xl.font-bold');
  const habits = getHabits();
  const categories = ['health', 'learning', 'mindfulness', 'productivity'];
  const counts = categories.map(cat => habits.filter(h => h.category === cat).length);
  const total = counts.reduce((a, b) => a + b, 0);
  // Pie geometry
  const cx = 0.5, cy = 0.5, r = 0.48; // percent units
  let start = -Math.PI/2;
  for (let i = 0; i < 4; i++) {
    const div = pieDivs[i];
    if (!div) continue;
    if (counts[i] === 0 || total === 0) {
      div.style.display = 'none';
      continue;
    }
    div.style.display = '';
    const percent = counts[i] / total;
    const end = start + percent * 2 * Math.PI;
    // For full circle, no clip-path needed
    if (percent >= 0.999) {
      div.style.clipPath = '';
      div.style.zIndex = 10;
    } else {
      div.style.clipPath = arcPolygon(cx, cy, r, start, end, Math.max(8, Math.round(percent*32)));
      div.style.zIndex = 10 - i;
    }
    start = end;
  }
  // Update legend
  for (let i = 0; i < 4; i++) {
    if (legendSpans[i]) {
      legendSpans[i].textContent = legendSpans[i].textContent.replace(/\(\d+\)/, `(${counts[i]})`);
      legendSpans[i].textContent = legendSpans[i].textContent.replace(/\(\d*\)/, `(${counts[i]})`); // fallback
    }
  }
  // Update center count
  if (centerCount) centerCount.textContent = total;
}

function renderDashboardProgress() {
  renderDashboardStaticProgress();
  renderDashboardDivPieChart();
}

// --- AI Coach Chat ---
const aiResponses = [
  "Great job! Remember, consistency is key to building habits.",
  "Try breaking your habit into smaller steps if you're struggling.",
  "Don't forget to reward yourself for small wins!",
  "If you miss a day, just get back on track tomorrow.",
  "Visualize your success to stay motivated.",
  "Track your progress to see how far you've come.",
  "Stay positive! Every step counts.",
  "Set a reminder to help you remember your habit.",
  "Share your goals with a friend for accountability.",
  "Reflect on why you started this habit."
];

function getAIChat() {
  const data = localStorage.getItem('habitforge_aichat');
  return data ? JSON.parse(data) : [];
}

function setAIChat(chat) {
  localStorage.setItem('habitforge_aichat', JSON.stringify(chat));
}

function renderAIChat() {
  const chatBox = document.getElementById('aiChat');
  if (!chatBox) return;
  const chat = getAIChat();
  chatBox.innerHTML = '';
  chat.forEach(msg => {
    const div = document.createElement('div');
    div.className = `mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`;
    div.innerHTML = `<span class="inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border'} max-w-xs">${msg.text}</span>`;
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}

function handleAIChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('aiChatInput');
  if (!input || !input.value.trim()) return;
  const chat = getAIChat();
  const userMsg = { role: 'user', text: input.value.trim() };
  chat.push(userMsg);
  setAIChat(chat);
  renderAIChat();
  input.value = '';
  // Simulate AI response
  setTimeout(() => {
    const aiMsg = { role: 'ai', text: aiResponses[Math.floor(Math.random() * aiResponses.length)] };
    const updatedChat = getAIChat();
    updatedChat.push(aiMsg);
    setAIChat(updatedChat);
    renderAIChat();
  }, 700);
}

function setupAIChat() {
  const form = document.getElementById('aiChatForm');
  if (form) {
    form.addEventListener('submit', handleAIChatSubmit);
    renderAIChat();
  }
}

function safeRenderHabits() {
  if (document.getElementById('habitsList')) {
    renderHabits('habitsList');
    setupHabitActions('habitsList');
  }
  if (document.getElementById('dashboardHabitsList')) {
    renderHabits('dashboardHabitsList');
    setupHabitActions('dashboardHabitsList');
  }
}

function safeSetupHabitModal() {
  if (document.getElementById('habitForm')) setupModalListeners();
}

// --- Progress Page Weekly Bars ---
function renderWeeklyCompletionBars() {
  const container = document.getElementById('progressBars');
  if (!container) return;
  const habits = getHabits();
  if (!habits.length) { container.innerHTML = ''; return; }
  // Get current week days
  const now = new Date();
  const weekDays = [];
  const weekDates = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - ((now.getDay() + 7 - ((i + 1) % 7)) % 7));
    weekDates.push(d.toISOString().slice(0, 10));
    weekDays.push(dayNames[i]);
  }
  // Calculate completion % for each day
  const completions = weekDates.map(date => {
    const total = habits.length;
    const done = habits.filter(h => h.completedDates && h.completedDates.includes(date)).length;
    return total ? Math.round((done / total) * 100) : 0;
  });
  // Render bars
  container.innerHTML = '';
  completions.forEach((percent, i) => {
    let color = percent >= 80 ? 'bg-green-500' : percent >= 60 ? 'bg-yellow-500' : percent > 0 ? 'bg-red-500' : 'bg-gray-200';
    container.innerHTML += `
      <div class="flex justify-between mb-2 mt-4">
        <span class="text-sm text-gray-600">${weekDays[i]}</span>
        <span class="text-sm text-gray-600">${percent}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2.5 mb-2">
        <div class="${color} h-2.5 rounded-full" style="width: ${percent}%; transition: width 0.5s;"></div>
      </div>
    `;
  });
}

// --- Progress Page Logic ---
function renderProgressPage() {
  const habits = getHabits();
  const noData = document.getElementById('progressNoData');
  const charts = document.getElementById('progressCharts');
  if (!noData || !charts) return;
  if (!habits.length) {
    noData.classList.remove('hidden');
    charts.classList.add('hidden');
  } else {
    noData.classList.add('hidden');
    charts.classList.remove('hidden');
    renderWeeklyCompletionBars();
    renderProgressDivPieChart();
  }
}

// Patch DOMContentLoaded for progress page
const oldDOMContentLoaded = document.onreadystatechange || null;
document.addEventListener('DOMContentLoaded', () => {
  renderStats();
  safeRenderHabits();
  setupModalListeners();
  if (document.getElementById('progressNoData')) {
    renderProgressPage();
  } else {
    renderWeeklyCompletionBars();
  }
  setupAIChat();
  setupDashboardAIChat();
});

// Future: export/import, habits CRUD, progress, AI coach, etc. 
// Future: export/import, habits CRUD, progress, AI coach, etc. 

function renderProgressDivPieChart() {
  // Pie segment divs: order is indigo, green, yellow, purple
  const pieDivs = [
    document.querySelector('#progressCharts .border-indigo-500'),
    document.querySelector('#progressCharts .border-green-500'),
    document.querySelector('#progressCharts .border-yellow-500'),
    document.querySelector('#progressCharts .border-purple-500')
  ];
  const legendSpans = [
    ...document.querySelectorAll('#progressCharts .ml-8 .flex.items-center span.text-sm')
  ];
  const centerCount = document.querySelector('#progressCharts .relative.w-40.h-40 .text-2xl.font-bold');
  const habits = getHabits();
  const categories = ['health', 'learning', 'mindfulness', 'productivity'];
  const counts = categories.map(cat => habits.filter(h => h.category === cat).length);
  const total = counts.reduce((a, b) => a + b, 0);
  // Pie geometry
  const cx = 0.5, cy = 0.5, r = 0.48; // percent units
  let start = -Math.PI/2;
  for (let i = 0; i < 4; i++) {
    const div = pieDivs[i];
    if (!div) continue;
    if (counts[i] === 0 || total === 0) {
      div.style.display = 'none';
      continue;
    }
    div.style.display = '';
    const percent = counts[i] / total;
    const end = start + percent * 2 * Math.PI;
    // For full circle, no clip-path needed
    if (percent >= 0.999) {
      div.style.clipPath = '';
      div.style.zIndex = 10;
    } else {
      div.style.clipPath = arcPolygon(cx, cy, r, start, end, Math.max(8, Math.round(percent*32)));
      div.style.zIndex = 10 - i;
    }
    start = end;
  }
  // Update legend
  for (let i = 0; i < 4; i++) {
    if (legendSpans[i]) {
      legendSpans[i].textContent = legendSpans[i].textContent.replace(/\(\d+\)/, `(${counts[i]})`);
      legendSpans[i].textContent = legendSpans[i].textContent.replace(/\(\d*\)/, `(${counts[i]})`); // fallback
    }
  }
  // Update center count
  if (centerCount) centerCount.textContent = total;
}

// Patch renderProgressPage to call renderProgressDivPieChart
const oldRenderProgressPage = window.renderProgressPage;
window.renderProgressPage = function() {
  const habits = getHabits();
  const noData = document.getElementById('progressNoData');
  const charts = document.getElementById('progressCharts');
  if (!noData || !charts) return;
  if (!habits.length) {
    noData.classList.remove('hidden');
    charts.classList.add('hidden');
  } else {
    noData.classList.add('hidden');
    charts.classList.remove('hidden');
    renderWeeklyCompletionBars();
    renderProgressDivPieChart();
  }
};

// Future: export/import, habits CRUD, progress, AI coach, etc. 
// Future: export/import, habits CRUD, progress, AI coach, etc. 

// --- Dashboard AI Coach Chat (Dashboard Modal) ---
const dashboardAIResponses = [
  ...aiResponses,
  "What habit would you like to improve today?",
  "Remember: small steps lead to big changes!",
  "Try setting a reminder for your next habit.",
  "Stay consistent and celebrate your wins!"
];

function getDashboardAIChat() {
  const data = localStorage.getItem('habitforge_dashboard_aichat');
  return data ? JSON.parse(data) : [];
}
function setDashboardAIChat(chat) {
  localStorage.setItem('habitforge_dashboard_aichat', JSON.stringify(chat));
}
function renderDashboardAIChat() {
  const chatBox = document.getElementById('dashboardAIChat');
  if (!chatBox) return;
  const chat = getDashboardAIChat();
  chatBox.innerHTML = '';
  chat.forEach(msg => {
    const div = document.createElement('div');
    div.className = `mb-2 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`;
    div.innerHTML = `<span class="inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 border'} max-w-xs">${msg.text}</span>`;
    chatBox.appendChild(div);
  });
  chatBox.scrollTop = chatBox.scrollHeight;
}
function handleDashboardAIChatSubmit(e) {
  e.preventDefault();
  const input = document.getElementById('dashboardAIChatInput');
  if (!input || !input.value.trim()) return;
  const chat = getDashboardAIChat();
  const userMsg = { role: 'user', text: input.value.trim() };
  chat.push(userMsg);
  setDashboardAIChat(chat);
  renderDashboardAIChat();
  input.value = '';
  setTimeout(() => {
    const aiMsg = { role: 'ai', text: dashboardAIResponses[Math.floor(Math.random() * dashboardAIResponses.length)] };
    const updatedChat = getDashboardAIChat();
    updatedChat.push(aiMsg);
    setDashboardAIChat(updatedChat);
    renderDashboardAIChat();
  }, 700);
}
function setupDashboardAIChat() {
  const modal = document.getElementById('dashboardAIChatModal');
  const openBtn = document.querySelector('.bg-white.text-indigo-600'); // Ask Question button
  const closeBtn = document.getElementById('dashboardAIChatClose');
  const form = document.getElementById('dashboardAIChatForm');
  const input = document.getElementById('dashboardAIChatInput');
  // Action buttons
  const suggestionBtn = document.getElementById('dashboardSuggestionBtn');
  const progressBtn = document.getElementById('dashboardProgressBtn');
  const motivationBtn = document.getElementById('dashboardMotivationBtn');
  function openModalWithPrompt(prompt) {
    if (modal) modal.classList.remove('hidden');
    renderDashboardAIChat();
    setTimeout(() => {
      if (input) {
        input.value = prompt;
        input.focus();
        // Auto-submit for instant response
        if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      }
    }, 100);
  }
  if (openBtn && modal) {
    openBtn.onclick = () => {
      modal.classList.remove('hidden');
      renderDashboardAIChat();
      setTimeout(() => {
        if (input) input.focus();
      }, 100);
    };
  }
  if (closeBtn && modal) {
    closeBtn.onclick = () => {
      modal.classList.add('hidden');
    };
  }
  if (form) {
    form.onsubmit = handleDashboardAIChatSubmit;
    renderDashboardAIChat();
  }
  if (suggestionBtn) suggestionBtn.onclick = () => openModalWithPrompt('Can you give me a habit suggestion?');
  if (progressBtn) progressBtn.onclick = () => openModalWithPrompt('How is my habit progress?');
  if (motivationBtn) motivationBtn.onclick = () => openModalWithPrompt('Can you motivate me to keep going?');
}