// Copy-email button (home page) and the Order Desk walkthrough (Icestasy case study).
(function () {
  var copy = document.getElementById('copy');
  if (copy) {
    copy.addEventListener('click', function () {
      var b = this, t = 'tardcosta4@gmail.com';
      function ok() { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy email'; }, 1600); }
      function sel() {
        var r = document.createRange(); r.selectNodeContents(document.getElementById('email'));
        var s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Press Ctrl/Cmd+C';
      }
      try { navigator.clipboard.writeText(t).then(ok, sel); } catch (e) { sel(); }
    });
  }

  var demo = document.getElementById('demo');
  if (!demo) return;

  var out = demo.querySelector('.demo-out');
  var log = demo.querySelector('.demo-log');
  var parseBtn = document.getElementById('parse');
  var outage = document.getElementById('outage');
  var started = 0;

  // Illustrative catalogue: not Icestasy's real product list or prices.
  var lines = [
    { raw: '6 Belgian', qty: 6, options: ['Belgian Speculoos', 'Belgian Chocolate'] },
    { raw: '4 mango', qty: 4, item: 'Mango' },
    { raw: '3 vanilla', qty: 3, item: 'Vanilla Bean' }
  ];
  var picked = null;

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function say(html) { log.innerHTML = html; }

  function render() {
    var engine = outage.checked ? 'Rules' : 'AI';
    var rows = lines.map(function (l) {
      if (l.options) {
        if (picked) {
          return '<tr><td>' + esc(picked) + '<span class="raw">“' + esc(l.raw) + '”</span></td><td>' + l.qty +
            '</td><td><span class="ok">Confirmed by salesperson</span></td></tr>';
        }
        return '<tr class="flag"><td><b>Which “Belgian”?</b><span class="raw">“' + esc(l.raw) + '” matches two products</span>' +
          '<div class="choose">' + l.options.map(function (o) { return '<button type="button" data-pick="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') +
          '</div></td><td>' + l.qty + '</td><td><span class="ask">Needs a check</span></td></tr>';
      }
      return '<tr><td>' + esc(l.item) + '<span class="raw">“' + esc(l.raw) + '”</span></td><td>' + l.qty +
        '</td><td><span class="ok">Matched · ' + engine + '</span></td></tr>';
    }).join('');

    var ready = !!picked;
    out.innerHTML =
      '<p class="lab">Structured order · Café (sample customer) · Region 3</p>' +
      '<table class="lines"><thead><tr><th>Item</th><th>Qty</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<div class="demo-foot"><span class="state">' + (ready ? '<b>All items clear.</b> Ready to invoice.' : '<b>1 item</b> needs the salesperson.') + '</span>' +
      '<button type="button" class="btn primary" id="invoice"' + (ready ? '' : ' disabled style="opacity:.45;cursor:not-allowed"') + '>Create GST invoice</button></div>';

    out.querySelectorAll('[data-pick]').forEach(function (b) {
      b.addEventListener('click', function () {
        picked = this.getAttribute('data-pick');
        say('Salesperson chose <b>' + esc(picked) + '</b>. Order Desk asked instead of guessing.');
        render();
      });
    });
    var inv = document.getElementById('invoice');
    if (ready) inv.addEventListener('click', function () {
      var foot = out.querySelector('.demo-foot');
      foot.outerHTML = '<div class="invoice"><b>GST invoice drafted</b>3 line items, priced at Region 3 rates. The order is on the dashboard for the regional head and feeds this week\'s production plan.</div>';
      say('<b>Order confirmed and invoiced.</b> In real use this takes under 2 minutes. It used to take 10–15.');
    });
  }

  parseBtn.addEventListener('click', function () {
    started = Date.now();
    picked = null;
    render();
    say(outage.checked
      ? '<b>AI service unavailable.</b> Switched to the rule-based parser: known product names and aliases only. Orders keep moving.'
      : 'Parsed by the AI parser. Two items matched cleanly; one is ambiguous.');
    parseBtn.textContent = 'Parse again';
  });

  outage.addEventListener('change', function () {
    if (started) parseBtn.click();
    else say(outage.checked ? 'Outage simulated. Parse the message to see the fallback.' : 'AI service back online.');
  });
})();
