// ============================================================
// SHARED DATA & UTILITIES — مشترك بين كل الصفحات
// ============================================================
const API_BASE_URL = 'https://robokit-backend.onrender.com';
const CURRENCY = 'د.أ';
const ORDER_STATUSES = ['قيد المراجعة','قيد التجهيز','تم الشحن','مكتمل','ملغي'];
const ADMIN_PASSWORD = 'robokit-admin-2026';

// ---- Cart (localStorage so it persists across pages) ----
function cartLoad(){ try{ return JSON.parse(localStorage.getItem('robokit_cart')||'[]'); }catch(e){return[];} }
function cartSave(c){ try{ localStorage.setItem('robokit_cart', JSON.stringify(c)); }catch(e){} }
function cartAdd(entry){ const c=cartLoad(); c.push(entry); cartSave(c); updateCartBadge(); }
function cartRemove(id){ const c=cartLoad().filter(i=>i.id!==id); cartSave(c); updateCartBadge(); }
function cartClear(){ cartSave([]); updateCartBadge(); }

function updateCartBadge(){
  const badge = document.getElementById('cartBadge');
  if(!badge) return;
  const n = cartLoad().length;
  badge.textContent = n;
  badge.hidden = n === 0;
}

// ---- API helpers ----
let USE_API = false;
let adminToken = null;
async function detectApi(){
  if(!API_BASE_URL){ USE_API=false; return; }
  try{ const r=await fetch(API_BASE_URL+'/api/health'); USE_API=r.ok; }catch(e){ USE_API=false; }
}
async function adminFetch(path,opts={}){
  const r=await fetch(API_BASE_URL+path,{...opts,headers:{...(opts.headers||{}),'Authorization':'Bearer '+adminToken}});
  if(r.status===401){ adminToken=null; }
  return r;
}

// ---- Storage fallbacks ----
async function storageGetCatalog(){
  try{ const r=await window.storage?.get('catalog',true); return r?.value?JSON.parse(r.value):null; }catch(e){return null;}
}
async function storageSetCatalog(l){
  try{ await window.storage?.set('catalog',JSON.stringify(l),true); }catch(e){}
}
async function storageGetOrders(){
  try{ const r=await window.storage?.get('orders',true); return r?.value?JSON.parse(r.value):[]; }catch(e){return[];}
}
async function storageSetOrders(o){
  try{ await window.storage?.set('orders',JSON.stringify(o),true); }catch(e){}
}
async function loadCatalog(){
  if(USE_API){ try{ const r=await fetch(API_BASE_URL+'/api/catalog'); if(r.ok)return await r.json(); }catch(e){} }
  return await storageGetCatalog();
}
async function submitNewOrder(payload){
  if(USE_API){ try{ const r=await fetch(API_BASE_URL+'/api/orders',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); if(!r.ok)return null; return (await r.json()).id; }catch(e){return null;} }
  const order={id:'RK-'+Date.now().toString(36).toUpperCase(),date:new Date().toISOString(),customer:payload.customer,items:payload.items,total:payload.total,status:ORDER_STATUSES[0]};
  const orders=await storageGetOrders(); orders.push(order); await storageSetOrders(orders); return order.id;
}

// ---- Shared UI helpers ----
function escHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function kitTotal(item){ return item.parts.reduce((s,p)=>s+p.price,0); }
function showToast(msg){
  let t=document.getElementById('toast');
  if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t);}
  t.textContent=msg; t.classList.add('show');
  clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove('show'),3200);
}

// ---- Shared Header HTML ----
function renderHeader(activePage=''){
  return `
  <header class="site-header">
    <div class="container hdr-inner">
      <a href="index.html" class="brand">
        <span class="brand-mark"><span class="bot-face"><span class="eye"></span><span class="eye"></span></span></span>
        <span class="brand-text">ROBOKIT</span>
      </a>
      <nav class="nav" id="siteNav">
        <a href="index.html" class="${activePage==='home'?'active':''}">الرئيسية</a>
        <a href="projects.html" class="${activePage==='projects'?'active':''}">الكيتات</a>
        <a href="videos.html" class="${activePage==='videos'?'active':''}">الفيديوهات</a>
        <a href="community.html" class="${activePage==='community'?'active':''}">مجتمع روبو</a>
        <a href="about.html" class="${activePage==='about'?'active':''}">من نحن</a>
        <a href="index.html#contact" class="${activePage==='contact'?'active':''}">تواصل معنا</a>
      </nav>
      <div class="hdr-right">
        <a href="admin.html" class="icon-btn" title="لوحة التحكم">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        </a>
        <button class="icon-btn cart-btn" onclick="openCart()" aria-label="سلة المشتريات">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h2l2.6 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6"/></svg>
          <span class="cart-badge" id="cartBadge" hidden>0</span>
        </button>
        <button class="icon-btn menu-toggle" onclick="document.getElementById('siteNav').classList.toggle('open')" aria-label="القائمة">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        </button>
      </div>
    </div>
  </header>`;
}

