// Renders data/profile.json into any page that has the matching containers:
//   #glance  – "At a glance" panel on the home page
//   #record-body – Experience / Education / Certifications on the home page
//   #resume  – the full web resume (resume.html)
// Edit data/profile.json (or run tools/linkedin_sync.py) and every page follows.
(function () {
  var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function md(s) { return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>'); }
  function ym(s) { if (!s) return null; var p = String(s).split('-'); return { y: p[0], m: p[1] ? M[+p[1] - 1] : '' }; }
  function range(a, b) {
    var s = ym(a), e = ym(b);
    if (!s) return '';
    if (!e) return (s.m ? s.m + ' ' : '') + s.y + ' – now';
    if (s.y === e.y && s.m && e.m) return s.m + ' – ' + e.m + ' ' + e.y;
    return (s.m ? s.m + ' ' : '') + s.y + ' – ' + (e.m ? e.m + ' ' : '') + e.y;
  }
  function months(a, b) {
    var s = String(a).split('-'), e = b ? String(b).split('-') : [new Date().getFullYear(), new Date().getMonth() + 1];
    return (e[0] - s[0]) * 12 + (e[1] - s[1]) + 1;
  }
  // Group consecutive roles at the same company (e.g. two Barclays titles).
  function groups(list) {
    var out = [];
    list.forEach(function (r) {
      var g = out[out.length - 1];
      if (g && g.company === r.company) g.roles.push(r); else out.push({ company: r.company, location: r.location, roles: [r] });
    });
    return out;
  }
  var base = document.documentElement.getAttribute('data-base') || '';

  function glance(d) {
    var el = document.getElementById('glance'); if (!el) return;
    var ex = d.experience || [], cur = ex[0], gs = groups(ex);
    var before = gs.slice(1, 3).map(function (g) {
      var first = g.roles[g.roles.length - 1], last = g.roles[0];
      var n = months(first.start, last.end), y = Math.floor(n / 12), m = n % 12;
      var yrs = (y ? y + (y > 1 ? ' yrs' : ' yr') : '') + (y && m ? ' ' : '') + (m ? m + (m > 1 ? ' mos' : ' mo') : '');
      return '<span style="display:block;margin-bottom:6px">' + esc(g.company.replace(/ Pvt\. Ltd\.| Private Limited/, '')) + '<small>' + esc(g.roles.length > 1 ? first.title.replace(/ \(.*\)/, '') + ' → ' + last.title.replace(/ \(.*\)/, '') : last.title) + ' · ' + yrs + '</small></span>';
    }).join('');
    var ed = (d.education || [])[0];
    el.innerHTML =
      '<h2>At a glance</h2><dl>' +
      '<div><dt>Status</dt><dd><span class="live">Available ' + esc(d.availability.split('·')[0].trim().toLowerCase()) + '</span><small>' + esc((d.availability.split('·')[1] || '').trim()) + '</small></dd></div>' +
      '<div><dt>Looking for</dt><dd>' + esc(d.looking_for) + '<small>' + esc(d.work_mode) + '</small></dd></div>' +
      (cur ? '<div><dt>' + (cur.end ? 'Most recent' : 'Now') + '</dt><dd>' + esc(cur.title) + '<small>' + esc(cur.company.replace(/ Pvt\. Ltd\./, '')) + ' · ' + range(cur.start, cur.end) + '</small></dd></div>' : '') +
      (before ? '<div><dt>Before</dt><dd>' + before + '</dd></div>' : '') +
      (ed ? '<div><dt>Education</dt><dd>' + esc(ed.degree) + ', ' + esc(ed.school.split(',')[0]) + " '" + String(ed.end).slice(2) + '<small>' + esc(ed.detail.split('·').pop().trim()) + '</small></dd></div>' : '') +
      '</dl><div class="cta"><a class="btn primary" href="mailto:' + esc(d.email) + '">Email me</a><a class="btn" href="' + base + 'resume.html">Resume</a><a class="btn" href="' + esc(d.linkedin) + '" target="_blank" rel="noopener">LinkedIn</a></div>';
  }

  function record(d) {
    var el = document.getElementById('record-body'); if (!el) return;
    var h = '<p class="record-head">Work</p><table class="record">';
    (d.experience || []).forEach(function (r) {
      var co = esc(r.company) + ', ' + esc(r.location);
      if (r.case_study) co += ' · <a href="' + base + esc(r.case_study) + '">Case study</a>';
      h += '<tr><td class="when">' + range(r.start, r.end) + '</td><td class="what"><b>' + esc(r.title) + '</b><span>' + co + '</span></td></tr>';
    });
    h += '</table><p class="record-head">Education</p><table class="record">';
    (d.education || []).forEach(function (e) {
      h += '<tr><td class="when">' + esc(e.start) + ' – ' + esc(e.end) + '</td><td class="what"><b>' + esc(e.degree) + '</b><span>' + esc(e.school) + ' · ' + esc(e.detail) + '</span></td></tr>';
    });
    h += '</table><p class="record-head">Certifications</p><table class="record">';
    (d.certifications || []).forEach(function (c) {
      h += '<tr><td class="when">' + esc(c.issuer) + '</td><td class="what"><b>' + esc(c.name) + '</b></td></tr>';
    });
    el.innerHTML = h + '</table>';
  }

  function resume(d) {
    var el = document.getElementById('resume'); if (!el) return;
    var site = d.website.replace(/^https?:\/\//, '').replace(/\/$/, '');
    var h = '<header class="rh"><h1>' + esc(d.name) + '</h1><p class="contact-line"><span>' + esc(d.location) + '</span>' +
      '<a href="mailto:' + esc(d.email) + '">' + esc(d.email) + '</a>' +
      '<a href="' + esc(d.linkedin) + '">' + esc(d.linkedin.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')) + '</a>' +
      '<a href="' + esc(d.website) + '">' + esc(site) + '</a></p>' +
      '<p class="sum">' + md(d.summary) + '</p></header>';
    h += '<h2>Experience</h2>';
    groups(d.experience || []).forEach(function (g) {
      h += '<div class="job">';
      g.roles.forEach(function (r, i) {
        h += '<div class="job-h"><b>' + esc(r.title) + (i === 0 ? ' · ' + esc(g.company) : '') + '</b><span>' + range(r.start, r.end) + (i === 0 ? ' · ' + esc(g.location) : '') + '</span></div>';
      });
      var bl = []; g.roles.forEach(function (r) { bl = bl.concat(r.bullets || []); });
      if (bl.length) h += '<ul>' + bl.map(function (b) { return '<li>' + md(b) + '</li>'; }).join('') + '</ul>';
      h += '</div>';
    });
    h += '<h2>Education</h2>';
    (d.education || []).forEach(function (e) {
      h += '<div class="job"><div class="job-h"><b>' + esc(e.degree) + ' · ' + esc(e.school) + '</b><span>' + esc(e.start) + ' – ' + esc(e.end) + '</span></div><p class="sub">' + esc(e.detail) + '</p></div>';
    });
    h += '<div class="two"><div><h2>Achievements</h2><ul>' + (d.achievements || []).map(function (a) { return '<li>' + md(a) + '</li>'; }).join('') + '</ul></div>' +
      '<div><h2>Certifications</h2><ul>' + (d.certifications || []).map(function (c) { return '<li>' + esc(c.name) + ' (' + esc(c.issuer) + ')</li>'; }).join('') + '</ul>' +
      '<h2>Skills</h2><div class="skills">' + Object.keys(d.skills || {}).map(function (k) { return '<div><b>' + esc(k) + ':</b> ' + esc(d.skills[k]) + '</div>'; }).join('') + '</div></div></div>';
    el.innerHTML = h;
  }

  fetch(base + 'data/profile.json', { cache: 'no-cache' })
    .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(function (d) { glance(d); record(d); resume(d); })
    .catch(function () {
      ['glance', 'record-body', 'resume'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.innerHTML = '<p class="note">This section could not load. The full record is on <a href="https://www.linkedin.com/in/trevordco/">LinkedIn</a>.</p>';
      });
    });
})();
