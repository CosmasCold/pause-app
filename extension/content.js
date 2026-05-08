// extension/content.js
(function () {
  'use strict';

  console.log('🔄 Pause extension content script loaded');

  if (document.getElementById('pause-extension-root')) return;

  setTimeout(createButton, 2000);

  function createButton() {
    if (document.getElementById('pause-extension-button')) return;

    const button = document.createElement('div');
    button.id = 'pause-extension-button';
    button.textContent = '⏸️';
    button.title = 'Check with Pause';
    button.setAttribute('style', `
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      width: 48px !important;
      height: 48px !important;
      background: #ffffff !important;
      border-radius: 24px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 22px !important;
      cursor: pointer !important;
      z-index: 2147483647 !important;
      border: 2px solid #0d9488 !important;
      transition: transform 0.3s ease !important;
    `);

    document.body.appendChild(button);
    console.log('✅ Floating button created');

    const panel = document.createElement('div');
    panel.id = 'pause-results-panel';
    panel.setAttribute('style', `
      position: fixed !important;
      bottom: 80px !important;
      right: 20px !important;
      width: 360px !important;
      max-height: 500px !important;
      background: white !important;
      border-radius: 20px !important;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2) !important;
      z-index: 2147483646 !important;
      overflow-y: auto !important;
      display: none !important;
      font-family: system-ui, sans-serif !important;
    `);
    document.body.appendChild(panel);

    button.addEventListener('mouseenter', function () {
      button.style.transform = 'scale(1.1)';
    });
    button.addEventListener('mouseleave', function () {
      button.style.transform = 'scale(1)';
    });

    button.addEventListener('click', async function () {
      var text = getActiveText();
      if (!text || text.length < 10) {
        showToast('Please write at least a few sentences.');
        return;
      }

      showLoading();
      try {
        var res = await fetch('https://pauseapp.space/api/analyze-extension', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text, context: detectContext() }),
        });
        var data = await res.json();
        showResults(data);
      } catch {
        showToast('Analysis failed. Ensure you are signed in on pauseapp.space.');
        hidePanel();
      }
    });
  }

  function getActiveText() {
    var gmail = document.querySelector('[role="textbox"][aria-label*="Message"]');
    if (gmail && gmail.innerText && gmail.innerText.trim()) return gmail.innerText;

    var tweet = document.querySelector('[data-testid="tweetTextarea_0"]');
    if (tweet && tweet.innerText && tweet.innerText.trim()) return tweet.innerText;

    var slack = document.querySelector('[data-qa="message_input"] .ql-editor');
    if (slack && slack.innerText && slack.innerText.trim()) return slack.innerText;

    var wa = document.querySelector('[spellcheck="true"][contenteditable="true"]');
    if (wa && wa.innerText && wa.innerText.trim()) return wa.innerText;

    var active = document.activeElement;
    if (active && (active.isContentEditable || active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
      return active.innerText || active.value || '';
    }
    return '';
  }

  function detectContext() {
    var host = location.hostname;
    if (host.indexOf('mail.google.com') !== -1) return 'email';
    if (host.indexOf('twitter') !== -1 || host.indexOf('x.com') !== -1) return 'social';
    if (host.indexOf('linkedin') !== -1) return 'social';
    if (host.indexOf('slack') !== -1 || host.indexOf('whatsapp') !== -1) return 'message';
    return 'email';
  }

  function showLoading() {
    var panel = document.getElementById('pause-results-panel');
    if (!panel) return;
    panel.style.display = 'block';
    panel.innerHTML = '<div style="padding:24px;text-align:center"><div style="font-size:32px">⏳</div><p style="color:#666">Analyzing...</p></div>';
  }

  function showResults(data) {
    var panel = document.getElementById('pause-results-panel');
    if (!panel) return;
    var score = data.regretScore || 0;
    var color = score < 30 ? '#059669' : score < 60 ? '#D97706' : '#DC2626';
    var message = score < 30 ? 'This message looks well-balanced and thoughtful.' : score < 60 ? 'There are some elements that might be worth reconsidering.' : 'This message carries significant emotional weight. Consider waiting before sending.';

    var html = '';
    html += '<div style="padding:20px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">';
    html += '<h3 style="font-size:18px;font-weight:600;color:#1c1917">Pause Analysis</h3>';
    html += '<button id="pause-close-btn" style="background:none;border:none;cursor:pointer;font-size:20px">✕</button>';
    html += '</div>';
    html += '<div style="background:#f5f5f4;padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<span style="font-weight:500;color:#666">Regret Probability</span>';
    html += '<span style="font-size:28px;font-weight:700;color:' + color + '">' + score + '%</span>';
    html += '</div>';
    html += '<div style="background:#e0e0e0;height:8px;border-radius:4px;margin-top:8px">';
    html += '<div style="width:' + score + '%;height:100%;background:' + color + ';border-radius:4px;transition:width 1s"></div>';
    html += '</div>';
    html += '<p style="font-size:13px;color:#666;margin-top:8px">' + message + '</p>';
    html += '</div>';

    if (data.biases && data.biases.length > 0) {
      html += '<div style="margin-bottom:16px"><h4 style="font-size:14px;font-weight:600;color:#666;margin-bottom:8px">Detected Biases</h4>';
      data.biases.forEach(function (b) {
        html += '<div style="background:#fef3c7;padding:12px;border-radius:8px;margin-bottom:8px">';
        html += '<div style="font-weight:600;color:#92400e">' + b.type + '</div>';
        html += '<div style="font-size:13px;color:#78716c">&ldquo;' + b.excerpt + '&rdquo;</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    if (data.emotionalTone) {
      var tone = data.emotionalTone;
      html += '<div style="margin-bottom:16px">';
      html += '<h4 style="font-size:14px;font-weight:600;color:#666;margin-bottom:8px">Emotional Tone</h4>';
      html += '<div style="display:flex;gap:8px">';
      html += '<span style="flex:1;text-align:center;background:#f5f5f4;padding:8px;border-radius:8px;font-size:12px;color:#666">' + tone.start + '</span>';
      html += '<span style="flex:1;text-align:center;background:#f5f5f4;padding:8px;border-radius:8px;font-size:12px;color:#666">' + tone.middle + '</span>';
      html += '<span style="flex:1;text-align:center;background:#f5f5f4;padding:8px;border-radius:8px;font-size:12px;color:#666">' + tone.end + '</span>';
      html += '</div>';
      html += '</div>';
    }

    if (data.suggestedRephrases && data.suggestedRephrases.length > 0) {
      html += '<div style="margin-bottom:16px"><h4 style="font-size:14px;font-weight:600;color:#666;margin-bottom:8px">Suggestions</h4>';
      data.suggestedRephrases.forEach(function (r) {
        html += '<div style="background:#f0fdf4;padding:12px;border-radius:8px;margin-bottom:8px;font-size:13px;color:#166534">' + r + '</div>';
      });
      html += '</div>';
    }

    if (data.reflectiveQuestion) {
      html += '<div style="background:linear-gradient(135deg,#f0fdf4,#ecfdf5);padding:16px;border-radius:12px">';
      html += '<p style="font-style:italic;color:#065f46;font-size:14px">&ldquo;' + data.reflectiveQuestion + '&rdquo;</p>';
      html += '</div>';
    }

    html += '</div>';
    panel.innerHTML = html;
    panel.style.display = 'block';

    var closeBtn = document.getElementById('pause-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        panel.style.display = 'none';
      });
    }
  }

  function hidePanel() {
    var panel = document.getElementById('pause-results-panel');
    if (panel) panel.style.display = 'none';
  }

  function showToast(msg) {
    var toast = document.createElement('div');
    toast.setAttribute('style', `
      position: fixed !important;
      top: 20px !important;
      right: 20px !important;
      background: white !important;
      padding: 12px 24px !important;
      border-radius: 12px !important;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
      z-index: 2147483647 !important;
      font-size: 14px !important;
    `);
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () { toast.remove(); }, 3000);
  }
})();