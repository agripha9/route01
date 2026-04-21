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

  // 소셜 로그인 계정 → r01_accs에 method 포함 저장 (중복 가입 감지용)
  try {
    if(user && user.email && user.sub) {
      const sub = user.sub || '';
      let method = null;
      if(sub.startsWith('google'))      method = 'google-oauth2';
      else if(sub.startsWith('apple'))  method = 'apple';
      else if(sub.startsWith('naver'))  method = 'naver';
      else if(sub.startsWith('kakao'))  method = 'kakao';

      if(method) {
        const raw = localStorage.getItem('r01_accs');
        const accs = raw ? JSON.parse(raw) : [];
        // 같은 이메일이 없을 때만 추가
        if(!accs.find(a => a.email === user.email)) {
          accs.push({ email: user.email, method: method, ts: Date.now() });
          localStorage.setItem('r01_accs', JSON.stringify(accs));
        }
      }
    }
  } catch(e) {}
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

  // 소셜 로그인 이력 저장 (method 기록으로 중복 가입 감지에 활용)
  try{
    const authRaw = localStorage.getItem('nachim_auth');
    if(authRaw){
      const authData = JSON.parse(authRaw);
      const u = authData?.user;
      if(u && u.email && u.sub){
        const sub = u.sub||'';
        let method = null;
        if(sub.startsWith('google')) method = 'google-oauth2';
        else if(sub.startsWith('apple')) method = 'apple';
        else if(sub.startsWith('naver')) method = 'naver';
        else if(sub.startsWith('kakao')) method = 'kakao';
        if(method){
          const accs = _r01Accounts();
          if(!accs.find(a => a.email === u.email)){
            accs.push({email:u.email, method, ts:Date.now()});
            localStorage.setItem('r01_accs', JSON.stringify(accs));
          }
        }
      }
    }
  }catch(e){}

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
  const styleGuide = MENTOR_STYLES[profile.style] || MENTOR_STYLES['Paul Graham (YC)'];
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

[멘토 톤: ${profile.style||'Paul Graham (YC)'}]
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

const MENTOR_META = {
  'Paul Graham (YC)': {
    tag:'YC', tagColor:'#F26522', emoji:'🔶',
    headline:'초기 생존 · PMF · 직설적 실행',
    desc:'"Do things that don\'t scale." 지금 당장 할 수 있는 것에 집중. 수치와 사례로 직설적 피드백.',
    free: true
  },
  'Peter Thiel (Founders Fund)': {
    tag:'Founders Fund', tagColor:'#1a3a8a', emoji:'♟️',
    headline:'독점 · 역발상 · 0→1 전략',
    desc:'"경쟁은 패자의 것." 아무도 가지 않는 길, 10배 이상의 차별화, 독점 가능한 시장을 찾아라.',
    free: true
  },
  'Brian Chesky (Airbnb)': {
    tag:'Airbnb', tagColor:'#FF5A5F', emoji:'🏠',
    headline:'위기관리 · 브랜드 · 고객 경험',
    desc:'"11성급 경험을 설계하라." 위기를 기회로, 진짜 팬 1000명부터 만드는 브랜드 전략.',
    free: false
  },
  'Jensen Huang (NVIDIA)': {
    tag:'NVIDIA', tagColor:'#76b900', emoji:'💚',
    headline:'장기 비전 · 플랫폼 · 집념',
    desc:'"고통은 선물이다." 30년 관점으로 역산, 생태계·락인 구조 설계, 기술 깊이에 투자.',
    free: false
  },
  'Naval Ravikant': {
    tag:'AngelList', tagColor:'#1a1a2e', emoji:'🎯',
    headline:'사고방식 · 레버리지 · 철학적 기반',
    desc:'사고 프레임부터 재설정. 레버리지 원칙과 판단력. 다른 4인의 멘토링을 소화하는 기반.',
    free: false
  }
};

const MENTOR_STYLES = {
  'Paul Graham (YC)': 'Paul Graham(YC) 스타일로 답하세요. 핵심을 먼저, 결론→근거→액션 순서. "Do things that don\'t scale" 원칙으로 지금 당장 실행 가능한 것을 제시. 추상적 조언 금지, 수치와 구체적 예시 필수. PMF 검증, 초기 생존, 고객 집착을 중심으로 직설적으로 조언하세요.',
  'Peter Thiel (Founders Fund)': 'Peter Thiel(Founders Fund) 스타일로 답하세요. "경쟁은 패자의 것"—경쟁 구도 자체를 피하는 독점 전략을 먼저 제시하라. 10배 이상의 차별화가 없으면 시장에 들어가지 말라. 역발상 질문("모두가 동의하는 것 중 사실이 아닌 것은?")으로 프레임을 깨고, 비밀(secrets)을 찾아내는 방식으로 조언하세요.',
  'Brian Chesky (Airbnb)': 'Brian Chesky(Airbnb) 스타일로 답하세요. 위기를 기회로 전환하는 프레임을 먼저 제시. 고객 경험의 "11성급" 순간을 설계하고, 진짜 팬 1000명을 만드는 것부터 시작하라. 브랜드 스토리와 감성적 연결을 통한 D2C 전략, 그리고 위기관리 체크리스트를 구체적으로 제시하세요.',
  'Jensen Huang (NVIDIA)': 'Jensen Huang(NVIDIA) 스타일로 답하세요. 30년 후 관점에서 역산해 지금의 전략을 정당화하라. 플랫폼·생태계·락인 구조를 먼저 설계하고, 단기 수익보다 기술 깊이에 투자하라. "고통은 선물이다"—실패와 위기 속 학습 포인트를 명시적으로 짚어주고, 집념있는 장기 투자의 논리를 제시하세요.',
  'Naval Ravikant': 'Naval Ravikant 스타일로 답하세요. 먼저 사고 프레임을 재설정하라—잘못된 질문에 좋은 답을 구하지 말고, 질문 자체를 바꿔라. 레버리지(코드·미디어·자본·노동) 관점에서 최소 투입으로 최대 확장성을 설계하라. 스펙이 아닌 판단력을 키우는 원칙을 제시하고, 마지막에 근본적 사고를 위한 질문 1개를 반드시 포함하세요.'
};
let profile = {};
let domain = 'strategy';
let messages = [];
let busy = false;
let ob = {industry:'',sector:[],sectorOther:'',stage:'',target:'',team:'',mrr:'',invest:'',name:'',concern:'',style:'Paul Graham (YC)'};
let step = 1;

/* ─── 온보딩 ────────────────────────── */
function onIndustryInput(val){
  ob.industry=val.trim();
  document.querySelectorAll('.ind-tag').forEach(t=>t.classList.remove('sel'));
  validate();
}
function setIndustry(val){
  /* 하위 호환 유지 — 새 로직은 toggleSector 사용 */
  ob.industry = ob.industry || val;
  validate();
}
function toggleSector(el) {
  const val = el.dataset.sector;
  if(val === '기타') {
    const isOn = el.classList.toggle('sel');
    const otherIn = document.getElementById('sector-other-in');
    if(otherIn) otherIn.style.display = isOn ? 'block' : 'none';
    if(!isOn) { ob.sectorOther = ''; if(otherIn) otherIn.value = ''; }
  } else {
    el.classList.toggle('sel');
  }
  // 선택된 sector 배열 업데이트
  ob.sector = [...document.querySelectorAll('.ind-tag.sel')]
    .map(t => t.dataset.sector)
    .filter(s => s && s !== '기타');
  if(ob.sectorOther) ob.sector.push(ob.sectorOther);
  validate();
}
function onSectorOtherInput(val) {
  ob.sectorOther = val.trim();
  // ob.sector 재계산
  ob.sector = [...document.querySelectorAll('.ind-tag.sel')]
    .map(t => t.dataset.sector)
    .filter(s => s && s !== '기타');
  if(ob.sectorOther) ob.sector.push(ob.sectorOther);
  validate();
}
function pickChip(type, el) {
  const grid = el.closest('[id$="-grid"]') || el.closest('[id$="-list"]');
  if(grid){
    // ob-chip 또는 ob-mentor-row 모두 처리
    grid.querySelectorAll('.ob-chip, .ob-mentor-row').forEach(c=>c.classList.remove('sel'));
  }
  el.classList.add('sel');
  ob[type] = el.dataset.val;
  validate();
}
function validate() {
  if (step===1) document.getElementById('btn1').disabled=!(ob.industry&&ob.stage&&ob.target&&ob.concern);
  // Step2는 모두 선택사항이므로 항상 활성화
  const btn2 = document.getElementById('btn2');
  if (btn2) btn2.disabled = false;
}
/* oninput 바인딩은 DOMContentLoaded에서 처리 */
function goStep(n) {
  document.getElementById('sec'+step).classList.remove('active');
  step=n;
  document.getElementById('sec'+n).classList.add('active');
  for(let i=1;i<=3;i++){
    const dot=document.getElementById('s'+i);
    if(dot) dot.classList.toggle('done',i<=n);
  }
  validate();
}
function finishOnboarding() {
  profile={...ob};
  // sector 최종 계산
  const selTags = [...document.querySelectorAll('#industry-tags .ind-tag.sel')]
    .map(t=>t.dataset.sector).filter(s=>s&&s!=='기타');
  const otherVal = (document.getElementById('sector-other-in')?.value||'').trim();
  if(otherVal) selTags.push(otherVal);
  profile.sector = selTags;
  profile.sectorOther = otherVal;
  localStorage.setItem('vd_profile',JSON.stringify(profile));
  launch();
}
function skipOnboarding(){profile={};launch();}
function editProfile(){
  closeModal();
  ob={...profile}; step=1;
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('app').style.display='none';
  ['sec1','sec2'].forEach((s,i)=>document.getElementById(s).classList.toggle('active',i===0));
  for(let i=1;i<=3;i++){
    const dot=document.getElementById('s'+i);
    if(dot) dot.classList.toggle('done',i<=1);
  }
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
  ['sec1','sec2'].forEach((s,i)=>{
    const el=document.getElementById(s);
    if(el) el.classList.toggle('active', i===0);
  });
  for(let i=1;i<=3;i++){
    const dot=document.getElementById('s'+i);
    if(dot) dot.classList.toggle('done', i<=1);
  }

  /* inputs */
  const ind=document.getElementById('industry-in');
  if(ind){ ind.value=ob.industry||''; onIndustryInput(ind.value||''); }
  // sector 태그 복원
  document.querySelectorAll('#industry-tags .ind-tag').forEach(t=>{
    const s = t.dataset.sector;
    const on = ob.sector && ob.sector.includes(s);
    t.classList.toggle('sel', !!on);
    if(s==='기타' && on) {
      const otherIn = document.getElementById('sector-other-in');
      if(otherIn) { otherIn.style.display='block'; otherIn.value=ob.sectorOther||''; }
    }
  });
  // target 복원
  document.querySelectorAll('#target-grid .ob-chip').forEach(c=>{
    c.classList.toggle('sel', c.dataset.val===ob.target);
  });
  // invest 복원
  document.querySelectorAll('#invest-grid .ob-chip').forEach(c=>{
    c.classList.toggle('sel', c.dataset.val===ob.invest);
  });
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
  // style-grid는 ob-mentor-row 구조 — data-val로 sel 클래스 복원
  const styleGrid = document.getElementById('style-grid');
  if(styleGrid){
    const curStyle = ob.style || 'Paul Graham (YC)';
    styleGrid.querySelectorAll('[data-val]').forEach(c=>{
      c.classList.toggle('sel', c.dataset.val === curStyle);
    });
  }

  validate();
}

/* ─── 앱 시작 ──────────────────────── */
function launch(){
  document.getElementById('onboarding').classList.add('hidden');
  const app=document.getElementById('app');
  app.style.display='flex';
  applyProfile();
  syncUnifiedBadges();
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
  if(styleEl) styleEl.textContent=profile.style||'Paul Graham (YC)';
  const styleBtn=document.getElementById('style-btn-text');
  if(styleBtn) styleBtn.textContent=profile.style||'Paul Graham (YC)';
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
  /* 도메인 통합 — 배너 비활성화 */
  return;
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
  /* 도메인 통합 — 미스매치 감지 비활성화 */
  return null;
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
    /* 방어: 답변 본문 자리에 답변 ID('a' + 13자리 epoch + 랜덤)가 들어오는 경우 저장 거부 */
    const aStr=String(a||'').trim();
    if(/^a\d{13}[a-z0-9]{5,}$/.test(aStr)){
      console.warn('[saveHistory] rejected: answer payload looks like an ID, not markdown', aStr);
      return;
    }
    if(!aStr){
      console.warn('[saveHistory] rejected: empty answer payload');
      return;
    }
    const raw=localStorage.getItem('vd_history');
    const log=raw?JSON.parse(raw):[];
    log.unshift({q,a:aStr,domain:domainTitle,domainKey:domain,ts:Date.now()});
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
    historyLog=all;
    if(!historyLog.length){el.innerHTML='<div class="pop-empty">아직 질문 기록이 없어요.</div>';return;}
    el.innerHTML=historyLog.map((h,i)=>{
      const d=new Date(h.ts);
      const ts=`${d.getMonth()+1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
      return `<div class="hist-item" data-hidx="${i}">
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
  // 웰컴화면 숨기고 채팅 화면으로 전환
  rmWelcome();
  const chat=document.getElementById('chat');
  if(chat) chat.innerHTML='';

  // 메시지 상태 복원
  messages=[];
  docsSentOnce=false;

  addMsg('user', h.q, []);
  messages.push({role:'user', content:h.q});

  /* 방어: 저장된 답변이 ID 패턴(구 데이터)이거나 비어있으면 안내 메시지로 대체 */
  const aStr=String(h.a||'').trim();
  const looksLikeId=/^a\d{13}[a-z0-9]{5,}$/.test(aStr);
  if(!aStr || looksLikeId){
    console.warn('[openHistConversation] stored answer is empty or id-like — showing notice', aStr);
    addMsg('ai','> 저장된 답변을 불러올 수 없습니다. (기록 손상으로 추정)\n\n이 질문은 **위 입력창에 다시 입력**하여 새로 물어봐 주세요.');
    messages.push({role:'assistant', content:''});
  } else {
    addMsg('ai', aStr);
    messages.push({role:'assistant', content:aStr});
  }

  // 스크롤 하단으로
  setTimeout(()=>{
    if(chat) chat.scrollTop = chat.scrollHeight;
    document.getElementById('input')?.focus();
  }, 80);
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
  renderHistory();
  updateHistoryDomainContext();
  showWelcome(); // 기존 호환 유지

  // unified-area: 도메인에 맞는 추천 질문 업데이트
  const domainToSug = {
    strategy:'strategy', investment:'investment', finance:'finance',
    marketing:'marketing', sales:'hr', hr:'hr', legal:'legal'
  };
  const sugKey = domainToSug[d] || 'all';
  if(typeof renderSugChips === 'function') {
    renderSugChips(sugKey);
    document.querySelectorAll('.sug-dc').forEach(c => {
      c.classList.toggle('active', c.textContent.trim()==='전체' && sugKey==='all');
    });
    const ua = document.getElementById('unified-area');
    if(ua) ua.style.display = 'block';
    const welcomeEl = document.getElementById('welcome-el');
    if(welcomeEl) welcomeEl.remove();
  }
}

/* ─── 채팅 UI ──────────────────────── */
function showWelcome(){
  // 웰컴 화면 표시
  const ws = document.getElementById('welcome-screen');
  const chat = document.getElementById('chat');
  const inputArea = document.querySelector('.input-area');

  if(ws) { ws.classList.remove('hidden'); }
  if(chat) { chat.classList.remove('active'); chat.innerHTML = ''; }
  if(inputArea) { inputArea.classList.remove('active'); }

  // 웰컴 타이틀 업데이트 (회사명 이탤릭+색상)
  const name = profile.name || profile.industry;
  const wsTitle = document.getElementById('ws-title');
  if(wsTitle) {
    if(name) {
      wsTitle.innerHTML = '안녕하세요, <em class="ws-company">' + esc(name) + '</em> 팀!';
    } else {
      wsTitle.textContent = '무엇이든 질문하세요';
    }
  }

  // ws-input 포커스
  setTimeout(()=>{ document.getElementById('ws-input')?.focus(); }, 100);
}

function rmWelcome(){
  // 웰컴 화면 숨기고 chat + input-area 활성화
  const ws = document.getElementById('welcome-screen');
  const chat = document.getElementById('chat');
  const inputArea = document.querySelector('.input-area');

  if(ws) ws.classList.add('hidden');
  if(chat) chat.classList.add('active');
  if(inputArea) inputArea.classList.add('active');
}

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
    el.innerHTML=`<div class="m-body ai-body"><div class="ai-head"><span class="ai-head-av"><img class="m-av-logo" src="./logo.png" width="22" height="22" alt=""/></span><span class="ai-head-name"><span class="brand">Route01</span> AI</span></div><div class="report-card"><div class="m-bubble report-bubble" data-answer-id="${id}" data-raw="${esc(safe)}">${renderMD(safe)}</div>${renderAnswerActions(id)}</div></div>`;
  } else {
    const fileHtml=(files&&files.length)?`<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:7px">${files.map(f=>`<span style="display:inline-flex;align-items:center;gap:4px;background:#f5f5f7;border:1px solid #d2d2d7;border-radius:20px;padding:2px 9px;font-size:11px;color:#1d1d1f;font-weight:500">${getIcon(f.name)} ${f.name}</span>`).join('')}</div>`:'';
    el.className = 'message user-msg';
    el.innerHTML=`<div class="m-av user">${uname.slice(0,2).toUpperCase()}</div><div class="m-body user-body"><div class="m-bubble u">${fileHtml}${esc(text)}</div></div>`;
  }
  chat.appendChild(el);
  chat.scrollTop=chat.scrollHeight;
}
function showLoad(){
  const chat=document.getElementById('chat');
  const el=document.createElement('div');
  el.className='message';el.id='load-msg';
  el.innerHTML=`<div class="m-body ai-body"><div class="ai-head"><span class="ai-head-av"><img class="m-av-logo" src="./logo.png" width="22" height="22" alt=""/></span><span class="ai-head-name"><span class="brand">Route01</span> AI</span></div><div class="report-card"><div class="m-bubble"><div class="route-loader" aria-label="로딩 중"><span class="rl-end rl-end-0 rl-step rl-s0">0</span><span class="rl-dot rl-step rl-s1"></span><span class="rl-dot rl-step rl-s2"></span><span class="rl-dot rl-step rl-s3"></span><span class="rl-node rl-step rl-s4"></span><span class="rl-dot rl-step rl-s5"></span><span class="rl-dot rl-step rl-s6"></span><span class="rl-dot rl-step rl-s7"></span><span class="rl-node rl-step rl-s8"></span><span class="rl-dot rl-step rl-s9"></span><span class="rl-dot rl-step rl-s10"></span><span class="rl-dot rl-step rl-s11"></span><span class="rl-node rl-step rl-s12"></span><span class="rl-dot rl-step rl-s13"></span><span class="rl-dot rl-step rl-s14"></span><span class="rl-dot rl-step rl-s15"></span><span class="rl-node rl-step rl-s16"></span><span class="rl-dot rl-step rl-s17"></span><span class="rl-dot rl-step rl-s18"></span><span class="rl-dot rl-step rl-s19"></span><span class="rl-end rl-end-1 rl-step rl-s20">1</span></div></div></div></div>`;
  chat.appendChild(el);
  chat.scrollTop=chat.scrollHeight;
}
function hideLoad(){const e=document.getElementById('load-msg');if(e)e.remove();}

