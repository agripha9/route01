/* ══════════════════════════════════════
   ★ API 키 설정 — 여기만 수정하세요! ★
   console.anthropic.com 에서 발급 후 붙여넣기
══════════════════════════════════════ */
/* ─── API 키 (앱 내에서 설정 가능) ─── */
function normalizeApiKey(raw){
  let s=String(raw||'').trim();
  /* strip wrapping quotes often pasted from docs */
  if((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))){
    s=s.slice(1,-1).trim();
  }
  /* remove zero-width / whitespace characters */
  s=s.replace(/[\u200B-\u200D\uFEFF\s]+/g,'');
  return s;
}
let API_KEY = normalizeApiKey(localStorage.getItem('nachim_api_key') || '');
function apiKey(){ return normalizeApiKey(API_KEY); }

/* ─── AUTH (LOGIN) ───────────────────────── */
function getAuth0Config(){
  try{
    const raw=localStorage.getItem('nachim_auth0');
    return raw?JSON.parse(raw):{};
  }catch(e){return {};}
}
function setAuth0Config(cfg){
  localStorage.setItem('nachim_auth0', JSON.stringify(cfg||{}));
}
function auth0Domain(){return (getAuth0Config().domain||'').trim();}
function auth0ClientId(){return (getAuth0Config().clientId||'').trim();}
function auth0Audience(){return (getAuth0Config().audience||'').trim();}

/* default Auth0 config (can be overridden in settings modal) */
(function ensureDefaultAuth0(){
  const cfg=getAuth0Config();
  if(cfg && cfg.domain && cfg.clientId) return;
  setAuth0Config({
    domain:'dev-unrwq5rzawkqep5s.us.auth0.com',
    clientId:'c6KcE7zuXTUiRCcWgh53ycSyBCqOcLWz',
    audience: cfg?.audience || ''
  });
})();

const AUTH0_REDIRECT_URI = window.location.origin + window.location.pathname;
let auth0Client = null;

/* ─── Auth0 SPA SDK loader (fallback CDNs) ─── */
const AUTH0_SDK_URLS = [
  'https://unpkg.com/@auth0/auth0-spa-js@2.0.4/dist/auth0-spa-js.production.js',
  'https://cdn.jsdelivr.net/npm/@auth0/auth0-spa-js@2.0.4/dist/auth0-spa-js.production.js'
];
let auth0SdkLoadPromise = null;
function getCreateAuth0Client(){
  return window.createAuth0Client || (window.auth0 && window.auth0.createAuth0Client) || null;
}
function bridgeAuth0Global(){
  if(!window.createAuth0Client && window.auth0 && window.auth0.createAuth0Client){
    window.createAuth0Client = window.auth0.createAuth0Client;
  }
}
function loadScriptOnce(src){
  return new Promise((resolve, reject)=>{
    const existing=[...document.scripts].find(s=>s.src===src);
    if(existing){
      bridgeAuth0Global();
      if(getCreateAuth0Client()) return resolve();
      /* if it exists but didn't execute yet, wait a tick */
      setTimeout(()=>{
        bridgeAuth0Global();
        getCreateAuth0Client()?resolve():reject(new Error('script_present_but_sdk_missing'));
      }, 0);
      return;
    }
    const s=document.createElement('script');
    s.src=src;
    s.async=true;
    s.crossOrigin='anonymous';
    s.onload=()=>{ bridgeAuth0Global(); resolve(); };
    s.onerror=()=>reject(new Error('script_load_failed'));
    document.head.appendChild(s);
  });
}
async function ensureAuth0Sdk(){
  bridgeAuth0Global();
  if(getCreateAuth0Client()) return true;
  if(auth0SdkLoadPromise) return auth0SdkLoadPromise;
  auth0SdkLoadPromise = (async ()=>{
    for(const url of AUTH0_SDK_URLS){
      try{
        await loadScriptOnce(url);
        bridgeAuth0Global();
        if(getCreateAuth0Client()) return true;
      }catch(e){}
    }
    return false;
  })();
  return auth0SdkLoadPromise;
}

function isAuthed(){
  return !!localStorage.getItem('nachim_auth');
}
function setAuthed(user){
  localStorage.setItem('nachim_auth', JSON.stringify({user, ts:Date.now()}));
}
function clearAuthed(){
  localStorage.removeItem('nachim_auth');
}
function initAuthHeroMessaging(){
  const h=document.getElementById('auth-heading');
  const s=document.getElementById('auth-sub');
  if(!h||!s) return;
  const reduce=typeof window.matchMedia==='function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  h.classList.remove('auth-hero-anim','auth-hero-visible');
  s.classList.remove('auth-hero-anim','auth-hero-visible','auth-hero-sub');
  if(reduce) return;
  s.classList.add('auth-hero-sub');
  void s.offsetHeight;
  h.classList.add('auth-hero-anim');
  s.classList.add('auth-hero-anim');
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      h.classList.add('auth-hero-visible');
      s.classList.add('auth-hero-visible');
    });
  });
}
function showAuthGate(){
  document.getElementById('auth').classList.remove('hidden');
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('app').style.display='none';
}
function hideAuthGate(){
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('onboarding').classList.remove('hidden');
}

async function initAuth0(){
  const domain=auth0Domain();
  const clientId=auth0ClientId();
  const audience=auth0Audience();
  if(!domain || !clientId) return null;
  if(!getCreateAuth0Client()){
    const ok = await ensureAuth0Sdk();
    if(!ok) return null;
  }
  if(auth0Client) return auth0Client;
  const factory = getCreateAuth0Client();
  if(!factory) return null;
  auth0Client = await factory({
    domain,
    clientId,
    authorizationParams:{
      redirect_uri: AUTH0_REDIRECT_URI,
      audience: audience || undefined
    },
    cacheLocation:'localstorage',
    useRefreshTokens:true
  });
  return auth0Client;
}

async function handleAuthCallback(){
  const qs=new URLSearchParams(window.location.search);
  if(qs.has('code') && qs.has('state')){
    const c=await initAuth0();
    if(c){
      await c.handleRedirectCallback();
      const user=await c.getUser();
      setAuthed(user||{});
    }
    /* cleanup url */
    window.history.replaceState({}, document.title, AUTH0_REDIRECT_URI);
  }
}

async function loginProvider(connection){
  try{
    /* Auth0 SPA SDK requires a secure origin (http(s)). file:// won't work reliably. */
    if(window.location.protocol==='file:'){
      alert('소셜 로그인을 사용하려면 파일을 직접 열기(file://)가 아니라 로컬 서버(http://localhost)로 실행해야 합니다.');
      return;
    }
    if(!getCreateAuth0Client()){
      const ok = await ensureAuth0Sdk();
      if(!ok){
        alert(
          'Auth0 라이브러리 로드에 실패했습니다. 네트워크/차단 여부를 확인하세요.\n\n' +
          '- 보안 프로그램/확장 프로그램에서 unpkg, jsdelivr 차단 여부 확인\n' +
          '- 회사/학교 네트워크에서 CDN 차단 여부 확인\n' +
          '- 가능하면 http://localhost 로 실행'
        );
        return;
      }
    }
    const c=await initAuth0();
    if(!c){
      openAuth0Settings();
      return;
    }
    await c.loginWithRedirect({
      authorizationParams:{ connection }
    });
  }catch(e){
    alert(`로그인 시작 오류: ${e?.message||e}`);
  }
}
function demoLogin(){
  setAuthed({demo:true,name:'Demo User'});
  startAfterLogin();
}
function openAuth0Settings(){
  const cfg=getAuth0Config();
  const d=document.getElementById('auth0-domain');
  const c=document.getElementById('auth0-clientid');
  const a=document.getElementById('auth0-audience');
  if(d) d.value=cfg.domain||'';
  if(c) c.value=cfg.clientId||'';
  if(a) a.value=cfg.audience||'';
  const m=document.getElementById('auth0-modal');
  if(m) m.classList.add('open');
}
function closeAuth0Settings(){
  const m=document.getElementById('auth0-modal');
  if(m) m.classList.remove('open');
}
function saveAuth0Settings(){
  const domain=(document.getElementById('auth0-domain')?.value||'').trim();
  const clientId=(document.getElementById('auth0-clientid')?.value||'').trim();
  const audience=(document.getElementById('auth0-audience')?.value||'').trim();
  if(!domain || !clientId){
    alert('AUTH0 DOMAIN과 CLIENT ID는 필수입니다.');
    return;
  }
  setAuth0Config({domain, clientId, audience});
  auth0Client=null; /* reset */
  closeAuth0Settings();
  alert('저장되었습니다. 이제 소셜 로그인을 다시 시도하세요.\n\n주의: file://로 열면 동작하지 않을 수 있어요. http://localhost로 실행하세요.');
}
async function logout(){
  clearAuthed();
  const c=await initAuth0();
  if(c){
    c.logout({logoutParams:{returnTo: AUTH0_REDIRECT_URI}});
  } else {
    showAuthGate();
    initAuthHeroMessaging();
  }
}

function startAfterLogin(){
  document.getElementById('auth').classList.add('hidden');
  /* if profile exists, go straight to app; otherwise onboarding */
  try{
    const saved = localStorage.getItem('vd_profile');
    if(saved){
      profile = JSON.parse(saved);
      launch();
      return;
    }
  }catch(e){}
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('app').style.display='none';
}

function updateKeyStatus(){
  const dot=document.getElementById('key-status-dot');
  const txt=document.getElementById('key-status-text');
  if(!dot||!txt) return;
  if(API_KEY){
    dot.className='key-dot key-dot-on';
    txt.textContent='API 연결됨';
  } else {
    dot.className='key-dot key-dot-off';
    txt.textContent='API 키 설정';
  }
}
function openKeyModal(){
  const inp=document.getElementById('key-input');
  if(inp) inp.value=API_KEY||'';
  const msg=document.getElementById('key-status-msg');
  if(msg) msg.textContent=API_KEY?'✅ 현재 키가 저장되어 있습니다.':'키를 입력하고 저장하세요.';
  if(msg) msg.style.color=API_KEY?'#1e3a8a':'var(--ink3)';
  document.getElementById('key-modal').classList.add('open');
}
function closeKeyModal(){document.getElementById('key-modal').classList.remove('open');}
function toggleKeyVis(){
  const inp=document.getElementById('key-input');
  const btn=document.getElementById('key-vis-btn');
  if(!inp) return;
  inp.type=inp.type==='password'?'text':'password';
  btn.textContent=inp.type==='password'?'👁':'🙈';
}
function saveKey(){
  const val=normalizeApiKey(document.getElementById('key-input').value||'');
  if(!val){alert('API 키를 입력해주세요.');return;}
  if(!val.startsWith('sk-ant-')){
    if(!confirm('키 형식이 예상과 다릅니다 (sk-ant-로 시작해야 함). 그래도 저장할까요?')) return;
  }
  API_KEY=val;
  localStorage.setItem('nachim_api_key',val);
  const msg=document.getElementById('key-status-msg');
  msg.textContent='✅ 저장되었습니다!';
  msg.style.color='#1e3a8a';
  updateKeyStatus();
  setTimeout(closeKeyModal,800);
}
function deleteKey(){
  if(!confirm('API 키를 삭제할까요?')) return;
  API_KEY='';
  localStorage.removeItem('nachim_api_key');
  document.getElementById('key-input').value='';
  const msg=document.getElementById('key-status-msg');
  msg.textContent='키가 삭제되었습니다.';
  msg.style.color='var(--ink3)';
  updateKeyStatus();
}
/* key-modal 닫기 바인딩은 DOMContentLoaded에서 처리 */
/* ─── 파일 저장소 ──────────────────── */
let uploadedDocs = [];   // 온보딩에서 업로드한 문서들
let chatPendingFiles = []; // 채팅창에서 첨부 대기 중인 파일들

const FILE_ICONS = {pdf:'📄',png:'🖼️',jpg:'🖼️',jpeg:'🖼️',txt:'📝',csv:'📊',md:'📝'};
const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
function getExt(name){return name.split('.').pop().toLowerCase();}
function getIcon(name){return FILE_ICONS[getExt(name)]||'📎';}
function fmtSize(b){return b>1048576?(b/1048576).toFixed(1)+'MB':(b/1024).toFixed(0)+'KB';}

/* FileReader → PDF만 base64 (Anthropic document) */
function readFile(file){
  return new Promise((res,rej)=>{
    const ext=getExt(file.name);
    if(ext!=='pdf'){
      rej(new Error('PDF 파일만 업로드할 수 있습니다.'));
      return;
    }
    const r=new FileReader();
    r.onload=e=>{
      const b64=e.target.result.split(',')[1];
      res({type:'document',b64,mime:'application/pdf',name:file.name,size:file.size});
    };
    r.onerror=rej;
    r.readAsDataURL(file);
  });
}

/* ── 온보딩 파일 업로드 ── */
function obDragOver(e){e.preventDefault();document.getElementById('ob-drop-zone').classList.add('drag');}
function obDragLeave(e){document.getElementById('ob-drop-zone').classList.remove('drag');}
function obDrop(e){e.preventDefault();obDragLeave(e);obFileSelect(e.dataTransfer.files);}

async function obFileSelect(files){
  for(const f of files){
    if(f.size>MAX_UPLOAD_BYTES){alert(`${f.name}: 파일 크기가 20MB를 초과합니다.`);continue;}
    const id='f'+Date.now()+Math.random().toString(36).slice(2);
    const item={id,name:f.name,size:f.size,status:'loading',data:null};
    uploadedDocs.push(item);
    renderObFiles();
    try{
      item.data=await readFile(f);
      item.status='ok';
    }catch(e){item.status='err';}
    renderObFiles();
  }
  document.getElementById('ob-file-input').value='';
}

function renderObFiles(){
  const el=document.getElementById('ob-file-list');
  if(!uploadedDocs.length){el.innerHTML='';return;}
  el.innerHTML=uploadedDocs.map(f=>`
    <div class="file-item">
      <span class="file-item-icon">${getIcon(f.name)}</span>
      <div class="file-item-info">
        <div class="file-item-name">${f.name}</div>
        <div class="file-item-size">${fmtSize(f.size)}</div>
      </div>
      <span class="file-item-status ${f.status}">${f.status==='ok'?'완료':f.status==='err'?'오류':'읽는 중...'}</span>
      <button class="file-remove" onclick="removeObFile('${f.id}')">×</button>
    </div>`).join('');
}
function removeObFile(id){uploadedDocs=uploadedDocs.filter(f=>f.id!==id);renderObFiles();}

/* ── 채팅창 파일 첨부 ── */
async function chatFileSelect(files){
  for(const f of files){
    if(f.size>MAX_UPLOAD_BYTES){alert(`${f.name}: 파일 크기가 20MB를 초과합니다.`);continue;}
    try{
      const data=await readFile(f);
      chatPendingFiles.push({name:f.name,size:f.size,data});
    }catch(e){alert(`${f.name}: ${e.message||'읽기 실패'}`);}
  }
  document.getElementById('chat-file-input').value='';
  renderChatFiles();
}
function renderChatFiles(){
  const el=document.getElementById('chat-files-preview');
  if(!chatPendingFiles.length){el.innerHTML='';return;}
  el.innerHTML=chatPendingFiles.map((f,i)=>`
    <div class="chat-file-chip">
      ${getIcon(f.name)} ${f.name}
      <button onclick="removeChatFile(${i})">×</button>
    </div>`).join('');
}
function removeChatFile(i){chatPendingFiles.splice(i,1);renderChatFiles();}

/* ── API 메시지에 파일 포함 ── */
let docsSentOnce=false; /* 파일은 첫 메시지에만 1회 첨부 */
function buildUserContent(text, pendingFiles){
  /* 채팅 첨부 파일 */
  const chatFiles=pendingFiles.map(f=>f.data).filter(Boolean);
  /* 온보딩 업로드 파일 — 첫 질문에만 1회 */
  const obFiles=(!docsSentOnce)?uploadedDocs.filter(f=>f.status==='ok').map(f=>f.data):[];
  if(obFiles.length) docsSentOnce=true;
  const allFiles=[...obFiles,...chatFiles];
  if(!allFiles.length) return text;
  const parts=[];
  for(const d of allFiles){
    if(d.type==='document') parts.push({type:'document',source:{type:'base64',media_type:d.mime,data:d.b64}});
    else if(d.type==='image') parts.push({type:'image',source:{type:'base64',media_type:d.mime,data:d.b64}});
    else if(d.type==='text') parts.push({type:'text',text:`[첨부: ${d.name}]\n${d.text}`});
  }
  parts.push({type:'text',text});
  return parts;
}

/* ─── 지원 사업 도우미 (첨부 + 양식 기반 계획서 초안) ─── */
let grantBundles={ann:[],tpl:[],co:[]};

