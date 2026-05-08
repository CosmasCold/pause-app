// extension/content.js
(function () {
  const API_URL = 'https://pauseapp.space/api/analyze-extension';

  // Prevent multiple injections
  if (document.getElementById('pause-extension-root')) return;

  // Create floating button
  const button = document.createElement('div');
  button.id = 'pause-extension-button';
  button.innerHTML = '⏸️';
  button.title = 'Check with Pause';
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: '48px',
    height: '48px',
    background: 'white',
    borderRadius: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    cursor: 'pointer',
    zIndex: 999999,
    transition: 'all 0.3s ease',
    border: '2px solid #0d9488',
  });
  document.body.appendChild(button);

  // Create results panel
  const panel = document.createElement('div');
  panel.id = 'pause-results-panel';
  Object.assign(panel.style, {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    width: '360px',
    maxHeight: '500px',
    background: 'white',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    zIndex: 999998,
    overflowY: 'auto',
    display: 'none',
    fontFamily: 'system-ui, sans-serif',
  });
  document.body.appendChild(panel);

  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
  });

  // Click handler
  button.addEventListener('click', async () => {
    const text = getActiveText();
    if (!text || text.length < 10) {
      showToast('Please write at least a few sentences.');
      return;
    }

    showLoading();
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, context: detectContext() }),
      });
      const data = await res.json();
      showResults(data);
    } catch (err) {
      showToast('Analysis failed. Ensure you are signed in on pauseapp.space.');
      hidePanel();
    }
  });

  function getActiveText() {
    // Try Gmail
    const gmail = document.querySelector('[role="textbox"][aria-label*="Message"]');
    if (gmail?.innerText.trim()) return gmail.innerText;

    // Try Twitter/X
    const tweet = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (tweet?.innerText.trim()) return tweet.innerText;

    // Try Slack
    const slack = document.querySelector('[data-qa="message_input"] .ql-editor');
    if (slack?.innerText.trim()) return slack.innerText;

    // Try WhatsApp Web
    const wa = document.querySelector('[spellcheck="true"][contenteditable="true"]');
    if (wa?.innerText.trim()) return wa.innerText;

    // Generic: find any focused editable element
    const active = document.activeElement;
    if (active?.isContentEditable || active?.tagName === 'TEXTAREA' || active?.tagName === 'INPUT') {
      return active.innerText || active.value || '';
    }
    return '';
  }

  function detectContext() {
    const host = location.hostname;
    if (host.includes('mail.google.com')) return 'email';
    if (host.includes('twitter') || host.includes('x.com')) return 'social';
    if (host.includes('linkedin')) return 'social';
    if (host.includes('slack') || host.includes('whatsapp')) return 'message';
    return 'email';
  }

  function showLoading() {
    panel.style.display = 'block';
    panel.innerHTML = `<div style="padding:24px;text-align:center"><div style="font-size:32px">⏳</div><p style="color:#666">Analyzing...</p></div>`;
  }

  function showResults(data) {
    const score = data.regretScore || 0;
    const color = score < 30 ? '#059669' : score < 60 ? '#D97706' : '#DC2626';
    const emoji = score < 30 ? '😌' : score < 60 ? '🤔' : '🚨';

    let html = `
      <div style="padding:20px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <h3 style="font-size:18px;font-weight:600;color:#1c1917">Pause Analysis</h3>
          <button id="pause-close-btn" style="background:none;border:none;cursor:pointer;font-size:20px">✕</button>
        </div>
        <div style="background:#f5f5f4;padding:16px;border-radius:12px;margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-weight:500;color:#666">Regret Probability</span>
            <span style="font-size:28px;font-weight:700;color:${color}">${score}%</span>
          </div>
          <div style="background:#e0e0e0;height:8px;border-radius:4px;margin-top:8px">
            <div style="width:${score}%;height:100%;background:${color};border-radius:4px;transition:width 1s"></div>
          </div>
          <p style="font-size:13px;color:#666;margin-top:8px">${getMessage(score)}</p>
        </div>
    `;

    if (data.biases?.length > 0) {
      html += `<div style="margin-bottom:16px"><h4 style="font-size:14px;font-weight:600;color:#666;margin-bottom:8px">Detected Biases</h4>`;
      data.biases.forEach(b => {
        html += `<div style="background:#fef3c7;padding:12px;border-radius:8px;margin-bottom:8px">
          <div style="font-weight:600;color:#92400e">${b.type}</div>
          <div style="font-size:13px;color:#78716c">"${b.excerpt}"</div>
        </div>`;
      });
      html += `</div>`;
    }

    if (data.emotionalTone) {
      const tone = data.emotionalTone;
      html += `<div style="margin-bottom:16px">
        <h4 style="font-size:14px;font-weight:600;color:#666;margin-bottom:8px">Emotional Tone</h4>
        <div style="display:flex;gap:8px">
          <span style="flex:1;text-align:center;background:#f5f5f4;padding:8px;border-radius:8px;font-size:12px;color:#666">${tone.start}</span>
          <span style="flex:1;text-align:center;background:#f5f5f4;padding:8px;border-radius:8px;font-size:12px;color:#666">${tone.middle}</span>
          <span style="flex:1;text-align:center;background:#f5f5f4;padding:8px;border-radius:8px;font-size:12px;color:#666">${tone.end}</span>
        </div>
      </div>`;
    }

    if (data.suggestedRephrases?.length > 0) {
      html += `<div style="margin-bottom:16px"><h4 style="font-size:14px;font-weight:600;color:#666;margin-bottom:8px">Suggestions</h4>`;
      data.suggestedRephrases.forEach(r => {
        html += `<div style="background:#f0fdf4;padding:12px;border-radius:8px;margin-bottom:8px;font-size:13px;color:#166534">${r}</div>`;
      });
      html += `</div>`;
    }

    if (data.reflectiveQuestion) {
      html += `<div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);padding:16px;border-radius:12px">
        <p style="font-style:italic;color:#065f46;font-size:14px">"${data.reflectiveQuestion}"</p>
      </div>`;
    }

    html += `</div>`;
    panel.innerHTML = html;
    panel.style.display = 'block';

    document.getElementById('pause-close-btn')?.addEventListener('click', () => {
      panel.style.display = 'none';
    });
  }

  function getMessage(score) {
    if (score < 30) return 'This message looks well-balanced and thoughtful.';
    if (score < 60) return 'There are some elements that might be worth reconsidering.';
    return 'This message carries significant emotional weight. Consider waiting before sending.';
  }

  function hidePanel() {
    panel.style.display = 'none';
  }

  function showToast(msg) {
    const toast = document.createElement('div');
    Object.assign(toast.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: 'white',
      padding: '12px 24px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      zIndex: 999999,
      fontSize: '14px',
    });
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
})();