// ---- Shared Cart Drawer HTML + Logic ----
function renderCartDrawer(){
  return `
  <div class="cart-overlay" id="cartOverlay" onclick="if(event.target.id==='cartOverlay')closeCart()">
    <aside class="cart-drawer">
      <div class="cart-head">
        <h3>سلة المشتريات</h3>
        <button class="icon-btn" onclick="closeCart()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="cart-items" id="cartItems"></div>
      <div class="cart-footer">
        <div class="cart-subtotal"><span>الإجمالي</span><strong id="cartSubtotal">0 ${CURRENCY}</strong></div>
        <div id="checkoutForm" hidden>
          <div class="field"><label>الاسم الكامل</label><input type="text" id="custName" placeholder="مثال: محمد أحمد"></div>
          <div class="field"><label>رقم الهاتف</label><input type="tel" id="custPhone" placeholder="07xxxxxxxx"></div>
          <div class="field"><label>العنوان</label><textarea id="custAddress" placeholder="المدينة، الحي، وأقرب نقطة دالة"></textarea></div>
          <button class="btn btn-primary btn-full" onclick="submitOrder()">تأكيد الطلب</button>
        </div>
        <button class="btn btn-primary btn-full" id="checkoutBtn" onclick="startCheckout()">إتمام الشراء</button>
        <p class="cart-note">الدفع مشفّر بالكامل عبر بوابة دفع معتمدة.</p>
      </div>
    </aside>
  </div>`;
}

function openCart(){ renderCartItems(); document.getElementById('cartOverlay').classList.add('open'); document.body.style.overflow='hidden'; }
function closeCart(){ document.getElementById('cartOverlay').classList.remove('open'); document.body.style.overflow=''; }

function renderCartItems(){
  const cart=cartLoad();
  const el=document.getElementById('cartItems');
  if(cart.length===0){ el.innerHTML='<p class="cart-empty">سلتك فارغة</p>'; }
  else{
    el.innerHTML=cart.map(ci=>`
      <div class="cart-item">
        <div><div class="cart-item-title">${escHtml(ci.title)}</div><div class="cart-item-meta">${ci.code} · ${ci.note}</div></div>
        <div class="cart-item-right">
          <span class="cart-item-price">${ci.total} ${CURRENCY}</span>
          <button class="cart-remove" onclick="cartRemove(${ci.id});renderCartItems()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>`).join('');
  }
  const total=cart.reduce((s,ci)=>s+ci.total,0);
  document.getElementById('cartSubtotal').textContent=total+' '+CURRENCY;
}

function startCheckout(){
  if(cartLoad().length===0){showToast('السلة فارغة');return;}
  document.getElementById('checkoutForm').hidden=false;
  document.getElementById('checkoutBtn').hidden=true;
}

async function submitOrder(){
  const name=document.getElementById('custName').value.trim();
  const phone=document.getElementById('custPhone').value.trim();
  const address=document.getElementById('custAddress').value.trim();
  if(!name||!phone||!address){showToast('فضلًا عبّي بيانات التوصيل كاملة');return;}
  const cart=cartLoad();
  const btn=document.querySelector('#checkoutForm button');
  btn.disabled=true;
  const id=await submitNewOrder({customer:{name,phone,address},items:cart.map(ci=>({code:ci.code,title:ci.title,note:ci.note,total:ci.total})),total:cart.reduce((s,ci)=>s+ci.total,0)});
  btn.disabled=false;
  if(!id){showToast('تعذّر إرسال الطلب، حاول مرة أخرى');return;}
  cartClear(); renderCartItems();
  document.getElementById('checkoutForm').hidden=true;
  document.getElementById('checkoutBtn').hidden=false;
  closeCart();
  showToast('تم استلام طلبك — رقم الطلب: '+id);
}