function grantRemoveFile(slot,i){
  if(!grantBundles[slot]) return;
  grantBundles[slot].splice(i,1);
  renderGrantLists();
}
async function grantFileChosen(slot, files){
  if(!files||!files.length) return;
  for(const f of files){
    if(f.size>MAX_UPLOAD_BYTES){alert(`${f.name}: 파일 크기가 20MB를 초과합니다.`);continue;}
    try{
      const data=await readFile(f);
      grantBundles[slot].push({name:f.name,data});
    }catch(e){alert(`${f.name}: ${e.message||'읽기 실패'}`);}
  }
  const ids={ann:'grant-file-ann',tpl:'grant-file-tpl',co:'grant-file-co'};
  const inp=document.getElementById(ids[slot]);
  if(inp) inp.value='';
  renderGrantLists();
}
function renderGrantLists(){
  ['ann','tpl','co'].forEach(slot=>{
    const el=document.getElementById('grant-list-'+slot);
    if(!el) return;
    const items=grantBundles[slot];
    if(!items.length){el.innerHTML='';return;}
    el.innerHTML=items.map((it,i)=>`
      <div class="chat-file-chip" style="margin-bottom:4px">
        ${getIcon(it.name)} ${esc(it.name)}
        <button type="button" onclick="grantRemoveFile('${slot}',${i})">×</button>
      </div>`).join('');
  });
}
function openGrantModal(ev){
  if(ev&&ev.stopPropagation) ev.stopPropagation();
  grantBundles={ann:[],tpl:[],co:[]};
  ['grant-file-ann','grant-file-tpl','grant-file-co'].forEach(id=>{const n=document.getElementById(id);if(n)n.value='';});
  const tc=document.getElementById('grant-text-co');
  if(tc) tc.value='';
  renderGrantLists();
  document.getElementById('grant-modal').classList.add('open');
}
function closeGrantModal(){
  const m=document.getElementById('grant-modal');
  if(m) m.classList.remove('open');
}
function buildGrantSystem(){
  const styleGuide = MENTOR_STYLES[profile.style] || MENTOR_STYLES['YC 파트너식 직설'];
  let sys=`당신은 한국의 정부지원사업(기업부설연구소, 창업·R&D 지원, 지역·중소벤처 사업, TIPS 등) 사업계획서 작성에 특화된 전문가입니다.

**임무**
- 사용자가 제공한 지원사업 공고(PDF)에서 평가기준, 제출 서식, 필수 기재항목, 유의사항을 파악합니다.
- 첨부된 사업계획서 양식의 목차·항목·번호 체계를 그대로 따릅니다.
- 회사소개 자료·텍스트를 반영해 항목별 초안을 채웁니다.

**원칙**
- 양식에 없는 장을 임의로 추가하지 않습니다(공고에서 별도로 요구하는 경우만 예외).
- 검증되지 않은 수치·실적은 임의로 만들지 말고 [확인 필요] 또는 [해당사항 기재]로 표시합니다.
- 출력: 마크다운(## · ###), 표·목록 적극 활용.
- 마지막에 "## 제출 전 체크리스트"로 공고·양식 대비 점검 항목을 정리합니다.

[멘토 톤: ${profile.style||'YC 파트너식 직설'}]
${styleGuide}
`;
  if(profile.industry){
    sys+=`\n[참고 프로필]\n업종/서비스: ${profile.industry}\n단계: ${profile.stage||'-'}\n팀: ${profile.team||'-'}\n${profile.mrr?`월 매출: ${profile.mrr}\n`:''}${profile.name?`명칭: ${profile.name}\n`:''}${profile.concern?`핵심 맥락: ${profile.concern}\n`:''}`;
  }
  return sys;
}
function appendGrantParts(parts, items, label){
  for(const it of items){
    const d=it.data;
    if(d.type==='document') parts.push({type:'document',source:{type:'base64',media_type:d.mime,data:d.b64}});
    else if(d.type==='image') parts.push({type:'image',source:{type:'base64',media_type:d.mime,data:d.b64}});
    else if(d.type==='text') parts.push({type:'text',text:`[${label}: ${it.name}]\n${d.text}`});
  }
}
async function submitGrantHelper(){
  const textCo=(document.getElementById('grant-text-co')?.value||'').trim();
  if(!grantBundles.tpl.length){
    alert('사업계획서 양식 파일을 1개 이상 첨부해 주세요.');
    return;
  }
  if(!grantBundles.ann.length){
    alert('지원사업 공고문 PDF를 1개 이상 첨부해 주세요.');
    return;
  }
  if(!grantBundles.co.length && !textCo){
    alert('회사소개 자료를 첨부하거나, 회사소개 내용을 입력해 주세요.');
    return;
  }
  if(!API_KEY){
    alert('API 키를 먼저 설정해 주세요.');
    return;
  }
  if(busy) return;
  const subBtn=document.getElementById('grant-submit-btn');
  busy=true;
  if(subBtn) subBtn.disabled=true;
  const sendBtn=document.getElementById('send-btn');
  if(sendBtn) sendBtn.disabled=true;

  const parts=[];
  parts.push({type:'text',text:`[첨부 요약] 공고문 파일 ${grantBundles.ann.length}건, 사업계획서 양식 ${grantBundles.tpl.length}건, 회사소개 파일 ${grantBundles.co.length}건. 아래 지시에 따라 사업계획서 초안을 작성하세요.`});
  appendGrantParts(parts, grantBundles.ann, '공고문');
  appendGrantParts(parts, grantBundles.tpl, '사업계획서_양식');
  appendGrantParts(parts, grantBundles.co, '회사소개_자료');
  let tail=`**작성 지시 (반드시 준수)**\n`;
  tail+=`1. '사업계획서_양식' 첨부의 목차·항목·번호 체계를 그대로 사용합니다. 항목 제목을 바꾸거나 순서를 바꾸지 마세요.\n`;
  tail+=`2. '공고문'에서 요구하는 내용·평가기준·기재 양식을 각 항목에 반영합니다.\n`;
  tail+=`3. '회사소개_자료'와 아래 [직접 입력]이 있으면 그 내용을 근거로 구체적으로 서술합니다.\n\n`;
  if(textCo) tail+=`[회사 소개(직접 입력)]\n${textCo}\n\n`;
  tail+=`지금부터 마크다운으로 사업계획서 전체 초안을 작성해 주세요.`;

  parts.push({type:'text',text:tail});
  const usrMsg={role:'user',content:parts};
  const userSummary=`[지원 사업 도우미] 공고 ${grantBundles.ann.length}건 · 양식 ${grantBundles.tpl.length}건 · 회사소개 ${grantBundles.co.length?grantBundles.co.length+'건':(textCo?'텍스트':'없음')}`;

  closeGrantModal();
  rmWelcome();
  addMsg('user',userSummary,null);
  messages.push(usrMsg);
  showLoad();

  const extractText=(j)=> (j?.content||[]).filter(c=>c?.type==='text'&&typeof c?.text==='string').map(c=>c.text).join('');
  const callOnce=async (msgs,maxTokens)=>{
    const model=(await resolveModelId('sonnet')) || 'claude-3-5-sonnet-20241022';
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':apiKey(),
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({model,max_tokens:maxTokens,stream:false,system:buildGrantSystem(),messages:msgs})
    });
    if(!res.ok){
      let errMsg='API 오류';
      try{const jj=await res.json();errMsg=jj.error?.message||errMsg;}catch(e){}
      throw new Error(errMsg);
    }
    return res.json();
  };

  try{
    let convo=[usrMsg];
    let fullTextAll='';
    for(let turn=0;turn<5;turn++){
      const j=await callOnce(convo, turn===0?8192:4096);
      const part=extractText(j);
      if(part) fullTextAll+=part;
      if(String(j?.stop_reason||'')!=='max_tokens') break;
      convo=[...convo,{role:'assistant',content:part},{role:'user',content:'동일 공고·양식 구조를 유지한 채, 바로 이어서 계속 작성해 주세요. 이미 작성한 내용은 반복하지 마세요.'}];
    }
    hideLoad();
    const finalText=(fullTextAll||'').trim();
    if(finalText){
      addMsg('ai',finalText,null,'지원 사업 도우미');
      messages.push({role:'assistant',content:finalText});
      saveHistory(userSummary,finalText,'지원 사업 도우미');
    }else{
      addMsg('ai','응답을 받지 못했습니다.',null,'지원 사업 도우미');
      messages.push({role:'assistant',content:'응답을 받지 못했습니다.'});
    }
  }catch(e){
    hideLoad();
    addMsg('ai',`오류: ${e.message||'연결을 확인해 주세요.'}`,null,'지원 사업 도우미');
    messages.push({role:'assistant',content:`오류: ${e.message||'연결을 확인해 주세요.'}`});
  }
  busy=false;
  if(subBtn) subBtn.disabled=false;
  if(sendBtn) sendBtn.disabled=false;
  document.getElementById('input')?.focus();
}

/* ─── 도메인 설정 ──────────────────── */
const DOMAINS = {
  strategy:{title:'경영전략 자문',desc:'비즈니스 모델 · 경쟁분석 · PMF · 성장전략',sys:'스타트업 경영전략 및 비즈니스 모델 전문가로서 PMF 검증, 경쟁전략, 피벗 판단, 성장 설계에 대해 조언합니다.',
    prompts:['PMF 검증은 어떻게 하나요?','경쟁사 차별화 전략을 어떻게 세우나요?','지금 피벗해야 할지 어떻게 판단하나요?','성장 KPI를 어떻게 설계할까요?']},
  investment:{title:'투자 / IR 자문',desc:'IR 덱 · 투자 전략 · 밸류에이션 · 투자자 관계',sys:'VC 투자 전문가로서 투자 유치 전략, IR 자료 작성, 밸류에이션 산정, 투자자 미팅 단골 질문, 텀싯 협상에 대해 조언합니다.',
    prompts:['시드 IR 덱 필수 구성요소가 뭔가요?','밸류에이션은 어떻게 계산하나요?','투자자 미팅 단골 질문들은?','텀싯에서 꼭 확인할 조항은?']},
  finance:{title:'재무 / 회계 자문',desc:'런웨이 · 단위경제 · 세무 · 정부지원 · 투자금 처리',sys:'스타트업 전문 CFO 및 세무사 수준의 전문가로서 런웨이 관리, 단위경제(Unit Economics), 재무모델링, 법인세, 부가세, 스타트업 세제 혜택, 벤처기업 인증, 투자금 회계처리, 정부지원사업 신청에 대해 조언합니다.',
    prompts:['런웨이 계산하는 법을 알려주세요','스타트업 세제 혜택 알려주세요','벤처기업 인증 조건이 뭔가요?','투자금 회계처리는 어떻게 하나요?']},
  marketing:{title:'마케팅 / 홍보 자문',desc:'그로스해킹 · 콘텐츠 · PR · 브랜딩 · 퍼포먼스',sys:'스타트업 마케팅 전문가로서 그로스해킹, 콘텐츠 마케팅, PR/홍보 전략, 브랜드 구축, 퍼포먼스 마케팅(CAC 최적화, 채널 전략)에 대해 구체적이고 실행 가능한 조언을 합니다.',
    prompts:['초기 스타트업 마케팅 채널 우선순위는?','CAC를 줄이는 방법이 있을까요?','PR 없이 언론 노출을 얻는 방법은?','브랜드 아이덴티티를 어떻게 만드나요?']},
  sales:{title:'영업 / 제휴 자문',desc:'B2B 영업 · 파트너십 · 채널 전략 · 계약 협상',sys:'스타트업 영업 및 파트너십 전문가로서 B2B 영업 프로세스 구축, 기업 파트너십 전략, 채널 세일즈, 계약 협상 전략에 대해 실전적이고 구체적인 조언을 합니다.',
    prompts:['첫 B2B 고객은 어떻게 확보하나요?','파트너십 제안을 어떻게 해야 하나요?','영업 파이프라인은 어떻게 관리하나요?','엔터프라이즈 영업과 SMB 영업의 차이는?']},
  hr:{title:'인사 / 노무 자문',desc:'채용전략 · 노무관리 · 스톡옵션 · 조직설계',sys:'스타트업 인사 및 노무 전문가로서 채용 전략, 근로계약서 작성, 노무 리스크 관리, 4대 보험, 스톡옵션 설계, 조직문화 구축에 대해 조언합니다. 노무 분쟁 등 구체적 사안은 노무사 상담을 권장하세요.',
    prompts:['첫 직원 근로계약서 작성 시 주의점은?','스톡옵션 풀은 얼마나 잡아야 하나요?','공동창업자 지분 분배 방법은?','프리랜서와 정규직 고용의 차이는?']},
  legal:{title:'법률 / 특허 자문',desc:'계약 · IP 전략 · 특허 · 규제 · 법인 구조',sys:'스타트업 법률 및 특허 전문가로서 계약서 검토, 지식재산권 전략, 특허 출원 및 등록 전략, 상표·저작권 보호, 규제 이슈, 법인 구조에 대해 조언합니다. 구체적 사안은 반드시 변호사·변리사 상담을 권장하세요.',
    prompts:['특허 출원 시기와 절차가 궁금해요','소프트웨어는 특허를 받을 수 있나요?','NDA는 언제 써야 하나요?','서비스 이용약관 필수 내용은?']}
};

/* Apple SF Symbols–style line icons (24×24, currentColor) */
const DOMAIN_ICONS_SVG = {
  strategy:'<svg class="domain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="8" width="16" height="11" rx="2"/><path d="M9 8V6a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>',
  investment:'<svg class="domain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 17 9 11 13 15 21 7"/><polyline points="21 7 21 11 17 11"/></svg>',
  finance:'<svg class="domain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="7" y1="20" x2="7" y2="10"/><line x1="12" y1="20" x2="12" y2="5"/><line x1="17" y1="20" x2="17" y2="13"/></svg>',
  marketing:'<svg class="domain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 11v2a2 2 0 002 2h2l4 3V6L8 9H6a2 2 0 00-2 2z"/><line x1="16" y1="8" x2="21" y2="8"/><line x1="16" y1="16" x2="21" y2="8"/></svg>',
  sales:'<svg class="domain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.12.86.3 1.71.54 2.54a2 2 0 01-.47 2.1l-1.27 1.27a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.83.24 1.68.42 2.54.54A2 2 0 0122 16.92z"/></svg>',
  hr:'<svg class="domain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="9" cy="7" r="2.5"/><path d="M4 20v-1a4 4 0 014-4h2"/><circle cx="17" cy="7" r="2.5"/><path d="M22 20v-1a4 4 0 00-4-4h-1"/></svg>',
  legal:'<svg class="domain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="3" x2="12" y2="21"/><line x1="5" y1="9" x2="19" y2="9"/><path d="M5 9l2.5 6h9L19 9"/><circle cx="8.5" cy="18" r="2.5"/><circle cx="15.5" cy="18" r="2.5"/></svg>',
  grant:'<svg class="domain-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>'
};

function domainIconHtml(key){
  const k=(key && DOMAIN_ICONS_SVG[key])?key:'strategy';
  return DOMAIN_ICONS_SVG[k];
}

function initDomainIcons(){
  document.querySelectorAll('.d-btn[data-domain-key]').forEach(btn=>{
    const k=btn.getAttribute('data-domain-key');
    const ico=btn.querySelector('.d-ico');
    if(ico && k) ico.innerHTML=domainIconHtml(k);
  });
  const bar=document.getElementById('d-ico');
  if(bar) bar.innerHTML=domainIconHtml(domain);
  const hist=document.getElementById('hist-domain-ico');
  if(hist) hist.innerHTML=domainIconHtml(domain);
}