/* fmt() kept for backward compatibility (use renderMD instead) */
function fmt(md){return renderMD(md);}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ─── 시스템 프롬프트 (Expert Mode) — 토큰 최적화 + 차별화 강화 ─── */
function buildDomainScopeLines(){
  return Object.entries(DOMAINS).map(([key,v])=>`- **${key}** → 표시명: 「${v.title}」 / 범위 요약: ${v.desc}`).join('\n');
}

/* 프로필 요약 JSON — 토큰 최소화 */
function buildProfileJson(){
  if(!profile.industry) return null;
  const p = {};
  if(profile.industry) p.biz = profile.industry;
  if(profile.sector && profile.sector.length) p.sector = profile.sector.join(',');
  if(profile.stage) p.stage = profile.stage;
  if(profile.target) p.target = profile.target;
  if(profile.team) p.team = profile.team;
  if(profile.invest) p.invest = profile.invest;
  if(profile.mrr) p.mrr = profile.mrr;
  if(profile.name) p.name = profile.name;
  if(profile.concern) p.concern = profile.concern.slice(0,200);
  return JSON.stringify(p);
}

function buildSys(){
  const domKey=(domain && DOMAINS[domain])?domain:'strategy';
  const cfg=DOMAINS[domKey];
  const persona=DOMAIN_EXPERT_PERSONAS[domKey]||DOMAIN_EXPERT_PERSONAS.strategy;
  const styleGuide = MENTOR_STYLES[profile.style] || MENTOR_STYLES['Paul Graham (YC)'];
  const mentorName = profile.style || 'Paul Graham (YC)';
  const profileJson = buildProfileJson();

  let sys=`당신은 **Route01** — 한국·실리콘밸리 스타트업 생태계 전문 AI 자문 엔진이다.
일반 LLM과 달리 스타트업 실전 데이터(YC배치, 국내 VC 포트폴리오, 정부지원사업 패턴)에 기반한 구체적·검증된 자문을 제공한다.

${persona}

[현재 도메인: ${cfg.title}]
${cfg.sys}

[멘토 스타일: ${mentorName}]
${styleGuide}
`;

  if(profileJson){
    sys += `\n[스타트업 프로필]\n${profileJson}\n이 스타트업 상황에 맞는 구체적 자문을 하라. 일반론 금지.\n`;
  } else {
    sys += `\n[프로필 미설정] 일반적인 스타트업 관점에서 답하되, 프로필 설정을 권유하라.\n`;
  }

  if(uploadedDocs.filter(f=>f.status==='ok').length){
    const names=uploadedDocs.filter(f=>f.status==='ok').map(f=>f.name).join(', ');
    sys+=`\n[첨부 자료: ${names}] — 자료를 적극 참조하여 구체적 맞춤 자문 제공.\n`;
  }

  sys+=`
[가드레일] 스타트업/창업/경영/투자 외 질문은 정중히 거절 후 자문 가능 분야 3~5개 제시.

[답변 구조 — 필수]
## Executive Summary
3~5문장. 핵심 결론·권고·우선순위.
## 근거 및 맥락
수치·가정·프레임워크·벤치마크·비교 사례.
## 실행 방안 (Action Plan)
즉시 실행 가능한 단계 (주/2주 단위 마일스톤 포함).
- "~할 수 있습니다" 대신 "~하세요" 직접 톤 유지.

[서식 규칙 — 엄수]
- 한글 변수·수식·지표명에 백틱(\`\`)을 쓰지 말 것. 백틱은 영문 코드·파일명·명령어에만 사용.
  (예: 나쁨 \`대상 기업 수\` × \`ARPU\`  / 좋음: **대상 기업 수 × ARPU**  또는  (대상 기업 수) × (ARPU))
- 수식은 괄호와 × ÷ = 기호로, 강조는 **굵게**로 표기.
- 순서가 있는 "실행 항목/단계 목록"은 마크다운 순서 목록(1. 2. 3.)을 써도 됨. ①②③ 같은 유니코드 원문자를 제목이나 리스트 머리에 쓰지 말 것. 본문 내 인라인 언급으로만 허용.
- **번호 리스트 규칙**:
  (a) 각 섹션(### 제목) 안에서 번호 리스트는 반드시 **1부터** 새로 시작한다.
      (섹션이 달라지면 새 ol을 만들어 1., 2., 3. ... 로. 이전 섹션의 번호를 이어가지 말 것.)
  (b) 항목이 **하나뿐**이면 번호 리스트를 쓰지 말고 그냥 본문 단락이나 불릿 한 줄로 쓸 것.
  (c) 같은 섹션 안에서 중간에 본문 단락이 끼어도 번호는 이어서 쓸 것(리스트를 쪼개지 말 것).
- **번호가 붙은 섹션 "제목"은 절대 리스트(-, 1.)로 쓰지 말 것.** 반드시 ### 또는 #### 헤딩으로.
  (나쁨: "- **1. 현 단계에서 CAC가 의미 없는 이유**" 다음 줄에 본문/표
   좋음: "### 1. 현 단계에서 CAC가 의미 없는 이유" 다음 줄에 본문/표)
  판단 기준: 뒤에 2줄 이상의 본문·표·하위 리스트가 따라오면 그건 "제목"이지 리스트가 아니다.
- 리스트 아이템 안에 **굵게**를 쓸 때, 그 아이템 전체가 굵게로만 구성되지 않도록 할 것.
  (예: "- **핵심 원칙**: 설명..." 처럼 콜론 뒤에 설명을 붙여 쓸 것)
- 표는 GitHub Flavored Markdown 표 문법만 사용. 표 셀 안에서 백틱 금지.
- 코드블록(\`\`\`)은 영문 코드/쿼리/JSON에만 사용. 한글 수식·정의문을 코드블록에 넣지 말 것.

[구분선 규칙] 본문 완료 후 부가문구(추천질문·CTA 등) 앞에만:
<<<NACHIM_TAIL>>>
`;
  return sys;
}

/* ─── 프로필 없으면 질문 전 안내 ─── */
function checkProfileBeforeSend(text){
  if(profile.industry) return true; // 프로필 있으면 통과
  // 프로필 없는 경우 — 안내 모달 표시
  const m = document.createElement('div');
  m.className = 'modal-bg open';
    m.style.zIndex = '9999';
  m.id = 'no-profile-modal';
  m.innerHTML = `
    <div class="modal" style="max-width:400px;text-align:center">
      <div style="font-size:36px;margin-bottom:12px">👤</div>
      <div class="modal-title">프로필을 설정하면 더 정확한 자문을 받을 수 있어요</div>
      <div class="modal-sub" style="text-align:left;line-height:1.7;margin-bottom:1rem">
        스타트업 단계, 업종, 핵심 고민을 입력하면:<br>
        ✅ <strong>맞춤형</strong> 자문 (일반론 → 나만의 조언)<br>
        ✅ <strong>멘토 스타일</strong>에 맞는 피드백 톤<br>
        ✅ <strong>도메인별</strong> 구체적 수치와 사례
      </div>
      <div style="display:flex;gap:8px">
        <button class="modal-btn" id="no-profile-skip" style="flex:1">일단 질문하기</button>
        <button class="modal-btn pri" onclick="document.getElementById('no-profile-modal').remove();editProfile();" style="flex:1">프로필 설정 →</button>
      </div>
    </div>`;
  document.body.appendChild(m);
  document.getElementById('no-profile-skip').onclick = () => {
    m.remove();
    localStorage.setItem('r01_profile_skip','1'); // 이번 세션은 스킵
    doSend(text);
  };
  m.addEventListener('click', e => { if(e.target===m) m.remove(); });
  return false;
}

/* ─── 메시지 전송 ──────────────────── */
async function send(){
  if(busy)return;
  const el=document.getElementById('input');
  const t=el.value.trim();
  if(!t && !chatPendingFiles.length)return;
  /* 프로필 미설정 체크 (이번 세션 스킵이면 통과) */
  if(!profile.industry && !localStorage.getItem('r01_profile_skip')){
    const blocked = checkProfileBeforeSend(t);
    if(!blocked){ el.value='';resize(el); return; }
  }
  el.value='';resize(el);
  await doSend(t);
}
async function quickAsk(t){if(!busy)await doSend(t);}

async function doSend(text){
  /* 요금제 한도 체크 — 프로토타입 단계에서는 비활성화.
     사용자가 직접 자기 Claude API 키를 입력해서 쓰므로 우리가 횟수를 제한할 근거가 없고,
     실서비스 전환 시(서버/DB 도입 시점) 다시 켜면 됨. */
  const PROTOTYPE_MODE = true;
  if(!PROTOTYPE_MODE){
    const curPlan = getCurrentPlan ? getCurrentPlan() : 'free';
    const planInfo = R01_PLANS ? R01_PLANS.find(p=>p.id===curPlan) : null;
    if(planInfo && planInfo.limit !== 99999){
      const usage = getMonthlyUsage ? getMonthlyUsage() : 0;
      if(usage >= planInfo.limit){
        const m = document.createElement('div');
        m.className = 'modal-bg open';
          m.style.zIndex = '9999';
        m.innerHTML = `<div class="modal" style="max-width:400px;text-align:center">
          <div style="font-size:32px;margin-bottom:12px">📊</div>
          <div class="modal-title">이번 달 질문 한도에 도달했어요</div>
          <div class="modal-sub">${planInfo.name} 플랜 월 ${planInfo.limit}회 사용 완료.<br>더 많은 자문이 필요하시면 업그레이드하세요.</div>
          <div style="display:flex;gap:8px;margin-top:1.25rem">
            <button class="modal-btn" onclick="this.closest('.modal-bg').remove()" style="flex:1">닫기</button>
            <button class="modal-btn pri" onclick="this.closest('.modal-bg').remove();openPricingModal();" style="flex:1">요금제 업그레이드 →</button>
          </div>
        </div>`;
        document.body.appendChild(m);
        m.addEventListener('click',e=>{if(e.target===m)m.remove();});
        return;
      }
    }
    /* 사용량 카운트 */
    if(incrementUsage) incrementUsage();
  }

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

    /* 토큰 최적화: 최근 6턴(12메시지)만 유지 */
    let convo=messages.slice(-12);
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
      /* DEBUG: trace what goes into saveHistory to catch id-as-content bug */
      try{
        const looksLikeId=/^a\d{13}[a-z0-9]{5,}$/.test(finalText);
        if(looksLikeId || finalText.length < 30){
          console.warn('[doSend] suspicious finalText before saveHistory', {
            length: finalText.length,
            looksLikeId,
            first80: finalText.slice(0,80)
          });
        }
      }catch(e){}
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
    html=collapseAdjacentHrs(html);
    html=normalizeOrderedListNumbering(html);
    return html;
  }
  return collapseAdjacentHrs(renderMDFallback(src));
}

/* 연속된 HR(공백·빈 p 사이 포함)을 하나로 줄임 — AI의 --- 와 우리의 NACHIM_TAIL HR 중복 방지 */
function collapseAdjacentHrs(html){
  const s=String(html||'');
  /* 두 번째 이후의 <hr>(class 포함)과 그 사이의 빈 단락·공백만 제거 */
  return s.replace(/(<hr\b[^>]*>)((?:\s|<p>\s*<\/p>)*<hr\b[^>]*>)+/gi, '$1');
}

/* 번호 리스트 정상화:
   - ol의 start 속성 제거
   - 항목 1개뿐인 ol은 data-single 마크 → CSS에서 마커 숨김
   - li가 실질적 "섹션 제목"이면 data-section-heading 부여
     판정: (a) li 첫 줄이 짧고(~70자) + (b) 뒤에 블록 콘텐츠(p/table/ul/ol/blockquote)가 이어짐
     '첫 줄' 추출 방식을 DOM 구조에 의존하지 않고 textContent로 보기 때문에
     <li>바로 텍스트</li>, <li><p>텍스트</p>...</li>, <li><strong>텍스트</strong>...</li> 모두 대응. */
