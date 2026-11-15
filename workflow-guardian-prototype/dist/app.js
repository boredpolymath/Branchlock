const findings = [
  {id:'WG-012', severity:'Critical', title:'Untrusted pull request input reaches shell', workflow:'pull-request.yml', location:'line 42', evidence:'run: echo "${{ github.event.pull_request.title }}"', description:'A pull request title is attacker-controlled input. Interpolating it directly into a shell command can allow command injection.', remediation:'Pass the value through an environment variable and quote it, or use a GitHub Action that handles the value as data.', confidence:'High'},
  {id:'WG-004', severity:'High', title:'Workflow token has write-all permissions', workflow:'release.yml', location:'line 4', evidence:'permissions: write-all', description:'This workflow grants the built-in token broad write permissions. A compromised action or unsafe input could modify repository resources.', remediation:'Set permissions to read-all at workflow level, then grant only the specific permission needed by each job.', confidence:'High'},
  {id:'WG-021', severity:'High', title:'Third-party action is not pinned to a commit', workflow:'release.yml', location:'line 29', evidence:'uses: acme/upload-release@v3', description:'Tags can move after review. This reference could execute different code in a future workflow run.', remediation:'Pin the action to a full-length commit SHA and document the source version in a comment.', confidence:'High'},
  {id:'WG-021', severity:'Medium', title:'Third-party action is not pinned to a commit', workflow:'ci.yml', location:'line 18', evidence:'uses: actions/setup-node@v4', description:'A moving version tag makes the workflow dependent on future changes outside your review process.', remediation:'Pin the action to a full-length commit SHA and review Dependabot updates deliberately.', confidence:'High'},
  {id:'WG-008', severity:'Medium', title:'pull_request_target can access write credentials', workflow:'deploy.yml', location:'line 6', evidence:'on: pull_request_target', description:'This trigger runs in the base repository context and requires special care with untrusted pull request content.', remediation:'Use pull_request for untrusted contributions, or avoid checking out and executing pull request code in this workflow.', confidence:'Medium'},
  {id:'WG-015', severity:'Medium', title:'Job permissions not explicitly declared', workflow:'ci.yml', location:'line 12', evidence:'jobs: test:', description:'Without explicit job permissions, the effective token scope is harder to audit and may change with repository defaults.', remediation:'Declare the minimum required permissions at workflow or job level.', confidence:'Medium'}
];
const workflows = [
  {name:'release.yml', triggers:'push · workflow_dispatch', findings:2, status:'Needs review'},
  {name:'pull-request.yml', triggers:'pull_request', findings:1, status:'Needs review'},
  {name:'ci.yml', triggers:'push · pull_request', findings:2, status:'Needs review'},
  {name:'deploy.yml', triggers:'pull_request_target', findings:1, status:'Needs review'}
];
const cloneFindings = list => list.map(f=>({...f}));
const defaultReports = [
  {date:'Today, 10:18 AM', revision:'1a2c9f8', findings:6, status:'Completed', reportFindings:cloneFindings(findings)},
  {date:'Nov 12, 4:32 PM', revision:'6f912ce', findings:5, status:'Completed', reportFindings:cloneFindings(findings.slice(1))},
  {date:'Nov 08, 9:06 AM', revision:'0e3b44f', findings:5, status:'Completed', reportFindings:cloneFindings(findings.slice(0,5))}
];
let selected = 0, scanning = false;
let history = (JSON.parse(localStorage.getItem('wg-history') || 'null') || defaultReports).map(report=>({...report,reportFindings:report.reportFindings||cloneFindings(findings)}));
let retention = Number(localStorage.getItem('wg-retention') || 20);
let activeReportFindings = cloneFindings(history[0]?.reportFindings || findings);
const $ = s => document.querySelector(s);
const escapeHtml = value => value.replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[char]));
function setTheme(theme){
  const isDark=theme==='dark'; document.documentElement.dataset.theme=theme; localStorage.setItem('wg-theme',theme);
  const button=$('#themeToggle'), settingsButton=$('#settingsTheme');
  button.textContent=isDark?'☼':'◐'; button.title=isDark?'Switch to light theme':'Switch to dark theme'; button.setAttribute('aria-label',button.title); button.setAttribute('aria-pressed',String(isDark));
  settingsButton.textContent=isDark?'Dark':'Light'; settingsButton.setAttribute('aria-pressed',String(isDark));
}
function sevClass(severity){ return severity.toLowerCase(); }
function renderPriority(){
  $('#priorityList').innerHTML = findings.slice(0,3).map((f,i) => `<div class="finding-row ${i===selected?'active':''}" data-select="${i}"><i class="finding-bar ${sevClass(f.severity)}"></i><div class="finding-main"><div class="finding-title">${f.title}</div><div class="finding-meta">${f.id} · ${f.workflow} · ${f.location}</div></div><span class="badge ${sevClass(f.severity)}">${f.severity}</span></div>`).join('');
}
function filtered(){
  const s=$('#severityFilter')?.value || 'all', w=$('#workflowFilter')?.value || 'all', q=($('#findSearch')?.value||'').toLowerCase();
  return activeReportFindings.map((f,i)=>({...f,index:i})).filter(f=>(s==='all'||f.severity===s)&&(w==='all'||f.workflow===w)&&(!q||`${f.title} ${f.id} ${f.workflow}`.toLowerCase().includes(q)));
}
function detailMarkup(f){return `<div class="detail-top"><span class="badge ${sevClass(f.severity)}">${f.severity}</span><span class="finding-meta">${f.id}</span></div><h2>${f.title}</h2><p>${f.description}</p><div class="detail-section"><h3>Evidence</h3><div class="evidence">${escapeHtml(f.workflow)} · ${escapeHtml(f.location)}<br>${escapeHtml(f.evidence)}</div></div><div class="detail-section"><h3>Recommended remediation</h3><p class="remediation">${f.remediation}</p></div><div class="detail-section"><h3>Detection confidence</h3><p>${f.confidence} · Rule set 2026.11</p></div>`}
function detail(f){$('#detailCard').innerHTML=f?detailMarkup(f):'<p class="muted">Select a finding to inspect evidence and remediation guidance.</p>'}
function openFindingSheet(f){if(!window.matchMedia('(max-width: 600px)').matches)return;$('#findingSheetContent').innerHTML=detailMarkup(f);$('#findingSheet').classList.add('show');$('#findingSheet').setAttribute('aria-hidden','false')}
function closeFindingSheet(){$('#findingSheet').classList.remove('show');$('#findingSheet').setAttribute('aria-hidden','true')}
function renderFindings(){
  const set=filtered(); $('#findingTotal').textContent=set.length; $('#findingList').innerHTML=set.length?set.map(f=>`<div class="finding-row ${f.index===selected?'active':''}" data-select="${f.index}"><i class="finding-bar ${sevClass(f.severity)}"></i><div class="finding-main"><div class="finding-title">${f.title}</div><div class="finding-meta">${f.id} · ${f.workflow} · ${f.location}</div></div><span class="badge ${sevClass(f.severity)}">${f.severity}</span></div>`).join(''):'<div class="empty"><strong>No findings match these filters.</strong><p>Try changing the severity or workflow filter.</p></div>';
  detail(activeReportFindings[selected]);
}
function renderWorkflows(){ $('#workflowList').innerHTML=workflows.map(w=>`<div class="workflow-row"><div class="file-icon">⌘</div><div><strong>${w.name}</strong><span>${w.triggers}</span></div><div class="workflow-status"><span class="badge ${w.findings>1?'high':'medium'}">${w.findings} finding${w.findings>1?'s':''}</span><span>${w.status}</span></div></div>`).join(''); }
function renderHistory(){if(!history.length){$('#historyList').innerHTML='<div class="empty-state"><span class="empty-icon">◷</span><strong>No reports saved</strong><p>Run a scan below to create a local report for this repository.</p></div>';return}$('#historyList').innerHTML=history.map((r,i)=>`<div class="history-row ${i===0?'current-scan':''}" ${i===0?'id="currentScanReport" tabindex="-1"':''}><div class="file-icon">◷</div><div><strong>${r.date}${i===0?' · Latest scan':''}</strong><span>Revision ${r.revision} · Rule set 2026.11</span></div><div class="workflow-status"><span class="badge ${r.findings>6?'high':'medium'}">${r.findings} findings</span><span>${r.status}</span></div><button class="text-btn" data-view-report="${i}">View report →</button></div>`).join(''); }
function toast(message){const t=$('#toast');t.textContent=message;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function show(view){
  document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===view));
  document.querySelectorAll('.nav-link[data-view]').forEach(v=>v.classList.toggle('active',v.dataset.view===view));
  location.hash=view; window.scrollTo({top:0,behavior:'smooth'});
}
function openReport(report){activeReportFindings=cloneFindings(report?.reportFindings||findings);selected=0;$('#severityFilter').value='all';$('#workflowFilter').value='all';$('#findSearch').value='';renderFindings()}
function download(format){
  const report={repository:$('#repoInput').value, scanned_at:new Date().toISOString(), revision:'1a2c9f8', rule_set:'2026.11', findings};
  const body=format==='json'?JSON.stringify(report,null,2):`# Branchlock report\n\n**Repository:** ${report.repository}\n\n**Revision:** ${report.revision}\n\n## Findings\n\n${findings.map(f=>`### [${f.severity}] ${f.title}\n\n- **Rule:** ${f.id}\n- **Location:** ${f.workflow}:${f.location}\n- **Remediation:** ${f.remediation}\n`).join('\n')}`;
  const blob=new Blob([body],{type:format==='json'?'application/json':'text/markdown'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`workflow-guardian-report.${format==='json'?'json':'md'}`;a.click();URL.revokeObjectURL(a.href);$('#modal').classList.remove('show');toast(`${format.toUpperCase()} report downloaded`);
}
function setScanState(running){
  document.querySelectorAll('#scanBtn,#historyScan').forEach(button=>{button.disabled=running;button.innerHTML=running?'◌ Scanning':'↻ Scan'});
  $('#scanNotice').classList.toggle('scanning',running);
  $('#scanStatusText').innerHTML=running?'<strong>Scan in progress</strong> Reviewing 4 workflow files at revision <code>1a2c9f8</code>':'<strong>Last scan completed</strong> just now at revision <code>1a2c9f8</code>';
}
function startScan(){
  if(scanning)return;
  const raw=$('#repoInput').value.trim();
  if(!/^(?:https:\/\/github\.com\/)?[\w.-]+\/[\w.-]+$/.test(raw)){toast('Enter a valid owner/repository or GitHub URL');return;}
  scanning=true;setScanState(true);toast('Scan started — analyzing workflow files locally');
  setTimeout(()=>{const now=new Date();history.unshift({date:`Today, ${now.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`,revision:'1a2c9f8',findings:findings.length,status:'Completed',reportFindings:cloneFindings(findings)});history=history.slice(0,retention);localStorage.setItem('wg-history',JSON.stringify(history));openReport(history[0]);renderHistory();scanning=false;setScanState(false);toast('Scan complete — 6 findings detected');},1300);
}
document.addEventListener('click',e=>{
  const nav=e.target.closest('[data-view]');if(nav){e.preventDefault();show(nav.dataset.view)}
  const go=e.target.closest('[data-go]');if(go)show(go.dataset.go);
  const select=e.target.closest('[data-select]');if(select){if(select.closest('#priorityList'))openReport(history[0]);selected=Number(select.dataset.select);renderPriority();renderFindings();openFindingSheet(activeReportFindings[selected]);}
  const report=e.target.closest('[data-view-report]');if(report){const selectedReport=history[Number(report.dataset.viewReport)];openReport(selectedReport);show('findings');toast(`Showing report from ${selectedReport.date}`)}
  const runScan=e.target.closest('[data-run-scan]');if(runScan){show('overview');startScan()}
  const notice=e.target.closest('[data-toast]');if(notice)toast(notice.dataset.toast);
});
$('#scanBtn').addEventListener('click',startScan);$('#historyScan').addEventListener('click',startScan);
$('#scanDetails').addEventListener('click',()=>{openReport(history[0]);show('findings');toast('Showing findings from the latest scan')});
['severityFilter','workflowFilter','findSearch'].forEach(id=>$('#'+id).addEventListener(id==='findSearch'?'input':'change',renderFindings));
$('#filterClear').addEventListener('click',()=>{$('#severityFilter').value='all';$('#workflowFilter').value='all';$('#findSearch').value='';renderFindings()});
$('#retention').value=String(retention);$('#retention').addEventListener('change',e=>{retention=Number(e.target.value);history=history.slice(0,retention);localStorage.setItem('wg-retention',String(retention));localStorage.setItem('wg-history',JSON.stringify(history));renderHistory();toast(`Keeping the newest ${retention} reports per repository`)});
$('#exportBtn').addEventListener('click',()=>$('#modal').classList.add('show'));$('#mdExport').addEventListener('click',()=>download('md'));$('#jsonExport').addEventListener('click',()=>download('json'));$('#modalClose').addEventListener('click',()=>$('#modal').classList.remove('show'));$('#modal').addEventListener('click',e=>{if(e.target===$('#modal'))$('#modal').classList.remove('show')});
$('#findingSheetClose').addEventListener('click',closeFindingSheet);$('#findingSheet').addEventListener('click',e=>{if(e.target===$('#findingSheet'))closeFindingSheet()});
function clearReports(message){history=[];localStorage.removeItem('wg-history');renderHistory();toast(message)}
$('#clearReports').addEventListener('click',()=>{if(confirm('Clear all saved reports for this repository? This cannot be undone.'))clearReports('Reports cleared locally')});
$('#clearData').addEventListener('click',()=>{if(confirm('Clear all local analysis data? This cannot be undone.'))clearReports('Local analysis data cleared')});
$('#cacheToggle').addEventListener('click',e=>{const b=e.currentTarget;b.classList.toggle('on');b.setAttribute('aria-pressed',b.classList.contains('on'));toast(b.classList.contains('on')?'Offline shell caching enabled':'Offline shell caching disabled')});
$('#offlineToggle').addEventListener('click',e=>{const offline=e.currentTarget.textContent==='Online';e.currentTarget.textContent=offline?'Offline':'Online';toast(offline?'Offline mode simulated — saved reports remain available':'Live scanning restored')});
$('#helpBtn').addEventListener('click',()=>toast('Tip: findings are explainable and never modify your repository.'));
$('#themeToggle').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
$('#settingsTheme').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#repoInput').focus()}if(e.key==='Escape'){$('#modal').classList.remove('show');closeFindingSheet()}});
setTheme(localStorage.getItem('wg-theme') || 'dark');
renderPriority();renderFindings();renderWorkflows();renderHistory();
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