/* buildSys — Expert Mode: 도메인별 최상위 전문가 페르소나 (키는 DOMAINS와 동일) */
const DOMAIN_EXPERT_PERSONAS = {
  strategy:`[전문가 페르소나 — 경영·전략(BIZ)]
- 정체성: 15년 차 글로벌 전략·비즈니스 컨설턴트. Big4·MBB·유니콘 자문을 거쳐 다수 시리즈B~IPO 기업의 보드·전략실과 협업한 경력.
- 말투: 짧고 단정한 문장, 결론·판단·우선순위를 먼저. 위로보다 실행 가능한 선택지 제시.
- 용어: PMF, TAM/SAM/SOM, moat, 경쟁지도, 시나리오·옵션, KPI 트리, 가격·포지셔닝, 피벗·스코프 결정 등 전략 어휘를 정확히 쓰고 남발하지 않는다. 제품·로드맵·기술 부채 질문은 우선순위·트레이드오프 관점에서 답하되, 순수 구현·코드 수준은 다루지 않는다.`,
  investment:`[전문가 페르소나 — 투자·IR(INVEST)]
- 정체성: 글로벌 VC·크로스보더 펀드 출신 투자 파트너(시드~시리즈B). IR·텀싯·캡테이블·밸류에이션 협상 수백 건 경험.
- 말투: 투자자 미팅장에서 쓰는 간결한 논리. 숫자·가정·리스크를 명시.
- 용어: pre/post-money, SAFE, convertible, liquidation preference, ESOP 풀, 데이터룸, DD, runway, traction 지표 등을 맥락에 맞게 사용. 법적 효력·분쟁 가능성은 법률 도메인 전문가 확인을 안내한다.`,
  finance:`[전문가 페르소나 — 재무·회계]
- 정체성: 스케일업·벤처 전문 CFO 출신. 런웨이·단위경제·재무모델·세무·정부지원 연계를 실무에서 설계.
- 말투: 보수적이고 검증 가능한 표현. 추정은 가정을 밝힌다.
- 용어: P&L, 현금흐름, Gross margin, OPEX, runway, Unit economics, 인식·부가세·법인세 개념 등을 정확히 사용. 최종 세무·회계 처리는 세무사 확인을 권한다.`,
  marketing:`[전문가 페르소나 — 마케팅·그로스(MKT)]
- 정체성: 유니콘·초고성장 B2C/B2B에서 그로스 리드·CMO급. 채널 믹스·실험 설계·브랜드·퍼포먼스를 통합해 본 경험.
- 말투: 실험 가설·지표·다음 액션 중심. 감성 카피보다 전환·리텐션 논리.
- 용어: CAC, LTV, ROAS, 퍼널, 코호트, A/B, 채널 적합성, 포지셔닝, 메시지-채널 피트 등을 상황에 맞게 사용한다.`,
  sales:`[전문가 페르소나 — 영업·제휴]
- 정체성: 엔터프라이즈·SMB 복합 B2B 세일즈 리더. 파이프라인·MEDDIC·파트너십 설계 경험.
- 말투: 미팅 스크립트처럼 구체적이고 단계형.
- 용어: SQL/MQL, 파이프라인 단계, 윈플랜, POC, 계약·SOW, 채널 파트너, 리뉴얼·업셀 등을 사용한다.`,
  hr:`[전문가 페르소나 — 인사·노무]
- 정체성: 스케일업 단계 CHRO·스타트업 전문 HRBP. 채용·보상·조직·스톡옵션 설계 경험.
- 말투: 정책·리스크·실무 절차를 균형 있게.
- 용어: 근로계약, 4대보험, 평가·보상 체계, 옵션풀, 조직 설계 등. 개별 분쟁·소송 가능성이 있으면 반드시 노무사 상담을 권한다.`,
  legal:`[전문가 페르소나 — 법률·IP]
- 정체성: 벤처·테크 특화 로펌 출신, 계약·IP·규제를 아우르는 자문 관점(교육·정보 제공 수준).
- 말투: 조항·리스크·실무 체크리스트 중심, 단정적 법적 결론은 피한다.
- 용어: NDA, 이용약관, 개인정보, 특허·상표·저작권, 라이선스, 준법. 모든 구체 사안은 변호사·변리사 자문을 반복 권고한다.`
};

const MENTOR_STYLES = {
  'YC 파트너식 직설':'Paul Graham의 직설적 방식으로 핵심을 먼저 말하고 구체적 액션을 제시하세요. 추상적 조언 금지, 수치와 예시 필수.',
  '소크라테스식 질문':'창업자가 스스로 답을 찾도록 질문 중심으로 이끌어주세요. 매 응답 마지막에 생각을 자극하는 질문 1개를 꼭 포함하세요.',
  '데이터 중심 분석':'모든 주장에 데이터와 수치를 근거로 제시하세요. 업계 벤치마크, 통계, 사례 수치를 구체적으로 언급하세요.',
  '국내 시장 특화':'한국 스타트업 생태계 특성(정부지원사업, 국내 VC 성향, 규제 환경, K-스타트업 사례)을 반영한 현실적 조언을 우선하세요.'
};
let profile = {};
let domain = 'strategy';
let messages = [];
let busy = false;
let ob = {industry:'',stage:'',team:'',mrr:'',name:'',concern:'',style:'YC 파트너식 직설'};
let step = 1;

/* ─── 온보딩 ────────────────────────── */
function onIndustryInput(val){
  ob.industry=val.trim();
  document.querySelectorAll('.ind-tag').forEach(t=>t.classList.remove('sel'));
  validate();
}
function setIndustry(val){
  ob.industry=val;
  document.getElementById('industry-in').value=val;
  document.querySelectorAll('.ind-tag').forEach(t=>t.classList.toggle('sel',t.textContent.trim()===val||t.onclick.toString().includes(`'${val}'`)));
  validate();
}
function pickChip(type, el) {
  el.closest('[id$="-grid"]').querySelectorAll('.ob-chip').forEach(c=>c.classList.remove('sel'));
  el.classList.add('sel');
  ob[type] = el.dataset.val;
  validate();
}
function validate() {
  if (step===1) document.getElementById('btn1').disabled=!(ob.industry&&ob.stage);
  if (step===2) document.getElementById('btn2').disabled=!ob.team;
}
/* oninput 바인딩은 DOMContentLoaded에서 처리 */
function goStep(n) {
  document.getElementById('sec'+step).classList.remove('active');
  step=n;
  document.getElementById('sec'+n).classList.add('active');
  for(let i=1;i<=3;i++) document.getElementById('s'+i).classList.toggle('done',i<=n);
  validate();
}
function finishOnboarding() {
  profile={...ob};
  localStorage.setItem('vd_profile',JSON.stringify(profile));
  launch();
}
function skipOnboarding(){profile={};launch();}
function editProfile(){
  closeModal();
  ob={...profile};step=1;
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('app').style.display='none';
  ['sec1','sec2','sec3'].forEach((s,i)=>document.getElementById(s).classList.toggle('active',i===0));
  hydrateOnboardingFromOb();
}

function cancelOnboardingEdit(){
  document.getElementById('onboarding').classList.add('hidden');
  document.getElementById('app').style.display='flex';
  /* discard unsaved changes */
  try{
    const saved = localStorage.getItem('vd_profile');
    if(saved) profile = JSON.parse(saved);
  }catch(e){}
  ob={...profile};
  applyProfile();
}

function hydrateOnboardingFromOb(){
  /* step reset */
  step=1;
  ['sec1','sec2','sec3'].forEach((s,i)=>document.getElementById(s).classList.toggle('active',i===0));
  for(let i=1;i<=3;i++) document.getElementById('s'+i).classList.toggle('done',i<=1);

  /* inputs */
  const ind=document.getElementById('industry-in');
  if(ind){ ind.value=ob.industry||''; onIndustryInput(ind.value||''); }
  const mrr=document.getElementById('mrr-in');
  if(mrr){ mrr.value=ob.mrr||''; }
  const name=document.getElementById('name-in');
  if(name){ name.value=ob.name||''; }
  const con=document.getElementById('concern-in');
  if(con){ con.value=ob.concern||''; }

  /* tags */
  document.querySelectorAll('.ind-tag').forEach(t=>{
    t.classList.toggle('sel', (t.textContent||'').trim()===(ob.industry||'').trim());
  });

  /* chips */
  const setSel=(gridId, val)=>{
    const g=document.getElementById(gridId);
    if(!g) return;
    g.querySelectorAll('.ob-chip').forEach(c=>c.classList.toggle('sel', c.dataset.val===val));
  };
  setSel('stage-grid', ob.stage||'');
  setSel('team-grid',  ob.team||'');
  setSel('style-grid', ob.style||'YC 파트너식 직설');

  validate();
}

/* ─── 앱 시작 ──────────────────────── */
function launch(){
  document.getElementById('onboarding').classList.add('hidden');
  const app=document.getElementById('app');
  app.style.display='flex';
  applyProfile();
  renderHistory();
  updateHistoryDomainContext();
  updateKeyStatus();
  showWelcome();
  const inp=document.getElementById('input');
  if(inp){inp.disabled=false;inp.readOnly=false;inp.focus();}
  queueMicrotask(()=>refreshAllReportBubbleMarkdown());
}
function applyProfile(){
  const name=profile.name||profile.industry||null;
  const pname=document.getElementById('pname');
  if(pname) pname.textContent=name?(name.length>18?name.slice(0,18)+'…':name):'프로필 미설정';
  const pbInfo=document.getElementById('pb-info');
  if(pbInfo) pbInfo.textContent=(profile.industry&&profile.stage)?`${profile.stage} · ${profile.industry}`:'프로필 미설정';
  const styleEl=document.getElementById('pb-style');
  if(styleEl) styleEl.textContent=profile.style||'YC 파트너식 직설';
  const styleBtn=document.getElementById('style-btn-text');
  if(styleBtn) styleBtn.textContent=profile.style||'YC 파트너식 직설';
}

/* (popular questions tab removed) */

/* ─── 탭 전환 ──────────────────────── */
function updateHistoryDomainContext(){
  const cfg=DOMAINS[domain];
  if(!cfg) return;
  const ico=document.getElementById('hist-domain-ico');
  const title=document.getElementById('hist-domain-title');
  if(ico) ico.innerHTML=domainIconHtml(domain);
  if(title) title.textContent=cfg.title;
}

function switchTab(tab){
  ['domain','history'].forEach(t=>{
    const tb=document.getElementById('tab-'+t);
    const pn=document.getElementById('panel-'+t);
    if(tb) tb.classList.toggle('active',t===tab);
    if(pn) pn.style.display=t===tab?'':'none';
  });
  if(tab==='history') updateHistoryDomainContext();
  if(tab==='domain'){
    const inp=document.getElementById('input');
    if(inp){inp.disabled=false;inp.readOnly=false;inp.focus();}
  }
}

let pendingMismatchQuestion='';

function hideDomainBanner(){
  const b=document.getElementById('domain-banner');
  if(!b) return;
  b.style.display='none';
  b.innerHTML='';
  pendingMismatchQuestion='';
}

function showDomainBanner(question, mismatch){
  pendingMismatchQuestion=question;
  const b=document.getElementById('domain-banner');
  if(!b) return;
  const cur=DOMAINS[mismatch.current]?.title||mismatch.current;
  const top=DOMAINS[mismatch.top]?.title||mismatch.top;
  const sugg=(mismatch.suggestions||[]).slice(0,3);
  b.innerHTML=`
    <div class="db-row">
      <div class="db-left">
        <div class="db-title">도메인 미스매치 가능성</div>
        <div class="db-desc">현재 <strong>${esc(cur)}</strong>에서 질문하셨어요. 내용상 <strong>${esc(top)}</strong> 도메인이 더 적합해 보여요.</div>
      </div>
      <div class="db-actions">
        ${sugg.map(k=>`<button class="db-btn primary" onclick="applyDomainSuggestion('${k}')">${esc(DOMAINS[k]?.title||k)}</button>`).join('')}
        <button class="db-btn" onclick="sendAnyway()">그대로 질문</button>
        <button class="db-btn ghost" onclick="hideDomainBanner()">닫기</button>
      </div>
    </div>`;
  b.style.display='';
}

function findDomainButton(key){
  return Array.from(document.querySelectorAll('.d-btn')).find(btn=>{
    const oc=btn.getAttribute('onclick')||'';
    return oc.includes(`'${key}'`);
  }) || null;
}

function applyDomainSuggestion(key){
  if(busy) return;
  const btn=findDomainButton(key);
  if(btn) selectDomain(btn, key);
  switchTab('domain');
  const inp=document.getElementById('input');
  if(inp) { inp.value=pendingMismatchQuestion; resize(inp); inp.focus(); }
  hideDomainBanner();
}

async function sendAnyway(){
  if(busy) return;
  const t=pendingMismatchQuestion;
  hideDomainBanner();
  const inp=document.getElementById('input');
  if(inp) { inp.value=''; resize(inp); }
  if(t) await doSend(t);
}

function classifyDomain(text){
  const s=String(text||'').toLowerCase();
  const KW={
    strategy:['pmf','피봇','피벗','경쟁','kpi','전략','비즈니스 모델','biz model','시장','포지셔닝','go-to-market','gtm','가격','pricing'],
    investment:['투자','ir','vc','밸류','밸류에이션','valuation','텀싯','term sheet','term-sheet','cap table','캡테이블','주주','지분','시드','series','프리머니','post-money','pre-money','데모데이'],
    finance:['재무','회계','세무','부가세','법인세','원천세','손익','p&l','현금흐름','cashflow','cash flow','런웨이','runway','unit economics','단위경제','마진','gross margin','매출','비용','결산'],
    marketing:['마케팅','브랜딩','seo','as o','퍼포먼스','roas','cac','l tv','ltv','cvr','전환','그로스','콘텐츠','pr','홍보','광고','퍼널','funnel'],
    sales:['영업','리드','파이프라인','pipeline','b2b','계약','제안서','미팅','세일즈','채널','파트너','제휴','리텐션','업셀','다운셀'],
    hr:['채용','면접','평가','보상','연봉','조직','문화','근로계약','노무','퇴사','해고','스톡옵션','옵션풀','esop'],
    legal:['법률','계약서','nda','약관','개인정보','개인정보처리방침','저작권','특허','상표','규제','준수','컴플라이언스','라이선스']
  };
  const scores={strategy:0,investment:0,finance:0,marketing:0,sales:0,hr:0,legal:0};
  for(const [k,arr] of Object.entries(KW)){
    for(const w of arr){
      const ww=String(w).toLowerCase();
      if(!ww) continue;
      if(s.includes(ww)) scores[k]+=1;
    }
  }
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  return {scores, top:ranked[0][0], topScore:ranked[0][1], secondScore:ranked[1][1]};
}

function detectDomainMismatch(text, current){
  const r=classifyDomain(text);
  if(r.topScore<=0) return null;
  const top=r.top;
  if(top===current) return null;
  /* require clear signal */
  if(r.topScore<2 && r.topScore-r.secondScore<1) return null;
  const suggestions=[top, ...Object.entries(r.scores).filter(([k,v])=>k!==top && v===r.topScore-1 && v>0).map(([k])=>k)];
  return {current, top, suggestions};
}

/* ─── 확인 모달 ─────────────────────── */
let pendingQuestion='';
function openConfirm(q){
  pendingQuestion=q;
  const txt=document.getElementById('confirm-q-text');
  if(txt) txt.textContent=q;
  const m=document.getElementById('confirm-modal');
  if(m) m.classList.add('open');
}
function closeConfirm(){
  const m=document.getElementById('confirm-modal');
  if(m) m.classList.remove('open');
  pendingQuestion='';
}
function confirmAsk(){
  const q=pendingQuestion;  /* 먼저 복사 */
  const m=document.getElementById('confirm-modal');
  if(m) m.classList.remove('open');
  pendingQuestion='';       /* 모달 닫은 뒤 초기화 */
  busy=false;               /* 혹시 남아있을 busy 상태 초기화 */
  if(q) quickAsk(q);
}
/* confirm-modal 닫기 바인딩은 DOMContentLoaded에서 처리 */

/* ─── 질문 기록 ─────────────────────── */
let historyLog=[];
let currentHistItem=null;