function normalizeOrderedListNumbering(html){
  try{
    const tmp=document.createElement('div');
    tmp.innerHTML=String(html||'');

    tmp.querySelectorAll('ol').forEach(ol=>{
      const liCount=[...ol.children].filter(c=>c.tagName==='LI').length;
      if(liCount<=1){
        /* 단일 항목 ol이라도, 앞뒤에 blockquote/표/hr 등으로 쪼개진 다른 ol이 있어서
           리스트가 연속되는 경우엔 data-single을 붙이지 않는다.
           marked는 이런 경우 start="2" 같이 번호 연속성을 이미 주므로 그대로 유지. */
        const hasStart = ol.hasAttribute('start') && parseInt(ol.getAttribute('start'),10) > 1;
        /* 인접 sibling 중 (공백/단순 p/blockquote/table/hr을 건너뛴 후) 또 다른 ol이 있으면 연속. */
        const SKIP=new Set(['BLOCKQUOTE','TABLE','HR','P']);
        let prev=ol.previousElementSibling;
        while(prev && SKIP.has(prev.tagName)) prev=prev.previousElementSibling;
        let next=ol.nextElementSibling;
        while(next && SKIP.has(next.tagName)) next=next.nextElementSibling;
        const partOfChain = hasStart || (prev && prev.tagName==='OL') || (next && next.tagName==='OL');
        if(partOfChain){
          /* 체인의 일부 — start는 유지, data-single 금지 */
          return;
        }
        ol.removeAttribute('start');
        ol.setAttribute('data-single','1');
      }
      /* 다항목 ol은 start 속성 유지 — 번호 연속성 보장. */
    });

    /* H3/H4 제목이 이미 숫자로 시작하면(예: "1. 단계별 KPI", "3~4주차: IR") 
       CSS의 ::before 불릿 점은 '번호 옆 또 불릿'처럼 보여 가독성을 해침.
       다양한 번호 표기를 모두 감지해 data-numbered 부여. */
    tmp.querySelectorAll('h2, h3, h4').forEach(h=>{
      const txt=(h.textContent||'').trim();
      // 숫자 또는 숫자범위(1~2, 3-4, 3·4, 3,4)로 시작 + 마침표/괄호/한국어 섹션 단위
      const numHead = /^\d+(\s*[~\-–—·,]\s*\d+)?(\s*[.)]|(주차|단계|주|장|부|편|절|단원|차시|교시|챕터|part|week)\b)/i;
      if(numHead.test(txt)){
        h.setAttribute('data-numbered','1');
      }
    });

    const BLOCK_TAGS = new Set(['P','TABLE','UL','OL','BLOCKQUOTE','DIV','PRE','H1','H2','H3','H4','H5','H6']);

    /* AI가 리스트 항목 아래에 4공백 들여쓰기로 "새 섹션 제목(**...**)" 이나
       "2주 후 판단 기준" 같은 heading을 박아놓으면 marked는 그것들을 해당 li 안에 중첩시킴.
       의미·내보내기가 어긋나므로, li 안의 "명백한 새 섹션 시작점"과
       그 뒤에 이어지는 블록(ul/ol/p/blockquote)을 ol/ul 형제 뒤로 꺼내 루트 레벨로 승격.
       승격 시작점 판정:
         - <p><strong>...</strong></p> 단독 (AI가 쓰는 비공식 제목)
         - <h1>~<h6>
       이 시작점을 못 찾으면 li는 건드리지 않음 (→ 본문 설명/예시 blockquote 보존). */
    function isHoistStart(el){
      const tag = el.tagName;
      if(['H1','H2','H3','H4','H5','H6'].includes(tag)) return true;
      if(tag==='P'){
        const children = [...el.childNodes].filter(n=>{
          if(n.nodeType===3) return (n.nodeValue||'').trim().length>0;
          return true;
        });
        if(children.length===1 && children[0].nodeType===1 && children[0].tagName==='STRONG') return true;
      }
      return false;
    }
    const liList = [...tmp.querySelectorAll('li')];
    liList.forEach(li=>{
      const parent = li.parentElement;
      if(!parent || (parent.tagName!=='OL' && parent.tagName!=='UL')) return;
      if(parent.parentElement && parent.parentElement.tagName==='LI') return;
      const children = [...li.children].filter(c=>BLOCK_TAGS.has(c.tagName));
      if(children.length < 2) return;
      /* 첫 블록 이후에서 첫 번째 "섹션 시작점" 찾음 */
      let startIdx = 1;
      while(startIdx < children.length && !isHoistStart(children[startIdx])) startIdx++;
      if(startIdx >= children.length) return;
      /* startIdx부터 li 끝까지 전부 꺼내서 순서를 유지한 채 ol/ul 뒤에 삽입 */
      const toHoist = children.slice(startIdx);
      const refNode = parent.nextSibling;
      toHoist.forEach(el=>{
        li.removeChild(el);
        parent.parentElement.insertBefore(el, refNode);
      });
    });

    return tmp.innerHTML;
  }catch(e){
    return html;
  }
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

/* `**3. 제목**나머지` 처럼 번호가 굵게로 감싸이면 목록이 아니라 <p>로만 파싱됨 → `3. **제목**나머지` 로 바꿔 번호 목록으로 인식.
   주의: 마지막 캡처는 같은 줄만(개행 제외). 이전에 [\s\S]*로 greedy 매칭해서 문서 전체를 집어삼켜 첫 매치 이후 두번째 "**2. ...**" 라인이 처리되지 않는 버그가 있었음. */
function fixBoldWrappedOrderedListLines(md){
  const chunks=String(md||'').split(/(```[\s\S]*?```)/g);
  return chunks.map((chunk,i)=>{
    if(i%2===1) return chunk;
    return chunk.replace(/^(\s*)\*\*(\d{1,3}\.\s+)((?:[^*\n]|\*(?!\*))+?)\*\*([^\n]*)$/gm,(m,sp,num,emb,rest)=>{
      const tail=rest||'';
      return `${sp}${num}**${emb}**${tail}`;
    });
  }).join('');
}

