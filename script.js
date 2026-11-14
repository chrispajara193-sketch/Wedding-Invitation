// ==========================================
// CONFIGURATION (CUSTOMIZE THESE TWO)
// ==========================================
const WEDDING_DATE_STRING = 'June 19, 2027 16:00:00';

// Paste your deployed Google Apps Script Web App URL here:
const GOOGLE_SCRIPT_URL = 'YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL';


// ==========================================
// 1. ENVELOPE OPENING ANIMATION
// ==========================================
const envelope = document.getElementById('envelope');
const overlay = document.getElementById('envelope-overlay');
const mainContent = document.getElementById('main-content');

function openInvitation() {
  if (envelope.classList.contains('open')) return;
  envelope.classList.add('open');

  setTimeout(() => {
    overlay.classList.add('hidden');
    mainContent.classList.add('visible');
  }, 1100);
}

envelope.addEventListener('click', openInvitation);
envelope.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    openInvitation();
  }
});


// ==========================================
// 2. LIVE COUNTDOWN TIMER
// ==========================================
const weddingDate = new Date(WEDDING_DATE_STRING).getTime();

function updateCountdown() {
  const now = new Date().getTime();
  const distance = weddingDate - now;

  if (distance <= 0) {
    document.getElementById('countdown').innerHTML =
      '<p style="grid-column: 1 / -1; font-size: 1.2rem; color: var(--sage-dark);">Today is the day!</p>';
    return;
  }

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);

  document.getElementById('days').textContent = String(days).padStart(2, '0');
  document.getElementById('hours').textContent = String(hours).padStart(2, '0');
  document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
  document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
}

updateCountdown();
setInterval(updateCountdown, 1000);


// ==========================================
// 3. INTERACTIVE RSVP -> GOOGLE SHEETS
// ==========================================
const rsvpForm = document.getElementById('rsvp-form');
const attendingDetails = document.getElementById('attending-details');
const attendanceRadios = document.querySelectorAll('input[name="attendance"]');
const confirmationBox = document.getElementById('rsvp-confirmation');
const confirmationMsg = document.getElementById('confirmation-message');
const submitBtn = document.getElementById('submit-btn');
const errorBox = document.getElementById('rsvp-error');
const editBtn = document.getElementById('edit-rsvp-btn');

// Show/hide seats & dietary fields based on attendance choice
attendanceRadios.forEach((radio) => {
  radio.addEventListener('change', (e) => {
    attendingDetails.style.display = e.target.value === 'yes' ? 'block' : 'none';
  });
});

function showConfirmation(payload) {
  if (payload.attendance === 'yes') {
    confirmationMsg.textContent = `We are thrilled to celebrate with you, ${payload.name}! We have reserved ${payload.seats} seat(s) for you.`;
    launchConfetti();
  } else {
    confirmationMsg.textContent = `Thank you for letting us know, ${payload.name}. We will miss having you there and appreciate your warm wishes!`;
  }
  rsvpForm.style.display = 'none';
  confirmationBox.style.display = 'block';
}

rsvpForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  errorBox.style.display = 'none';

  const formData = new FormData(rsvpForm);
  const payload = {
    name: formData.get('name').trim(),
    email: formData.get('email').trim(),
    attendance: formData.get('attendance'),
    seats: formData.get('attendance') === 'yes' ? formData.get('seats') : '0',
    notes: formData.get('attendance') === 'yes' ? formData.get('notes').trim() : 'N/A'
  };

  // Allows previewing locally in VS Code before connecting Google Sheets
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('YOUR_GOOGLE_APPS_SCRIPT')) {
    console.warn('Demo mode: Paste your Google Apps Script Web App URL in script.js to save to Google Sheets.');
    showConfirmation(payload);
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = 'Sending...';

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.result === 'success') {
      showConfirmation(payload);
    } else {
      throw new Error(result.message || 'Submission failed');
    }
  } catch (err) {
    console.error('RSVP Error:', err);
    errorBox.textContent = 'Unable to save your RSVP right now. Please try again in a moment.';
    errorBox.style.display = 'block';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Response';
  }
});

editBtn.addEventListener('click', () => {
  rsvpForm.reset();
  attendingDetails.style.display = 'block';
  confirmationBox.style.display = 'none';
  rsvpForm.style.display = 'block';
});


// ==========================================
// 4. LIGHTWEIGHT CONFETTI ANIMATION
// ==========================================
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#c4a47c', '#6b7b66', '#e6dfd3', '#d4b48c', '#8fa189'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * -canvas.height,
    w: Math.random() * 8 + 4,
    h: Math.random() * 5 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    speedY: Math.random() * 3 + 2,
    speedX: Math.random() * 2 - 1,
    angle: Math.random() * Math.PI * 2,
    spin: Math.random() * 0.1 - 0.05
  }));

  let frame = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach((p) => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.angle += p.spin;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    frame++;
    if (frame < 180) {
      requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  draw();
}