function saveHistory(q,a,domainTitle){
  try{
    const raw=localStorage.getItem('vd_history');
    const log=raw?JSON.parse(raw):[];
    log.unshift({q,a,domain:domainTitle,domainKey:domain,ts:Date.now()});
    localStorage.setItem('vd_history',JSON.stringify(log.slice(0,200)));
  }catch(e){localStorage.removeItem('vd_history');}
  renderHistory();
}
function renderHistory(){
  try{
    const raw=localStorage.getItem('vd_history');
    const el=document.getElementById('history-list');
    if(!el)return;
    if(!raw){el.innerHTML='<div class="pop-empty">아직 질문 기록이 없어요.</div>';return;}
    const all=JSON.parse(raw);
    historyLog=all.filter(h=>h.domainKey===domain);
    if(!historyLog.length){el.innerHTML=`<div class="pop-empty">${DOMAINS[domain].title}의<br>질문 기록이 아직 없어요.</div>`;return;}
    el.innerHTML=historyLog.map((h,i)=>{
      const d=new Date(h.ts);
      const ts=`${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
      return `<div class="hist-item" data-hidx="${i}">
        <div class="hist-domain">${esc(h.domain||'')}</div>
        <div class="hist-q">${esc(h.q)}</div>
        <div class="hist-time">${ts}</div>
      </div>`;
    }).join('');
    el.querySelectorAll('[data-hidx]').forEach(item=>{
      item.addEventListener('click',()=>openHistConversation(historyLog[+item.dataset.hidx]));
    });
  }catch(e){localStorage.removeItem('vd_history');}
}

function openHistConversation(h){
  if(!h) return;
  currentHistItem=h;
  /* move back to the original chat screen */
  switchTab('domain');
  const chat=document.getElementById('chat');
  if(chat) chat.innerHTML='';

  /* restore messages state (so follow-up continues naturally) */
  messages=[];
  docsSentOnce=false;

  addMsg('user', h.q, []);
  messages.push({role:'user',content:h.q});

  addMsg('ai', h.a || '');
  messages.push({role:'assistant',content:h.a || ''});
}

function openHistModal(h){
  currentHistItem=h;
  document.getElementById('hist-modal-domain').textContent=h.domain+' 자문 기록';
  document.getElementById('hist-modal-time').textContent=new Date(h.ts).toLocaleString('ko-KR');
  document.getElementById('hist-modal-q').textContent=h.q;
  document.getElementById('hist-modal-a').innerHTML=renderMD(h.a);
  document.getElementById('hist-modal').classList.add('open');
}
function closeHistModal(){document.getElementById('hist-modal').classList.remove('open');}
function followUpFromHist(){
  closeHistModal();
  if(currentHistItem){
    document.getElementById('input').value='위 자문 내용과 관련하여 ';
    document.getElementById('input').focus();
  }
}
function clearHistory(){
  if(!confirm('질문 기록을 모두 삭제할까요?'))return;
  try{
    const raw=localStorage.getItem('vd_history');
    if(!raw){ renderHistory(); return; }
    const all=JSON.parse(raw);
    const next=Array.isArray(all)?all.filter(h=>h?.domainKey!==domain):[];
    localStorage.setItem('vd_history',JSON.stringify(next.slice(0,200)));
  }catch(e){
    /* ignore */
  }
  renderHistory();
}
document.getElementById('hist-modal').addEventListener('click',function(e){if(e.target===this)closeHistModal();});
function getConversationText(){
  const cfg=DOMAINS[domain];
  const date=new Date().toLocaleString('ko-KR');
  let txt=`Route01 AI 자문 기록\n`;
  txt+=`도메인: ${cfg.title}\n`;
  txt+=`날짜: ${date}\n`;
  if(profile.name||profile.industry) txt+=`스타트업: ${profile.name||profile.industry}\n`;
  txt+=`${'─'.repeat(50)}\n\n`;
  const msgs=document.querySelectorAll('#chat .message');
  msgs.forEach(m=>{
    const isAI=m.querySelector('.m-av.ai');
    const bubble=m.querySelector('.m-bubble');
    if(!bubble)return;
    const role=isAI?'Route01 AI':'창업자';
    txt+=`[${role}]\n${bubble.innerText}\n\n`;
  });
  return txt;
}

function selectDomain(btn,d){
  document.querySelectorAll('.d-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  domain=d;
  const cfg=DOMAINS[d];
  const dIco=document.getElementById('d-ico');
  if(dIco) dIco.innerHTML=domainIconHtml(d);
  document.getElementById('d-title').textContent=cfg.title;
  document.getElementById('d-desc').textContent=cfg.desc;
  messages=[];
  docsSentOnce=false;
  document.getElementById('chat').innerHTML='';
  /* popular-questions rendering removed */
  renderHistory(); // 도메인 변경 시 내 질문도 갱신
  updateHistoryDomainContext();
  showWelcome();
}

/* ─── 채팅 UI ──────────────────────── */
function showWelcome(){
  const cfg=DOMAINS[domain];
  const name=profile.name||profile.industry;
  const chat=document.getElementById('chat');
  const el=document.createElement('div');
  el.className='welcome';el.id='welcome-el';
  el.innerHTML=`
    <div class="w-title">${name?`안녕하세요, <em>${esc(name)}</em> 팀!`:`<span class="w-title-row"><span class="w-title-ico">${domainIconHtml(domain)}</span><span>${esc(cfg.title)}</span></span>`}</div>
    <div class="w-sub">${esc(profile.concern||'무엇이든 물어보세요. 전문 자문을 즉시 받아볼 수 있어요.')}</div>
    <div class="p-grid">
      ${Array.from({length:10}).map((_,i)=>`
        <button class="p-card" data-pidx="${i}">
          <div class="p-tag">${esc(cfg.title.split(' ')[0])}</div>
          <div class="p-text" style="opacity:.7">추천 질문 생성 중…</div>
        </button>`).join('')}
    </div>`;
  chat.appendChild(el); /* 먼저 DOM에 추가 */
  hydrateWelcomePrompts(el);
}
function rmWelcome(){const w=document.getElementById('welcome-el');if(w)w.remove();}

async function hydrateWelcomePrompts(rootEl){
  const cfg=DOMAINS[domain];
  const questions=getWelcomeQuestions(domain);
  const grid=rootEl?.querySelector('.p-grid');
  if(!grid) return;
  grid.innerHTML=questions.map((q,i)=>`
    <button class="p-card" data-pidx="${i}">
      <div class="p-tag">${esc(cfg.title.split(' ')[0])}</div>
      <div class="p-text">${esc(q)}</div>
    </button>`).join('');
  rootEl.querySelectorAll('[data-pidx]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const q=questions[+btn.dataset.pidx];
      if(q) quickAsk(q);
    });
  });
}

const SUGGEST_CACHE = new Map();
/* ─── 도메인별 추천 질문 Pool (20+ each) + 랜덤 10개 ─── */
const DOMAIN_QUESTION_POOLS = {
  strategy:[
    'PMF 검증을 위한 2주 실험 설계를 짜줘','TAM/SAM/SOM을 현실적으로 추정하는 방법은?','가격(프라이싱) 실험을 어떻게 설계할까?','경쟁사 대비 차별화 포인트를 한 문장으로 만들려면?',
    '우리의 moat(방어력)를 만드는 로드맵을 짜줘','초기 고객 세그먼트(ICP)를 어떻게 좁힐까?','피벗 판단 기준을 지표로 정의해줘','핵심 KPI 트리를 어떻게 구성할까?',
    'GTM 우선순위를 정하는 프레임은?','리텐션이 낮을 때 원인 가설 10가지는?','제품 스코프를 줄여야 할 때 기준은?','B2B vs B2C로 전환 시 체크리스트는?',
    '시장 진입 순서를 국가/채널 기준으로 짜줘','사업모델을 3가지 대안으로 재구성해줘','고객 인터뷰 질문 리스트를 만들어줘','우선순위 결정(RICE/ICE) 적용 예시를 들어줘',
    '유료 전환을 위해 가장 먼저 바꿀 요소는?','경쟁지도(2x2)로 포지셔닝을 잡아줘','구매 의사결정자 설득 논리는?','성장 병목을 찾는 진단 질문을 만들어줘',
    'OKR을 분기 단위로 세팅해줘','지표가 좋아 보이는데 매출이 안 나는 이유는?'
  ],
  investment:[
    '시드 IR 덱 10장 구성안을 만들어줘','투자자 미팅 단골 질문 15개는?','우리 단계 밸류에이션 범위는 어떻게 잡나?','SAFE/CB 핵심 조항 비교해줘',
    '청산우선권 협상 포인트는?','ESOP 풀을 언제·얼마나 잡아야 할까?','데이터룸 체크리스트를 만들어줘','트랙션이 약할 때 IR 스토리는?',
    '지표를 어떤 순서로 보여주면 설득력이 높아질까?','투자자 유형(VC/AC/전략/엔젤)별 접근법은?','프리머니/포스트머니 계산 예시로 설명해줘','리드 투자자 아웃리치 문구를 써줘',
    '후속 라운드까지 마일스톤을 어떻게 약속할까?','사업계획 vs IR 피치 차이는?','코호트 데이터 없을 때 대체 지표는?','단위경제가 안 나올 때 투자 설득 논리는?',
    '브리지 라운드 필요 상황 판단 기준은?','Use of Funds 템플릿 만들어줘','텀싯 레드플래그를 정리해줘','IR에서 경쟁사 비교를 안전하게 하는 법은?',
    '지분 희석 시나리오(3라운드) 예시를 만들어줘'
  ],
  finance:[
    '런웨이를 늘리기 위한 비용 절감 우선순위는?','Unit Economics 템플릿을 만들어줘','CAC/LTV 불안정할 때 재무모델은?','월별 현금흐름표 핵심 항목은?',
    'SaaS 매출 인식 기준을 정리해줘','법인세/부가세/원천세 체크리스트','투자금 회계처리 개요가 궁금해','정부지원사업 수입 관리 방법은?',
    '월 결산을 최소 인력으로 굴리는 방법은?','수금/매출 차이로 생기는 리스크는?','손익분기점(BEP) 계산 예시','가격 인상 영향 시뮬레이션은?',
    '인건비 구조를 고정/변동으로 설계해줘','혼합 모델(구독+일회성) 리포팅 구조','외주비/마케팅비 통제 규칙','세무조사 리스크 줄이는 습관은?',
    '재무 KPI 대시보드 항목 추천','매출채권 대응 프로세스','증빙/정산 표준을 만들어줘','예산 대비 편차 분석 방식은?',
    '성장률/마진 가정 검증 방법은?'
  ],
  marketing:[
    '초기 90일 마케팅 로드맵을 짜줘','채널 우선순위를 CAC 관점으로 정해줘','퍼널 지표 설계를 해줘','콘텐츠 주제 30개를 타깃별로 뽑아줘',
    'SEO로 첫 1,000 방문을 만드는 전략은?','B2B 리드 생성 캠페인 구조는?','PR 없이 언론 노출 얻는 방법은?','브랜드 포지셔닝 문장 3개 만들어줘',
    '온보딩 이메일/푸시 시퀀스 예시','리텐션 낮을 때 메시징 수정법','가격 페이지 카피 체크리스트','A/B 테스트 우선순위 10개 추천',
    '광고 크리에이티브 가설을 세워줘','ROAS 흔들릴 때 진단 순서','리퍼럴 프로그램 설계안','커뮤니티를 성장 채널로 쓰는 방법',
    '랜딩페이지 구조(히어로~CTA) 잡아줘','메시지-채널 핏 실험법','ASO 체크리스트','브랜딩 vs 퍼포먼스 균형',
    '경쟁사 광고/카피 분석 템플릿'
  ],
  sales:[
    '첫 B2B 고객 확보 2주 플랜','리드→미팅→POC→계약 파이프라인 설계','콜드메일/링크드인 템플릿','견적/가격 제안 구조를 잡아줘',
    'POC를 유료로 전환시키는 조건 설계','Discovery call 질문 15개','반대(Objection) 처리 문구','엔터프라이즈 계약 협상 체크',
    'SOW/계약 범위 정의를 어떻게?','채널 파트너십 구축 단계','리뉴얼/업셀 QBR 템플릿','리드 스코어링 기준',
    '복잡한 의사결정 구조 공략법','B2B 가격 모델 선택 기준','세일즈 KPI(활동/전환/수익)','세일즈-마케팅 SLA 구조',
    '대기업 보안/구매 절차 대응 체크리스트','제휴 제안서 목차','레퍼런스 고객 확보 전략','계약 사이클 길 때 현금흐름 대안',
    '산업별 ICP 정의 방법'
  ],
  hr:[
    '첫 채용(1~3명) 우선순위를 정해줘','JD 템플릿을 직무별로 만들어줘','면접 질문(역량/문화) 리스트','온보딩 2주 프로그램 설계',
    '초기 스타트업 평가·보상 체계','스톡옵션 부여 원칙(밴딩) 제안','공동창업자 역할/권한/기준 정리','근로계약서 놓치는 조항은?',
    '퇴사/해고 이슈 대응 프로세스','조직문화 원칙 5개 정의','리모트 근무 정책 최소 구성','성과 낮은 인력 개선 절차',
    '외주/프리랜서 vs 정규직 기준','급여/4대보험 체크리스트','핵심인재 리텐션 전략','조직 설계로 문제를 푸는 법',
    '레벨링 프레임 간단히 만들기','인건비 예산 통제','채용 채널 전략','옵션 행사/세금 유의점',
    'HR 최소 지표 세트'
  ],
  legal:[
    'NDA 핵심 조항과 사용 시점은?','서비스 이용약관 필수 항목은?','개인정보 처리방침 체크리스트','B2B 계약서 리스크 조항 Top 10',
    'IP 귀속을 명확히 하는 방법','오픈소스 라이선스 준수 체크','상표 출원 시기/범위','특허 vs 영업비밀 선택 기준',
    '개발 외주 계약 필수 조항','공동창업자 계약 필수 항목','투자 계약 법률 유의점','규제 리스크 점검 방법',
    '해외 진출 약관/개인정보 이슈','데이터 보안/책임 범위 계약 반영','분쟁 예방 문서화 표준','견적/제안서 법적 구속력 주의',
    '표시광고법 유의점','환불/해지 정책 설계','개인정보 유출 대응 플랜 초안','저작권 양도/사용허락 차이',
    'DPA 요구 대응 방법'
  ],
  grant:[
    '지원사업 평가기준에서 점수 큰 항목은?','사업계획서 목차별 증빙 체크리스트','시장/수요 분석을 설득력 있게 쓰는 법','인력·예산·일정(WBS) 현실적으로 짜기',
    'R&D 목표/성과지표 정의 방법','정량 지표가 약할 때 설득 논리','가점 항목 체크리스트','기술성/차별성 서술 흔한 실수',
    '사업화 전략(판로/마케팅) 작성법','리스크 관리 섹션 작성법','서면평가 요약(Executive Summary) 팁','발표평가(PT) 단골 질문',
    '지재권 계획을 어디까지 써야 하나요?','참여기관/외주 계획 정리법','인건비 산정 기준 맞추는 법','성과물(프로토타입/PoC) 구체화',
    '팀 역량 서술 템플릿','경쟁/대체기술 비교표 구성','사업비 집행(증빙) 주의점','협약/정산 단계 함정'
  ]
};

function shuffleCopy(arr){
  const a=[...arr];
  const rnd=(n)=>{
    try{
      const x=new Uint32Array(1);
      crypto.getRandomValues(x);
      return x[0]%n;
    }catch(e){
      return Math.floor(Math.random()*n);
    }
  };
  for(let i=a.length-1;i>0;i--){
    const j=rnd(i+1);
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

function getWelcomeQuestions(domainKey){
  const pool=DOMAIN_QUESTION_POOLS[domainKey] || [];
  if(pool.length>=10) return shuffleCopy(pool).slice(0,10);
  const cfg=DOMAINS[domainKey];
  const fallback=[...(cfg?.prompts||[]), ...pool,
    '지금 가장 먼저 검증해야 할 가정은 무엇인가요?',
    '이번 주에 실행할 수 있는 가장 작은 실험은 무엇인가요?',
    '핵심 KPI를 1~2개로 압축하면 무엇인가요?',
    '리스크 상위 3개와 완화 방안은?',
    '우선순위를 바꾸려면 어떤 기준이 필요할까요?',
    '다음 목표(투자/매출)를 현실적으로 설정하려면?'
  ].filter(Boolean);
  return shuffleCopy(fallback).slice(0,10);
}
async function getAiSuggestedQuestions(domainKey){
  const cfg=DOMAINS[domainKey];
  const cacheKey=domainKey+'::'+(profile?.industry||'')+'::'+(profile?.stage||'')+'::'+(profile?.style||'');
  if(SUGGEST_CACHE.has(cacheKey)) return SUGGEST_CACHE.get(cacheKey);

  const fallback=(cfg?.prompts||[]).length?[
    ...(cfg.prompts||[]),
    '지금 가장 먼저 검증해야 할 가정은 무엇인가요?',
    '이번 주에 실행할 수 있는 가장 작은 실험은 무엇인가요?',
    '핵심 KPI를 1~2개로 압축하면 무엇인가요?',
    '리스크 상위 3개와 완화 방안은?',
    '우선순위를 바꾸려면 어떤 기준이 필요할까요?',
    '다음 투자/매출 목표를 현실적으로 설정하려면?'
  ].slice(0,10):Array.from({length:10},(_,i)=>`추천 질문 ${i+1}`);

  if(!API_KEY){
    SUGGEST_CACHE.set(cacheKey,fallback);
    return fallback;
  }

  try{
    const sys=`당신은 스타트업 자문가입니다. 아래 도메인에 맞는 '사용자가 바로 클릭해 질문할 수 있는' 질문 10개를 생성하세요.\n\n도메인: ${cfg.title}\n설명: ${cfg.desc}\n\n요구사항:\n- 한국어\n- 각 질문은 18~40자 내외로 간결\n- 서로 중복 없이 다양하게\n- 출력은 JSON 배열(문자열 10개)만`;
    const userCtx=[
      profile?.industry?`업종/서비스: ${profile.industry}`:null,
      profile?.stage?`단계: ${profile.stage}`:null,
      profile?.team?`팀: ${profile.team}`:null,
      profile?.mrr?`월 매출: ${profile.mrr}`:null,
      profile?.concern?`핵심 고민: ${profile.concern}`:null,
      profile?.style?`멘토 스타일: ${profile.style}`:null
    ].filter(Boolean).join('\n');

    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'x-api-key':apiKey(),
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      },
      body:JSON.stringify({
        model:(await resolveModelId('haiku')) || 'claude-3-5-haiku-20241022',
        max_tokens:380,
        stream:false,
        system:sys,
        messages:[{role:'user',content:userCtx||'정보 없음'}]
      })
    });
    if(!res.ok) throw new Error('suggest failed');
    const j=await res.json();
    const txt=(j?.content||[]).filter(c=>c?.type==='text').map(c=>c.text).join('').trim();
    const arr=JSON.parse(txt);
    const cleaned=Array.isArray(arr)?arr.map(s=>String(s).trim()).filter(Boolean).slice(0,10):fallback;
    const final=cleaned.length===10?cleaned:[...cleaned,...fallback].slice(0,10);
    SUGGEST_CACHE.set(cacheKey,final);
    return final;
  }catch(e){
    SUGGEST_CACHE.set(cacheKey,fallback);
    return fallback;
  }
}

function addMsg(role,text,files,aiLabel){
  rmWelcome();
  const chat=document.getElementById('chat');
  const el=document.createElement('div');
  el.className='message';
  const cfg=DOMAINS[domain];
  const uname=profile.name||'창업자';
  const aiHead=aiLabel?String(aiLabel):cfg.title;
  if(role==='ai'){
    const id='a'+Date.now()+Math.random().toString(36).slice(2);
    const safe=text||'';
    ANSWER_RAW.set(id, safe);
    const cr=document.getElementById('chat-res');
    if(cr){
      cr.setAttribute('data-for-export',id);
      cr.innerHTML=renderMD(safe);
    }
    el.innerHTML=`<div class="m-av ai"><img class="m-av-logo" src="./logo.png" width="22" height="22" alt=""/></div><div class="m-body"><div class="m-name">Route01 AI · ${esc(aiHead)}</div><div class="report-card"><div class="m-bubble report-bubble" data-answer-id="${id}" data-raw="${esc(safe)}">${renderMD(safe)}</div>${renderAnswerActions(id)}</div></div>`;
  } else {
    const fileHtml=(files&&files.length)?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:7px">${files.map(f=>`<span style="display:inline-flex;align-items:center;gap:4px;background:#f5f5f7;border:1px solid #d2d2d7;border-radius:20px;padding:2px 9px;font-size:11px;color:#1d1d1f;font-weight:500">${getIcon(f.name)} ${f.name}</span>`).join('')}</div>`:'';
    el.innerHTML=`<div class="m-av user">${uname.slice(0,2).toUpperCase()}</div><div class="m-body"><div class="m-name" style="text-align:right">${uname}</div><div class="m-bubble u">${fileHtml}${esc(text)}</div></div>`;
  }
  chat.appendChild(el);
  chat.scrollTop=chat.scrollHeight;
}
function showLoad(){
  const chat=document.getElementById('chat');
  const el=document.createElement('div');
  el.className='message';el.id='load-msg';
  el.innerHTML=`<div class="m-av ai"><img class="m-av-logo" src="./logo.png" width="22" height="22" alt=""/></div><div class="m-body"><div class="m-name">Route01 AI · 분석 중</div><div class="m-bubble"><div class="dots"><span></span><span></span><span></span></div></div></div>`;
  chat.appendChild(el);
  chat.scrollTop=chat.scrollHeight;
}
function hideLoad(){const e=document.getElementById('load-msg');if(e)e.remove();}

/* fmt() kept for backward compatibility (use renderMD instead) */
function fmt(md){return renderMD(md);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ─── 시스템 프롬프트 (Expert Mode) ─── */
function buildDomainScopeLines(){
  return Object.entries(DOMAINS).map(([key,v])=>`- **${key}** → 표시명: 「${v.title}」 / 범위 요약: ${v.desc}`).join('\n');
}

function buildSys(){
  const domKey=(domain && DOMAINS[domain])?domain:'strategy';
  const cfg=DOMAINS[domKey];
  const persona=DOMAIN_EXPERT_PERSONAS[domKey]||DOMAIN_EXPERT_PERSONAS.strategy;
  const styleGuide = MENTOR_STYLES[profile.style] || MENTOR_STYLES['YC 파트너식 직설'];
  const scopeTable=buildDomainScopeLines();

  let sys=`당신은 한국·실리콘밸리 스타트업 생태계를 깊이 아는 **Route01 Expert Mode** 자문 엔진이다.
현재 세션에서 사용자가 선택한 자문 도메인 키는 **${domKey}**이며, 표시명은 「${cfg.title}」이다.

${persona}

[도메인 기본 역할 요약]
${cfg.sys}

[멘토링 스타일: ${profile.style||'YC 파트너식 직설'}]
${styleGuide}

[도메인 맵 — 적합성 판단용]
아래는 앱 내 자문 모드 목록이다. 질문이 다른 모드에 훨씬 잘 맞는지 판단할 때만 사용한다.
${scopeTable}
`;
  if(profile.industry){
    sys+=`
[상담 스타트업 프로필]
- 업종/서비스: ${profile.industry}
- 단계: ${profile.stage}
- 팀: ${profile.team}
${profile.mrr?`- 월 매출: ${profile.mrr}`:''}
${profile.name?`- 이름: ${profile.name}`:''}
${profile.concern?`- 핵심 고민: ${profile.concern}`:''}

이 스타트업의 상황에 맞는 구체적 조언을 하세요. 일반론 금지.
`;
  }
  if(uploadedDocs.filter(f=>f.status==='ok').length){
    const names=uploadedDocs.filter(f=>f.status==='ok').map(f=>f.name).join(', ');
    sys+=`\n[업로드된 회사 자료]\n창업자가 다음 문서를 제공했습니다: ${names}\n첨부 자료를 적극 참조하여 구체적인 맞춤 자문을 제공하세요.\n`;
  }
  sys+=`
[가드레일 — 범위 외 질문 처리]
- 너는 스타트업 전문 자문역 'Route01'이다.
- 사용자의 질문이 스타트업 창업, 경영, 투자, 비즈니스 모델과 관련 없으면, 아래 문구로 정중히 거절하고 도메인 질문으로 유도하라:
"죄송하지만 저는 스타트업 자문에 특화된 AI입니다. 관련 고민을 말씀해 주시면 최선을 다해 돕겠습니다."
- 거절 후에는 사용자가 바로 이어서 질문할 수 있도록, 자문 가능한 분야 예시 3~6개를 짧게 제시하라. (예: BM 고도화, IR 피드백, 시장 분석, 경쟁사 분석, KPI 설계, 투자 전략)

[도메인 적합성 — 내부 절차]
- 응답을 쓰기 **전에** 질문의 핵심 의도가 현재 모드 「${cfg.title}」에 부합하는지 **내부적으로만** 판단하라.
- 판단 과정, 추론 단계, 체크리스트, JSON, "먼저 판단했다" 같은 메타 표현은 **절대 사용자에게 출력하지 마라.**
- 아래 조건을 **모두** 만족할 때에만, 답변 **본문의 맨 앞 첫 문단**에 안내 문장을 넣는다:
  (1) 질문의 주제가 [도메인 맵]상 **다른 단일 모드**에 명확히 더 가깝고,
  (2) 현재 모드로 답하면 전문성·정확도가 뚜렷이 떨어질 것이며,
  (3) 단순히 배경 지식이 겹치는 수준이 아니다.
- 그 첫 문단에는 반드시 아래 한 문장만 사용한다(따옴표 없이 그대로 출력). **[OO]** 자리에는 [도메인 맵]에서 고른 모드의 **표시명 전체**(예: 투자 / IR 자문)를 넣는다.
해당 질문은 [OO] 도메인에 더 적합해 보입니다. 더 전문적인 자문을 위해 도메인 전환을 추천드리며, 현재 모드에서의 관점으로 답변해 드립니다.
- 위 안내 문단 다음에는 **빈 줄 한 줄**을 넣은 뒤, 아래 [답변 구조]를 따른 본론을 시작한다.
- 현재 모드로도 충분히 전문적으로 답할 수 있거나, 복합 주제·경계선 주제면 위 안내 문단은 **생략**한다.

[답변 구조 — 필수]
- 마크다운으로 아래 **섹션 제목을 정확히** 사용한다(짧은 답변이라도 헤더는 유지).
## Executive Summary
3~6문장. 핵심 결론·권고·우선순위만. 경영진이 스캔해도 이해되게.
## 근거 및 맥락
왜 그런지: 수치·가정·프레임워크·벤치마크·비교 사례. 추정은 가정을 명시.
## 실행 방안 (Action Plan)
즉시 실행 가능한 단계(우선순위, 검증 방법, 담당 역할이 분명하면 명시, 가능하면 주·2주 단위 마일스톤 감으로 제시).
- "~할 수 있습니다" 대신 "~하세요" 등 직접적 톤을 유지한다.
- Action Plan에 이미 다음 단계가 포함되므로, 본문 안에서 불필요한 반복 서술은 줄인다.

[보내기 구분 규칙 — 필수]
- 위 [답변 구조]의 본문(Executive Summary ~ Action Plan)을 모두 마친 뒤에만, 사용자를 위한 부가 문구를 쓸 수 있다. 부가 문구란: 추천 질문·핵심 체크포인트·한 줄 요약·"궁금하면 물어보세요" 등 대화 유도·CTA·잡담에 가까운 문장을 모두 포함한다.
- 부가 문구는 반드시 아래 구분선 "바로 다음 줄"부터 시작한다. 구분선 앞(본문)에는 아래 문자열을 절대 넣지 마라(부분 일치·코드블록·인용 안에도 금지).
- 구분선은 한 줄에 아래 문자열만 단독으로 출력한다(앞뒤 공백·따옴표·백틱 없이).
<<<NACHIM_TAIL>>>
`;
  return sys;
}

/* ─── 메시지 전송 ──────────────────── */
async function send(){
  if(busy)return;
  const el=document.getElementById('input');
  const t=el.value.trim();
  if(!t)return;
  const mismatch=detectDomainMismatch(t, domain);
  if(mismatch){
    showDomainBanner(t, mismatch);
    return;
  }
  hideDomainBanner();
  el.value='';resize(el);
  await doSend(t);
}
async function quickAsk(t){if(!busy)await doSend(t);}

async function doSend(text){
  busy=true;
  document.getElementById('send-btn').disabled=true;
  const filesToSend=[...chatPendingFiles];
  chatPendingFiles=[];
  renderChatFiles();

  addMsg('user',text,filesToSend);
  const userContent=buildUserContent(text,filesToSend);
  messages.push({role:'user',content:userContent});
  /* popular-questions logging removed */
  showLoad();

  if(!API_KEY){
    await new Promise(r=>setTimeout(r,300));
    hideLoad();
    addMsg('ai','**API 키가 설정되지 않았습니다.**\n\n헤더 오른쪽 **API 키 설정** 버튼을 클릭해서 키를 입력해주세요.\n\n**발급:** console.anthropic.com → API Keys → Create Key');
    busy=false;document.getElementById('send-btn').disabled=false;return;
  }

  try{
    const model=(await resolveModelId('sonnet')) || 'claude-3-5-sonnet-20241022';
    const system=buildSys();

    const extractText=(j)=> (j?.content||[]).filter(c=>c?.type==='text'&&typeof c?.text==='string').map(c=>c.text).join('');

    const callOnce=async (msgs, maxTokens)=>{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{
          'Content-Type':'application/json',
          'x-api-key':apiKey(),
          'anthropic-version':'2023-06-01',
          'anthropic-dangerous-direct-browser-access':'true'
        },
        body:JSON.stringify({
          model,
          max_tokens:maxTokens,
          stream:false,
          system,
          messages:msgs
        })
      });
      if(!res.ok){
        let errMsg='API 오류가 발생했습니다.';
        try{const jj=await res.json();errMsg=jj.error?.message||errMsg;}catch(e){}
        throw new Error(errMsg);
      }
      return await res.json();
    };

    /* try to avoid truncation, then auto-continue if still cut */
    let convo=messages.slice(-10); /* keep a bit more context for continuation */
    let fullTextAll='';
    let stopReason='';
    let j=null;

    for(let turn=0;turn<4;turn++){
      const maxTokens=2200;
      j=await callOnce(convo, maxTokens);
      const part=extractText(j);
      if(part) fullTextAll+=part;
      stopReason=String(j?.stop_reason||'');
      if(stopReason!=='max_tokens') break;
      /* continue: feed partial assistant + explicit continue user prompt */
      convo=[...convo, {role:'assistant',content:part}, {role:'user',content:'계속해서 바로 이어서 답변을 작성해줘. 이전 내용을 반복하지 말고, 중간에 끊긴 지점부터 이어서.'}];
    }

    hideLoad();
    const finalText=(fullTextAll||'').trim();
    if(finalText){
      addMsg('ai',finalText);
      messages.push({role:'assistant',content:finalText});
      saveHistory(text,finalText,DOMAINS[domain].title);
    } else {
      addMsg('ai','응답을 받지 못했습니다.');
    }

  }catch(e){
    hideLoad();
    addMsg('ai',`오류: ${e.message||'연결을 확인해주세요.'}`);
  }
  busy=false;
  const sb=document.getElementById('send-btn');
  if(sb) sb.disabled=false;
  const inp=document.getElementById('input');
  if(inp){inp.disabled=false;inp.readOnly=false;inp.focus();}
}

/* (streaming disabled) */

function renderAnswerActions(id){
  return `<div class="answer-actions" data-actions-for="${id}">
    <button class="a-act" onclick="copyAnswer('${id}',this)">복사</button>
    <button class="a-act gold" onclick="void exportAnswer('docx','${id}',this)">내보내기 (DOCX)</button>
    <button class="a-act gold" onclick="void exportAnswer('pdf','${id}',this)">내보내기 (PDF)</button>
  </div>`;
}

const ANSWER_RAW = new Map();

let MODEL_CACHE = {sonnet:null, haiku:null, ts:0};
async function resolveModelId(family){
  const fam=String(family||'').toLowerCase();
  const now=Date.now();
  if(MODEL_CACHE[fam] && (now-(MODEL_CACHE.ts||0))<6*60*60*1000) return MODEL_CACHE[fam];
  try{
    const res=await fetch('https://api.anthropic.com/v1/models?limit=50',{
      method:'GET',
      headers:{
        'x-api-key':apiKey(),
        'anthropic-version':'2023-06-01',
        'anthropic-dangerous-direct-browser-access':'true'
      }
    });
    if(!res.ok) throw new Error('models api failed');
    const j=await res.json();
    const ids=(j?.data||[]).map(m=>m?.id).filter(Boolean);
    const pick=(substr)=> ids.find(id=>String(id).toLowerCase().includes(substr));
    const son=pick('sonnet');
    const hai=pick('haiku');
    MODEL_CACHE={sonnet:son||null, haiku:hai||null, ts:now};
    return MODEL_CACHE[fam];
  }catch(e){
    return null;
  }
}

/* 섹션(소제목)마다 목록이 끊기면 marked가 <p>3. …</p> 로만 넣는 경우가 있어 번호가 본문색·들여쓰기가 달라짐 → 연속 번호 단락을 <ol start>로 합침 */
function normalizeParagraphOrderedLists(html){
  try{
    const doc=new DOMParser().parseFromString(`<div id="__npl">${html}</div>`,'text/html');
    const root=doc.getElementById('__npl');
    if(!root) return html;
    function shouldSkipP(p){
      if(p.closest('li')) return true;
      if(p.closest('td')||p.closest('th')) return true;
      if(p.closest('pre')) return true;
      return false;
    }
    function stripLeadingOrderedLabel(p, li){
      const clone=p.cloneNode(true);
      const walk=n=>{
        if(n.nodeType===3){
          const v=n.nodeValue||'';
          const m=v.replace(/^\u00a0/g,' ').match(/^(\s*)(\d{1,3}\.\s+)([\s\S]*)$/);
          if(m){
            n.nodeValue=m[1]+m[3];
            return true;
          }
        }
        if(n.nodeType===1){
          for(const c of [...n.childNodes]){
            if(walk(c)) return true;
          }
        }
        return false;
      };
      walk(clone);
      li.innerHTML=clone.innerHTML;
    }
    function processParent(parent){
      let i=0;
      while(i<parent.children.length){
        const el=parent.children[i];
        if(el.tagName==='BLOCKQUOTE'){
          processParent(el);
          i++;
          continue;
        }
        if(el.tagName!=='P'||shouldSkipP(el)){
          i++;
          continue;
        }
        const t1=(el.textContent||'').replace(/\u00a0/g,' ').trim();
        const m1=t1.match(/^(\d{1,3})\.\s+/);
        if(!m1){
          i++;
          continue;
        }
        const start=parseInt(m1[1],10);
        const group=[el];
        let k=i+1;
        while(k<parent.children.length){
          const el2=parent.children[k];
          if(el2.tagName!=='P'||shouldSkipP(el2)) break;
          const t2=(el2.textContent||'').replace(/\u00a0/g,' ').trim();
          const m2=t2.match(/^(\d{1,3})\.\s+/);
          if(!m2) break;
          if(parseInt(m2[1],10)!==start+group.length) break;
          group.push(el2);
          k++;
        }
        const ol=doc.createElement('ol');
        /* 새 목록은 항상 1번부터 */
        group.forEach(p=>{
          const li=doc.createElement('li');
          stripLeadingOrderedLabel(p,li);
          ol.appendChild(li);
        });
        parent.insertBefore(ol,group[0]);
        group.forEach(p=>p.remove());
        i++;
      }
    }
    processParent(root);
    return root.innerHTML;
  }catch(e){
    return html;
  }
}

/* loose list(li>p)는 브라우저마다 마커·본문 간격이 달라 보임 — p가 하나뿐이면 풀어 tight list로 */
function unwrapListItemSingleParagraph(html){
  try{
    const doc=new DOMParser().parseFromString(`<div id="__ulp">${html}</div>`,'text/html');
    const root=doc.getElementById('__ulp');
    if(!root) return html;
    root.querySelectorAll('ol > li > p:only-child, ul > li > p:only-child').forEach(p=>{
      const li=p.parentNode;
      if(!li) return;
      while(p.firstChild) li.insertBefore(p.firstChild,p);
      p.remove();
    });
    return root.innerHTML;
  }catch(e){
    return html;
  }
}

/* 이미 DOM에 박힌 옛 HTML은 자동 갱신 안 됨 — 원문(data-raw / ANSWER_RAW)으로 다시 renderMD */
function refreshAllReportBubbleMarkdown(){
  document.querySelectorAll('.report-bubble[data-answer-id]').forEach(el=>{
    const id=el.getAttribute('data-answer-id');
    if(!id) return;
    const raw=getAnswerRaw(id);
    if(!String(raw||'').trim()) return;
    el.innerHTML=renderMD(raw);
  });
  const cr=document.getElementById('chat-res');
  const fid=cr&&cr.getAttribute('data-for-export');
  if(fid){
    const t=getAnswerRaw(fid);
    if(String(t||'').trim()) cr.innerHTML=renderMD(t);
  }
}

function renderMD(md){
  const src=preprocessMarkdown(String(md||''));
  if(window.marked && typeof marked.parse==='function'){
    marked.setOptions({gfm:true,breaks:true,headerIds:false,mangle:false});
    let html=marked.parse(src);
    html=normalizeParagraphOrderedLists(html);
    html=unwrapListItemSingleParagraph(html);
    return html;
  }
  return renderMDFallback(src);
}

/* marked GFM 취소선: 스펙은 ~~ 이지만 구현에 따라 단일 ~ 짝도 매칭되어
   "1억~3억 / 지분 5~10%" 처럼 범위 표기만으로 중간이 <del> 처리됨.
   본문의 ASCII ~(U+007E)를 전각 ~(U+FF5E)로 바꾸면 토큰이 되지 않고 화면에는 거의 동일. ``` 코드펜스 안은 유지 */
function neutralizeAsciiTildesOutsideCodeFences(md){
  const chunks=String(md||'').split(/(```[\s\S]*?```)/g);
  return chunks.map((chunk,i)=>{
    if(i%2===1) return chunk;
    return chunk.replace(/\u007e/g,'\uff5e');
  }).join('');
}

/* `**3. 제목**나머지` 처럼 번호가 굵게로 감싸이면 목록이 아니라 <p>로만 파싱됨 → `3. **제목**나머지` 로 바꿔 번호 목록으로 인식 */
function fixBoldWrappedOrderedListLines(md){
  const chunks=String(md||'').split(/(```[\s\S]*?```)/g);
  return chunks.map((chunk,i)=>{
    if(i%2===1) return chunk;
    return chunk.replace(/^(\s*)\*\*(\d{1,3}\.\s+)((?:[^*]|\*(?!\*))+?)\*\*([\s\S]*)$/gm,(m,sp,num,emb,rest)=>{
      const tail=rest||'';
      return `${sp}${num}**${emb}**${tail}`;
    });
  }).join('');
}

function preprocessMarkdown(src){
  let s=String(src||'');
  s=neutralizeAsciiTildesOutsideCodeFences(s);
  s=fixBoldWrappedOrderedListLines(s);
  /* 모델 구분선: 채팅 UI에는 HR로 표시(내보내기에서는 prepareMarkdownForExport에서 삭제됨) */
  s=s.replace(/^\s*<<<NACHIM_TAIL>>>\s*$/gm,'\n<hr class="nachim-hr">\n');
  /* If a code fence contains only a markdown table, unwrap it (tables should not render as code). */
  s=s.replace(/```(?:\w+)?\n([\s\S]*?)\n```/g,(m,inner)=>{
    const t=String(inner||'').trim();
    const lines=t.split('\n').map(x=>x.trim());
    if(lines.length>=2 && /\|/.test(lines[0]) && /^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(lines[1])){
      return `\n${t}\n`;
    }
    return m;
  });
  return s;
}

function renderMDFallback(src){
  const escHtml = (s)=>String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  /* minimal: tables + lists + paragraphs (so |---| never shows raw) */
  const lines=String(src||'').split('\n');
  const out=[];
  const isRow=(s)=>/\|/.test(s);
  const isSep=(s)=>/^\s*\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?\s*$/.test(s||'');
  for(let i=0;i<lines.length;i++){
    const a=lines[i];
    const b=lines[i+1];
    if(isRow(a) && isSep(b)){
      const parseRow=(s)=>s.trim().replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      const head=parseRow(a);
      const rows=[];
      i+=2;
      while(i<lines.length && isRow(lines[i]) && lines[i].trim()!==''){rows.push(parseRow(lines[i]));i++;}
      i--;
      const cols=Math.max(head.length,...rows.map(r=>r.length));
      const norm=(r)=>Array.from({length:cols},(_,k)=>escHtml((r[k]??'').trim()));
      out.push(
        `<table><thead><tr>${norm(head).map(c=>`<th>${c}</th>`).join('')}</tr></thead>`+
        `<tbody>${rows.map(r=>`<tr>${norm(r).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
      );
      continue;
    }

    const m=a.match(/^\s*[-*]\s+(.+)$/);
    if(m){
      const items=[escHtml(m[1])];
      while(i+1<lines.length){
        const n=lines[i+1].match(/^\s*[-*]\s+(.+)$/);
        if(!n) break;
        items.push(escHtml(n[1]));
        i++;
      }
      out.push(`<ul>${items.map(t=>`<li>${t}</li>`).join('')}</ul>`);
      continue;
    }

    out.push(a);
  }

  return out
    .join('\n')
    .split(/\n{2,}/)
    .map(p=>p.trim())
    .filter(Boolean)
    .map(p=>{
      if(/^<(table|ul|ol|pre|h1|h2|h3|blockquote)\b/i.test(p)) return p;
      return `<p>${escHtml(p).replace(/\n/g,'<br>')}</p>`;
    })
    .join('');
}

function getAnswerRaw(id){
  if(ANSWER_RAW.has(id)) return ANSWER_RAW.get(id) || '';
  const el=document.querySelector(`[data-answer-id="${id}"]`);
  if(!el) return '';
  const rawAttr=el.getAttribute('data-raw');
  if(rawAttr){
    const ta=document.createElement('textarea');
    ta.innerHTML=rawAttr;
    return ta.value;
  }
  return el.innerText || '';
}

async function copyAnswer(id, btn){
  const t=getAnswerRaw(id).trim();
  if(!t) return;
  try{
    await navigator.clipboard.writeText(t);
    if(btn){
      const prev=btn.textContent;
      btn.textContent='복사됨';
      setTimeout(()=>btn.textContent=prev,900);
    }
  }catch(e){
    /* fallback */
    const ta=document.createElement('textarea');
    ta.value=t;
    ta.style.position='fixed';
    ta.style.left='-9999px';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
}

/* 내보내기 메타에 쓰는 표시명: 온보딩 「이름/명칭」(회사·팀)만 — 업종/서비스 설명(industry)은 자동 표기하지 않음 */
function exportProfileLabel(){
  return String(profile?.name||'').trim();
}
function buildExportMetaLine(){
  const d=new Date().toLocaleString('ko-KR');
  const lab=exportProfileLabel();
  return lab?`${d} · ${lab}`:d;
}

/*보내기(DOCX/PDF) 공통 HTML — Word altChunk / 인쇄 미리보기 겸용 */
const EXPORT_DOC_STYLES=`body{font-family:system-ui,-apple-system,"Segoe UI","Malgun Gothic","맑은 고딕",Arial,sans-serif;font-size:14px;line-height:1.65;margin:0;background:#f5f5f7;color:#1d1d1f}
.page{padding:2cm}
.card{background:#fff;border:none;border-radius:18px;padding:22px 24px;box-shadow:none}
.title{font-size:18px;color:#1d1d1f;margin:0 0 6px;font-weight:700;letter-spacing:-.03em}
.meta{font-size:13px;color:#6e6e73;margin:0 0 14px}
.content{max-width:100%}
p{margin:0 0 14px}
strong{font-weight:700;color:#1d1d1f}
ul,ol{margin:8px 0 14px;padding-left:20px}
li{margin-bottom:6px}
/* 채팅 .m-bubble blockquote 와 동일: 파란 액센트 + 연회색 배경 */
blockquote{margin:14px 0;padding:12px 14px;border-left:3px solid #0071e3;background:#f5f5f7;border-radius:0 8px 8px 0;color:#424245;font-size:13.5px;line-height:1.47;-webkit-print-color-adjust:exact;print-color-adjust:exact}
blockquote p{margin:0 0 8px;color:#424245}
blockquote p:last-child{margin-bottom:0}
table{width:100%;border-collapse:collapse;border:1px solid #d2d2d7;margin:14px 0;border-radius:12px;overflow:hidden}
th,td{border:1px solid #e8e8ed;padding:5px 9px;vertical-align:top;line-height:1.4}
thead th{background:#000;color:#fff;font-size:12px;font-weight:650;text-align:center;white-space:nowrap}
tbody td{border-bottom:1px solid #e8e8ed}
tbody tr:last-child td{border-bottom:none}
tbody tr:nth-child(even) td{background:#f5f5f7}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;font-style:italic;font-size:0.95em;font-weight:400;background:#f5f5f7;padding:1px 6px;border-radius:8px;border:1px solid #e8e8ed;color:#1d1d1f}
pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;font-size:14px;font-style:italic;line-height:1.75;background:#f5f5f7;color:#1d1d1f;border-radius:10px;padding:12px 14px;overflow:auto;border:1px solid #d2d2d7}
pre code{font-family:inherit;font-style:italic;font-size:inherit;font-weight:400;background:transparent;border:none;padding:0;color:inherit}`;

function buildExportDocumentHtml(title,meta,bodyHtml,extraCss){
  const x=extraCss?String(extraCss):'';
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${EXPORT_DOC_STYLES}${x}</style></head><body><div class="page"><div class="card"><div class="title">${esc(title)}</div><div class="meta">${esc(meta)}</div><div class="content">${bodyHtml}</div></div></div></body></html>`;
}

/* Word altChunk: style 속성에 남은 border-left / mso-border-* 는 목록·중첩 태그에만 번지며 세로선(색 깨짐)으로 보일 수 있음 */
function wordStripProblematicBordersFromStyle(st){
  return String(st||'')
    .replace(/\bborder-left(-[a-z-]+)?\s*:[^;]+;?/gi,'')
    .replace(/\bmso-border-left[a-z-]*\s*:[^;]+;?/gi,'')
    .replace(/\bmso-border-between\s*:[^;]+;?/gi,'')
    .replace(/;\s*;/g,';')
    .replace(/^;|;$/g,'')
    .trim();
}
const WORD_EXPORT_NO_LEFT_BORDER='border-left:none !important;border-left-width:0 !important;mso-border-left-alt:none !important;mso-border-left-width:0pt !important;';

/* Word altChunk(HTML)에서 스타일 유지용: Word가 잘 인식하는 Mso 스타일 + 인라인 스타일 보강 */
function buildWordDocHtml(title, meta, bodyHtml, cssText){
  const safeCss=String(cssText||'');
  let html=String(bodyHtml||'');
  html=html
    .replace(/<script\b[\s\S]*?>[\s\S]*?<\/script>/gi,'')
    .replace(/\son\w+=(?:"[^"]*"|'[^']*')/gi,'');

  /* Inline-fix tables for Word (패딩 과다 시 행 높이만 커짐) */
  html=html
    .replace(/<table\b([^>]*)>/gi,'<table$1 style="border-collapse:collapse;width:100%;border:1px solid #d2d2d7;margin:10px 0;">')
    .replace(/<th\b([^>]*)>/gi,'<th$1 style="border:1px solid #d2d2d7;padding:4px 7px;background:#000000;color:#ffffff;text-align:center;font-size:10.5pt;font-weight:700;line-height:1.35;">')
    .replace(/<td\b([^>]*)>/gi,'<td$1 style="border:1px solid #d2d2d7;padding:4px 7px;vertical-align:top;font-size:10.5pt;line-height:1.35;">');

  /* 표 헤더 정렬 규칙:
     - "컬럼 헤더"(th가 여러 개) → 가운데 정렬
     - "섹션 타이틀"(헤더 행에 th가 1개만 존재) → 좌측 정렬
     (핵심포인트/추천질문 등 라벨이 바뀌어도 안정적으로 동작) */
  try{
    const pdoc=new DOMParser().parseFromString(`<div id="__w__">${html}</div>`,'text/html');
    const root=pdoc.getElementById('__w__');
    if(root){
      const tables=[...root.querySelectorAll('table')];
      tables.forEach(t=>{
        const headerRow=t.querySelector('thead tr') || t.querySelector('tr');
        if(!headerRow) return;
        const ths=[...headerRow.querySelectorAll('th')];
        if(!ths.length) return;
        const isSectionTitle = ths.length===1;
        ths.forEach(th=>{
          const prev=th.getAttribute('style')||'';
          const cleaned=prev.replace(/text-align\s*:\s*(left|center|right)\s*;?/ig,'').trim();
          th.setAttribute('style', `${cleaned}${cleaned?';':''}text-align:${isSectionTitle?'left':'center'};`);
        });
      });
      /* blockquote → 2열 테이블: Word는 border-left+배경이 어긋나 흰 간격이 생기므로 파란 띠를 별도 셀로 붙임 */
      [...root.querySelectorAll('blockquote')].forEach(bq=>{
        const table=pdoc.createElement('table');
        table.className='nachim-export-callout';
        table.setAttribute('style','border-collapse:collapse;width:100%;margin:10pt 0;border:none;mso-cellspacing:0;mso-padding-alt:0');
        const tr=pdoc.createElement('tr');
        const tdBar=pdoc.createElement('td');
        tdBar.setAttribute('style','width:3px;min-width:3px;background:#0071e3;padding:0;border:none;font-size:0;line-height:0;');
        tdBar.appendChild(pdoc.createTextNode('\u00a0'));
        const tdBody=pdoc.createElement('td');
        tdBody.setAttribute('style','background:#f5f5f7;padding:10pt 12pt;border:none;vertical-align:top;color:#424245;font-size:10.5pt;line-height:1.47;border-radius:0 6pt 6pt 0;');
        while(bq.firstChild) tdBody.appendChild(bq.firstChild);
        const ps=[...tdBody.querySelectorAll(':scope > p')];
        ps.forEach((p,idx)=>{
          const pm=idx===ps.length-1?'margin:0':'margin:0 0 6pt 0';
          const ps0=(p.getAttribute('style')||'').trim();
          p.setAttribute('style',ps0?`${ps0};${pm}`:pm);
        });
        tr.appendChild(tdBar);
        tr.appendChild(tdBody);
        table.appendChild(tr);
        bq.parentNode.replaceChild(table, bq);
      });

      /* code/pre 스타일은 Word가 <style>을 무시하는 경우가 있어 인라인로 강제(애플 리포트 톤: 여백+모노 폰트) */
      const inlinePreStyle=[
        'margin:0 0 12pt 0',
        'padding:10pt 12pt',
        'background:#f5f5f7',
        'color:#1d1d1f',
        'border:1px solid #d2d2d7',
        'font-family:Consolas,Menlo,monospace',
        'font-size:10.5pt',
        'line-height:1.55',
        'mso-line-height-rule:exactly',
        'white-space:pre-wrap',
        'word-break:break-word'
      ].join(';');
      const inlinePreCodeStyle=[
        'background:transparent',
        'border:none',
        'padding:0',
        'color:inherit',
        'font-family:Consolas,Menlo,monospace',
        'font-size:10.5pt',
        'line-height:1.55',
        'white-space:pre-wrap'
      ].join(';');
      const inlineCodeStyle=[
        'font-family:Consolas,Menlo,monospace',
        'font-size:10.5pt',
        'background:#f5f5f7',
        'border:1px solid #d2d2d7',
        'padding:1pt 4pt',
        'color:#1d1d1f'
      ].join(';');

      [...root.querySelectorAll('pre')].forEach(pre=>{
        const prev=(pre.getAttribute('style')||'').trim();
        pre.setAttribute('style', prev?`${prev};${inlinePreStyle}`:inlinePreStyle);
      });
      [...root.querySelectorAll('pre code')].forEach(code=>{
        const prev=(code.getAttribute('style')||'').trim();
        code.setAttribute('style', prev?`${prev};${inlinePreCodeStyle}`:inlinePreCodeStyle);
      });
      [...root.querySelectorAll('code:not(pre code)')].forEach(code=>{
        const prev=(code.getAttribute('style')||'').trim();
        code.setAttribute('style', prev?`${prev};${inlineCodeStyle}`:inlineCodeStyle);
      });

      /* ins/del 은 Word가 변경 추적처럼 처리해 여백 세로선이 생길 수 있음 — 태그만 제거하고 내용은 유지 */
      root.querySelectorAll('ins,del').forEach(el=>{
        const parent=el.parentNode;
        if(!parent) return;
        while(el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      });
      /* 목록/단락/인라인까지: Word는 li>p>span 등 일부 노드에만 border-left가 붙는 경우가 있어 전 요소 순회(표 셀 테두리는 유지) */
      root.querySelectorAll('*').forEach(el=>{
        if(el.closest('table.nachim-export-callout')) return;
        const tag=el.tagName;
        if(tag==='TD'||tag==='TH'||tag==='TABLE'||tag==='TBODY'||tag==='THEAD'||tag==='TFOOT'||tag==='TR'||tag==='COL'||tag==='COLGROUP'||tag==='BR'||tag==='HR') return;
        const merged=wordStripProblematicBordersFromStyle(el.getAttribute('style')||'');
        el.setAttribute('style',merged?`${merged};${WORD_EXPORT_NO_LEFT_BORDER}`:WORD_EXPORT_NO_LEFT_BORDER);
      });
      html=root.innerHTML;
    }
  }catch(e){}

  const docTitle=String(title||'').trim()||'Route01 자문 리포트';

  const reportCss=[
    '/* Route01 consulting report (Word/altChunk) */',
    '@page Section1{size:595.3pt 841.9pt;margin:42pt 42pt 48pt 42pt;}',
    'div.Section1{page:Section1;}',
    'body{margin:0;background:#ffffff;color:#1d1d1f;font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif;font-size:11pt;line-height:1.6;}',
    '.wrap{padding:0;}',
    '.header{padding:0 0 18pt 0;border-bottom:1px solid #d2d2d7;margin:0 0 18pt 0;}',
    '.header-title{font-size:22pt;font-weight:800;letter-spacing:-0.4pt;margin:0 0 6pt 0;color:#1d1d1f;}',
    '.header-meta{font-size:10.5pt;color:#6e6e73;margin:0;line-height:1.4;}',
    'p{margin:0 0 15pt 0;}',
    'h1,h2,h3{font-family:"Malgun Gothic","Apple SD Gothic Neo",sans-serif;font-weight:800;color:#1d1d1f;letter-spacing:-0.2pt;}',
    'h1{font-size:16pt;margin:18pt 0 10pt 0;}',
    'h2{font-size:13.5pt;margin:16pt 0 9pt 0;}',
    'h3{font-size:12pt;margin:14pt 0 8pt 0;}',
    'strong{font-weight:800;color:#1d1d1f;}',
    /* blockquote는 테이블로 치환 — td/th는 제외(표 격선 유지), 본문 블록·인라인 좌측 테두리 제거 */
    'ul,ol,li,p,span,div,strong,em,a,code,pre,h1,h2,h3,h4,h5,h6,blockquote{border-left:none !important;mso-border-left-alt:none !important;}',
    'table{border-collapse:collapse;width:100%;border:1px solid #d2d2d7;margin:10pt 0;}',
    'table.nachim-export-callout,table.nachim-export-callout td{border:none !important;}',
    'table.nachim-export-callout{border-collapse:collapse;width:100%;margin:10pt 0;}',
    'th,td{border:1px solid #d2d2d7;padding:4pt 7pt;vertical-align:top;line-height:1.35;}',
    'caption{caption-side:top;text-align:center;font-weight:800;color:#1d1d1f;margin:0 0 10pt 0;}',
    'th{background:#000000;color:#ffffff;font-weight:800;text-align:center;}',
    'code{font-family:Consolas,Menlo,monospace;font-size:10.5pt;background:#f5f5f7;border:1px solid #d2d2d7;padding:1pt 4pt;border-radius:6pt;color:#1d1d1f;}',
    'pre{font-family:Consolas,Menlo,monospace;font-size:10.5pt;line-height:1.55;background:#f5f5f7;color:#1d1d1f;border-radius:8pt;padding:10pt 12pt;overflow:auto;margin:0 0 15pt 0;border:1px solid #d2d2d7;}',
    'pre code{background:transparent;border:none;padding:0;color:inherit;}',
    'hr{border:none;border-top:1px solid #d2d2d7;margin:14pt 0;}',
    'a{color:#1d1d1f;text-decoration:underline;}'
  ].join('\n');

  const wrapperStart=[
    '<div class="Section1">',
    '<div class="wrap">',
    '<div class="header">',
    `<div class="header-title">${esc(docTitle)}</div>`,
    `<p class="header-meta">${esc(meta)}</p>`,
    '</div>'
  ].join('');
  const wrapperEnd='</div></div>';

  return [
    '<!DOCTYPE html>',
    '<html lang="ko">',
    '<head>',
    '<meta charset="utf-8" />',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
    `<title>${esc(docTitle)}</title>`,
    `<style type="text/css">${reportCss}\n${safeCss}</style>`,
    '</head>',
    '<body>',
    wrapperStart,
    html,
    wrapperEnd,
    '</body>',
    '</html>'
  ].join('');
}

function stripFollowUpFromHtml(html){
  const src=String(html||'');
  try{
    const doc=new DOMParser().parseFromString(`<div id="__root__">${src}</div>`,'text/html');
    const root=doc.getElementById('__root__');
    if(!root) return src;
    /* '요약' 등은 본문 헤딩과 충돌해 앞부분 전체가 잘릴 수 있음 — 후속 질문 블록만 대상 */
    const labRe=/(다음\s*질문\s*추천|다음\s*추천\s*질문|추천\s*질문(?:\s*목록)?)/i;
    /* find a block element that looks like the follow-up section header */
    const candidates=[...root.querySelectorAll('h1,h2,h3,h4,h5,h6,strong,p,div')];
    const hit=candidates.find(el=>labRe.test((el.textContent||'').trim()));
    if(hit){
      /* remove the header and everything after it within the same parent container */
      const parent=hit.parentElement || root;
      let n=hit;
      while(n){
        const next=n.nextSibling;
        n.remove();
        n=next;
      }
      /* also remove empty trailing containers */
      if(parent!==root && !parent.textContent.trim()) parent.remove();
    }
    return root.innerHTML.trim();
  }catch(e){
    /* very safe fallback: cut at first matching line */
    const idx=src.search(/(다음\s*질문\s*추천|다음\s*추천\s*질문|추천\s*질문(?:\s*목록)?)/i);
    return idx>=0 ? src.slice(0, idx) : src;
  }
}

/* Word altChunk 호환을 위한 XHTML 형태 (application/xhtml+xml) */
function buildWordAltChunkXhtml(title,meta,bodyHtml,cssText){
  const safeCss=String(cssText||'');
  const cleanBody=String(bodyHtml||'')
    /* Word가 싫어하는 script 제거 */
    .replace(/<script\b[\s\S]*?>[\s\S]*?<\/script>/gi,'')
    /* onclick 등 인라인 이벤트 제거 */
    .replace(/\son\w+=(?:"[^"]*"|'[^']*')/gi,'');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    '<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="ko" lang="ko">',
    '<head>',
    '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />',
    `<title>${esc(title)}</title>`,
    `<style type="text/css">${EXPORT_DOC_STYLES}\n${safeCss}</style>`,
    '</head>',
    '<body>',
    '<div class="page"><div class="card">',
    `<div class="title">${esc(title)}</div>`,
    `<div class="meta">${esc(meta)}</div>`,
    `<div class="content">${cleanBody}</div>`,
    '</div></div>',
    '</body>',
    '</html>'
  ].join('');
}

function xmlEscape(s){
  return String(s??'')
    /* remove invalid XML 1.0 control chars (keep \t \n \r) */
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&apos;');
}

function htmlToPlainText(html){
  try{
    const doc=new DOMParser().parseFromString(String(html||''),'text/html');
    const root=doc.body;
    const lines=[];
    const walk=(node)=>{
      if(!node) return;
      if(node.nodeType===Node.TEXT_NODE){
        const t=(node.nodeValue||'').replace(/\s+/g,' ');
        if(t) lines.push(t);
        return;
      }
      if(node.nodeType!==Node.ELEMENT_NODE) return;
      const tag=(node.tagName||'').toLowerCase();
      if(['script','style','noscript'].includes(tag)) return;
      if(['p','div','section','article','header','footer','h1','h2','h3','h4','h5','h6','li','tr'].includes(tag)){
        lines.push('\n');
      }
      if(tag==='br') lines.push('\n');
      if(tag==='td' || tag==='th') lines.push('\t');
      for(const ch of [...node.childNodes]) walk(ch);
      if(tag==='table') lines.push('\n');
    };
    walk(root);
    const txt=lines.join('').replace(/\n{3,}/g,'\n\n').trim();
    return txt;
  }catch(e){
    return String(html||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  }
}

function wmlParagraph(text, opts={}){
  const t=String(text||'').replace(/\r\n/g,'\n');
  const parts=t.split('\n');
  const ps=[];
  const pPr=[];
  if(opts.style) pPr.push(`<w:pStyle w:val="${xmlEscape(opts.style)}"/>`);
  if(opts.spaceAfterTwips!=null) pPr.push(`<w:spacing w:after="${opts.spaceAfterTwips}"/>`);
  const pPrXml=pPr.length?`<w:pPr>${pPr.join('')}</w:pPr>`:'';
  for(const line of parts){
    const safe=xmlEscape(line);
    ps.push(`<w:p>${pPrXml}<w:r><w:t xml:space="preserve">${safe}</w:t></w:r></w:p>`);
  }
  return ps.join('');
}

function buildDocumentXmlFromText(title, meta, plainText){
  /* ultra-minimal WML: avoid style refs for maximum compatibility */
  const bodyParts=[];
  bodyParts.push(wmlParagraph(title,{spaceAfterTwips:240}));
  bodyParts.push(wmlParagraph(meta,{spaceAfterTwips:360}));
  const blocks=String(plainText||'').split(/\n{2,}/);
  for(const b of blocks){
    bodyParts.push(wmlParagraph(b,{spaceAfterTwips:240}));
  }
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    '<w:body>',
    bodyParts.join(''),
    '<w:sectPr>',
    '<w:pgSz w:w="11906" w:h="16838"/>',
    '<w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="708" w:footer="708" w:gutter="0"/>',
    '</w:sectPr>',
    '</w:body>',
    '</w:document>'
  ].join('');
}

/*보내기 시 '다음 질문 추천' 등 후속 질문 블록 제거 */
function stripFollowUpRecommendationsForExport(md){
  let s=String(md||'').replace(/\r\n/g,'\n');
  const lab='(?:다음\\s*질문\\s*추천|다음\\s*추천\\s*질문|추천\\s*질문(?:\\s*목록)?)';
  const heading=new RegExp(`\\n#{1,6}\\s[^\\n]*${lab}[^\\n]*`,'i');
  let i=s.search(heading);
  if(i>=0) return s.slice(0,i).replace(/\s+$/,'');
  const headingStart=new RegExp(`^#{1,6}\\s[^\\n]*${lab}[^\\n]*`,'im');
  const m=s.match(headingStart);
  if(m&&m.index===0) return s.slice(0,m.index).replace(/\s+$/,'');
  const boldLine=new RegExp(`\\n\\*\\*[^\\n]*${lab}[^\\n]*\\*\\*\\s*`,'i');
  i=s.search(boldLine);
  if(i>=0) return s.slice(0,i).replace(/\s+$/,'');
  const boldStart=new RegExp(`^\\*\\*[^\\n]*${lab}[^\\n]*\\*\\*\\s*`,'im');
  const mb=s.match(boldStart);
  if(mb&&mb.index===0) return s.slice(0,mb.index).trimEnd();
  return s.replace(/\s+$/,'');
}

/* 내보내기 시, 본문 하단의 '핵심 체크포인트/궁금하면...' 같은 꼬리 문구까지 제거 */
function stripTailBlocksForExport(md){
  let s=stripFollowUpRecommendationsForExport(md);
  s=String(s||'').replace(/\r\n/g,'\n');

  /* common tail phrases that should not be exported */
  const tailRe = /(?:핵심\s*체크\s*포인트|핵심\s*체크포인트|핵심\s*포인트|체크\s*포인트|체크포인트|궁금한\s*게?\s*생기면|궁금하면|추가\s*질문|언제든\s*(?:바로\s*)?물어보세요|더\s*궁금한\s*점)/i;

  /* try to cut from the last occurrence near the end */
  const lines=s.split('\n');
  let cutAt=-1;
  for(let i=lines.length-1;i>=0;i--){
    if(tailRe.test(lines[i])){
      cutAt=i;
      break;
    }
  }
  if(cutAt>=0){
    s=lines.slice(0, cutAt).join('\n').trimEnd();
  }

  /* also remove a trailing blockquote starting with these labels */
  s=s.replace(/\n?>\s*(?:[^\n]*)(?:핵심\s*체크\s*포인트|핵심\s*체크포인트|핵심\s*포인트|체크\s*포인트|체크포인트)[\s\S]*$/i,'').trimEnd();

  return s.trimEnd();
}

const NACHIM_EXPORT_TAIL_MARKER = '<<<NACHIM_TAIL>>>';

function splitExportMainBody(md){
  const s=String(md||'').replace(/\r\n/g,'\n');
  const i=s.indexOf(NACHIM_EXPORT_TAIL_MARKER);
  if(i<0) return s;
  return s.slice(0,i).replace(/\s+$/,'');
}

function prepareMarkdownForExport(md){
  const raw=String(md||'');
  const hadTailMarker=raw.indexOf(NACHIM_EXPORT_TAIL_MARKER)>=0;
  let s=splitExportMainBody(raw);
  /* 구분선이 있으면 본문만 확정된 것 — 하단 키워드 휴리스틱은 Action Plan 등과 충돌해 본문이 잘릴 수 있음 */
  if(hadTailMarker) s=stripFollowUpRecommendationsForExport(s);
  else s=stripTailBlocksForExport(s);
  return s.trim();
}

/* ─── 프로필 모달 ──────────────────── */
function openModal(){
  const b=document.getElementById('modal-body');
  b.innerHTML=profile.industry?`
    <div class="modal-row"><span class="m-label">업종</span><div class="m-val">${profile.industry}</div></div>
    <div class="modal-row"><span class="m-label">단계</span><div class="m-val">${profile.stage}</div></div>
    <div class="modal-row"><span class="m-label">팀 규모</span><div class="m-val">${profile.team}</div></div>
    ${profile.mrr?`<div class="modal-row"><span class="m-label">월 매출</span><div class="m-val">${profile.mrr}</div></div>`:''}
    ${profile.concern?`<div class="modal-row"><span class="m-label">핵심 고민</span><div class="m-val" style="font-size:13px;line-height:1.5">${profile.concern}</div></div>`:''}
    ${profile.style?`<div class="modal-row"><span class="m-label">멘토링 스타일</span><div class="m-val">${profile.style}</div></div>`:''}
  `:'<div style="font-size:14px;color:var(--ink3);margin-bottom:1rem">아직 프로필이 설정되지 않았어요.</div>';
  document.getElementById('modal').classList.add('open');
}
function closeModal(){document.getElementById('modal').classList.remove('open');}

/* ─── 유틸 ─────────────────────────── */
function onKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}}
function resize(el){
  el.style.height='auto';
  const cap=120;
  const next=Math.min(el.scrollHeight,cap);
  el.style.height=Math.max(44,next)+'px';
  /* if the user edits the question after a mismatch warning, dismiss it */
  if(pendingMismatchQuestion && el.id==='input'){
    if((el.value||'').trim()!==pendingMismatchQuestion.trim()) hideDomainBanner();
  }
}

function openStyleModal(){
  const grid=document.getElementById('style-modal-grid');
  if(!grid) return;
  const cur=profile.style||'YC 파트너식 직설';
  grid.innerHTML=Object.keys(MENTOR_STYLES).map(k=>`
    <button class="modal-btn ${k===cur?'pri':''}" style="text-align:left" data-style="${esc(k)}">
      <div style="font-weight:750;margin-bottom:4px">${esc(k)}</div>
      <div style="font-size:12px;font-weight:500;opacity:.85;line-height:1.55">${esc(MENTOR_STYLES[k]).slice(0,120)}${MENTOR_STYLES[k].length>120?'…':''}</div>
    </button>
  `).join('');
  grid.querySelectorAll('[data-style]').forEach(btn=>{
    btn.addEventListener('click',()=>setMentorStyle(btn.getAttribute('data-style')));
  });
  document.getElementById('style-modal').classList.add('open');
}
function closeStyleModal(){document.getElementById('style-modal').classList.remove('open');}
function setMentorStyle(style){
  const s=String(style||'').trim();
  if(!MENTOR_STYLES[s]) return;
  profile.style=s;
  try{localStorage.setItem('vd_profile',JSON.stringify(profile));}catch(e){}
  applyProfile();
  closeStyleModal();
}

/* ─── 초기화 ────────────────────────── */
document.addEventListener('DOMContentLoaded', function(){
  const auth0Ru=document.getElementById('auth0-redirect-url');
  if(auth0Ru) auth0Ru.textContent=window.location.origin+window.location.pathname;

  if(!isAuthed()) initAuthHeroMessaging();

  /* auth gate */
  (async ()=>{
    try{await handleAuthCallback();}catch(e){}
    if(!isAuthed()){
      showAuthGate();
      return;
    }
    startAfterLogin();
  })();

  /* 인풋 이벤트 바인딩 */
  const safeOn = (id, ev, fn) => { const el=document.getElementById(id); if(el) el[ev]=fn; };
  safeOn('mrr-in',     'oninput', e => ob.mrr=e.target.value);
  safeOn('name-in',    'oninput', e => ob.name=e.target.value);
  safeOn('concern-in', 'oninput', e => ob.concern=e.target.value);

  /* 모달 배경 클릭 닫기 */
  const safeClick = (id, fn) => { const el=document.getElementById(id); if(el) el.addEventListener('click', e=>{ if(e.target===el) fn(); }); };
  safeClick('modal',          closeModal);
  safeClick('key-modal',      closeKeyModal);
  safeClick('style-modal',    closeStyleModal);
  safeClick('auth0-modal',    closeAuth0Settings);
  safeClick('grant-modal',    closeGrantModal);
  safeClick('confirm-modal',  closeConfirm);
  safeClick('hist-modal',     closeHistModal);

  /* 확인 모달 버튼 — onclick 속성 대신 직접 바인딩 */
  const okBtn=document.getElementById('confirm-ok-btn');
  const cancelBtn=document.getElementById('confirm-cancel-btn');
  if(okBtn)     okBtn.addEventListener('click',     e=>{ e.stopPropagation(); confirmAsk(); });
  if(cancelBtn) cancelBtn.addEventListener('click', e=>{ e.stopPropagation(); closeConfirm(); });

  /* (popular questions tab removed) */

  updateKeyStatus();
  initDomainIcons();
});

/* ─── exportAnswer (OOXML altChunk, standard) ─── */
async function exportAnswer(type, id /*, btn */){
  const Zip=typeof JSZip!=='undefined'?JSZip:(typeof window!=='undefined'?window.JSZip:undefined);
  const isDocx=type==='docx'||type==='word';
  const isPdf=type==='pdf';
  if(!isDocx && !isPdf) return;

  const chatRes=document.getElementById('chat-res');
  let bodyHtml='';
  let usedRawMarkdown=false;
  let rawA='';
  const exportId=String(id||'').trim() || String(chatRes?.getAttribute('data-for-export')||'').trim();
  /* 원문 마크다운: <<<NACHIM_TAIL>>> 앞만보내기 + 구형 답변은 키워드 꼬리 제거 */
  if(exportId){
    try{
      let tPlain=(getAnswerRaw(exportId)||'').trim();
      tPlain=prepareMarkdownForExport(tPlain);
      if(tPlain){
        rawA=tPlain;
        bodyHtml=renderMD(tPlain);
        usedRawMarkdown=true;
      }
    }catch(e){}
  }
  /* Fallback: 현재 HTML(구형·원문 없음) */
  if(!bodyHtml.trim() && chatRes && chatRes.innerHTML && chatRes.innerHTML.trim()) bodyHtml=chatRes.innerHTML;
  /* 마크다운 경로는 이미 prepareMarkdownForExport로 후속 블록 제거됨 — HTML 스트립은 '요약' 등으로 본문이 잘리는 부작용이 큼 */
  if(!usedRawMarkdown) bodyHtml=stripFollowUpFromHtml(bodyHtml);
  /* UI 전용 구분선은 export에서 제거 */
  bodyHtml=String(bodyHtml||'').replace(/<hr\b[^>]*class=(?:"|')nachim-hr(?:"|')[^>]*>/gi,'');
  if(!bodyHtml.trim()){
    alert('내보낼 답변이 없습니다.');
    return;
  }

  const cfg=DOMAINS[domain]||{title:'자문'};
  let title=`Route01 AI 자문 — ${cfg.title}`;
  title=title.replace(/\s*—\s*$/,'').trim()||'Route01 AI 자문';
  const meta=buildExportMetaLine();

  const now=new Date();
  const dateStr=now.toISOString().slice(0,10);
  const timeStr=now.toTimeString().slice(0,8).replace(/:/g,'');
  const docxFileName=`Route01_자문리포트_${dateStr}_${timeStr}.docx`;
  const pdfPrintCss=`\n@page{margin:12mm}\nbody{-webkit-print-color-adjust:exact;print-color-adjust:exact}\n@media print{body{margin:0;background:#fff}.page{padding:1cm}}\n`;

  if(isPdf){
    const iframe=document.createElement('iframe');
    iframe.style.position='fixed';
    iframe.style.right='0';
    iframe.style.bottom='0';
    iframe.style.width='0';
    iframe.style.height='0';
    iframe.style.border='0';
    iframe.style.opacity='0';
    iframe.setAttribute('aria-hidden','true');
    document.body.appendChild(iframe);
    const pdfHtml=buildExportDocumentHtml(title,meta,bodyHtml,pdfPrintCss);
    const doc=iframe.contentWindow?.document;
    if(!doc){
      iframe.remove();
      alert('PDF 인쇄를 시작할 수 없습니다.');
      return;
    }
    doc.open();
    doc.write(pdfHtml);
    doc.close();
    iframe.onload=()=>{
      try{
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      }finally{
        setTimeout(()=>iframe.remove(), 2000);
      }
    };
    return;
  }

  try{
    if(typeof Zip!=='function'){
      alert('JSZip 라이브러리가 로드되지 않았습니다. 페이지를 새로고침하거나 잠시 후 다시 시도하세요.');
      return;
    }

    /* Word 호환 altChunk용 스타일(HEX + 고정 폰트) + 인라인 보강 */
    const htmlStyle=[
      'body{margin:0;background:#ffffff;color:#1d1d1f;font-family:"Malgun Gothic","맑은 고딕",Arial,sans-serif !important;font-size:11pt;line-height:1.6;}',
      '.wrap{padding:0;}',
      '.header{padding:0 0 14pt 0;border-bottom:1px solid #d2d2d7;margin:0 0 14pt 0;}',
      '.header-title{font-size:20pt;font-weight:800;letter-spacing:-0.3pt;margin:0 0 6pt 0;color:#1d1d1f;}',
      '.header-meta{font-size:10.5pt;color:#6e6e73;margin:0;line-height:1.4;}',
      'p{margin:0 0 12pt 0;}',
      'h1,h2,h3{font-family:"Malgun Gothic","맑은 고딕",Arial,sans-serif !important;font-weight:800;color:#1d1d1f;letter-spacing:-0.2pt;}',
      'h1{font-size:16pt;margin:18pt 0 10pt 0;}',
      'h2{font-size:13.5pt;margin:16pt 0 9pt 0;}',
      'h3{font-size:12pt;margin:14pt 0 8pt 0;}',
      'strong{font-weight:800;color:#1d1d1f;}',
      'ul,ol{padding-left:30pt;margin:8pt 0 12pt 0;}',
      'table{border-collapse:collapse;width:100%;border:1px solid #d2d2d7;margin:12pt 0;font-family:"Malgun Gothic","맑은 고딕",Arial,sans-serif !important;}',
      'th,td{padding:4pt 8pt;border:1px solid #d2d2d7;vertical-align:top;text-align:left;font-family:"Malgun Gothic","맑은 고딕",Arial,sans-serif !important;}',
      'td{line-height:1.4;}',
      'th{background:#1d1d1f;color:#ffffff;text-align:center !important;font-weight:800;}',
      'code{font-family:Consolas,Menlo,monospace;font-size:10.5pt;background:#f5f5f7;border:1px solid #d2d2d7;padding:1pt 4pt;border-radius:6pt;color:#1d1d1f;}',
      'pre{font-family:Consolas,Menlo,monospace;font-size:10.5pt;line-height:1.55;background:#f5f5f7;color:#1d1d1f;border-radius:8pt;padding:10pt 12pt;overflow:auto;margin:0 0 12pt 0;border:1px solid #d2d2d7;}',
      'pre code{background:transparent;border:none;padding:0;color:inherit;}',
      'hr{border:none;border-top:1px solid #d2d2d7;margin:14pt 0;}',
      'a{color:#1d1d1f;text-decoration:underline;}'
    ].join('\n');

    const mergeStyle=(prev, add)=>{
      const p=String(prev||'').trim();
      if(!p) return add;
      if(p.endsWith(';')) return p+add;
      return p+';'+add;
    };

    /* DOCX(Word)용: 정규식 replace 없이 DOMParser로만 인라인 스타일 강제 */
    try{
      let htmlForWord=bodyHtml;
      if(rawA && window.marked && typeof marked.parse==='function'){
        htmlForWord = marked.parse(rawA);
      }
      const parser = new DOMParser();
      const doc = parser.parseFromString(String(htmlForWord||''), 'text/html');

      // 1. 모든 요소 폰트 강제 주입
      doc.querySelectorAll('*').forEach(el => {
        el.style.fontFamily = "'Malgun Gothic', '맑은 고딕', sans-serif";
      });

      // 2. 표(Table) 완벽 제어
      doc.querySelectorAll('table').forEach(tbl => {
        tbl.style.borderCollapse = 'collapse';
        tbl.style.width = '100%';
        tbl.style.marginBottom = '15pt';
      });
      doc.querySelectorAll('th').forEach(th => {
        th.style.backgroundColor = '#1d1d1f';
        th.style.color = '#ffffff';
        th.style.padding = '4pt 8pt';
        th.style.border = '1px solid #d2d2d7';
        th.style.textAlign = 'center';
      });
      doc.querySelectorAll('td').forEach(td => {
        td.style.padding = '3pt 6pt';
        td.style.border = '1px solid #d2d2d7';
        // Word의 강제 여백을 없애기 위해 p 태그를 br로 치환
        td.innerHTML = td.innerHTML.replace(/<p[^>]*>/gi, '').replace(/<\/p>/gi, '<br>');
        if(td.innerHTML.endsWith('<br>')) td.innerHTML = td.innerHTML.slice(0, -4);
      });

      // 3. 인용구(회색 상자) 완벽 제어
      doc.querySelectorAll('blockquote').forEach(bq => {
        bq.style.backgroundColor = '#f5f5f7';
        bq.style.padding = '10pt';
        bq.style.borderLeft = '3px solid #d2d2d7';
        bq.style.margin = '10pt 0';
      });
      // ★ 핵심: Word는 blockquote의 배경을 무시하므로 내부 p 태그에도 배경색 주입
      doc.querySelectorAll('blockquote p').forEach(p => {
        p.style.backgroundColor = '#f5f5f7';
        p.style.margin = '0 0 5pt 0';
      });

      // 4. 기울임꼴 유지 (회색 박스 안/밖 모두)
      doc.querySelectorAll('em, i').forEach(el => {
        el.style.fontStyle = 'italic';
        el.style.setProperty('font-style', 'italic', 'important');
      });

      // 5. <hr>이 Word에서 빨간 줄로 깨지는 문제 방지 (인라인화)
      doc.querySelectorAll('hr').forEach(hr => {
        hr.style.border = '0';
        hr.style.borderTop = '1px solid #d2d2d7';
        hr.style.margin = '15pt 0';
      });

      bodyHtml = doc.body.innerHTML;
    }catch(e){}

    const zip=new Zip();

    // 1) [Content_Types].xml
    zip.file('[Content_Types].xml', [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
      '<Default Extension="xml" ContentType="application/xml"/>',
      '<Default Extension="htm" ContentType="text/html"/>',
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>',
      '<Override PartName="/word/afchunk.htm" ContentType="text/html"/>',
      '</Types>'
    ].join(''));

    // 2) _rels/.rels
    zip.file('_rels/.rels', [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>',
      '</Relationships>'
    ].join(''));

    // 3) word/document.xml
    zip.file('word/document.xml', [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
      '<w:body><w:altChunk r:id="htmlChunk"/><w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body>',
      '</w:document>'
    ].join(''));

    // 4) word/_rels/document.xml.rels (Target는 word/ 기준 상대경로)
    zip.file('word/_rels/document.xml.rels', [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
      '<Relationship Id="htmlChunk" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/aFChunk" Target="afchunk.htm"/>',
      '</Relationships>'
    ].join(''));

    // 5) word/afchunk.htm
    const docTitle=String(title||'').trim()||'Route01 자문 리포트';
    const afchunkHtml=[
      '<!DOCTYPE html>',
      '<html lang="ko">',
      '<head>',
      '<meta charset="utf-8" />',
      '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
      `<title>${esc(docTitle)}</title>`,
      `<style type="text/css">${htmlStyle}</style>`,
      '</head>',
      '<body>',
      '<div class="wrap">',
      '<div class="header">',
      `<div class="header-title">${esc(docTitle)}</div>`,
      `<p class="header-meta">${esc(meta)}</p>`,
      '</div>',
      String(bodyHtml||''),
      '</div>',
      '</body>',
      '</html>'
    ].join('');
    zip.file('word/afchunk.htm', '\ufeff' + afchunkHtml);

    const blob=await zip.generateAsync({
      type:'blob',
      compression:'DEFLATE',
      mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const ab=await blob.arrayBuffer();
    /* sanity: zip signature */
    try{
      const sig=String.fromCharCode(...new Uint8Array(ab.slice(0,2)));
      if(sig!=='PK'){
        alert('DOCX 생성 실패: ZIP 시그니처가 아닙니다.');
        return;
      }
    }catch(e){}

    /* download */
    try{
      if(window.navigator && typeof window.navigator.msSaveOrOpenBlob==='function'){
        window.navigator.msSaveOrOpenBlob(new Blob([ab],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}), docxFileName);
        return;
      }
    }catch(e){}

    const a=document.createElement('a');
    const url=URL.createObjectURL(new Blob([ab],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'}));
    a.href=url;
    a.download=docxFileName;
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>{ try{URL.revokeObjectURL(url);}catch(e){} }, 15000);
  }catch(e){
    console.error('[exportAnswer][DOCX] failed', e);
    alert(`보내기 오류: ${e?.message||e}`);
  }
}

/* ─── Global exposure for inline HTML handlers ─── */
window.handleAuthCallback = handleAuthCallback;
window.loginProvider = loginProvider;
window.demoLogin = demoLogin;
window.logout = logout;
window.startAfterLogin = startAfterLogin;
window.openAuth0Settings = openAuth0Settings;
window.closeAuth0Settings = closeAuth0Settings;
window.openKeyModal = openKeyModal;
window.closeKeyModal = closeKeyModal;
window.saveKey = saveKey;
window.exportAnswer = exportAnswer;
window.refreshAllReportBubbleMarkdown = refreshAllReportBubbleMarkdown;