function preprocessMarkdown(src){
  let s=String(src||'');
  s=neutralizeAsciiTildesOutsideCodeFences(s);
  s=fixBoldWrappedOrderedListLines(s);
  /* 모델 구분선: 채팅 UI에는 HR로 표시(내보내기에서는 prepareMarkdownForExport에서 삭제됨).
     AI가 TAIL 직전·직후에 자기 스스로 '---' 마크다운 구분선을 추가로 넣는 경우가 있어
     쌍선으로 보이는 문제 → TAIL과 인접한 --- 선은 TAIL로 흡수. */
  s=s.replace(/(^|\n)\s*-{3,}\s*\n(\s*<<<NACHIM_TAIL>>>)/g, '$1$2');
  s=s.replace(/(<<<NACHIM_TAIL>>>\s*)\n\s*-{3,}\s*(\n|$)/g, '$1$2');
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
const EXPORT_DOC_STYLES=`body{font-family:system-ui,-apple-system,"Segoe UI","Apple SD Gothic Neo","Malgun Gothic","맑은 고딕",Arial,sans-serif;font-size:10.5pt;line-height:1.7;margin:0;background:#f5f5f7;color:#1d1d1f;letter-spacing:-0.008em}
.brand{font-weight:700;letter-spacing:-0.03em;font-style:normal}
.page{padding:1.8cm 2cm}
.card{background:#fff;border:none;border-radius:12px;padding:26px 30px;box-shadow:none}
.title{font-size:22px;color:#1d1d1f;margin:0 0 6px;font-weight:700;letter-spacing:-.028em;line-height:1.25}
.meta{font-size:12px;color:#6e6e73;margin:0 0 20px;padding-bottom:14px;border-bottom:1px solid #e5e5ea}
.content{max-width:100%}
p{margin:0 0 14px;color:#1d1d1f}
strong{font-weight:700;color:#1d1d1f}
em{font-style:italic;color:#1d1d1f}
/* 제목 계층 — 화면과 동일 (본문 14 → h4 16 → h3 18 → h2 20 → h1 24, pt 환산) */
h1{font-size:18pt;font-weight:700;color:#1d1d1f;margin:18pt 0 10pt;letter-spacing:-0.02em;line-height:1.3}
h2{font-size:15pt;font-weight:800;color:#1d1d1f;margin:20pt 0 10pt;padding:2pt 0 2pt 10pt;border-left:3.5pt solid #8B1A1A;line-height:1.35;letter-spacing:-0.015em}
h2:first-child{margin-top:4pt}
h3{font-size:13.5pt;font-weight:700;color:#1d1d1f;margin:14pt 0 6pt;letter-spacing:-0.01em}
h4{font-size:12pt;font-weight:700;color:#1d1d1f;margin:12pt 0 5pt}
/* 리스트 — 마커 검정으로 통일 */
ul,ol{margin:8pt 0 12pt;padding-left:24pt}
li{margin-bottom:5pt;line-height:1.68}
ul{list-style-type:disc}
ol{list-style-type:decimal}
ul li::marker{color:#1d1d1f;font-weight:700}
ol li::marker{color:#1d1d1f;font-weight:700}
li > p{margin:0 0 4pt}
li > p:last-child{margin-bottom:0}
/* 인용구 — 이탤릭 + 회색 좌측 막대 + 대칭 여백 */
blockquote{margin:14pt 0;padding:10pt 14pt;border-left:3pt solid #d2d2d7;background:#f7f8fb;border-radius:0 6pt 6pt 0;color:#1d1d1f;font-size:10.5pt;line-height:1.6;font-style:italic;-webkit-print-color-adjust:exact;print-color-adjust:exact}
blockquote p{margin:0 0 6pt;color:#1d1d1f;font-style:italic}
blockquote p:first-child{margin-top:0}
blockquote p:last-child{margin-bottom:0}
blockquote > *:first-child{margin-top:0}
blockquote > *:last-child{margin-bottom:0}
/* 표 — 레드 헤더만 유지, 나머지 중성 톤 */
table{width:100%;border-collapse:collapse;border:1px solid #d2d2d7;margin:12pt 0;border-radius:6pt;overflow:hidden;font-size:10.5pt}
th,td{border:1px solid #e5e5ea;padding:6pt 10pt;vertical-align:middle;line-height:1.5;text-align:left}
thead th{background:#8B1A1A !important;color:#fff !important;font-size:10.5pt;font-weight:700;text-align:center;letter-spacing:-0.005em;-webkit-print-color-adjust:exact;print-color-adjust:exact;border-color:#8B1A1A}
tbody td:first-child{font-weight:600;color:#1d1d1f}
tbody tr:nth-child(even) td{background:#fdfafa}
tbody tr:nth-child(odd) td{background:#ffffff}
caption{caption-side:top;text-align:left;font-weight:700;color:#1d1d1f;font-size:10.5pt;margin:0 0 5pt;letter-spacing:-0.005em}
/* 링크 — 검정 + 밑줄 (파란색 제거) */
a{color:#1d1d1f;text-decoration:underline}
/* 구분선 */
hr{border:0;height:1px;background:rgba(0,0,0,0.08);margin:16pt 0}
/* 코드 */
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono","Apple SD Gothic Neo","Malgun Gothic","맑은 고딕",sans-serif;font-style:normal;font-size:0.95em;font-weight:400;background:#f5f5f7;padding:1pt 5pt;border-radius:4pt;border:1px solid #e8e8ed;color:#1d1d1f}
pre{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono","Apple SD Gothic Neo","Malgun Gothic","맑은 고딕",sans-serif;font-size:10pt;font-style:normal;line-height:1.6;background:#f5f5f7;color:#1d1d1f;border-radius:6pt;padding:10pt 12pt;overflow:auto;border:1px solid #d2d2d7;margin:10pt 0}
pre code{font-family:inherit;font-style:normal;font-size:inherit;font-weight:400;background:transparent;border:none;padding:0;color:inherit}`;

function buildExportDocumentHtml(title,meta,bodyHtml,extraCss){
  const x=extraCss?String(extraCss):'';
  /* 'Route01' 텍스트를 .brand 스팬으로 감싸 폰트 통일 — esc() 이후에 치환해야 안전 */
  const brandify = (s) => String(s||'').replace(/Route01/g,'<span class="brand">Route01</span>');
  const titleHtml = brandify(esc(title));
  const metaHtml = brandify(esc(meta));
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${EXPORT_DOC_STYLES}${x}</style></head><body><div class="page"><div class="card"><div class="title">${titleHtml}</div><div class="meta">${metaHtml}</div><div class="content">${bodyHtml}</div></div></div></body></html>`;
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
    'th{background:#8B1A1A !important;color:#ffffff !important;font-weight:700;text-align:center;-webkit-print-color-adjust:exact;}',
    'tbody td:first-child{font-weight:600;color:#1d1d1f;}',
    'tbody tr:nth-child(even) td{background:#fdfafa;}',
    'tbody tr:nth-child(odd) td{background:#ffffff;}',
    'code{font-family:Consolas,Menlo,monospace;font-size:10.5pt;background:#f5f5f7;border:1px solid #d2d2d7;padding:1pt 4pt;border-radius:6pt;color:#1d1d1f;}',
    'pre{font-family:Consolas,Menlo,monospace;font-size:10.5pt;line-height:1.55;background:#f5f5f7;color:#1d1d1f;border-radius:8pt;padding:10pt 12pt;overflow:auto;margin:0 0 15pt 0;border:1px solid #d2d2d7;}',
    'pre code{background:transparent;border:none;padding:0;color:inherit;}',
    'hr{border:none;border-top:1px solid #d2d2d7;margin:14pt 0;}',
    'a{color:#1d1d1f;text-decoration:underline;}'
  ].join('\n');

  const brandify = (s) => String(s||'').replace(/Route01/g,'<span class="brand">Route01</span>');
  const wrapperStart=[
    '<div class="Section1">',
    '<div class="wrap">',
    '<div class="header">',
    `<div class="header-title">${brandify(esc(docTitle))}</div>`,
    `<p class="header-meta">${brandify(esc(meta))}</p>`,
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
  const cur=profile.style||'Paul Graham (YC)';
  /* 프로토타입 단계: 전체 멘토 개방 */
  const PROTOTYPE_MODE = true;
  const plan = getCurrentPlan ? getCurrentPlan() : 'free';
  const isPaid = PROTOTYPE_MODE ? true : (plan === 'starter' || plan === 'pro' || plan === 'team');

  grid.innerHTML = Object.keys(MENTOR_META).map(k => {
    const m = MENTOR_META[k];
    const isSel = k === cur;
    const isLocked = !m.free && !isPaid;
    return `<div class="ob-mentor-row ${isSel?'sel':''} ${isLocked?'ob-mentor-row--locked':''}" data-style="${esc(k)}" style="cursor:pointer">
      <div class="ob-mentor-row-left">
        <span class="ob-mentor-row-emoji">${m.emoji}</span>
        <div class="ob-mentor-row-info">
          <div class="ob-mentor-row-name">${esc(k.split(' (')[0])} <span class="ob-mentor-row-tag" style="background:${m.tagColor}18;color:${m.tagColor}">${m.tag}</span>${isSel?'<span style="margin-left:6px;font-size:11px;color:var(--cta);font-weight:700">✓ 선택됨</span>':''}</div>
          <div class="ob-mentor-row-kw">${esc(m.headline)}</div>
          <div class="ob-mentor-row-desc">${esc(m.desc)}</div>
        </div>
      </div>
      ${PROTOTYPE_MODE ? '' : `<div class="ob-mentor-row-badge ${m.free?'free-badge':'pro-badge'}">${m.free?'FREE':'PRO'}</div>`}
    </div>`;
  }).join('');

  grid.querySelectorAll('[data-style]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const s = btn.getAttribute('data-style');
      /* 프로토타입 단계: 무조건 선택 허용 */
      if(PROTOTYPE_MODE){ setMentorStyle(s); return; }
      const meta = MENTOR_META[s];
      const pl = getCurrentPlan ? getCurrentPlan() : 'free';
      const paid = (pl === 'starter' || pl === 'pro' || pl === 'team');
      if(meta && !meta.free && !paid){
        closeStyleModal();
        openPricingModal();
        return;
      }
      setMentorStyle(s);
    });
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
  // 멘토 변경 피드백
  const m = MENTOR_META[s];
  if(m){
    const toast = document.createElement('div');
    toast.style.cssText='position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:#1d1d1f;color:#fff;padding:10px 20px;border-radius:20px;font-size:13px;z-index:9999;pointer-events:none;opacity:0;transition:opacity .25s';
    toast.textContent = `${m.emoji} ${s} 스타일로 변경됐습니다`;
    document.body.appendChild(toast);
    requestAnimationFrame(()=>{ toast.style.opacity='1'; });
    setTimeout(()=>{ toast.style.opacity='0'; setTimeout(()=>toast.remove(),300); }, 2000);
  }
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
  safeOn('concern-in', 'oninput', e => { ob.concern=e.target.value.trim(); validate(); });

  /* 모달 배경 클릭 닫기 */
  const safeClick = (id, fn) => { const el=document.getElementById(id); if(el) el.addEventListener('click', e=>{ if(e.target===el) fn(); }); };
  safeClick('modal',          closeModal);
  safeClick('key-modal',      closeKeyModal);
  safeClick('style-modal',    closeStyleModal);
  safeClick('auth0-modal',    closeAuth0Settings);
  safeClick('grant-modal',    closeGrantModal);
  safeClick('confirm-modal',  closeConfirm);
  safeClick('hist-modal',     closeHistModal);
  safeClick('mypage-modal',   closeMyPage);
  safeClick('pricing-modal',  closePricingModal);
  safeClick('pw-change-modal',closePwChange);
  safeClick('withdraw-modal', closeWithdraw);

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

  // 마지막 질문 텍스트 추출 (최대 60자)
  const lastUserMsg = [...messages].reverse().find(m=>m.role==='user');
  const qText = lastUserMsg
    ? (lastUserMsg.content.length > 60
        ? lastUserMsg.content.slice(0,60)+'…'
        : lastUserMsg.content)
    : '';
  const title = qText ? `Route01 AI 자문 — ${qText}` : 'Route01 AI 자문';
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

    /* Word 호환 altChunk용 스타일(HEX + 고정 폰트) + 인라인 보강 — 컨설팅 리포트 톤 (화면과 동기화) */
    const htmlStyle=[
      'body{margin:0;background:#ffffff;color:#1d1d1f;font-family:"Malgun Gothic","맑은 고딕",Arial,sans-serif !important;font-size:10.5pt;line-height:1.7;}',
      '.wrap{padding:0;}',
      '.header{padding:0 0 14pt 0;border-bottom:1px solid #e5e5ea;margin:0 0 18pt 0;}',
      '.header-title{font-size:20pt;font-weight:700;letter-spacing:-0.3pt;margin:0 0 6pt 0;color:#1d1d1f;line-height:1.3;}',
      '.header-meta{font-size:10pt;color:#6e6e73;margin:0;line-height:1.4;}',
      'p{margin:0 0 11pt 0;color:#1d1d1f;}',
      /* 제목 — 색은 전부 검정, 크기 사다리는 화면 14/16/18/20/24 에 비례 */
      'h1,h2,h3,h4{font-family:"Malgun Gothic","맑은 고딕",Arial,sans-serif !important;color:#1d1d1f;letter-spacing:-0.2pt;}',
      'h1{font-size:18pt;font-weight:700;margin:18pt 0 10pt 0;line-height:1.3;}',
      /* H2: 섹션 제목 — 좌측 브랜드 레드 세로 막대 유지 */
      'h2{font-size:15pt;font-weight:800;color:#1d1d1f;margin:18pt 0 9pt 0;padding:2pt 0 2pt 10pt;border-left:3pt solid #8B1A1A;line-height:1.35;}',
      /* H3: 소제목 — 색 검정 (네이비 제거) */
      'h3{font-size:13.5pt;font-weight:700;color:#1d1d1f;margin:13pt 0 6pt 0;}',
      'h4{font-size:12pt;font-weight:700;color:#1d1d1f;margin:11pt 0 5pt 0;}',
      'strong{font-weight:700;color:#1d1d1f;}',
      'em{font-style:italic;color:#1d1d1f;}',
      '.brand{font-weight:700;letter-spacing:-0.3pt;}',
      'ul,ol{padding-left:24pt;margin:7pt 0 11pt 0;}',
      'li{margin-bottom:4pt;line-height:1.65;color:#1d1d1f;}',
      /* 마커 — 검정으로 통일 */
      'ul li::marker{color:#1d1d1f;font-weight:700;}',
      'ol li::marker{color:#1d1d1f;font-weight:700;}',
      /* 인용구 — 이탤릭 + 회색 좌측 막대 + 대칭 여백 */
      'blockquote{margin:11pt 0;padding:9pt 13pt;border-left:3pt solid #d2d2d7;background:#f7f8fb;color:#1d1d1f;font-size:10.5pt;line-height:1.6;font-style:italic;}',
      'blockquote p{margin:0 0 5pt 0;color:#1d1d1f;font-style:italic;}',
      'blockquote p:first-child{margin-top:0;}',
      'blockquote p:last-child{margin-bottom:0;}',
      /* Word change-bar(변경 추적 세로선) 방어 — H2는 예외(브랜드 레드 막대 유지) */
      'ul,ol,li,p,span,div,strong,em,a,code,h1,h3,h4,h5,h6{border-left:none !important;mso-border-left-alt:none !important;mso-border-between:none !important;}',
      'ins,del{text-decoration:none !important;border:none !important;background:transparent !important;mso-border-left-alt:none !important;}',
      /* 표 — 레드 헤더만 유지, 나머지 중성 */
      'table{border-collapse:collapse;width:100%;border:1px solid #d2d2d7;margin:11pt 0;font-family:"Malgun Gothic","맑은 고딕",Arial,sans-serif !important;}',
      'th{background:#8B1A1A !important;color:#ffffff !important;padding:5pt 10pt;border:1px solid #8B1A1A;vertical-align:middle;text-align:center !important;font-weight:700;font-size:10.5pt;line-height:1.4;-webkit-print-color-adjust:exact;print-color-adjust:exact;font-family:"Malgun Gothic","맑은 고딕",Arial,sans-serif !important;mso-line-height-rule:exactly;mso-para-margin:0;}',
      'td{padding:5pt 10pt;border:1px solid #e5e5ea;vertical-align:middle;text-align:left;line-height:1.5;font-size:10.5pt;font-family:"Malgun Gothic","맑은 고딕",Arial,sans-serif !important;mso-line-height-rule:exactly;mso-para-margin:0;color:#1d1d1f;}',
      'tbody td:first-child{font-weight:600;color:#1d1d1f;}',
      'tbody tr:nth-child(even) td{background:#fdfafa;}',
      'tbody tr:nth-child(odd) td{background:#ffffff;}',
      'caption{caption-side:top;text-align:left;font-weight:700;color:#1d1d1f;font-size:10.5pt;margin:0 0 5pt 0;}',
      'code{font-family:Consolas,Menlo,monospace,"Malgun Gothic","맑은 고딕";font-style:normal;font-size:10pt;background:#f5f5f7;border:1px solid #e5e5ea;padding:1pt 5pt;border-radius:4pt;color:#1d1d1f;}',
      'pre{font-family:Consolas,Menlo,monospace,"Malgun Gothic","맑은 고딕";font-style:normal;font-size:10pt;line-height:1.6;background:#f5f5f7;color:#1d1d1f;border-radius:6pt;padding:10pt 12pt;overflow:auto;margin:0 0 11pt 0;border:1px solid #d2d2d7;}',
      'pre code{background:transparent;border:none;padding:0;color:inherit;font-style:normal;}',
      'hr{border:none;border-top:1px solid #e5e5ea;margin:14pt 0;}',
      /* 링크 — 검정 + 밑줄 */
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

      // 1b. 인용구 → 1행 2열 테이블 변환 (Word에서 좌측 막대-배경 갭 제거)
      //     반드시 아래 '표 후처리' 이전에 실행해야 data-from 마커가 의미를 가짐.
      doc.querySelectorAll('blockquote').forEach(bq => {
        const innerHTML = bq.innerHTML;

        /* 상단 간격 확보용 빈 단락 — Word는 테이블들 사이 기본 margin을 무시하는 경향이 있어
           빈 <p>를 spacer로 삽입하면 확실히 세로 여백이 생김. */
        const spacerTop = doc.createElement('p');
        spacerTop.style.margin = '0';
        spacerTop.style.padding = '0';
        spacerTop.style.fontSize = '6pt';
        spacerTop.style.lineHeight = '1';
        spacerTop.innerHTML = '&nbsp;';

        const spacerBottom = spacerTop.cloneNode(true);

        const tbl = doc.createElement('table');
        tbl.setAttribute('cellspacing', '0');
        tbl.setAttribute('cellpadding', '0');
        tbl.setAttribute('border', '0');
        tbl.setAttribute('data-from', 'blockquote');
        /* 일반 본문 표와 동일한 폭 — 100%. 좌우 margin 0으로 표들과 좌우 정렬 일치.
           본문 표는 1px 테두리를 가지므로 외곽선 위치를 맞추기 위해 동일한 두께의
           투명 테두리를 부여 — 시각적으로 폭이 동일해짐. */
        tbl.style.width = '100%';
        tbl.style.marginLeft = '0';
        tbl.style.marginRight = '0';
        tbl.style.marginTop = '0';
        tbl.style.marginBottom = '0';
        tbl.style.borderCollapse = 'collapse';
        tbl.style.border = '1px solid transparent';
        tbl.setAttribute('role', 'presentation');
        /* Word 고유 spacing/padding 명시적으로 0 — 셀 간 및 테두리-내용 간 간격 완전 제거 */
        const prevTblStyle = tbl.getAttribute('style') || '';
        tbl.setAttribute('style', prevTblStyle + ';mso-cellspacing:0;mso-padding-alt:0pt 0pt 0pt 0pt;mso-yfti-tbllook:0;');

        const tr = doc.createElement('tr');

        const bar = doc.createElement('td');
        bar.style.width = '3pt';
        bar.style.minWidth = '3pt';
        bar.style.padding = '0';
        bar.style.margin = '0';
        bar.style.backgroundColor = '#d2d2d7';
        bar.style.border = 'none';
        bar.style.setProperty('-webkit-print-color-adjust', 'exact');
        bar.style.setProperty('print-color-adjust', 'exact');
        bar.innerHTML = '&nbsp;';
        bar.style.fontSize = '1pt';
        bar.style.lineHeight = '1';

        const body = doc.createElement('td');
        body.style.padding = '10pt 13pt';
        body.style.backgroundColor = '#f7f8fb';
        body.style.border = 'none';
        body.style.color = '#1d1d1f';
        body.style.fontStyle = 'italic';
        body.style.setProperty('-webkit-print-color-adjust', 'exact');
        body.style.setProperty('print-color-adjust', 'exact');
        body.innerHTML = innerHTML;

        const innerPs = body.querySelectorAll(':scope > p');
        innerPs.forEach((p, i) => {
          p.style.margin = '0';
          p.style.color = '#1d1d1f';
          p.style.fontStyle = 'italic';
          if (i > 0) p.style.marginTop = '5pt';
        });

        tr.appendChild(bar);
        tr.appendChild(body);
        tbl.appendChild(tr);

        /* blockquote를 spacerTop + table + spacerBottom 순으로 교체 */
        const parent = bq.parentNode;
        parent.insertBefore(spacerTop, bq);
        parent.insertBefore(tbl, bq);
        parent.insertBefore(spacerBottom, bq);
        parent.removeChild(bq);
      });

      // 2. 표(Table) 완벽 제어 (blockquote를 table로 변환한 것은 제외)
      doc.querySelectorAll('table:not([data-from="blockquote"])').forEach(tbl => {
        tbl.style.borderCollapse = 'collapse';
        tbl.style.width = '100%';
        tbl.style.marginBottom = '15pt';
        /* Word: 헤더 행을 다음 페이지에 자동 반복하지 않도록 시도.
           (Word는 tblHeader 속성으로 제어하지만 altChunk HTML에서는 mso-yfti-tbllook으로 힌트 제공) */
        tbl.setAttribute('cellspacing','0');
        tbl.setAttribute('cellpadding','0');
        const tblStyle = tbl.getAttribute('style') || '';
        tbl.setAttribute('style', tblStyle + ';mso-cellspacing:0;mso-yfti-tbllook:0;mso-padding-alt:0pt 0pt 0pt 0pt;');
      });
      doc.querySelectorAll('table:not([data-from="blockquote"]) th').forEach(th => {
        th.style.setProperty('background-color', '#8B1A1A', 'important');
        th.style.setProperty('color', '#ffffff', 'important');
        th.style.padding = '4pt 8pt';
        th.style.border = '1px solid #8B1A1A';
        th.style.textAlign = 'center';
        th.style.fontWeight = '700';
        th.style.fontSize = '10.5pt';
        th.style.lineHeight = '1.25';
        th.style.verticalAlign = 'middle';
        /* Word 줄 높이/단락 간격 정확도 강제 */
        const prev = th.getAttribute('style') || '';
        th.setAttribute('style', prev + ';mso-line-height-rule:exactly;mso-line-height-alt:14pt;mso-para-margin:0;mso-para-margin-top:0;mso-para-margin-bottom:0;');
        // Word 색상 출력 강제
        th.setAttribute('bgcolor', '#8B1A1A');
      });
      doc.querySelectorAll('table:not([data-from="blockquote"]) td').forEach(td => {
        td.style.padding = '3pt 8pt';
        td.style.border = '1px solid #d2d2d7';
        td.style.verticalAlign = 'middle';
        td.style.lineHeight = '1.25';
        td.style.fontSize = '10.5pt';
        /* Word 행 높이 팽창 원인:
           1) <p> 태그의 기본 margin (1em top/bottom)
           2) mso-line-height-rule 미지정 시 큰 줄간격 기본값
           3) mso-para-margin 미지정 시 단락 사이 자동 간격
           이 셋을 모두 0 처리 */
        let inner = td.innerHTML
          .replace(/<p[^>]*>\s*/gi, '')       // <p> 열기 제거
          .replace(/\s*<\/p>/gi, '<br>')      // </p> → <br>
          .replace(/(<br\s*\/?>\s*)+$/gi, '') // 끝 <br> 제거
          .trim();
        td.innerHTML = inner || '&nbsp;';
        // 모든 자식 요소의 margin/padding 제거
        td.querySelectorAll('*').forEach(child => {
          child.style.margin = '0';
          child.style.padding = '0';
        });
        /* Word 줄 높이/단락 간격 정확도 강제 (셀 세로 팽창 방지의 핵심) */
        const prev = td.getAttribute('style') || '';
        td.setAttribute('style', prev + ';mso-line-height-rule:exactly;mso-line-height-alt:14pt;mso-para-margin:0;mso-para-margin-top:0;mso-para-margin-bottom:0;');
      });
      // tr에 고정 높이와 cantSplit 유사 힌트 (blockquote 변환 테이블은 제외)
      doc.querySelectorAll('table:not([data-from="blockquote"]) tr').forEach(tr => {
        tr.style.height = 'auto';
        const prev = tr.getAttribute('style') || '';
        tr.setAttribute('style', prev + ';mso-yfti-irow:0;page-break-inside:avoid;mso-row-cant-split:yes;');
      });
      // 행 단위 스트라이프 — 짝수 행 옅은 브랜드 레드, 홀수 행 흰색
      doc.querySelectorAll('table:not([data-from="blockquote"]) tbody tr').forEach((tr, idx) => {
        const tds = tr.querySelectorAll('td');
        /* :nth-child는 1-based. idx 0 = 첫 행 = odd = 흰색, idx 1 = even = 옅은 레드 */
        const bg = (idx % 2 === 0) ? '#ffffff' : '#fdfafa';
        tds.forEach(td => { td.style.backgroundColor = bg; });
        // 첫 열 — 굵기/색만 강조 (배경은 행 스트라이프 그대로)
        const firstTd = tr.querySelector('td');
        if(firstTd){
          firstTd.style.setProperty('font-weight', '600');
          firstTd.style.setProperty('color', '#1d1d1f');
        }
      });

      /* 헤더행 자동 반복 끄기: thead 안의 tr을 tbody 첫 행으로 이동.
         Word는 <thead><tr>을 "각 페이지에 반복할 행"으로 해석함. 표가 페이지를 넘길 때
         헤더가 뜬금없이 다시 나타나는 현상의 원인. 작은 표(3~5행)에서는 부자연스러우므로
         thead → tbody 병합. */
      doc.querySelectorAll('table:not([data-from="blockquote"])').forEach(tbl => {
        const thead = tbl.querySelector('thead');
        if(!thead) return;
        let tbody = tbl.querySelector('tbody');
        if(!tbody){
          tbody = doc.createElement('tbody');
          tbl.appendChild(tbody);
        }
        const rows = [...thead.querySelectorAll('tr')];
        // 역순으로 tbody 맨 앞에 삽입해서 원래 순서 유지
        for(let i = rows.length - 1; i >= 0; i--){
          tbody.insertBefore(rows[i], tbody.firstChild);
        }
        thead.remove();
      });

      // 3. (인용구 변환은 위 1b에서 이미 처리됨 — 이 위치에선 스킵)

      // 3b. h2 — 컨설팅 리포트 섹션 제목 (좌측 브랜드 레드 세로 막대 유지)
      doc.querySelectorAll('h2').forEach(h => {
        h.style.fontSize = '15pt';
        h.style.fontWeight = '800';
        h.style.color = '#1d1d1f';
        h.style.borderLeft = '3pt solid #8B1A1A';
        h.style.paddingLeft = '10pt';
        h.style.paddingTop = '2pt';
        h.style.paddingBottom = '2pt';
        h.style.margin = '18pt 0 9pt 0';
        h.style.lineHeight = '1.35';
      });
      // H3 — 검정 (네이비 제거)
      doc.querySelectorAll('h3').forEach(h => {
        h.style.fontSize = '13.5pt';
        h.style.fontWeight = '700';
        h.style.color = '#1d1d1f';
        h.style.margin = '13pt 0 6pt 0';
      });
      // H4 — 검정 (그레이 제거)
      doc.querySelectorAll('h4').forEach(h => {
        h.style.fontSize = '12pt';
        h.style.fontWeight = '700';
        h.style.color = '#1d1d1f';
        h.style.margin = '11pt 0 5pt 0';
      });

      // H1도 혹시 있으면 검정
      doc.querySelectorAll('h1').forEach(h => {
        h.style.fontSize = '18pt';
        h.style.fontWeight = '700';
        h.style.color = '#1d1d1f';
        h.style.margin = '18pt 0 10pt 0';
      });

      // em/i — 색 검정 (이탤릭으로 구분, 색 다르게 할 필요 없음)
      doc.querySelectorAll('em, i').forEach(el => {
        el.style.fontStyle = 'italic';
        el.style.setProperty('font-style', 'italic', 'important');
        el.style.color = '#1d1d1f';
      });

      // 5. <hr>이 Word에서 빨간 줄로 깨지는 문제 방지 (인라인화)
      doc.querySelectorAll('hr').forEach(hr => {
        hr.style.border = '0';
        hr.style.borderTop = '1px solid #d2d2d7';
        hr.style.margin = '15pt 0';
      });

      // 6. Word change-bar(변경 추적 빨간 세로선) 방어
      //    ① <ins>/<del> 태그는 Word가 "수정 제안"으로 해석해 왼쪽 여백에 빨간 막대를 그림 → 태그만 제거, 내용 유지
      doc.querySelectorAll('ins, del').forEach(el => {
        const parent = el.parentNode;
        if(!parent) return;
        while(el.firstChild) parent.insertBefore(el.firstChild, el);
        parent.removeChild(el);
      });
      //    ② 본문 블록/인라인 요소의 border-left와 mso-border-left-* 전부 제거 (표 셀/테두리는 예외)
      const stripLeftBorder = (st) => String(st||'')
        .replace(/\bborder-left(-[a-z-]+)?\s*:[^;]+;?/gi,'')
        .replace(/\bmso-border-left[a-z-]*\s*:[^;]+;?/gi,'')
        .replace(/\bmso-border-between\s*:[^;]+;?/gi,'')
        .replace(/;\s*;/g,';').replace(/^;|;$/g,'').trim();
      const FORCE_NO_LEFT = 'border-left:none !important;border-left-width:0 !important;mso-border-left-alt:none !important;mso-border-left-width:0pt !important;';
      doc.querySelectorAll('*').forEach(el => {
        const tag = el.tagName;
        // 표 관련 태그 + blockquote(의도된 파란 라인) + H2(의도된 레드 막대)는 건드리지 않음
        if(tag==='TD'||tag==='TH'||tag==='TABLE'||tag==='TBODY'||tag==='THEAD'||tag==='TFOOT'||tag==='TR'||tag==='COL'||tag==='COLGROUP'||tag==='BR'||tag==='HR'||tag==='BLOCKQUOTE'||tag==='H2') return;
        const prev = stripLeftBorder(el.getAttribute('style')||'');
        el.setAttribute('style', prev ? `${prev};${FORCE_NO_LEFT}` : FORCE_NO_LEFT);
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
      `<div class="header-title">${String(esc(docTitle)||'').replace(/Route01/g,'<span class="brand">Route01</span>')}</div>`,
      `<p class="header-meta">${String(esc(meta)||'').replace(/Route01/g,'<span class="brand">Route01</span>')}</p>`,
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


/* ══════════════════════════════════════
   신규 기능 — 이메일 로그인, 약관, 추천질문, 배너
   기존 launch()/send() 오버라이드 없이 DOMContentLoaded에서 후킹
══════════════════════════════════════ */

/* ── 이메일 인증 ── */
/* ── 탭 전환 ── */
function switchAuthTab(tab) {
  ['login','signup'].forEach(t => {
    document.getElementById('atab-'+t)?.classList.toggle('active', t===tab);
    const f = document.getElementById('aform-'+t);
    if(f) f.style.display = t===tab ? 'flex' : 'none';
  });
  // 인증/비밀번호찾기 화면도 숨김
  ['aform-verify','aform-forgot','aform-code'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.style.display='none';
  });
  ['aerr-login','aerr-signup','aerr-forgot','aerr-email-dup'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.textContent='';
  });
}

function togglePwEye(id, btn) {
  const inp = document.getElementById(id); if(!inp) return;
  inp.type = inp.type==='password' ? 'text' : 'password';
  btn.textContent = inp.type==='password' ? '👁' : '🙈';
}

function showForgotPw() {
  const fl = document.getElementById('aform-login'); if(fl) fl.style.display='none';
  const ff = document.getElementById('aform-forgot'); if(ff) ff.style.display='flex';
}

/* ── 계정 저장소 ── */
function _r01Accounts() {
  try{return JSON.parse(localStorage.getItem('r01_accs')||'[]');}catch(e){return[];}
}
function _saveR01Accounts(arr) { localStorage.setItem('r01_accs', JSON.stringify(arr)); }

/* 소셜 로그인으로 가입된 이메일인지 확인 (Auth0 캐시) */
function _isSocialEmail(email) {
  try {
    const raw = localStorage.getItem('nachim_auth');
    if(!raw) return false;
    const data = JSON.parse(raw);
    const u = data?.user;
    if(!u) return false;
    // Auth0 소셜 유저는 email 필드가 있고 sub가 google-oauth2|, apple|, naver| 등으로 시작
    const sub = u.sub||'';
    const uEmail = (u.email||'').toLowerCase();
    return uEmail === email.toLowerCase() && (
      sub.startsWith('google') || sub.startsWith('apple') ||
      sub.startsWith('naver') || sub.startsWith('kakao')
    );
  } catch(e){ return false; }
}

/* ── 이메일 로그인 ── */
function emailLogin() {
  const email = (document.getElementById('alogin-email')?.value||'').trim();
  const pw    = (document.getElementById('alogin-pw')?.value||'');
  const err   = document.getElementById('aerr-login');
  err.textContent = '';
  if(!email||!email.includes('@')) { err.textContent='올바른 이메일을 입력해주세요.'; return; }
  if(!pw) { err.textContent='비밀번호를 입력해주세요.'; return; }

  const accounts = _r01Accounts();
  const found = accounts.find(a=>a.email===email);
  if(!found) {
    err.textContent='가입되지 않은 이메일입니다. 회원가입을 해주세요.';
    return;
  }
  if(found.pw !== btoa(pw)) { err.textContent='비밀번호가 맞지 않습니다.'; return; }

  // 로그인 성공 — 기존 프로필 유지 (이메일 가입자의 프로필은 유지)
  setAuthed({email, name:found.nickname||email.split('@')[0], method:'email'});
  startAfterLogin();
}

/* ── 이메일 회원가입 ── */
function emailSignup() {
  const email = (document.getElementById('asignup-email')?.value||'').trim();
  const pw    = (document.getElementById('asignup-pw')?.value||'');
  const pw2   = (document.getElementById('asignup-pw2')?.value||'');
  const err   = document.getElementById('aerr-signup');
  err.textContent = '';
  // 이메일 바로 아래 중복 안내도 초기화
  const dupEl = document.getElementById('aerr-email-dup');
  if(dupEl) dupEl.textContent = '';

  if(!email||!email.includes('@')) { err.textContent='올바른 이메일을 입력해주세요.'; return; }
  if(pw.length<8) { err.textContent='비밀번호는 8자 이상이어야 합니다.'; return; }
  if(pw!==pw2) { err.textContent='비밀번호가 일치하지 않습니다.'; return; }
  if(!document.getElementById('agree-terms')?.checked) { err.textContent='이용약관에 동의해주세요.'; return; }
  if(!document.getElementById('agree-privacy')?.checked) { err.textContent='개인정보처리방침에 동의해주세요.'; return; }

  const accounts = _r01Accounts();

  // ① 이메일 가입 중복 체크
  if(accounts.find(a=>a.email===email)) {
    err.innerHTML='이미 이메일로 가입된 계정입니다.<br><button type="button" onclick="switchAuthTab(\'login\')" style="color:var(--link-blue);background:none;border:none;cursor:pointer;font-size:13px;text-decoration:underline;padding:0">로그인하기 →</button>';
    return;
  }

  // ② 소셜 계정 중복 체크 (같은 이메일로 구글/애플 등 로그인 이력 있는 경우)
  // localStorage에서 Auth0 소셜 사용자 이메일 목록 확인
  const socialUsed = _checkSocialUsedEmail(email);
  if(socialUsed) {
    err.innerHTML=`이 이메일은 이미 <strong>${socialUsed}</strong> 로그인으로 가입되어 있습니다.<br>해당 방법으로 로그인해 주세요.`;
    return;
  }

  // ③ 인증 코드 생성 및 인증 화면 전환
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  window._r01PendingSignup = { email, pw: btoa(pw), code, ts: Date.now() };

  // 인증 화면 표시
  const addrEl = document.getElementById('averify-addr'); if(addrEl) addrEl.textContent=email;
  const codeEl = document.getElementById('averify-demo-code');
  if(codeEl) {
    codeEl.textContent = code;
    codeEl.closest('.averify-demo-box').style.display='block';
  }
  const fs = document.getElementById('aform-signup'); if(fs) fs.style.display='none';
  const fv = document.getElementById('aform-verify'); if(fv) fv.style.display='flex';
  const ci = document.getElementById('averify-code-input'); if(ci) { ci.value=''; ci.focus(); }
  document.getElementById('averr-verify') && (document.getElementById('averr-verify').textContent='');
}

/* 소셜 이메일 사용 여부 확인 */
function _clearDupMsg() {
  var el = document.getElementById('aerr-email-dup');
  if(el) el.textContent = '';
}

function _showDupMsg(dupEl, msg, linkText) {
  // 기존 내용 초기화
  dupEl.innerHTML = '';

  // 메시지 줄
  var msgLine = document.createElement('div');
  msgLine.style.cssText = 'display:flex;align-items:center;gap:5px;margin-bottom:4px';
  msgLine.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' + msg;
  dupEl.appendChild(msgLine);

  // 로그인 버튼 줄
  var btnLine = document.createElement('div');
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = linkText;
  btn.style.cssText = 'color:var(--link-blue);background:none;border:none;cursor:pointer;font-size:12px;text-decoration:underline;padding:0;font-family:inherit';
  btn.addEventListener('click', function() { switchAuthTab('login'); });
  btnLine.appendChild(btn);
  dupEl.appendChild(btnLine);
}

function _checkSocialUsedEmail(email) {
  try {
    // r01_accs에서 소셜 method 확인 (setAuthed에서 저장됨)
    const accs = _r01Accounts();
    const found = accs.find(a => a.email && a.email.toLowerCase() === email.toLowerCase());
    if(found && found.method && found.method !== 'email') {
      const names = {
        'google-oauth2': 'Google',
        'apple': 'Apple',
        'naver': '네이버',
        'kakao': '카카오'
      };
      return names[found.method] || found.method;
    }
    // 보조: Auth0 캐시 확인
    const keys = Object.keys(localStorage).filter(k => k.includes('@@auth0spajs@@'));
    for(const k of keys) {
      try {
        const val = JSON.parse(localStorage.getItem(k)||'{}');
        const u = val?.body?.decodedPayload || val?.body?.user || {};
        if((u.email||'').toLowerCase() === email.toLowerCase()) {
          const sub = u.sub||'';
          if(sub.startsWith('google')) return 'Google';
          if(sub.startsWith('apple')) return 'Apple';
          if(sub.startsWith('naver')) return '네이버';
          if(sub.startsWith('kakao')) return '카카오';
        }
      } catch(e2){}
    }
  } catch(e){}
  return null;
}

/* ── 인증 코드 확인 ── */
function verifySignupCode() {
  const pending = window._r01PendingSignup;
  const codeInput = (document.getElementById('averify-code-input')?.value||'').trim();
  const errEl = document.getElementById('averr-verify');
  errEl && (errEl.textContent='');

  if(!pending) { errEl && (errEl.textContent='세션이 만료되었습니다. 다시 시도해주세요.'); return; }
  if(Date.now() - pending.ts > 10*60*1000) {
    errEl && (errEl.textContent='인증 시간이 초과되었습니다. 다시 가입해주세요.');
    window._r01PendingSignup = null;
    return;
  }
  if(codeInput !== pending.code) {
    errEl && (errEl.textContent='인증 코드가 올바르지 않습니다.');
    return;
  }

  // 인증 성공 — 계정 저장
  const accounts = _r01Accounts();
  accounts.push({email:pending.email, pw:pending.pw, ts:Date.now()});
  _saveR01Accounts(accounts);
  window._r01PendingSignup = null;

  // 신규 가입: 기존 프로필 초기화 후 온보딩으로
  localStorage.removeItem('vd_profile');
  setAuthed({email:pending.email, name:pending.email.split('@')[0], method:'email'});

  // 열려있는 모든 모달 닫기 (약관 팝업 등)
  document.querySelectorAll('.modal-bg.open').forEach(m => m.classList.remove('open'));
  closeTermsModal();

  // 인증 화면 닫고 온보딩으로
  document.getElementById('auth').classList.add('hidden');
  document.getElementById('onboarding').classList.remove('hidden');
  document.getElementById('app').style.display='none';
}

function resendVerify() {
  const pending = window._r01PendingSignup;
  if(!pending) { alert('세션이 만료되었습니다. 다시 가입해주세요.'); return; }
  // 새 코드 발급
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  pending.code = code; pending.ts = Date.now();
  const codeEl = document.getElementById('averify-demo-code');
  if(codeEl) codeEl.textContent = code;
  alert('새 인증 코드를 발송했습니다. (데모 화면에서 확인하세요)');
}

/* ── 비밀번호 찾기 ── */
function sendResetPw() {
  const email = (document.getElementById('aforgot-email')?.value||'').trim();
  const err   = document.getElementById('aerr-forgot');
  err.textContent = '';
  if(!email||!email.includes('@')) { err.textContent='올바른 이메일을 입력해주세요.'; return; }
  const accounts = _r01Accounts();
  if(!accounts.find(a=>a.email===email)) { err.textContent='가입되지 않은 이메일입니다.'; return; }
  alert(email+'으로 비밀번호 재설정 링크를 발송했습니다.');
  switchAuthTab('login');
}

/* ── 약관 체크박스 ── */
function toggleAllTerms(el) {
  ['agree-terms','agree-privacy','agree-marketing'].forEach(id=>{
    const c=document.getElementById(id); if(c) c.checked=el.checked;
  });
}
function syncAllCheck() {
  const a = document.getElementById('agree-all');
  if(a) a.checked = !!(
    document.getElementById('agree-terms')?.checked &&
    document.getElementById('agree-privacy')?.checked &&
    document.getElementById('agree-marketing')?.checked
  );
}

/* ── 약관 모달 ── */
const R01_TERMS = {
  terms:{title:'이용약관',html:`<h3>제1조 (목적)</h3><p>본 약관은 <span class="brand">Route01</span>이 제공하는 AI 스타트업 자문 서비스의 이용 조건 및 회사와 이용자의 권리·의무를 규정합니다.</p><h3>제2조 (서비스 제공)</h3><p><span class="brand">Route01</span>은 AI 기반 스타트업 경영·투자·법률·재무·마케팅 자문 서비스를 제공합니다.</p><h3>제3조 (AI 서비스 한계 및 면책)</h3><ol><li><span class="brand">Route01</span> AI 자문은 참고용 정보 제공을 목적으로 하며, 전문적 자문을 대체하지 않습니다.</li><li>AI 답변은 부정확하거나 불완전할 수 있으며, 회사는 정확성을 보증하지 않습니다.</li><li>중요한 의사결정 전에는 전문가와 상담해야 합니다.</li></ol><h3>제4조 (이용자 의무)</h3><p>이용자는 관련 법령 및 본 약관을 준수해야 합니다.</p><h3>제5조 (요금제)</h3><ol><li>Free: 월 20회 무료</li><li>Starter: 9,900원/월 (100회)</li><li>Pro: 29,900원/월 (무제한)</li><li>Team: 99,000원/월 (5인)</li></ol><h3>제6조 (분쟁 해결)</h3><p>관할 법원은 서울중앙지방법원입니다.</p><p style="margin-top:1rem;color:var(--ink3);font-size:12px">시행일: 2026년 1월 1일</p>`},
  privacy:{title:'개인정보처리방침',html:`<h3>1. 수집 항목</h3><ul><li><strong>필수:</strong> 이메일, 소셜 로그인 식별자</li><li><strong>선택:</strong> 스타트업명, 업종, 단계, 팀 규모</li></ul><h3>2. 수집 목적</h3><ul><li>서비스 제공 및 회원 관리</li><li>맞춤형 AI 자문 제공</li><li>마케팅 정보 발송 (동의 시)</li></ul><h3>3. 보유 기간</h3><p>회원 탈퇴 시 즉시 삭제</p><h3>4. 처리 위탁</h3><ul><li>Anthropic: AI 답변 생성</li><li>Auth0(Okta): 로그인 인증</li><li>토스페이먼츠: 결제 처리</li></ul><h3>5. 이용자 권리</h3><p>열람·수정·삭제 요청: privacy@route01.kr</p><p style="margin-top:1rem;color:var(--ink3);font-size:12px">시행일: 2026년 1월 1일</p>`}
};
function openTermsModal(type) {
  const d = R01_TERMS[type]; if(!d) return;
  const m = document.getElementById('terms-modal');
  const t = document.getElementById('terms-modal-title');
  const b = document.getElementById('terms-modal-body');
  if(!m||!t||!b) return;
  t.textContent = d.title;
  b.innerHTML = d.html;
  m.style.display = 'flex';     // display:flex 강제 (z-index 문제 보완)
  m.classList.add('open');
}
function closeTermsModal() {
  const m = document.getElementById('terms-modal');
  if(!m) return;
  m.classList.remove('open');
  m.style.display = '';
}
// window에 노출 (onclick 속성, footer 링크 등에서 접근 가능하도록)
/* window expose moved to end of file */

/* ── 추천 질문 ── */
const R01_SUG = {
  all:['시드 투자를 처음 받으려면 어떻게 시작해야 하나요?','우리 비즈니스 모델의 약점을 솔직하게 짚어주세요','PMF를 어떻게 측정하고 검증할 수 있나요?','경쟁사 대비 차별화 전략을 어떻게 잡아야 할까요?','IR 덱에 반드시 들어가야 할 내용은 무엇인가요?','초기 팀 구성에서 가장 중요한 역할은 무엇인가요?','글로벌 진출을 고려할 때 언제가 적기인가요?','번아웃 없이 스타트업을 지속하는 방법이 있나요?'],
  investment:['시드 투자를 처음 받으려면 어떻게 시작해야 하나요?','IR 덱에 반드시 들어가야 할 내용은 무엇인가요?','VC와 엔젤 투자의 차이는 무엇인가요?','밸류에이션을 어떻게 산정하나요?','텀싯에서 꼭 확인해야 할 조항은?'],
  strategy:['PMF를 어떻게 측정하고 검증할 수 있나요?','우리 비즈니스 모델의 약점을 솔직하게 짚어주세요','경쟁사 대비 차별화 전략을 어떻게 잡아야 할까요?','지금 피벗해야 할지 어떻게 판단하나요?','성장 KPI를 어떻게 설계할까요?'],
  marketing:['초기 스타트업에서 첫 고객을 어떻게 확보하나요?','CAC를 줄이는 효과적인 방법은?','돈 없이 바이럴을 만드는 방법이 있나요?','B2B와 B2C 마케팅 전략의 차이는?'],
  finance:['런웨이를 늘리기 위한 비용 절감 전략은?','스타트업에서 받을 수 있는 세제 혜택은?','단위경제(Unit Economics)를 어떻게 계산하나요?','재무모델은 어떻게 만들어야 하나요?'],
  hr:['초기 팀 구성에서 가장 중요한 역할은?','공동창업자와 지분을 어떻게 나눠야 하나요?','스톡옵션 풀은 얼마나 잡아야 하나요?','첫 직원 채용 시 주의할 점은?'],
  legal:['서비스 출시 전 법적으로 꼭 챙겨야 할 것들은?','개인정보처리방침 필수 항목은?','NDA는 언제 써야 하나요?','소프트웨어 특허를 받을 수 있나요?']
};

/* ── 도메인별 추천 질문 풀 (각 20개) ── */
const R01_SUG_POOL = {
  investment: [
    '시드 투자 유치를 위한 첫 번째 단계는?',
    'VC가 가장 중요하게 보는 IR 지표는?',
    '시드/시리즈A 밸류에이션 산정 방법은?',
    '투자자 미팅 전 반드시 준비해야 할 것은?',
    '텀싯에서 놓치면 안 되는 핵심 조항은?',
    'SAFE와 전환사채 중 어떤 게 유리한가요?',
    '국내 VC와 해외 VC의 투자 기준 차이는?',
    '엔젤 투자자를 어떻게 찾고 접근하나요?',
    '투자 유치 없이 성장할 수 있는 방법은?',
    '데이터룸에 꼭 넣어야 할 자료 목록은?',
    '투자자와의 관계를 장기적으로 유지하는 법은?',
    'IR 덱에서 가장 설득력 있는 슬라이드는?',
    '초기 스타트업 적정 지분 희석 비율은?',
    '투자 거절 후 재도전하는 올바른 방법은?',
    'TIPS 프로그램 신청 조건과 절차는?',
    '크라우드펀딩이 스타트업에게 유효한가요?',
    '투자자에게 트랙션을 효과적으로 보여주는 법?',
    'Post-money 밸류에이션 협상 전략은?',
    '공동창업자 지분 구조 어떻게 설계할까요?',
    '시리즈A를 위한 KPI 목표치는 어느 정도?',
  ],
  strategy: [
    'PMF(제품-시장 적합성)를 검증하는 방법은?',
    '비즈니스 모델의 핵심 약점을 찾는 방법은?',
    '경쟁사 대비 차별화 포인트를 설정하는 법?',
    '지금 피벗해야 할지 어떻게 판단하나요?',
    '스타트업 성장 단계별 핵심 KPI는?',
    '블루오션 시장을 발굴하는 프레임워크는?',
    '고객 인터뷰로 인사이트 얻는 방법은?',
    'TAM/SAM/SOM을 현실적으로 계산하는 법?',
    'OKR과 KPI 중 초기 스타트업에 맞는 것은?',
    '경쟁사가 없는 시장, 진짜 기회일까요?',
    '제품 로드맵 우선순위 결정 방법은?',
    'B2B vs B2C 전환 시 체크리스트는?',
    '무료 서비스에서 유료로 전환하는 전략은?',
    '파트너십과 직접 성장 중 어떤 게 유리?',
    '린 스타트업 방법론을 실제 적용하는 법?',
    '플랫폼 비즈니스의 닭-달걀 문제 해결책은?',
    '경쟁사 분석을 체계적으로 하는 방법은?',
    '스타트업이 대기업과 경쟁할 수 있는 전략?',
    '초기 고객 100명을 확보하는 전략은?',
    '제품 방향성이 흔들릴 때 기준 잡는 법?',
  ],
  marketing: [
    'CAC(고객 획득 비용)를 낮추는 방법은?',
    '초기 스타트업에게 가장 효과적인 채널은?',
    '콘텐츠 마케팅으로 유기적 성장하는 법?',
    'SNS 팔로워 없이 제품을 알리는 방법은?',
    'LTV(고객 생애 가치)를 높이는 전략은?',
    '바이럴 루프를 설계하는 방법은?',
    '언론 노출 없이 PR 효과를 얻는 방법은?',
    'B2B 마케팅에서 리드 생성 전략은?',
    '퍼포먼스 마케팅 예산 배분 방법은?',
    '리텐션을 높이는 이메일 마케팅 전략은?',
    '인플루언서 마케팅 ROI를 높이는 법?',
    '커뮤니티를 활용한 성장 전략은?',
    'SEO로 초기 트래픽을 확보하는 방법은?',
    '제품 출시 전 대기자 명단 모으는 법?',
    'NPS(순추천지수) 개선 방법은?',
    '경쟁사와 다른 포지셔닝 메시지 만들기?',
    '오프라인 이벤트로 마케팅하는 전략은?',
    'ABM(계정 기반 마케팅)이란 무엇인가요?',
    '그로스 해킹 실험을 설계하는 방법은?',
    '유료 광고 없이 첫 1000명 확보하는 법?',
  ],
  finance: [
    '스타트업 런웨이를 계산하는 방법은?',
    '현금 소진율(번 레이트)을 줄이는 전략은?',
    '손익분기점 계산 방법과 활용법은?',
    '벤처기업 세제 혜택을 최대로 받는 법?',
    '재무모델을 만드는 기본 프레임워크는?',
    '단위경제(Unit Economics) 분석 방법은?',
    '스타트업이 받을 수 있는 정부 보조금은?',
    'R&D 세액공제 신청 방법과 조건은?',
    '투자금 회계 처리 방법은?',
    '벤처기업 확인서 발급 조건과 절차는?',
    '창업 초기 법인 설립 시 자본금은 얼마?',
    '스톡옵션 회계 처리 방법은?',
    '매출 인식 기준 어떻게 적용하나요?',
    '간이과세자 vs 일반과세자 어떤 게 유리?',
    'EBITDA와 순이익 중 투자자가 보는 것은?',
    'SaaS 비즈니스 핵심 재무 지표는?',
    '해외 매출 외환 처리 방법은?',
    '직원 급여 지급 시 세금 처리 방법은?',
    '재무 예측 모델에서 가장 중요한 가정은?',
    '내부 회계 시스템 언제 구축해야 하나요?',
  ],
  hr: [
    '초기 팀에서 가장 먼저 채용할 직군은?',
    '공동창업자 지분 분배 방법과 기준은?',
    '스톡옵션 풀은 얼마나 설정해야 하나요?',
    '개발자 채용 시 기술 면접 방법은?',
    '스타트업 조직 문화를 만드는 방법은?',
    '직원 이탈을 막는 리텐션 전략은?',
    '프리랜서 vs 정규직 고용 결정 기준은?',
    '근로계약서 작성 시 필수 체크사항은?',
    'OKR로 팀 성과를 관리하는 방법은?',
    '원격근무 팀의 생산성을 높이는 법은?',
    '초기 직원에게 적정 연봉 수준은?',
    '공동창업자 갈등 예방하는 방법은?',
    '채용 공고 없이 좋은 인재 찾는 법은?',
    '팀원 온보딩 프로세스 만드는 방법은?',
    '성과 평가 시스템 어떻게 설계하나요?',
    '4대 보험 가입 시기와 절차는?',
    '최저임금 인상이 스타트업에 미치는 영향?',
    '팀 빌딩 이벤트 효과적인 방법은?',
    'CTO 없이 개발팀을 운영하는 방법은?',
    '해외 인재 고용 시 주의사항은?',
  ],
  legal: [
    '서비스 출시 전 법적으로 준비할 것들은?',
    '이용약관에 반드시 포함해야 할 조항은?',
    '개인정보처리방침 필수 기재 항목은?',
    'NDA(비밀유지계약서) 작성 핵심 포인트는?',
    '소프트웨어 특허 출원 가능한 범위는?',
    '상표 등록 절차와 비용은 어떻게 되나요?',
    '오픈소스 라이선스 사용 시 주의사항은?',
    '공동창업자 계약서 필수 내용은?',
    '투자 계약서에서 협상 가능한 조항은?',
    '정보통신망법 주요 의무 사항은?',
    '개인정보보호법 위반 시 처벌 수위는?',
    '직원 IP 귀속 조항 어떻게 작성하나요?',
    '서비스 약관 분쟁 시 준거법 설정법은?',
    '외주 개발 계약서 핵심 체크포인트는?',
    '온라인 플랫폼 사업자 의무 사항은?',
    '해외 서비스 시 적용되는 법률은?',
    'GDPR이 한국 스타트업에 적용되나요?',
    '특허 침해 대응 방법과 절차는?',
    '법인 설립 시 주의해야 할 사항은?',
    '공정거래법에서 스타트업이 주의할 점은?',
  ],
};

/* 도메인별 현재 페이지 인덱스 */
const _sugPage = {};

function renderSugChips(key) {
  const wrap = document.getElementById('sug-chips'); if(!wrap) return;
  const pool = R01_SUG_POOL[key] || R01_SUG_POOL['investment'];

  // 페이지 인덱스 순환 (클릭마다 다른 10개)
  if(_sugPage[key] === undefined) _sugPage[key] = 0;
  const start = (_sugPage[key] * 10) % pool.length;
  // 10개 슬라이싱 (배열 끝에서 감싸기)
  let qs = [];
  for(let i = 0; i < 10; i++) {
    qs.push(pool[(start + i) % pool.length]);
  }

  wrap.innerHTML = qs.map(q =>
    `<button class="sug-chip" onclick="useSugChip(this)">${esc(q)}</button>`
  ).join('');
}

function filterSugDomain(key, btn) {
  document.querySelectorAll('.ws-dc').forEach(c => c.classList.remove('active'));
  if(btn) btn.classList.add('active');
  // 같은 도메인 재클릭 시 다음 페이지 보여주기
  const currentKey = btn?.dataset?.domain || key;
  if(_sugPage[currentKey] === undefined) _sugPage[currentKey] = 0;
  else _sugPage[currentKey]++;
  renderSugChips(currentKey);
}
function useSugChip(btn) {
  const text = btn.textContent.trim();
  // 웰컴화면이 보이는 경우 → ws-input에 넣고 바로 전송
  const ws = document.getElementById('welcome-screen');
  const wsInp = document.getElementById('ws-input');
  if(ws && ws.style.display !== 'none' && wsInp) {
    wsInp.value = text;
    wsResize(wsInp);
    wsInp.focus();
    setTimeout(() => wsSend(), 80);
    return;
  }
  // 대화 중인 경우 → 하단 input에 넣고 포커스
  const inp = document.getElementById('input');
  if(inp) { inp.value = text; resize(inp); inp.focus(); }
}

/* ── 프로필 배너 ── */
function showProfileBannerIfNeeded() {
  const banner = document.getElementById('profile-banner'); if(!banner) return;
  const dismissed = localStorage.getItem('r01_banner_x');
  const hasProfile = !!(profile.industry && profile.stage);
  banner.style.display = (!hasProfile && !dismissed) ? 'flex' : 'none';
}
function dismissProfileBanner() {
  localStorage.setItem('r01_banner_x','1');
  const b = document.getElementById('profile-banner'); if(b) b.style.display='none';
}

/* ── unified-area: 프로필 배지 동기화 ── */
function syncUnifiedBadges() {
  const ind = document.getElementById('ub-industry');
  const st  = document.getElementById('ub-stage');
  const inv = document.getElementById('ub-invest');
  const co  = document.getElementById('ub-concern');
  const sy  = document.getElementById('ub-style');

  // 사업 소개
  const industryText = profile.industry
    ? (profile.industry.length > 22 ? profile.industry.slice(0,22)+'…' : profile.industry)
    : '미설정';
  if(ind) ind.textContent = industryText;

  // 단계 · 타겟
  const targetShort = profile.target
    ? profile.target.replace('(기업)','').replace('(소비자)','').replace('(공공/정부)','').trim()
    : '';
  const stageVal = profile.stage
    ? (targetShort ? `${profile.stage} · ${targetShort}` : profile.stage)
    : (targetShort || '미설정');
  if(st) st.textContent = stageVal;

  // 투자 상황
  if(inv) inv.textContent = profile.invest || '미설정';

  // 핵심 고민
  const concernText = profile.concern
    ? (profile.concern.length > 22 ? profile.concern.slice(0,22)+'…' : profile.concern)
    : '미설정';
  if(co) co.textContent = concernText;

  // 멘토 스타일
  if(sy) sy.textContent = profile.style || 'Paul Graham (YC)';
}

/* ──────────────────────────────────────────────────────────────────
   DEPRECATED — 이 섹션(r01_hist_v1 시스템)은 더 이상 사용하지 않습니다.

   과거에 vd_history(구)와 r01_hist_v1(신)이 공존하며 같은 #history-list
   DOM을 덮어쓰는 구조였고, 이 신 시스템의 saveR01History가 답변 본문 대신
   답변 ID를 저장하는 버그가 있었습니다. 히스토리 클릭 시 "ID만 찍히는"
   증상의 근원.

   현재 사이드바는 전적으로 vd_history + renderHistory + openHistConversation
   으로만 동작합니다. 아래 함수들은 hook이나 onclick이 실수로 다시 연결되지
   않는 한 호출되지 않습니다. 코드 제거 대신 "호출 안 됨 + 경고"로 남겨
   혹시 남은 참조가 있어도 조용히 무시되게 만듭니다.
   ────────────────────────────────────────────────────────────────── */
/* ── 통합 히스토리 ── */
const R01_HIST_KEY = 'r01_hist_v1';
function saveR01History(q, a) {
  console.warn('[DEPRECATED] saveR01History called — vd_history/saveHistory 시스템을 사용해야 합니다.');
  /* intentionally no-op to prevent corrupt writes */
}
function renderR01History() {
  const el = document.getElementById('history-list'); if(!el) return;
  try {
    const h = JSON.parse(localStorage.getItem(R01_HIST_KEY)||'[]');
    if(!h.length){el.innerHTML='<div class="pop-empty">아직 질문 기록이 없어요.</div>';return;}
    el.innerHTML = h.map(item=>`
      <button class="hist-item" onclick="openR01HistModal(${item.id})">
        <div class="hist-item-q">${_esc(item.q)}</div>
        <div class="hist-item-meta">${item.ts}</div>
      </button>`).join('');
  } catch(e){el.innerHTML='<div class="pop-empty">아직 질문 기록이 없어요.</div>';}
}
function _esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function openR01HistModal(id) {
  try {
    const h = JSON.parse(localStorage.getItem(R01_HIST_KEY)||'[]');
    const item = h.find(x=>x.id==id); if(!item) return;
    // 모달 대신 바로 채팅 화면으로 이동
    rmWelcome();
    const chat = document.getElementById('chat');
    if(chat) chat.innerHTML = '';
    messages = [];
    docsSentOnce = false;
    busy = false;

    addMsg('user', item.q, []);
    messages.push({role:'user', content:item.q});
    addMsg('ai', item.a || '');
    messages.push({role:'assistant', content:item.a || ''});

    setTimeout(()=>{
      if(chat) chat.scrollTop = chat.scrollHeight;
      document.getElementById('input')?.focus();
    }, 80);
  } catch(e){}
}
function clearAllHistory() {
  if(!confirm('전체 질문 기록을 삭제할까요?')) return;
  /* 사용 중인 히스토리는 vd_history. r01_hist_v1은 죽은 시스템이지만 혹시 남은 오염 데이터도 같이 정리 */
  try{ localStorage.removeItem('vd_history'); }catch(e){}
  try{ localStorage.removeItem('r01_hist_v1'); }catch(e){}
  if(typeof renderHistory === 'function') renderHistory();

  /* 현재 대화 화면도 초기화 후 웰컴 화면으로 복귀 */
  try{
    const chat = document.getElementById('chat');
    if(chat) chat.innerHTML = '';
    if(typeof messages !== 'undefined') messages = [];
    if(typeof docsSentOnce !== 'undefined') docsSentOnce = false;
    const cr = document.getElementById('chat-res');
    if(cr){ cr.innerHTML = ''; cr.setAttribute('data-for-export', ''); }
    if(typeof showWelcome === 'function') showWelcome();
  }catch(e){}
}

/* ── DOMContentLoaded: launch/send 후킹 ── */
document.addEventListener('DOMContentLoaded', ()=>{
  /* launch 후킹: 원본 실행 후 새 기능 초기화 */
  const _origLaunch = window.launch;
  window.launch = function() {
    if(_origLaunch) _origLaunch.call(this);

    // 초기화
    renderSugChips('investment'); // 기본 도메인 투자/IR
    showProfileBannerIfNeeded();
    /* 구 히스토리 시스템(vd_history)만 사용 — 신 시스템(r01_hist_v1)은 ID-as-body 버그로 비활성화.
       오염된 r01_hist_v1 데이터는 한 번만 정리 */
    try{
      const r01raw = localStorage.getItem('r01_hist_v1');
      if(r01raw){
        const arr = JSON.parse(r01raw);
        if(Array.isArray(arr) && arr.some(x=>/^a\d{13}[a-z0-9]+$/.test(String(x?.a||'').trim()))){
          localStorage.removeItem('r01_hist_v1');
        }
      }
    }catch(e){ try{localStorage.removeItem('r01_hist_v1');}catch(_){} }
    if(typeof renderHistory === 'function') renderHistory();
    syncUnifiedBadges();

    // 웰컴 화면 활성화 (chat/input-area 숨김)
    const ws = document.getElementById('welcome-screen');
    const chat = document.getElementById('chat');
    const inputArea = document.querySelector('.input-area');
    if(ws) ws.classList.remove('hidden');
    if(chat) { chat.classList.remove('active'); }
    if(inputArea) { inputArea.classList.remove('active'); }

    // ws-input 포커스
    setTimeout(()=>{ document.getElementById('ws-input')?.focus(); }, 150);
  };

  /* send 후킹: 질문 시 unified-area 숨기고 히스토리 저장 */
  const _origSend = window.send;
  window.send = async function() {
    const inp = document.getElementById('input');
    const q = (inp?.value||'').trim();
    if(!q && !window.chatPendingFiles?.length) return;

    // 웰컴 화면 → 채팅 모드 전환 (rmWelcome이 이미 처리했을 수 있음)
    const ws = document.getElementById('welcome-screen');
    if(ws && !ws.classList.contains('hidden')) { rmWelcome(); }

    if(_origSend) await _origSend.call(this);

    /* 히스토리 저장 비활성화: doSend()가 이미 saveHistory(q, finalText, ...)를 호출함.
       여기서 data-for-export(=답변 ID)를 답변 본문으로 착각해 저장하면
       나중에 히스토리 클릭 시 본문 자리에 ID만 렌더되는 버그 발생. */
  };

  /* applyProfile 후킹: unified badges 동기화 */
  const _origApply = window.applyProfile;
  window.applyProfile = function() {
    if(_origApply) _origApply.call(this);
    syncUnifiedBadges();
  };

  /* cancelOnboardingEdit 수정: auth gate 숨기기 */
  const _origCancel = window.cancelOnboardingEdit;
  window.cancelOnboardingEdit = function() {
    /* auth 확실히 숨기기 */
    const authEl = document.getElementById('auth');
    if(authEl) authEl.classList.add('hidden');
    if(_origCancel) _origCancel.call(this);
  };

  /* 약관 모달 배경 클릭 닫기 */
  const termsModal = document.getElementById('terms-modal');
  if(termsModal) termsModal.addEventListener('click', e=>{ if(e.target===termsModal) closeTermsModal(); });

  /* 약관 보기 버튼 — addEventListener 방식으로 확실히 연결 */
  const btnViewTerms = document.getElementById('btn-view-terms');
  const btnViewPrivacy = document.getElementById('btn-view-privacy');
  if(btnViewTerms) btnViewTerms.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation(); openTermsModal('terms');
  });
  if(btnViewPrivacy) btnViewPrivacy.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation(); openTermsModal('privacy');
  });

  /* 이메일 입력 후 포커스 벗어날 때 즉시 중복 체크 */
  const signupEmailEl = document.getElementById('asignup-email');
  if(signupEmailEl) {
    signupEmailEl.addEventListener('blur', function() {
      const email = this.value.trim();
      const dupEl = document.getElementById('aerr-email-dup');
      if(!dupEl) return;
      if(!email || !email.includes('@')) { _clearDupMsg(); return; }

      // r01_accs에서 중복 체크 (소셜/이메일 구분)
      const accounts = _r01Accounts();
      const found = accounts.find(a => a.email && a.email.toLowerCase() === email.toLowerCase());

      if(found) {
        if(found.method && found.method !== 'email') {
          // 소셜 가입
          const providerNames = {
            'google-oauth2':'Google', 'apple':'Apple',
            'naver':'네이버', 'kakao':'카카오'
          };
          const pName = providerNames[found.method] || found.method;
          _showDupMsg(dupEl, pName + ' 계정으로 가입된 이메일입니다.', pName + ' 로그인하기 →');
        } else {
          // 이메일 가입
          _showDupMsg(dupEl, '이미 이메일로 가입된 계정입니다.', '로그인하기 →');
        }
        return;
      }

      _clearDupMsg();
    });

    // 이메일 입력 시작하면 중복 메시지 초기화
    signupEmailEl.addEventListener('input', function() {
      const dupEl = document.getElementById('aerr-email-dup');
      if(dupEl) dupEl.textContent = '';
    });
  }

  /* aterms-row: 체크박스 직접 클릭만 동작 (행 전체 클릭 방지) */
  document.querySelectorAll('.aterms-row').forEach(row => {
    row.addEventListener('click', function(e){
      // 체크박스나 보기 버튼 클릭은 그대로 통과
      if(e.target.type === 'checkbox' || e.target.tagName === 'BUTTON') return;
      // 나머지 영역 클릭은 해당 행의 체크박스 toggle
      const cb = row.querySelector('input[type=checkbox]');
      if(cb) cb.checked = !cb.checked;
      if(cb && (cb.id === 'agree-terms' || cb.id === 'agree-privacy' || cb.id === 'agree-marketing')) {
        syncAllCheck();
      }
      if(cb && cb.id === 'agree-all') {
        toggleAllTerms(cb);
      }
    });
  });
});



/* ══════════════════════════════════════
   웰컴 화면 입력창 핸들러
══════════════════════════════════════ */
function wsOnKey(e) {
  if(e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    wsSend();
  }
}

function wsResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 240) + 'px';
}

function wsSend() {
  const wsInput = document.getElementById('ws-input');
  const mainInput = document.getElementById('input');
  if(!wsInput) return;
  const text = wsInput.value.trim();
  if(!text && !chatPendingFiles.length) return;

  // 웰컴 입력값을 메인 input으로 복사 후 send 호출
  if(mainInput) mainInput.value = text;
  wsInput.value = '';
  wsInput.style.height = 'auto';

  // rmWelcome으로 화면 전환 후 send
  rmWelcome();
  setTimeout(() => send(), 50);
}


function checkGrantAccess() {
  /* 프로토타입 단계: 모든 회원 접근 허용 */
  const PROTOTYPE_MODE = true;
  if(PROTOTYPE_MODE){ openGrantModal(); return; }

  // 유료 플랜 체크 (현재는 localStorage의 plan으로 판단)
  const plan = localStorage.getItem('r01_plan') || 'free';
  if(plan === 'free') {
    // 무료 회원 안내 모달
    const msg = document.createElement('div');
    msg.className = 'modal-bg open';
    msg.id = 'grant-access-modal';
    msg.innerHTML = `
      <div class="modal" style="max-width:400px;text-align:center">
        <button class="modal-close" onclick="document.getElementById('grant-access-modal').remove()">×</button>
        <div style="font-size:32px;margin-bottom:12px">🔒</div>
        <div class="modal-title">유료 회원 전용 서비스</div>
        <div class="modal-sub">지원사업 도우미는 <strong>Starter 플랜 이상</strong> 회원만 이용할 수 있어요.<br>월 9,900원으로 시작해 보세요.</div>
        <div style="margin:1.5rem 0;padding:16px;background:var(--bg);border-radius:var(--r);font-size:13px;color:var(--ink2);text-align:left;line-height:1.7">
          <div><strong>✅ Starter (9,900원/월)</strong></div>
          <div>· 월 100회 질문</div>
          <div>· PDF 파일 업로드</div>
          <div><strong style="color:var(--cta)">✅ 지원사업 도우미 포함</strong></div>
        </div>
        <div style="display:flex;gap:8px">
          <button class="modal-btn" onclick="document.getElementById('grant-access-modal').remove()" style="flex:1">닫기</button>
          <button class="modal-btn pri" onclick="alert('요금제 페이지 준비 중입니다.');document.getElementById('grant-access-modal').remove()" style="flex:1">요금제 보기 →</button>
        </div>
      </div>`;
    document.body.appendChild(msg);
    msg.addEventListener('click', e => { if(e.target===msg) msg.remove(); });
  } else {
    openGrantModal();
  }
}

/* ═══════════════════════════════════════════════
   전역 함수 즉시 노출 — onclick 속성에서 접근 가능
   (defer 없이 로드되므로 스크립트 로드 즉시 등록)
═══════════════════════════════════════════════ */

/* ── 홈(웰컴화면)으로 이동 ── */
function goHome() {
  // 대화 상태 초기화
  messages = [];
  busy = false;
  docsSentOnce = false;
  // send-btn 활성화
  const sendBtn = document.getElementById('send-btn');
  if(sendBtn) sendBtn.disabled = false;
  // ws-input 초기화
  const wsInp = document.getElementById('ws-input');
  if(wsInp) wsInp.value = '';
  // showWelcome()으로 통일 (chat 초기화 + 웰컴화면 표시)
  showWelcome();
}
/* ══════════════════════════════════════
   마이페이지 & 요금제 & 비밀번호 변경
══════════════════════════════════════ */

/* 요금제 정보 */
const R01_PLANS = [
  {
    id:'free', name:'Free', price:0, priceText:'무료',
    desc:'가볍게 시작하기',
    features:['월 10회 질문','추천 질문 이용','도메인별 자문'],
    limit:10, color:'#6e6e73', cta:'현재 플랜'
  },
  {
    id:'starter', name:'Starter', price:9900, priceText:'₩9,900/월',
    desc:'본격 자문 시작',
    features:['월 100회 질문','PDF 파일 업로드','지원사업 도우미','DOCX/PDF 내보내기','이메일 지원'],
    limit:100, color:'#0071e3', cta:'시작하기', highlight:true
  },
  {
    id:'pro', name:'Pro', price:29000, priceText:'₩29,000/월',
    desc:'무제한 집중 자문',
    features:['무제한 질문','PDF 업로드 무제한','지원사업 도우미','전체 멘토 스타일','우선 응답','전담 이메일 지원'],
    limit:99999, color:'#F26522', cta:'업그레이드'
  },
  {
    id:'team', name:'Team', price:99000, priceText:'₩99,000/월',
    desc:'팀 전체 자문',
    features:['5인 계정 공유','Pro 기능 전체 포함','팀 질문 기록 공유','월 500회 질문','데디케이티드 지원'],
    limit:500, color:'#1d1d1f', cta:'팀 시작'
  }
];

function getCurrentPlan(){
  return localStorage.getItem('r01_plan') || 'free';
}
function getMonthlyUsage(){
  try{
    const key = 'r01_usage_' + new Date().toISOString().slice(0,7);
    return parseInt(localStorage.getItem(key)||'0',10);
  }catch(e){return 0;}
}
function incrementUsage(){
  try{
    const key = 'r01_usage_' + new Date().toISOString().slice(0,7);
    const cur = parseInt(localStorage.getItem(key)||'0',10);
    localStorage.setItem(key, String(cur+1));
  }catch(e){}
}

/* 마이페이지 */
function openMyPage(){
  const body = document.getElementById('mypage-body');
  if(!body) return;
  const authRaw = localStorage.getItem('nachim_auth');
  let user = null;
  try{ user = JSON.parse(authRaw)?.user; }catch(e){}
  const email = user?.email || '이메일 정보 없음';
  const method = user?.method || (user?.sub?.startsWith('google')?'google-oauth2': user?.sub?.startsWith('apple')?'apple':'email');
  const isEmail = method === 'email';
  const plan = getCurrentPlan();
  const planInfo = R01_PLANS.find(p=>p.id===plan) || R01_PLANS[0];
  const usage = getMonthlyUsage();
  const usagePct = Math.min(100, Math.round(usage/planInfo.limit*100));

  const methodLabels = {'google-oauth2':'Google 계정','apple':'Apple 계정','naver':'네이버 계정','kakao':'카카오 계정','email':'이메일/패스워드'};

  body.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:16px">

      <!-- 계정 정보 -->
      <div style="background:var(--bg);border-radius:12px;padding:16px">
        <div style="font-size:12px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">계정 정보</div>
        <div class="modal-row"><span class="m-label">이메일</span><div class="m-val">${esc(email)}</div></div>
        <div class="modal-row"><span class="m-label">로그인 방식</span><div class="m-val">${methodLabels[method]||method}</div></div>
        ${isEmail ? `<button class="modal-btn" style="margin-top:10px;width:100%" onclick="closeMyPage();openPwChange()">🔑 비밀번호 변경</button>` : ''}
      </div>

      <!-- 요금제 현황 -->
      <div style="background:var(--bg);border-radius:12px;padding:16px">
        <div style="font-size:12px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">요금제 현황</div>
        <div class="modal-row">
          <span class="m-label">현재 플랜</span>
          <div class="m-val"><span style="font-weight:700;color:${planInfo.color}">${planInfo.name}</span> — ${planInfo.priceText}</div>
        </div>
        <div class="modal-row">
          <span class="m-label">이번 달 사용</span>
          <div class="m-val">${usage}회 / ${planInfo.limit===99999?'무제한':planInfo.limit+'회'}</div>
        </div>
        ${planInfo.limit !== 99999 ? `
        <div style="margin:8px 0 4px;height:6px;background:#e8e8ed;border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${usagePct}%;background:${usagePct>80?'#ff3b30':planInfo.color};border-radius:3px;transition:width .4s"></div>
        </div>
        <div style="font-size:11px;color:var(--ink3)">${usagePct}% 사용</div>` : ''}
        <button class="modal-btn pri" style="margin-top:12px;width:100%" onclick="closeMyPage();openPricingModal()">요금제 변경 →</button>
      </div>

      <!-- 데이터 관리 -->
      <div style="background:var(--bg);border-radius:12px;padding:16px">
        <div style="font-size:12px;font-weight:600;color:var(--ink3);text-transform:uppercase;letter-spacing:.06em;margin-bottom:10px">데이터 관리</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="modal-btn" onclick="editProfile();closeMyPage()">프로필 수정</button>
          <button class="modal-btn" onclick="if(confirm('질문 기록을 모두 삭제할까요?')){localStorage.removeItem('r01_hist_v1');localStorage.removeItem('vd_history');alert('삭제됐습니다.');}">질문 기록 삭제</button>
        </div>
      </div>

      <!-- 탈퇴 -->
      <div style="border-top:1px solid var(--border);padding-top:12px;text-align:center">
        <button type="button" style="background:none;border:none;color:var(--ink3);font-size:13px;cursor:pointer;text-decoration:underline" onclick="closeMyPage();openWithdraw()">회원 탈퇴</button>
      </div>
    </div>`;

  document.getElementById('mypage-modal').classList.add('open');
}
function closeMyPage(){
  document.getElementById('mypage-modal')?.classList.remove('open');
}

/* 요금제 모달 */
function openPricingModal(){
  const body = document.getElementById('pricing-body');
  if(!body) return;
  const cur = getCurrentPlan();
  body.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px">
      ${R01_PLANS.map(p=>`
        <div style="border:2px solid ${p.id===cur?p.color:'var(--border)'};border-radius:14px;padding:16px;background:${p.highlight?'#fffbf7':'var(--card)'};position:relative">
          ${p.highlight ? '<div style="position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:#F26522;color:#fff;font-size:10px;font-weight:700;padding:2px 10px;border-radius:10px;white-space:nowrap">인기</div>' : ''}
          <div style="font-weight:800;font-size:16px;color:${p.color};margin-bottom:2px">${p.name}</div>
          <div style="font-size:18px;font-weight:700;margin-bottom:2px">${p.priceText}</div>
          <div style="font-size:12px;color:var(--ink3);margin-bottom:10px">${p.desc}</div>
          <ul style="margin:0;padding-left:16px;font-size:12px;color:var(--ink2);line-height:1.8;margin-bottom:12px">
            ${p.features.map(f=>`<li>${esc(f)}</li>`).join('')}
          </ul>
          ${p.id===cur
            ? `<button class="modal-btn" style="width:100%;font-size:12px" disabled>✓ 현재 플랜</button>`
            : `<button class="modal-btn pri" style="width:100%;font-size:12px;background:${p.color}" onclick="selectPlan('${p.id}')">${p.cta} →</button>`
          }
        </div>`).join('')}
    </div>
    <p style="font-size:12px;color:var(--ink3);margin-top:12px;text-align:center">결제는 토스페이먼츠를 통해 안전하게 처리됩니다. 언제든 해지 가능.</p>`;
  document.getElementById('pricing-modal').classList.add('open');
}
function closePricingModal(){
  document.getElementById('pricing-modal')?.classList.remove('open');
}
function selectPlan(planId){
  // 토스페이먼츠 결제 (현재는 데모 — 실제 연동 시 서버 필요)
  const plan = R01_PLANS.find(p=>p.id===planId);
  if(!plan) return;
  if(plan.price === 0){
    localStorage.setItem('r01_plan','free');
    closePricingModal();
    alert('Free 플랜으로 변경됐습니다.');
    return;
  }
  // 결제 안내 (실제 구현 시 토스페이먼츠 SDK 호출)
  alert(`[준비 중] ${plan.name} 플랜 결제 기능은 곧 오픈됩니다.\n\n문의: contact@route01.kr`);
}

/* 비밀번호 변경 */
function openPwChange(){
  ['pw-cur','pw-new','pw-new2'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  const e=document.getElementById('aerr-pw-change'); if(e) e.textContent='';
  document.getElementById('pw-change-modal')?.classList.add('open');
}
function closePwChange(){
  document.getElementById('pw-change-modal')?.classList.remove('open');
}
function submitPwChange(){
  const cur = document.getElementById('pw-cur')?.value||'';
  const nw  = document.getElementById('pw-new')?.value||'';
  const nw2 = document.getElementById('pw-new2')?.value||'';
  const err = document.getElementById('aerr-pw-change');
  if(err) err.textContent='';

  const authRaw = localStorage.getItem('nachim_auth');
  let user = null;
  try{ user = JSON.parse(authRaw)?.user; }catch(e){}
  const email = user?.email;

  const accounts = _r01Accounts();
  const acc = accounts.find(a=>a.email===email);
  if(!acc){ if(err) err.textContent='소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.'; return; }
  if(acc.pw !== btoa(cur)){ if(err) err.textContent='현재 비밀번호가 맞지 않습니다.'; return; }
  if(nw.length<8){ if(err) err.textContent='새 비밀번호는 8자 이상이어야 합니다.'; return; }
  if(nw!==nw2){ if(err) err.textContent='새 비밀번호가 일치하지 않습니다.'; return; }

  acc.pw = btoa(nw);
  _saveR01Accounts(accounts);
  closePwChange();
  alert('비밀번호가 변경됐습니다.');
}

/* 회원탈퇴 */
function openWithdraw(){
  document.getElementById('withdraw-modal')?.classList.add('open');
}
function closeWithdraw(){
  document.getElementById('withdraw-modal')?.classList.remove('open');
}
function submitWithdraw(){
  // 모든 데이터 삭제
  const authRaw = localStorage.getItem('nachim_auth');
  let email = null;
  try{ email = JSON.parse(authRaw)?.user?.email; }catch(e){}

  if(email){
    const accounts = _r01Accounts().filter(a=>a.email!==email);
    _saveR01Accounts(accounts);
  }
  ['nachim_auth','vd_profile','vd_history','r01_hist_v1','r01_plan','r01_banner_x','r01_profile_skip',
   'nachim_api_key','r01_accs'].forEach(k=>localStorage.removeItem(k));
  // 접두사 기반 키 삭제
  Object.keys(localStorage).filter(k=>k.startsWith('r01_usage_')).forEach(k=>localStorage.removeItem(k));

  closeWithdraw();
  alert('탈퇴가 완료됐습니다. 이용해 주셔서 감사합니다.');
  clearAuthed();
  showAuthGate();
  initAuthHeroMessaging();
}
/* PRO 잠금 멘토 클릭 시 (온보딩용) */
function pickMentorOrUpgrade(el, styleKey){
  /* 프로토타입 단계: 모든 멘토 스타일 무료 개방 (유료 UI는 추후 서버 연동 시 되살림) */
  const PROTOTYPE_MODE = true;
  if(PROTOTYPE_MODE){ pickChip('style', el); return; }

  const plan = getCurrentPlan ? getCurrentPlan() : 'free';
  const isPaid = (plan === 'starter' || plan === 'pro' || plan === 'team');
  if(isPaid){ pickChip('style', el); return; }
  const m = document.createElement('div');
  m.className = 'modal-bg open';
  m.style.zIndex = '9999';
  m.innerHTML = `<div class="modal" style="max-width:380px;text-align:center">
    <button class="modal-close" onclick="this.closest('.modal-bg').remove()">×</button>
    <div style="font-size:32px;margin-bottom:10px">🔒</div>
    <div class="modal-title">Starter 이상 전용 멘토</div>
    <div class="modal-sub">이 멘토 스타일은 Starter 플랜 이상에서 이용할 수 있어요.</div>
    <div style="display:flex;gap:8px;margin-top:1.25rem">
      <button class="modal-btn" onclick="this.closest('.modal-bg').remove()" style="flex:1">닫기</button>
      <button class="modal-btn pri" onclick="this.closest('.modal-bg').remove();openPricingModal();" style="flex:1">요금제 보기 →</button>
    </div>
  </div>`;
  document.body.appendChild(m);
  m.addEventListener('click',e=>{if(e.target===m)m.remove();});
}

/* 파일 업로드 접근 제어 */
function checkUploadAccess(){
  /* 프로토타입 단계: 파일 업로드 자유 허용 */
  const PROTOTYPE_MODE = true;
  if(PROTOTYPE_MODE){
    document.getElementById('ob-file-input')?.click();
    return;
  }

  const plan = getCurrentPlan ? getCurrentPlan() : 'free';
  if(plan === 'free'){
    const m = document.createElement('div');
    m.className = 'modal-bg open';
    m.style.zIndex = '9999';
    m.innerHTML = `<div class="modal" style="max-width:380px;text-align:center">
      <button class="modal-close" onclick="this.closest('.modal-bg').remove()">×</button>
      <div style="font-size:32px;margin-bottom:10px">📎</div>
      <div class="modal-title">Starter 이상 전용 기능</div>
      <div class="modal-sub">파일 업로드는 Starter 플랜(₩9,900/월) 이상에서 이용할 수 있어요.</div>
      <div style="display:flex;gap:8px;margin-top:1.25rem">
        <button class="modal-btn" onclick="this.closest('.modal-bg').remove()" style="flex:1">닫기</button>
        <button class="modal-btn pri" onclick="this.closest('.modal-bg').remove();openPricingModal();" style="flex:1">요금제 보기 →</button>
      </div>
    </div>`;
    document.body.appendChild(m);
    m.addEventListener('click',e=>{if(e.target===m)m.remove();});
    return;
  }
  document.getElementById('ob-file-input')?.click();
}

(function exposeGlobals() {
  var fns = {
    // Auth
    switchAuthTab: switchAuthTab,
    emailLogin: emailLogin,
    emailSignup: emailSignup,
    togglePwEye: togglePwEye,
    showForgotPw: showForgotPw,
    sendResetPw: sendResetPw,
    verifySignupCode: verifySignupCode,
    resendVerify: resendVerify,
    toggleAllTerms: toggleAllTerms,
    syncAllCheck: syncAllCheck,
    openTermsModal: openTermsModal,
    closeTermsModal: closeTermsModal,
    // App
    loginProvider: loginProvider,
    demoLogin: demoLogin,
    logout: logout,
    openAuth0Settings: openAuth0Settings,
    closeAuth0Settings: closeAuth0Settings,
    saveAuth0Settings: saveAuth0Settings,
    openKeyModal: openKeyModal,
    closeKeyModal: closeKeyModal,
    saveKey: saveKey,
    deleteKey: deleteKey,
    toggleKeyVis: toggleKeyVis,
    openModal: openModal,
    closeModal: closeModal,
    openStyleModal: openStyleModal,
    closeStyleModal: closeStyleModal,
    openGrantModal: openGrantModal,
    closeGrantModal: closeGrantModal,
    closeHistModal: closeHistModal,
    followUpFromHist: followUpFromHist,
    editProfile: editProfile,
    filterSugDomain: filterSugDomain,
    checkGrantAccess: checkGrantAccess,
    useSugChip: useSugChip,
    dismissProfileBanner: dismissProfileBanner,
    clearAllHistory: clearAllHistory,
    exportAnswer: exportAnswer,
    send: send,
    onKey: onKey,
    resize: resize,
    wsSend: wsSend,
    wsOnKey: wsOnKey,
    wsResize: wsResize,
    chatFileSelect: chatFileSelect,
    obFileSelect: obFileSelect,
    obDragOver: obDragOver,
    obDragLeave: obDragLeave,
    obDrop: obDrop,
    removeObFile: removeObFile,
    removeChatFile: removeChatFile,
    submitGrantHelper: submitGrantHelper,
    grantFileChosen: grantFileChosen,
    grantRemoveFile: grantRemoveFile,
    cancelOnboardingEdit: cancelOnboardingEdit,
    finishOnboarding: finishOnboarding,
    skipOnboarding: skipOnboarding,
    goStep: goStep,
    setIndustry: setIndustry,
    toggleSector: toggleSector,
    onSectorOtherInput: onSectorOtherInput,
    onIndustryInput: onIndustryInput,
    pickChip: pickChip,
    selectDomain: selectDomain,
    switchTab: switchTab,
    openHistModal: openHistModal,
    handleAuthCallback: handleAuthCallback,
    refreshAllReportBubbleMarkdown: refreshAllReportBubbleMarkdown,
    startAfterLogin: startAfterLogin,
    goHome: goHome,
    // 마이페이지
    openMyPage: openMyPage,
    closeMyPage: closeMyPage,
    openPricingModal: openPricingModal,
    closePricingModal: closePricingModal,
    selectPlan: selectPlan,
    openPwChange: openPwChange,
    closePwChange: closePwChange,
    submitPwChange: submitPwChange,
    openWithdraw: openWithdraw,
    closeWithdraw: closeWithdraw,
    submitWithdraw: submitWithdraw,
    pickMentorOrUpgrade: pickMentorOrUpgrade,
    checkUploadAccess: checkUploadAccess,
  };
  for (var k in fns) {
    try { window[k] = fns[k]; } catch(e) {}
  }
})();
