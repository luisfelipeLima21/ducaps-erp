(() => {
  const $ = (selector) => document.querySelector(selector);
  const toast = (message) => { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer = setTimeout(() => el.classList.remove('show'), 2800); };
  const money = (n) => Number(n || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const safe = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const defaultSupabaseConfig = { url: 'https://xxmjdvlmpuaokeclgzqn.supabase.co', key: 'sb_publishable_hgy0XfyKyl9_hFM5wQn_cQ_xoc42MHY' };
  const readConfig = () => { try { const saved = JSON.parse(localStorage.getItem('vertice_supabase') || 'null'); return saved?.disabled ? {} : saved?.manual ? saved : { ...defaultSupabaseConfig }; } catch { return { ...defaultSupabaseConfig }; } };
  const rawSetLocal = localStorage.setItem.bind(localStorage);
  let cloudSyncReady = false;
  let cloudWriteChain = Promise.resolve();
  let cloudWriteErrorShown = false;
  const readLocal = () => { try { return JSON.parse(localStorage.getItem('vertice_transactions') || '[]'); } catch { return []; } };
  const readSiteCopy = () => { try { return JSON.parse(localStorage.getItem('vertice_site_copy') || '{}'); } catch { return {}; } };
  let siteCopy = readSiteCopy();
  let siteEditMode = false;
  let transactions = readLocal();
  let storageMovements = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_storage_movements') || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } })();
  let storageCatalog = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_storage_catalog') || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } })();
  let orders = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_orders') || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } })();
  let clients = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_clients') || '[]'); return Array.isArray(data) ? data.map(client => ({id:client.id || `client-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,familyName:client.familyName || client.name || 'Família sem nome',members:Array.isArray(client.members) ? client.members : [{name:client.name || '',role:client.role || '',phone:client.phone || ''}],createdAt:client.createdAt || new Date().toISOString()})) : []; } catch { return []; } })();
  let products = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_products') || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } })();
  const demoEmployees = [
    {id:'demo-042',name:'Marcos Oliveira',server_id:'042',role:'Mecânico',phone:'555-0142',status:'active'},
    {id:'demo-018',name:'João Pedro',server_id:'018',role:'Vendedor',phone:'555-0188',status:'active'},
    {id:'demo-031',name:'Ana Costa',server_id:'031',role:'Gerente',phone:'555-0131',status:'active'}
  ];
  const defaultRoles = ['Dono','Diretor','Gerente','Vendedor','Mecânico','Assistente','Segurança','Outro'];
  let memberRoles = (() => { try { const saved = JSON.parse(localStorage.getItem('vertice_member_roles') || 'null'); return Array.isArray(saved) ? [...new Set(['Dono',...(saved || [])])] : defaultRoles; } catch { return defaultRoles; } })();
  let employees = (() => { try { return JSON.parse(localStorage.getItem('vertice_employees') || 'null') || demoEmployees; } catch { return demoEmployees; } })();
  let memberAccounts = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_member_accounts') || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } })();
  let rolePermissions = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_role_permissions') || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } })();
  let memberPermissions = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_member_permissions') || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } })();
  const defaultNavOrder = ['owner','equipe','bau','encomendas','clientes'];
  const navLabels = {owner:'Gestão do site',equipe:'Cadastro de membros',bau:'Controle de baú',encomendas:'Encomendas',clientes:'Cadastro de clientes'};
  let navOrder = (() => { try { const saved = JSON.parse(localStorage.getItem('vertice_nav_order') || '[]'); return [...new Set([...(Array.isArray(saved) ? saved : []).filter(view => defaultNavOrder.includes(view)),...defaultNavOrder])]; } catch { return [...defaultNavOrder]; } })();
  let accountTargetServerId = null;
  let config = readConfig();
  localStorage.removeItem('vertice_owner_account');
  localStorage.removeItem('vertice_employee_credentials');
  const defaultSiteSettings = { companyName: 'Sua Empresa', serverName: 'Cidade Alta RP', ownerName: 'Proprietário', accent: '#c8f36a' };
  let siteSettings = (() => { try { return { ...defaultSiteSettings, ...JSON.parse(localStorage.getItem('vertice_site_settings') || '{}') }; } catch { return { ...defaultSiteSettings }; } })();
  if ((siteSettings.companyName || '').trim().toLocaleLowerCase('pt-BR') === 'vértice motors') {
    siteSettings.companyName = defaultSiteSettings.companyName;
    saveLocalState('vertice_site_settings', JSON.stringify(siteSettings));
  }
  const headers = () => ({ apikey: config.key, ...(String(config.key || '').startsWith('sb_publishable_') ? {} : { Authorization: `Bearer ${config.key}` }), 'Content-Type': 'application/json', Prefer: 'return=representation' });
  function saveLocalState(key, value) {
    rawSetLocal(key, value);
    if (!cloudSyncReady || !config.url || !config.key || !String(key).startsWith('vertice_') || key === 'vertice_supabase') return;
    let parsed; try { parsed = JSON.parse(value); } catch { parsed = value; }
    const row = { key, value: parsed, updated_at: new Date().toISOString() };
    cloudWriteChain = cloudWriteChain.then(async () => {
      const response = await fetch(`${config.url.replace(/\/$/,'')}/rest/v1/app_state?on_conflict=key`, { method: 'POST', headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) });
      if (!response.ok) throw new Error(`Falha ao sincronizar ${key} (${response.status}).`);
      cloudWriteErrorShown = false;
    }).catch(error => { if (!cloudWriteErrorShown) { cloudWriteErrorShown = true; toast(`${error.message} Confira se executou supabase-schema.sql.`); } });
  }
  const setConnection = (connected) => { $('#connectionDot').classList.toggle('connected', connected); $('#connectionText').textContent = connected ? 'Supabase conectado' : 'Modo demonstração'; };
  const setMetric = (id, value) => { const el = $(id); if (el) el.innerHTML = `${money(value).replace(',00','')}<span>,${String((Number(value || 0) % 1).toFixed(2).slice(2)).padStart(2,'0')}</span>`; };
  function updateMetrics() {
    const demoModeReset = localStorage.getItem('vertice_reset_completed') === 'true';
    const baseIncome = demoModeReset ? 0 : 48250, baseExpense = demoModeReset ? 0 : 18740;
    const extraIncome = transactions.filter(x => x.type === 'income').reduce((s, x) => s + Number(x.amount), 0);
    const extraExpense = transactions.filter(x => x.type === 'expense').reduce((s, x) => s + Number(x.amount), 0);
    setMetric('#revenue', baseIncome + extraIncome); setMetric('#expenses', baseExpense + extraExpense); setMetric('#balance', baseIncome - baseExpense + extraIncome - extraExpense);
  }
  function renderActivity() {
    const custom = [...transactions].sort((a,b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0)).slice(0,5).map(x => {
      const income = x.type === 'income';
      const date = new Date(x.created_at || x.createdAt || Date.now());
      const time = date.toLocaleDateString('pt-BR',{day:'2-digit',month:'short'}) + ' · ' + date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'});
      return `<div class="activity-item"><div class="activity-icon ${income?'income-icon':'expense-icon'}">${income?'↙':'↗'}</div><div class="activity-info"><b>${safe(x.description)}</b><small>${time} · ${safe(x.responsible || 'Equipe Vértice')}</small></div><strong class="${income?'amount-in':'amount-out'}">${income?'+':'−'} ${money(x.amount)}</strong></div>`;
    });
    if (localStorage.getItem('vertice_reset_completed') === 'true') {
      $('#activityList').innerHTML = custom.join('') || '<div class="activity-empty">Nenhuma movimentação cadastrada.</div>';
      return;
    }
    if (!custom.length) return;
    $('#activityList').insertAdjacentHTML('afterbegin', custom.join(''));
    [...$('#activityList').children].slice(5).forEach(el => el.remove());
  }
  function siteCopyPath(element) {
    const parts = [];
    let current = element;
    while (current && current !== document.body && !current.id) {
      const sameTag = [...current.parentElement.children].filter(sibling => sibling.tagName === current.tagName);
      parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${sameTag.indexOf(current) + 1})`);
      current = current.parentElement;
    }
    return `${current?.id ? `#${current.id}` : 'body'}>${parts.join('>')}`;
  }
  function prepareSiteCopy() {
    const excluded = 'script,style,svg,path,input,textarea,select,option,img,br,#toggleSiteEditor,#themeToggle,#activityList,#employeeRows,#chart,.team-table,.avatar-stack,.avatar,.nav-icon,.metric-icon,.activity-icon,.live-dot,.notification-dot,.connection-dot,#previewCompanyName,#previewServerName,#previewCompanyIcon';
    const elements = [...document.body.querySelectorAll('*')];
    elements.forEach(element => {
      if (element.matches(excluded) || element.closest(excluded) || element.hasAttribute('data-site-copy-key')) return;
      const textNodes = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE && node.nodeValue.trim());
      textNodes.forEach((node, index) => {
        const key = `${siteCopyPath(element)}::text-${index}`;
        const editableText = document.createElement('span');
        editableText.dataset.siteCopyKey = key;
        editableText.textContent = siteCopy[key] ?? node.nodeValue;
        node.replaceWith(editableText);
        editableText.addEventListener('click', event => {
          if (!siteEditMode) return;
          if (editableText.closest('a,button,label')) event.preventDefault();
          event.stopPropagation();
        });
        editableText.addEventListener('input', () => {
          siteCopy[key] = editableText.textContent;
          saveLocalState('vertice_site_copy', JSON.stringify(siteCopy));
        });
      });
    });
  }
  function setSiteEditMode(enabled) {
    siteEditMode = enabled;
    document.body.classList.toggle('site-editing', enabled);
    document.querySelectorAll('[data-site-copy-key]').forEach(element => { element.contentEditable = enabled ? 'true' : 'false'; });
    $('#toggleSiteEditor').textContent = enabled ? '✓ Edição ativa' : '✎ Editar site';
    $('#siteEditToolbar').hidden = !enabled;
  }
  async function loadRemote() {
    if (!config.url || !config.key) { setConnection(false); return; }
    try {
      cloudSyncReady = false;
      const res = await fetch(`${config.url.replace(/\/$/,'')}/rest/v1/app_state?select=key,value`, { headers: headers() });
      if (!res.ok) throw new Error(res.status === 404 ? 'Tabela app_state não encontrada. Execute o arquivo supabase-schema.sql no Supabase.' : `Supabase respondeu ${res.status}. Confira a URL, a chave pública e as políticas.`);
      const rows = await res.json();
      if (rows.length) {
        Object.keys(localStorage).filter(key => key.startsWith('vertice_') && key !== 'vertice_supabase').forEach(key => localStorage.removeItem(key));
        rows.filter(row => String(row.key).startsWith('vertice_') && row.key !== 'vertice_supabase').forEach(row => rawSetLocal(row.key, JSON.stringify(row.value)));
      } else {
        // Migra os dados que já estavam nas tabelas antigas antes de semear o estado compartilhado.
        const base = config.url.replace(/\/$/,'');
        const [oldTransactions, oldEmployees] = await Promise.all([
          fetch(`${base}/rest/v1/transactions?select=*&order=created_at.desc&limit=500`, { headers: headers() }),
          fetch(`${base}/rest/v1/employees?select=*&order=created_at.desc`, { headers: headers() })
        ]);
        if (oldTransactions.ok) { const data = await oldTransactions.json(); if (data.length) { transactions = data; rawSetLocal('vertice_transactions', JSON.stringify(data)); } }
        if (oldEmployees.ok) { const data = await oldEmployees.json(); if (data.length) { employees = data; rawSetLocal('vertice_employees', JSON.stringify(data)); } }
        const seed = Object.keys(localStorage).filter(key => key.startsWith('vertice_') && key !== 'vertice_supabase').map(key => { let value; try { value = JSON.parse(localStorage.getItem(key)); } catch { value = localStorage.getItem(key); } return { key, value }; });
        if (seed.length) {
          const seedResponse = await fetch(`${base}/rest/v1/app_state?on_conflict=key`, { method: 'POST', headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(seed) });
          if (!seedResponse.ok) throw new Error(`Falha ao enviar os dados atuais (${seedResponse.status}).`);
        }
      }
      hydrateSharedState(); cloudSyncReady = true; setConnection(true);
    } catch (err) { setConnection(false); toast(err.message || 'Não foi possível conectar ao Supabase.'); }
  }
  function hydrateSharedState() {
    const readArray = (key, fallback = []) => { try { const data = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(data) ? data : fallback; } catch { return fallback; } };
    const readObject = key => { try { const data = JSON.parse(localStorage.getItem(key) || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } };
    transactions = readArray('vertice_transactions'); storageMovements = readArray('vertice_storage_movements'); storageCatalog = readArray('vertice_storage_catalog'); orders = readArray('vertice_orders'); clients = readArray('vertice_clients'); products = readArray('vertice_products');
    employees = readArray('vertice_employees', localStorage.getItem('vertice_reset_completed') === 'true' ? [] : demoEmployees);
    memberAccounts = readObject('vertice_member_accounts'); rolePermissions = readObject('vertice_role_permissions'); memberPermissions = readObject('vertice_member_permissions');
    const savedRoles = readArray('vertice_member_roles', defaultRoles); memberRoles = [...new Set(['Dono', ...savedRoles])];
    const savedOrder = readArray('vertice_nav_order', defaultNavOrder); navOrder = [...new Set([...savedOrder.filter(view => defaultNavOrder.includes(view)), ...defaultNavOrder])];
    siteSettings = { ...defaultSiteSettings, ...readObject('vertice_site_settings') }; siteCopy = readObject('vertice_site_copy');
    applyTheme(localStorage.getItem('vertice_theme') || 'light'); applyNavOrder(); renderNavOrder(); applySiteSettings(); renderRoles(); renderEmployees(); renderStorageCatalog(); renderStorage(); renderProducts(); renderOrders(); renderClients(); renderActivity(); updateMetrics(); prepareSiteCopy(); syncOwnerNavigation();
  }
  const modal = $('#modalBackdrop');
  function openTransaction(type) { $('#transactionType').value = type || 'income'; $('#transactionForm').reset(); if (type) $('#transactionType').value = type; modal.classList.add('open'); setTimeout(() => $('#description').focus(), 50); }
  function closeTransaction() { modal.classList.remove('open'); }
  $('#newAction').addEventListener('click', () => {
    if (!canMemberDo('financeiro.income') && !canMemberDo('financeiro.expense')) return toast('O Dono não liberou movimentações financeiras para este membro.');
    openTransaction();
  });
  document.querySelectorAll('[data-action]').forEach(btn => btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    if (action === 'income' || action === 'expense') {
      if (!canMemberDo(`financeiro.${action}`)) return toast('O Dono não liberou esta ação financeira para este membro.');
      openTransaction(action);
    }
    else if (action === 'employee') showView('equipe');
    else toast('Estoque: seção em preparação.');
  }));
  $('#closeModal').addEventListener('click', closeTransaction); $('#cancelModal').addEventListener('click', closeTransaction);
  modal.addEventListener('click', e => { if (e.target === modal) closeTransaction(); });
  $('#transactionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!canMemberDo(`financeiro.${$('#transactionType').value}`)) return toast('O Dono não liberou esta ação financeira para este membro.');
    const record = { type: $('#transactionType').value, description: $('#description').value.trim(), amount: Number($('#amount').value), category: $('#category').value, responsible: $('#responsible').value.trim() || 'Lucas Martins' };
    if (!record.description || record.amount <= 0) return;
    record.created_at = new Date().toISOString();
    transactions.unshift(record); saveLocalState('vertice_transactions', JSON.stringify(transactions));
    renderActivity(); updateMetrics(); closeTransaction(); toast(cloudSyncReady ? 'Movimentação salva e sincronizada.' : 'Movimentação salva neste navegador.');
  });
  const settingsModal = $('#settingsBackdrop');
  $('#connectionButton').addEventListener('click', () => { $('#supabaseUrl').value = config.url || ''; $('#supabaseKey').value = config.key || ''; settingsModal.classList.add('open'); });
  $('#closeSettings').addEventListener('click', () => settingsModal.classList.remove('open'));
  settingsModal.addEventListener('click', e => { if (e.target === settingsModal) settingsModal.classList.remove('open'); });
  $('#settingsForm').addEventListener('submit', async e => {
    e.preventDefault(); config = { url: $('#supabaseUrl').value.trim().replace(/\/$/,''), key: $('#supabaseKey').value.trim(), manual: true };
    if (!config.url || !config.key) return toast('Informe a URL e a chave pública anon.');
    saveLocalState('vertice_supabase', JSON.stringify(config)); settingsModal.classList.remove('open'); await loadRemote(); if ($('#connectionDot').classList.contains('connected')) toast('Conexão Supabase ativa.');
  });
  $('#disconnectSupabase').addEventListener('click', () => { config = {}; cloudSyncReady = false; saveLocalState('vertice_supabase', JSON.stringify({ disabled: true })); setConnection(false); settingsModal.classList.remove('open'); toast('Supabase desconectado. Os dados locais continuam salvos.'); });
  $('#exportBtn').addEventListener('click', () => {
    if (!canMemberDo('relatorios.export')) return toast('O Dono não liberou a exportação de relatórios para este membro.');
    const rows = [['Data','Tipo','Descrição','Categoria','Responsável','Valor'], ...transactions.map(x => [x.created_at || x.createdAt || '',x.type,x.description,x.category,x.responsible,x.amount])];
    if (rows.length === 1) { toast('Ainda não há movimentações para exportar.'); return; }
    const csv = '\ufeff' + rows.map(row => row.map(v => `"${String(v ?? '').replace(/"/g,'""')}"`).join(';')).join('\n');
    const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], {type:'text/csv;charset=utf-8'})); link.download = 'vertice-movimentacoes.csv'; link.click(); URL.revokeObjectURL(link.href); toast('Relatório exportado em CSV.');
  });
  $('#notifications').addEventListener('click', () => toast('Você está em dia com as notificações.'));
  function applyTheme(theme) {
    const dark = theme === 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('#themeToggle').textContent = dark ? '☀' : '☾';
    $('#themeToggle').setAttribute('aria-label', dark ? 'Ativar modo claro' : 'Ativar modo escuro');
    $('#themeToggle').title = dark ? 'Ativar modo claro' : 'Ativar modo escuro';
    saveLocalState('vertice_theme', dark ? 'dark' : 'light');
  }
  $('#themeToggle').addEventListener('click', () => applyTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  const titles = {login:'Entrar',inicio:'Visão geral',financeiro:'Financeiro',equipe:'Cadastro de membros',bau:'Controle de baú',encomendas:'Encomendas',clientes:'Cadastro de clientes',operacoes:'Operações',estoque:'Estoque',relatorios:'Relatórios',configuracoes:'Configurações',owner:'Gestão do site'};
  const orderStatuses = ['Recebida','Em andamento','Pronta','Entregue','Cancelada'];
  function updateOrderPrice() {
    const product = products.find(item => String(item.id) === $('#orderItem').value);
    const unitValue = Number(product?.unitValue || 0), quantity = Number($('#orderQuantity').value || 0);
    $('#orderUnitValue').value = unitValue ? unitValue.toFixed(2) : '';
    $('#orderValue').value = unitValue && quantity ? (unitValue * quantity).toFixed(2) : '';
  }
  function getStorageItemBalances(itemName) {
    const balances = {QG:0,Casa:0};
    const key = String(itemName || '').trim().toLocaleLowerCase('pt-BR');
    storageMovements.forEach(move => { if (String(move.item || '').trim().toLocaleLowerCase('pt-BR') !== key) return; const location = move.location === 'Casa' ? 'Casa' : 'QG'; balances[location] += move.type === 'entry' ? Number(move.quantity) : -Number(move.quantity); });
    balances.QG = Math.max(0,balances.QG); balances.Casa = Math.max(0,balances.Casa); balances.total = balances.QG + balances.Casa;
    return balances;
  }
  function renderProducts() {
    const canManageProducts = canMemberDo('encomendas.manageProducts');
    $('#productForm').hidden = !canManageProducts;
    const selected = $('#orderItem').value;
    $('#productRows').innerHTML = products.map(product => { const existsInStorage = storageCatalog.some(item => item.name.toLocaleLowerCase('pt-BR') === product.name.toLocaleLowerCase('pt-BR')); const stock = getStorageItemBalances(product.name); const stockLabel = existsInStorage ? `<b>${stock.total.toLocaleString('pt-BR')} un.</b><small>QG ${stock.QG} · Casa ${stock.Casa}</small>` : '<span class="product-stock-missing">Não cadastrado no baú</span>'; return `<tr><td>${safe(product.name)}</td><td>${money(product.unitValue)}</td><td class="product-stock-cell">${stockLabel}</td><td>${canManageProducts ? `<button type="button" class="employee-delete" data-product-delete="${safe(product.id)}" title="Excluir produto" aria-label="Excluir ${safe(product.name)}">×</button>` : ''}</td></tr>`; }).join('');
    $('#productEmpty').hidden = products.length > 0;
    const select = $('#orderItem');
    select.innerHTML = '<option value="">Selecione um produto</option>' + products.map(product => { const existsInStorage = storageCatalog.some(item => item.name.toLocaleLowerCase('pt-BR') === product.name.toLocaleLowerCase('pt-BR')); const stock = getStorageItemBalances(product.name); const availability = existsInStorage ? `Estoque ${stock.total}` : 'Sem cadastro no baú'; return `<option value="${safe(product.id)}">${safe(product.name)} · ${money(product.unitValue)} · ${availability}</option>`; }).join('');
    select.value = products.some(product => String(product.id) === selected) ? selected : products.length === 1 ? String(products[0].id) : '';
    document.querySelectorAll('[data-product-delete]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('encomendas.manageProducts')) return toast('O Dono não liberou a gestão de produtos para este membro.');
      const product = products.find(item => String(item.id) === String(button.dataset.productDelete)); if (!product) return;
      if (!window.confirm(`Excluir o produto ${product.name}? Encomendas já cadastradas serão mantidas.`)) return;
      products = products.filter(item => String(item.id) !== String(product.id)); saveLocalState('vertice_products',JSON.stringify(products)); renderProducts(); updateOrderPrice(); toast('Produto excluído do catálogo.');
    }));
    updateOrderPrice();
  }
  $('#productForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!canMemberDo('encomendas.manageProducts')) return toast('O Dono não liberou a gestão de produtos para este membro.');
    const name = $('#productName').value.trim(), unitValue = Number($('#productUnitPrice').value);
    if (products.some(product => product.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) return toast('Esse produto já está cadastrado.');
    products.push({id:`product-${Date.now()}`,name,unitValue}); saveLocalState('vertice_products',JSON.stringify(products));
    event.target.reset(); renderProducts(); toast('Produto cadastrado.');
  });
  $('#orderItem').addEventListener('change', updateOrderPrice);
  $('#orderQuantity').addEventListener('input', updateOrderPrice);
  function renderOrderFamilies() {
    const familySelect = $('#orderFamily'); if (!familySelect) return;
    const selectedFamily = familySelect.value, selectedMember = $('#orderFamilyMember').value;
    familySelect.innerHTML = '<option value="">Selecione uma família</option>' + clients.map(family => `<option value="${safe(family.id)}">${safe(family.familyName || family.name)} · ${(family.members || []).length} ${(family.members || []).length === 1 ? 'membro' : 'membros'}</option>`).join('');
    familySelect.value = clients.some(family => String(family.id) === selectedFamily) ? selectedFamily : '';
    const family = clients.find(item => String(item.id) === familySelect.value);
    const members = family?.members || [];
    $('#orderFamilyMember').innerHTML = '<option value="">Toda a família</option>' + members.map((member,index) => `<option value="${index}">${safe(member.name)}${member.role ? ` · ${safe(member.role)}` : ''}</option>`).join('');
    $('#orderFamilyMember').disabled = !family || members.length === 0;
    if (members.some((member,index) => String(index) === selectedMember)) $('#orderFamilyMember').value = selectedMember;
  }
  $('#orderFamily').addEventListener('change', () => { $('#orderFamilyMember').value = ''; renderOrderFamilies(); });
  function renderOrders() {
    renderOrderFamilies();
    const canCreateOrders = canMemberDo('encomendas.create'), canManageOrders = canMemberDo('encomendas.manageOrders');
    $('#orderForm').hidden = !canCreateOrders;
    const query = ($('#orderSearch').value || '').trim().toLocaleLowerCase('pt-BR');
    const filtered = orders.filter(order => [order.customer,order.familyName,order.familyMember,order.item,order.responsible,order.status].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(query)));
    $('#orderTotal').textContent = orders.length;
    $('#orderPending').textContent = orders.filter(order => ['Recebida','Em andamento'].includes(order.status)).length;
    $('#orderReady').textContent = orders.filter(order => order.status === 'Pronta').length;
    $('#orderListCaption').textContent = `${orders.length} ${orders.length === 1 ? 'encomenda cadastrada' : 'encomendas cadastradas'}`;
    $('#orderRows').innerHTML = filtered.map(order => `<tr><td><b>${safe(order.familyName || order.customer)}</b>${order.familyMember ? `<small class="order-details">${safe(order.familyMember)}</small>` : order.familyName ? '<small class="order-details">Família</small>' : ''}</td><td><b>${safe(order.item)}</b>${order.details ? `<small class="order-details">${safe(order.details)}</small>` : ''}</td><td>${Number(order.quantity).toLocaleString('pt-BR')}</td><td>${money(order.value)}</td><td>${safe(order.responsible || '—')}</td><td>${order.dueDate ? new Date(`${order.dueDate}T00:00:00`).toLocaleDateString('pt-BR') : '—'}</td><td>${canManageOrders ? `<select class="order-status-select status-${order.status.toLocaleLowerCase('pt-BR').replaceAll(' ','-')}" data-order-status="${safe(order.id)}" aria-label="Status da encomenda de ${safe(order.familyName || order.customer)}">${orderStatuses.map(status => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select>` : `<span class="order-status-select status-${order.status.toLocaleLowerCase('pt-BR').replaceAll(' ','-')}">${safe(order.status)}</span>`}</td><td>${canManageOrders ? `<button class="employee-delete" data-delete-order="${safe(order.id)}" title="Excluir encomenda" aria-label="Excluir encomenda de ${safe(order.familyName || order.customer)}">×</button>` : ''}</td></tr>`).join('');
    $('#orderEmpty').hidden = filtered.length > 0;
    document.querySelectorAll('[data-order-status]').forEach(select => select.addEventListener('change', () => {
      if (!canMemberDo('encomendas.manageOrders')) return toast('O Dono não liberou a gestão de pedidos para este membro.');
      const order = orders.find(item => String(item.id) === String(select.dataset.orderStatus)); if (!order) return;
      order.status = select.value; saveLocalState('vertice_orders',JSON.stringify(orders)); renderOrders(); toast(`Encomenda atualizada: ${order.status}.`);
    }));
    document.querySelectorAll('[data-delete-order]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('encomendas.manageOrders')) return toast('O Dono não liberou a gestão de pedidos para este membro.');
      const order = orders.find(item => String(item.id) === String(button.dataset.deleteOrder)); if (!order) return;
      if (!window.confirm(`Excluir a encomenda de ${order.customer}?`)) return;
      orders = orders.filter(item => String(item.id) !== String(order.id)); saveLocalState('vertice_orders',JSON.stringify(orders)); renderOrders(); toast('Encomenda excluída.');
    }));
  }
  $('#orderForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!canMemberDo('encomendas.create')) return toast('O Dono não liberou a criação de pedidos para este membro.');
    if (!canMemberDo('bau.move')) return toast('Criar pedidos também baixa o estoque. Peça ao Dono a permissão de movimentar o baú.');
    const product = products.find(item => String(item.id) === $('#orderItem').value);
    if (!product) return toast('Cadastre e selecione um produto antes de salvar a encomenda.');
    const family = clients.find(item => String(item.id) === $('#orderFamily').value);
    if (!family) return toast('Cadastre e selecione uma família antes de salvar a encomenda.');
    const familyMemberIndex = $('#orderFamilyMember').value;
    const familyMember = familyMemberIndex === '' ? '' : family.members?.[Number(familyMemberIndex)]?.name || '';
    const quantity = Number($('#orderQuantity').value);
    const storageItem = storageCatalog.find(item => item.name.toLocaleLowerCase('pt-BR') === product.name.toLocaleLowerCase('pt-BR'));
    if (!storageItem) return toast(`Cadastre “${product.name}” também no catálogo do baú antes de vender.`);
    const stock = getStorageItemBalances(product.name);
    if (quantity > stock.total) return toast(`Estoque insuficiente de ${product.name} no baú. Disponível: ${stock.total}.`);
    const familyName = family.familyName || family.name;
    const orderId = `order-${Date.now()}`, createdAt = new Date().toISOString(), responsible = $('#orderResponsible').value.trim() || getStorageMember()?.name || 'Encomendas';
    let remaining = quantity; const stockMovementsForOrder = [];
    ['QG','Casa'].forEach(location => { const taken = Math.min(Math.max(0,stock[location]),remaining); if (taken > 0) { const movementId = `storage-move-${Date.now()}-${location}`; stockMovementsForOrder.push({id:movementId,type:'withdrawal',item:storageItem.name,location,quantity:taken,responsible,memberServerId:getStorageMember()?.server_id || '',note:`Venda da encomenda ${orderId}`,createdAt}); remaining -= taken; } });
    storageMovements.unshift(...stockMovementsForOrder);
    saveLocalState('vertice_storage_movements',JSON.stringify(storageMovements));
    orders.unshift({id:orderId,productId:product.id,customer:familyName,familyId:family.id,familyName,familyMember,item:product.name,quantity,unitValue:Number(product.unitValue),value:Number(product.unitValue) * quantity,responsible:$('#orderResponsible').value.trim(),dueDate:$('#orderDueDate').value,details:$('#orderDetails').value.trim(),status:'Recebida',stockMovementIds:stockMovementsForOrder.map(move => move.id),createdAt});
    saveLocalState('vertice_orders',JSON.stringify(orders)); event.target.reset(); $('#orderQuantity').value='1'; renderProducts(); renderStorage(); renderOrderFamilies(); renderOrders(); toast('Encomenda cadastrada e estoque do baú atualizado.');
  });
  $('#orderSearch').addEventListener('input', renderOrders);
  let editingClientId = null;
  const familyMemberRow = member => `<div class="family-member-row"><label>Nome do membro<input class="family-member-name" required maxlength="80" value="${safe(member?.name || '')}" placeholder="Ex.: Rafael Oliveira"></label><label>Cargo<input class="family-member-role" required maxlength="50" value="${safe(member?.role || '')}" placeholder="Ex.: Gerente"></label><label>Telefone para contato<input class="family-member-phone" maxlength="40" value="${safe(member?.phone || '')}" placeholder="Ex.: 555-0142"></label><button type="button" class="employee-delete family-member-remove" aria-label="Remover membro" title="Remover membro">×</button></div>`;
  function updateFamilyMemberRemoveButtons() { const buttons = document.querySelectorAll('.family-member-remove'); buttons.forEach(button => { button.disabled = buttons.length === 1; }); $('#familyMemberCount').textContent = `${buttons.length} ${buttons.length === 1 ? 'membro' : 'membros'}`; }
  function renderClients() {
    const canManageFamilies = canMemberDo('clientes.manageFamilies'), canDeleteFamilies = canMemberDo('clientes.deleteFamilies');
    $('#clientFormPanel').hidden = !canManageFamilies; $('#newClient').hidden = !canManageFamilies;
    const query = ($('#clientSearch').value || '').trim().toLocaleLowerCase('pt-BR');
    const filtered = clients.filter(client => [client.familyName,...(client.members || []).flatMap(member => [member.name,member.role,member.phone])].some(value => String(value || '').toLocaleLowerCase('pt-BR').includes(query)));
    $('#clientTotal').textContent = clients.length.toLocaleString('pt-BR');
    $('#clientListCaption').textContent = `${clients.length} ${clients.length === 1 ? 'família cadastrada' : 'famílias cadastradas'}`;
    $('#clientRows').innerHTML = filtered.map(client => { const members = client.members || []; const familyName = client.familyName || client.name; const memberCards = members.map(member => { const initials = (member.name || 'Membro').trim().split(/\s+/).slice(0,2).map(part => part[0] || '').join('').toLocaleUpperCase('pt-BR'); const phone = String(member.phone || ''); const phoneLink = phone.replace(/[^\d+]/g,''); return `<div class="family-member-card"><span class="family-member-avatar">${safe(initials || 'M')}</span><div class="family-member-info"><b>${safe(member.name || 'Membro sem nome')}</b><span class="family-member-role">${safe(member.role || 'Cargo não informado')}</span>${phone ? `<a class="family-member-contact" href="tel:${safe(phoneLink)}">☎ ${safe(phone)}</a>` : '<small class="family-member-no-contact">Telefone não informado</small>'}</div></div>`; }).join(''); return `<article class="family-card"><header class="family-card-header"><span class="family-card-icon">♧</span><div class="family-card-title"><h3>${safe(familyName)}</h3><small>${members.length} ${members.length === 1 ? 'membro' : 'membros'}</small></div><div class="family-card-actions">${canManageFamilies ? `<button class="employee-access" type="button" data-edit-client="${safe(client.id)}" title="Editar família">Editar</button>` : ''}${canDeleteFamilies ? `<button class="employee-delete" type="button" data-delete-client="${safe(client.id)}" title="Excluir família" aria-label="Excluir ${safe(familyName)}">×</button>` : ''}</div></header><div class="family-member-list">${memberCards || '<small class="family-member-no-contact">Nenhum membro cadastrado</small>'}</div></article>`; }).join('');
    $('#clientEmpty').hidden = filtered.length > 0;
    $('#clientEmpty b').textContent = clients.length && query ? 'Nenhuma família encontrada' : 'Nenhuma família cadastrada';
    $('#clientEmpty small').textContent = clients.length && query ? 'Tente buscar por outro nome, cargo ou telefone.' : 'Cadastre a primeira família para começar sua lista.';
    document.querySelectorAll('[data-delete-client]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('clientes.deleteFamilies')) return toast('O Dono não liberou a exclusão de famílias para este membro.');
      const client = clients.find(item => String(item.id) === String(button.dataset.deleteClient)); if (!client) return;
      if (!window.confirm(`Excluir ${client.familyName || client.name} do cadastro de clientes?`)) return;
      clients = clients.filter(item => String(item.id) !== String(client.id)); saveLocalState('vertice_clients',JSON.stringify(clients)); renderClients(); toast('Família removida.');
    }));
    document.querySelectorAll('[data-edit-client]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('clientes.manageFamilies')) return toast('O Dono não liberou a edição de famílias para este membro.');
      const client = clients.find(item => String(item.id) === String(button.dataset.editClient)); if (!client) return;
      editingClientId = String(client.id); $('#clientFamilyName').value = client.familyName || client.name || ''; $('#familyMembers').innerHTML = (client.members?.length ? client.members : [{name:client.name || '',role:'',phone:client.phone || ''}]).map(familyMemberRow).join(''); updateFamilyMemberRemoveButtons();
      $('#clientFormTitle').textContent = 'Editar família'; $('#saveClientButton').innerHTML = 'Salvar alterações <span>→</span>'; $('#cancelClientEdit').hidden = false; $('#clientFormPanel').scrollIntoView({behavior:'smooth',block:'center'});
    }));
    renderOrderFamilies();
  }
  function resetClientForm() { editingClientId = null; $('#clientForm').reset(); $('#clientFamilyName').value = ''; $('#familyMembers').innerHTML = familyMemberRow({}); updateFamilyMemberRemoveButtons(); $('#clientFormTitle').textContent = 'Nova família'; $('#saveClientButton').innerHTML = 'Salvar família <span>→</span>'; $('#cancelClientEdit').hidden = true; }
  $('#familyMembers').innerHTML = familyMemberRow({}); updateFamilyMemberRemoveButtons();
  $('#addFamilyMember').addEventListener('click', () => { $('#familyMembers').insertAdjacentHTML('beforeend',familyMemberRow({})); updateFamilyMemberRemoveButtons(); $('#familyMembers .family-member-row:last-child .family-member-name').focus(); });
  $('#familyMembers').addEventListener('click', event => { const remove = event.target.closest('.family-member-remove'); if (remove && $('#familyMembers .family-member-row').length > 1) { remove.closest('.family-member-row').remove(); updateFamilyMemberRemoveButtons(); } });
  $('#cancelClientEdit').addEventListener('click', resetClientForm);
  $('#clientSearch').addEventListener('input', renderClients);
  $('#newClient').addEventListener('click', () => { resetClientForm(); $('#clientFamilyName').focus(); $('#clientFormPanel').scrollIntoView({behavior:'smooth',block:'center'}); });
  $('#clientForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!canMemberDo('clientes.manageFamilies')) return toast('O Dono não liberou a edição de famílias para este membro.');
    const wasEditing = Boolean(editingClientId);
    const family = {familyName:$('#clientFamilyName').value.trim(),members:[...document.querySelectorAll('.family-member-row')].map(row => ({name:row.querySelector('.family-member-name').value.trim(),role:row.querySelector('.family-member-role').value.trim(),phone:row.querySelector('.family-member-phone').value.trim()})),createdAt:new Date().toISOString()};
    const duplicate = clients.some(item => String(item.id) !== String(editingClientId) && (item.familyName || item.name || '').toLocaleLowerCase('pt-BR') === family.familyName.toLocaleLowerCase('pt-BR'));
    if (duplicate) return toast('Já existe uma família com esse nome.');
    if (editingClientId) { const index = clients.findIndex(item => String(item.id) === editingClientId); if (index < 0) return resetClientForm(); clients[index] = {...clients[index],...family,createdAt:clients[index].createdAt}; }
    else clients.unshift({id:`client-${Date.now()}`,...family});
    saveLocalState('vertice_clients',JSON.stringify(clients)); resetClientForm(); renderClients(); toast(wasEditing ? 'Família atualizada.' : 'Família cadastrada.');
  });
  const storageSessionKey = 'vertice_storage_member_session';
  let requestedProtectedView = 'login';
  const getStorageMember = () => employees.find(member => String(member.server_id) === sessionStorage.getItem(storageSessionKey) && member.status !== 'inactive') || null;
  const hasDonoAccount = () => Object.values(memberAccounts).some(account => employees.some(member => String(member.server_id) === String(account.serverId) && member.status !== 'inactive' && String(member.role).toLocaleLowerCase('pt-BR') === 'dono'));
  const canManagePermissions = () => !hasDonoAccount() || String(getStorageMember()?.role || '').toLocaleLowerCase('pt-BR') === 'dono';
  const hasRolePermission = (member, view) => String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono' || rolePermissions[member?.role]?.[view] === true;
  const hasMemberPermission = (member, view) => { if (String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono') return true; const overrides = memberPermissions[String(member?.server_id)] || {}; return Object.prototype.hasOwnProperty.call(overrides,view) ? overrides[view] !== false : hasRolePermission(member,view); };
  const hasMemberAction = (member, action) => !member && !hasDonoAccount() || String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono' || memberPermissions[String(member?.server_id)]?.[action] === true;
  const canMemberDo = action => {
    const member = getStorageMember();
    const area = action.startsWith('bau.') ? 'bau' : action.startsWith('encomendas.') ? 'encomendas' : action.startsWith('clientes.') ? 'clientes' : '';
    return (!area || hasMemberPermission(member,area)) && hasMemberAction(member,action);
  };
  const memberLandingView = member => String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono' ? 'owner' : navOrder.find(view => ['bau','encomendas','clientes'].includes(view) && hasMemberPermission(member,view)) || (['financeiro.income','financeiro.expense','relatorios.export'].some(action => memberPermissions[String(member?.server_id)]?.[action] === true) ? 'inicio' : '');
  const syncOwnerNavigation = () => {
    const member = getStorageMember();
    const allowed = !hasDonoAccount() || String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono';
    document.querySelectorAll('.nav-item[data-view="owner"],#employeeNavItem').forEach(item => { item.hidden = !allowed; });
    document.querySelector('.nav-item[data-view="bau"]').hidden = Boolean(member) && !hasMemberPermission(member,'bau');
    document.querySelector('.nav-item[data-view="encomendas"]').hidden = Boolean(member) && !hasMemberPermission(member,'encomendas');
    document.querySelector('.nav-item[data-view="clientes"]').hidden = Boolean(member) && !hasMemberPermission(member,'clientes');
    $('#memberSessionButton').textContent = member ? `Sair · ${member.name}` : 'Entrar';
    $('#setupOwnerAccess').hidden = hasDonoAccount();
    $('#newAction').hidden = !canMemberDo('financeiro.income') && !canMemberDo('financeiro.expense');
    document.querySelectorAll('[data-action="income"]').forEach(button => { button.hidden = !canMemberDo('financeiro.income'); });
    document.querySelectorAll('[data-action="expense"]').forEach(button => { button.hidden = !canMemberDo('financeiro.expense'); });
    document.querySelectorAll('[data-action="employee"]').forEach(button => { button.hidden = !allowed; });
    $('#exportBtn').hidden = !canMemberDo('relatorios.export');
    renderMemberPermissions();
    const activeView = document.querySelector('.nav-item.active')?.dataset.view;
    if (activeView && ['bau','encomendas','clientes'].includes(activeView) && member && !hasMemberPermission(member,activeView)) {
      const destination = memberLandingView(member);
      if (destination && destination !== activeView) showView(destination);
      else { sessionStorage.removeItem(storageSessionKey); showView('login'); }
    }
    if (!allowed && ['owner','equipe'].includes(activeView)) { setSiteEditMode(false); showView('login'); }
  };
  function requestMemberLogin(view) {
    requestedProtectedView = view;
    const ownerAccess = view === 'owner' || view === 'equipe';
    $('#loginNotice').textContent = ownerAccess ? 'Entre com a conta do Dono para abrir esta área.' : 'Entre para acessar as áreas liberadas para sua conta.';
    $('#loginScreenForm').reset();
    showView('login');
    $('#loginScreenName').focus();
  }
  let selectedPermissionMemberId = '';
  function renderMemberPermissions() {
    const ownerLoggedIn = canManagePermissions();
    const memberSelect = $('#memberPermissionsMemberSelect');
    if (memberSelect) {
      if (!employees.some(member => String(member.server_id) === String(selectedPermissionMemberId))) selectedPermissionMemberId = '';
      memberSelect.innerHTML = '<option value="">Selecione um membro</option>' + employees.map(member => `<option value="${safe(member.server_id)}">${safe(member.name)} · ID ${safe(member.server_id || '—')} · ${safe(member.role || 'Sem cargo')}</option>`).join('');
      memberSelect.value = selectedPermissionMemberId;
    }
    const selectedMember = employees.find(member => String(member.server_id) === String(selectedPermissionMemberId));
    const groups = [
      {title:'Baú',permissions:[{key:'bau',label:'Acesso ao baú',view:true},{key:'bau.move',label:'Movimentar estoque'},{key:'bau.createItems',label:'Cadastrar itens'},{key:'bau.manageItems',label:'Excluir itens cadastrados'}]},
      {title:'Encomendas',permissions:[{key:'encomendas',label:'Acesso às encomendas',view:true},{key:'encomendas.create',label:'Criar pedidos'},{key:'encomendas.manageProducts',label:'Gerenciar produtos'},{key:'encomendas.manageOrders',label:'Gerenciar pedidos'}]},
      {title:'Clientes',permissions:[{key:'clientes',label:'Acesso aos clientes',view:true},{key:'clientes.manageFamilies',label:'Editar famílias'},{key:'clientes.deleteFamilies',label:'Excluir famílias'}]},
      {title:'Financeiro',permissions:[{key:'financeiro.income',label:'Registrar entradas'},{key:'financeiro.expense',label:'Registrar despesas'}]},
      {title:'Relatórios',permissions:[{key:'relatorios.export',label:'Exportar relatórios'}]}
    ];
    $('#memberPermissionsRows').innerHTML = selectedMember ? [selectedMember].map(member => {
      const isOwner = String(member.role || '').toLocaleLowerCase('pt-BR') === 'dono';
      const permissionGroups = groups.map(group => `<section class="member-permission-group"><h3>${group.title}</h3><div class="member-permission-options">${group.permissions.map(permission => { const checked = permission.view ? hasMemberPermission(member,permission.key) : hasMemberAction(member,permission.key); return `<label class="member-permission-option ${checked ? 'is-allowed' : 'is-blocked'}"><span>${permission.label}</span><span class="member-permission-state">${checked ? 'Permitido' : 'Bloqueado'}</span><input type="checkbox" data-member-permission="${safe(member.server_id)}" data-permission-key="${permission.key}" ${checked ? 'checked' : ''} ${isOwner || !ownerLoggedIn ? 'disabled' : ''} aria-label="${permission.label} para ${safe(member.name)}"></label>`; }).join('')}</div></section>`).join('');
      return `<article class="member-permission-card"><header class="member-permission-card-header"><div><b>${safe(member.name)}</b><small>ID ${safe(member.server_id || '—')} · ${safe(member.role || 'Sem cargo')}${member.status === 'inactive' ? ' · Inativo' : ''}</small></div><span class="member-permission-total">${isOwner ? 'Acesso total' : 'Permissões individuais'}</span></header><div class="member-permission-groups">${permissionGroups}</div></article>`;
    }).join('') : '';
    $('#memberPermissionsRows').hidden = !selectedMember;
    memberSelect.closest('.member-permissions-select-row').hidden = employees.length === 0;
    $('#memberPermissionsEmpty').hidden = employees.length > 0;
    document.querySelectorAll('[data-member-permission]').forEach(input => input.addEventListener('change', () => {
      if (!canManagePermissions()) { renderMemberPermissions(); return toast('Somente o Dono pode alterar permissões.'); }
      const serverId = input.dataset.memberPermission, permissionKey = input.dataset.permissionKey;
      memberPermissions[serverId] = {...(memberPermissions[serverId] || {}),[permissionKey]:input.checked};
      saveLocalState('vertice_member_permissions',JSON.stringify(memberPermissions));
      renderMemberPermissions(); syncOwnerNavigation(); toast('Acesso do membro atualizado.');
    }));
  }
  $('#memberPermissionsMemberSelect').addEventListener('change', event => { selectedPermissionMemberId = event.target.value; renderMemberPermissions(); });
  function applyNavOrder() {
    const nav = $('.main-nav');
    const items = new Map([...nav.querySelectorAll('.nav-item[data-view]')].map(item => [item.dataset.view,item]));
    navOrder.forEach(view => { const item = items.get(view); if (item) nav.appendChild(item); });
  }
  function renderNavOrder() {
    $('#navOrderList').innerHTML = navOrder.map((view,index) => `<div class="nav-order-item"><span class="nav-order-position">${index + 1}</span><b>${navLabels[view]}</b><div class="nav-order-actions"><button type="button" data-nav-move="-1" data-nav-view="${view}" aria-label="Mover ${navLabels[view]} para cima" ${index === 0 ? 'disabled' : ''}>↑ <span>Subir</span></button><button type="button" data-nav-move="1" data-nav-view="${view}" aria-label="Mover ${navLabels[view]} para baixo" ${index === navOrder.length - 1 ? 'disabled' : ''}>↓ <span>Descer</span></button></div></div>`).join('');
  }
  $('#navOrderList').addEventListener('click', event => {
    const button = event.target.closest('[data-nav-move]'); if (!button) return;
    if (!canManagePermissions()) return toast('Somente o Dono pode alterar a ordem das abas.');
    const index = navOrder.indexOf(button.dataset.navView), nextIndex = index + Number(button.dataset.navMove);
    if (index < 0 || nextIndex < 0 || nextIndex >= navOrder.length) return;
    [navOrder[index],navOrder[nextIndex]] = [navOrder[nextIndex],navOrder[index]];
    saveLocalState('vertice_nav_order',JSON.stringify(navOrder)); applyNavOrder(); renderNavOrder();
  });
  $('#memberSessionButton').addEventListener('click', () => {
    if (getStorageMember()) { sessionStorage.removeItem(storageSessionKey); syncOwnerNavigation(); requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Entre para acessar as áreas liberadas para sua conta.'; showView('login'); toast('Sessão encerrada.'); }
    else { requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Entre para acessar as áreas liberadas para sua conta.'; showView('login'); $('#loginScreenName').focus(); }
  });
  const hashMemberPassword = async (password, salt) => {
    if (!crypto?.subtle) throw new Error('Este navegador não oferece suporte ao login local. Abra o site em um navegador atualizado.');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2',salt:new TextEncoder().encode(salt),iterations:120000,hash:'SHA-256'},key,256);
    return Array.from(new Uint8Array(bits), byte => byte.toString(16).padStart(2,'0')).join('');
  };
  function openMemberAccount(serverId) {
    const member = employees.find(x => String(x.server_id) === String(serverId)); if (!member) return;
    accountTargetServerId = String(member.server_id);
    const account = memberAccounts[String(member.server_id)];
    $('#memberAccountTitle').textContent = account ? 'Alterar acesso do membro' : 'Criar acesso ao baú';
    $('#memberAccountDescription').textContent = `${member.name} · ID ${member.server_id}`;
    $('#memberAccountName').value = account?.login || '';
    $('#memberAccountPassword').value = ''; $('#memberAccountPassword').required = !account;
    $('#memberAccountPasswordHint').textContent = account ? 'Deixe em branco para manter a senha atual.' : 'Obrigatória para o primeiro acesso.';
    $('#memberAccountTitle').textContent = account ? 'Alterar acesso do membro' : String(member.role).toLocaleLowerCase('pt-BR') === 'dono' && !hasDonoAccount() ? 'Configurar primeiro acesso do Dono' : 'Criar acesso ao baú';
    $('#memberAccountBackdrop').classList.add('open');
  }
  $('#closeMemberAccount').addEventListener('click', () => $('#memberAccountBackdrop').classList.remove('open'));
  $('#cancelMemberAccount').addEventListener('click', () => $('#memberAccountBackdrop').classList.remove('open'));
  $('#memberAccountForm').addEventListener('submit', async event => {
    event.preventDefault();
    const login = $('#memberAccountName').value.trim(), password = $('#memberAccountPassword').value;
    const target = accountTargetServerId;
    if (!target) return;
    const oldAccount = memberAccounts[target];
    if (Object.entries(memberAccounts).some(([serverId,account]) => serverId !== target && account.login.toLocaleLowerCase('pt-BR') === login.toLocaleLowerCase('pt-BR'))) return toast('Esse login já está vinculado a outro membro.');
    try {
      const member = employees.find(x => String(x.server_id) === target);
      const firstOwnerSetup = !hasDonoAccount() && String(member?.role).toLocaleLowerCase('pt-BR') === 'dono';
      const salt = oldAccount?.salt || Array.from(crypto.getRandomValues(new Uint8Array(16))).join('-');
      memberAccounts[target] = {login, serverId:target, salt, passwordHash:password ? await hashMemberPassword(password,salt) : oldAccount.passwordHash};
      saveLocalState('vertice_member_accounts', JSON.stringify(memberAccounts)); $('#memberAccountBackdrop').classList.remove('open');
      if (firstOwnerSetup) { sessionStorage.setItem(storageSessionKey,target); syncOwnerNavigation(); renderEmployees(); showView('owner'); toast('Primeiro acesso do Dono configurado.'); }
      else { syncOwnerNavigation(); renderEmployees(); toast('Acesso do membro salvo.'); }
    } catch (error) { toast(error.message || 'Não foi possível salvar o acesso.'); }
  });
  $('#closeMemberLogin').addEventListener('click', () => $('#memberLoginBackdrop').classList.remove('open'));
  $('#cancelMemberLogin').addEventListener('click', () => $('#memberLoginBackdrop').classList.remove('open'));
  $('#loginScreenForm').addEventListener('submit', event => {
    event.preventDefault();
    $('#memberLoginName').value = $('#loginScreenName').value;
    $('#memberLoginPassword').value = $('#loginScreenPassword').value;
    $('#memberLoginForm').requestSubmit();
  });
  $('#setupOwnerAccess').addEventListener('click', () => showView('equipe'));
  $('#memberLoginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const login = $('#memberLoginName').value.trim().toLocaleLowerCase('pt-BR'), password = $('#memberLoginPassword').value;
    const match = Object.values(memberAccounts).find(account => account.login.toLocaleLowerCase('pt-BR') === login);
    if (!match) return toast('Login ou senha incorretos.');
    try {
      if (await hashMemberPassword(password,match.salt) !== match.passwordHash) return toast('Login ou senha incorretos.');
      const member = employees.find(x => String(x.server_id) === String(match.serverId) && x.status !== 'inactive');
      if (!member) return toast('Este membro não está ativo no cadastro.');
      if (['owner','equipe'].includes(requestedProtectedView) && String(member.role).toLocaleLowerCase('pt-BR') !== 'dono') return toast('A Gestão do site e o cadastro de membros são exclusivos do cargo Dono.');
      if (['bau','encomendas','clientes'].includes(requestedProtectedView) && !hasMemberPermission(member,requestedProtectedView)) return toast('Seu acesso não está liberado para esta área.');
      let destination = requestedProtectedView;
      if (destination === 'login') {
        destination = memberLandingView(member);
        if (!destination) { $('#loginNotice').textContent = 'Sua conta ainda não tem uma área liberada. Peça ao Dono para configurar suas permissões.'; return; }
      }
      sessionStorage.setItem(storageSessionKey,String(member.server_id)); $('#memberLoginBackdrop').classList.remove('open'); $('#memberLoginForm').reset(); $('#loginScreenForm').reset(); syncOwnerNavigation(); showView(destination); toast(`Olá, ${member.name}.`);
    } catch (error) { toast(error.message || 'Não foi possível validar o login.'); }
  });
  $('#storageSessionButton').addEventListener('click', () => {
    if (getStorageMember()) { sessionStorage.removeItem(storageSessionKey); renderStorage(); syncOwnerNavigation(); requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Entre para acessar as áreas liberadas para sua conta.'; showView('login'); toast('Sessão encerrada.'); }
    else { requestMemberLogin('bau'); }
  });
  $('#ownerLogoutButton').addEventListener('click', () => { sessionStorage.removeItem(storageSessionKey); syncOwnerNavigation(); requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Entre para acessar as áreas liberadas para sua conta.'; showView('login'); toast('Sessão do Dono encerrada.'); });
  function renderStorageCatalog() {
    const canCreateItems = canMemberDo('bau.createItems'), canManageItems = canMemberDo('bau.manageItems');
    $('#storageItemForm').hidden = !canCreateItems;
    $('#storageCatalogRows').innerHTML = storageCatalog.map(item => `<tr><td>${safe(item.name)}</td><td>${safe(item.location || 'QG')}</td><td>${canManageItems ? `<button type="button" class="employee-delete" data-storage-item-delete="${safe(item.id)}" title="Excluir item" aria-label="Excluir ${safe(item.name)}">×</button>` : ''}</td></tr>`).join('');
    $('#storageCatalogEmpty').hidden = storageCatalog.length > 0;
    document.querySelectorAll('[data-storage-item-delete]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('bau.manageItems')) return toast('O Dono não liberou a gestão de itens para este membro.');
      const item = storageCatalog.find(entry => String(entry.id) === String(button.dataset.storageItemDelete)); if (!item) return;
      if (!window.confirm(`Excluir ${item.name} do catálogo? O histórico já registrado será mantido.`)) return;
      storageCatalog = storageCatalog.filter(entry => String(entry.id) !== String(item.id)); saveLocalState('vertice_storage_catalog',JSON.stringify(storageCatalog)); renderStorageCatalog(); renderStorage(); toast('Item removido do catálogo.');
    }));
  }
  $('#storageItemForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!canMemberDo('bau.createItems')) return toast('O Dono não liberou o cadastro de itens para este membro.');
    const name = $('#storageCatalogName').value.trim(), location = $('#storageCatalogLocation').value, quantity = Number($('#storageCatalogQuantity').value);
    if (quantity > 0 && !canMemberDo('bau.move')) return toast('Para iniciar com quantidade maior que zero, peça ao Dono a permissão de movimentar estoque ou cadastre o item com saldo zero.');
    if (storageCatalog.some(item => item.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) return toast('Esse item já está cadastrado.');
    storageCatalog.push({id:`storage-item-${Date.now()}`,name,location}); saveLocalState('vertice_storage_catalog',JSON.stringify(storageCatalog));
    if (quantity > 0) { const member = getStorageMember(); storageMovements.unshift({type:'entry',item:name,location,quantity,responsible:member?.name || 'Cadastro inicial',memberServerId:member?.server_id || '',note:'Saldo inicial do cadastro',createdAt:new Date().toISOString()}); saveLocalState('vertice_storage_movements',JSON.stringify(storageMovements)); }
    event.target.reset(); renderStorageCatalog(); renderStorage(); toast('Item cadastrado no catálogo do baú.');
  });
  function openStorageMovement(itemId) {
    if (!getStorageMember()) { requestMemberLogin('bau'); return; }
    if (!canMemberDo('bau.move')) return toast('O Dono não liberou movimentações do baú para este membro.');
    const item = storageCatalog.find(entry => String(entry.id) === String(itemId));
    if (!item) return;
    $('#storageSelectedItem').value = String(item.id);
    $('#storageMovementTitle').textContent = item.name;
    $('#storageType').value = 'entry';
    $('#storageLocation').value = item.location || 'QG';
    $('#storageQuantity').value = '1';
    $('#storageMovementBackdrop').classList.add('open');
    $('#storageQuantity').focus();
  }
  function closeStorageMovement() { $('#storageMovementBackdrop').classList.remove('open'); $('#storageMovementForm').reset(); $('#storageQuantity').value = '1'; }
  $('#closeStorageMovement').addEventListener('click', closeStorageMovement);
  $('#cancelStorageMovement').addEventListener('click', closeStorageMovement);
  $('#storageMovementBackdrop').addEventListener('click', event => { if (event.target.id === 'storageMovementBackdrop') closeStorageMovement(); });
  $('#storageItemCards').addEventListener('click', event => { const card = event.target.closest('[data-storage-card]'); if (card) openStorageMovement(card.dataset.storageCard); });
  $('#storageSearch').addEventListener('input', () => renderStorage());
  function renderStorage() {
    const activeMember = getStorageMember();
    $('#storageSessionButton').textContent = activeMember ? `Conectado: ${activeMember.name} · Sair` : 'Entrar como membro';
    const canMoveItems = canMemberDo('bau.move');
    const balances = new Map();
    storageMovements.forEach(move => { const key = move.item.trim().toLocaleLowerCase('pt-BR'); const location = move.location === 'Casa' ? 'Casa' : 'QG'; const row = balances.get(key) || { name: move.item, QG: 0, Casa: 0, latest: move.createdAt }; row[location] += move.type === 'entry' ? Number(move.quantity) : -Number(move.quantity); if (!row.latest || new Date(move.createdAt) > new Date(row.latest)) row.latest = move.createdAt; balances.set(key, row); });
    const inventory = [...balances.values()].map(row => ({...row, quantity:row.QG + row.Casa})).filter(row => row.quantity > 0).sort((a,b) => a.name.localeCompare(b.name,'pt-BR'));
    const stockByName = new Map([...balances.entries()]);
    const query = $('#storageSearch').value.trim().toLocaleLowerCase('pt-BR');
    const visibleItems = storageCatalog.filter(item => item.name.toLocaleLowerCase('pt-BR').includes(query));
    $('#storageItemCards').innerHTML = visibleItems.map(item => { const balance = stockByName.get(item.name.toLocaleLowerCase('pt-BR')) || {QG:0,Casa:0}; const tag = canMoveItems ? 'button' : 'div'; const attrs = canMoveItems ? `type="button" data-storage-card="${safe(item.id)}" aria-label="Movimentar ${safe(item.name)}"` : `aria-label="${safe(item.name)}"`; const action = canMoveItems ? '<span class="storage-card-action" aria-hidden="true">＋</span>' : ''; return `<${tag} class="storage-item-card ${canMoveItems ? '' : 'storage-item-card-static'}" ${attrs}><span class="storage-item-art" aria-hidden="true"><svg viewBox="0 0 160 116" focusable="false"><path d="M34 38 80 16l46 22v48L80 108 34 86Z" fill="currentColor" opacity=".16"/><path d="m34 38 46 23 46-23M80 61v47M34 38v48l46 22 46-22V38" fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"/><path d="m57 27 46 23" fill="none" stroke="currentColor" stroke-width="2" opacity=".6"/></svg><span>📦</span></span><span class="storage-item-card-copy"><b>${safe(item.name)}</b><small class="storage-card-stock"><span>QG: ${Number(balance.QG).toLocaleString('pt-BR')}</span><span>Casa: ${Number(balance.Casa).toLocaleString('pt-BR')}</span></small></span>${action}</${tag}>`; }).join('');
    $('#storageCardsEmpty').hidden = storageCatalog.length > 0;
    $('#storageSearchEmpty').hidden = storageCatalog.length === 0 || visibleItems.length > 0;
    $('#storageItemCount').textContent = inventory.length;
    $('#storageUnitCount').textContent = inventory.reduce((sum,row) => sum + row.quantity, 0).toLocaleString('pt-BR');
    $('#storageMovementCount').textContent = storageMovements.length.toLocaleString('pt-BR');
    $('#storageInventoryRows').innerHTML = inventory.map(row => `<tr><td>${safe(row.name)}</td><td><b>${Math.max(0,row.QG).toLocaleString('pt-BR')}</b></td><td><b>${Math.max(0,row.Casa).toLocaleString('pt-BR')}</b></td><td><b>${row.quantity.toLocaleString('pt-BR')}</b></td><td>${new Date(row.latest).toLocaleString('pt-BR')}</td></tr>`).join('');
    $('#storageInventoryEmpty').hidden = inventory.length > 0;
    $('#storageHistoryRows').innerHTML = [...storageMovements].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map(move => `<tr><td>${new Date(move.createdAt).toLocaleString('pt-BR')}</td><td><span class="storage-movement ${move.type}">${move.type === 'entry' ? 'Entrada' : 'Retirada'}</span></td><td>${safe(move.item)}</td><td>${safe(move.location || 'QG')}</td><td>${Number(move.quantity).toLocaleString('pt-BR')}</td><td>${safe(move.responsible || '—')}${move.memberServerId ? `<small class="storage-member-id">ID ${safe(move.memberServerId)}</small>` : ''}</td><td>${safe(move.note || '—')}</td></tr>`).join('');
    $('#storageHistoryEmpty').hidden = storageMovements.length > 0;
  }
  $('#storageMovementForm').addEventListener('submit', e => {
    e.preventDefault();
    const activeMember = getStorageMember();
    if (!activeMember) { closeStorageMovement(); requestMemberLogin('bau'); return; }
    if (!canMemberDo('bau.move')) { closeStorageMovement(); return toast('O Dono não liberou movimentações do baú para este membro.'); }
    const type = $('#storageType').value, location = $('#storageLocation').value, catalogItem = storageCatalog.find(entry => String(entry.id) === $('#storageSelectedItem').value), item = catalogItem?.name || '', quantity = Number($('#storageQuantity').value);
    if (!catalogItem) return toast('Selecione um item do catálogo.');
    const balance = storageMovements.reduce((sum,move) => move.item.trim().toLocaleLowerCase('pt-BR') === item.toLocaleLowerCase('pt-BR') && (move.location || 'QG') === location ? sum + (move.type === 'entry' ? Number(move.quantity) : -Number(move.quantity)) : sum, 0);
    if (type === 'withdrawal' && quantity > balance) { toast(`Estoque insuficiente de ${item} em ${location}. Saldo atual: ${Math.max(0,balance)}.`); return; }
    storageMovements.unshift({ type, item, location, quantity, responsible: activeMember.name, memberServerId: activeMember.server_id, note: '', createdAt: new Date().toISOString() });
    saveLocalState('vertice_storage_movements', JSON.stringify(storageMovements));
    closeStorageMovement(); renderStorageCatalog(); renderStorage(); toast(type === 'entry' ? 'Entrada registrada no baú.' : 'Retirada registrada do baú.');
  });
  function applySiteSettings() {
    document.documentElement.style.setProperty('--green', siteSettings.accent || defaultSiteSettings.accent);
    $('#brandCompanyName').textContent = siteSettings.companyName;
    $('#brandMark').textContent = (siteSettings.companyName.trim()[0] || 'S').toLocaleUpperCase('pt-BR');
    $('#loginCompanyName').textContent = siteSettings.companyName;
    $('#loginBrandMark').textContent = (siteSettings.companyName.trim()[0] || 'S').toLocaleUpperCase('pt-BR');
    $('#breadcrumbCompanyName').textContent = siteSettings.companyName;
    $('.server-pill').innerHTML = `<i></i> ${safe(siteSettings.serverName).toLocaleUpperCase('pt-BR')}`;
    const displayName = siteSettings.ownerName;
    $('.user-profile b').textContent = displayName;
    const initials = displayName.split(/\s+/).slice(0,2).map(part => part[0] || '').join('').toUpperCase();
    $('.user-profile .avatar').textContent = initials;
    $('.top-avatar').textContent = initials;
    $('.footer > span:first-child').textContent = `© 2026 ${siteSettings.companyName} · ${siteSettings.serverName}`;
    document.title = `${siteSettings.companyName} — Gestão empresarial`;
    $('#transactionCompanyName').textContent = siteSettings.companyName.toLocaleUpperCase('pt-BR');
    $('#previewCompanyName').textContent = siteSettings.companyName;
    $('#previewServerName').textContent = siteSettings.serverName;
    $('#previewCompanyIcon').textContent = (siteSettings.companyName.trim()[0] || 'S').toLocaleUpperCase('pt-BR');
    $('#accentValue').textContent = siteSettings.accent.toUpperCase();
    $('#settingCompanyName').value = siteSettings.companyName;
    $('#settingServerName').value = siteSettings.serverName;
    $('#settingOwnerName').value = siteSettings.ownerName;
    $('#settingAccent').value = siteSettings.accent;
  }
  function showView(view) {
    if (view === 'login') {
      document.body.classList.add('auth-screen');
      $('#loginView').hidden = false; $('#dashboardView').hidden = true;
      $('#employeeView').hidden = true; $('#ownerView').hidden = true; $('#storageView').hidden = true; $('#ordersView').hidden = true; $('#clientsView').hidden = true;
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      $('#crumb').textContent = titles.login;
      $('#sidebar').classList.remove('open'); $('.mobile-nav-backdrop')?.classList.remove('show');
      return;
    }
    if (['owner','equipe'].includes(view) && hasDonoAccount() && String(getStorageMember()?.role || '').toLocaleLowerCase('pt-BR') !== 'dono') { requestMemberLogin(view); return; }
    if (['bau','encomendas','clientes'].includes(view) && !getStorageMember()) { requestMemberLogin(view); return; }
    if (['bau','encomendas','clientes'].includes(view) && !hasMemberPermission(getStorageMember(),view)) { toast('Seu acesso não está liberado para esta área.'); return; }
    document.body.classList.remove('auth-screen');
    $('#loginView').hidden = true;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    $('#crumb').textContent = titles[view] || view;
    $('#dashboardView').hidden = !['inicio','financeiro','operacoes','estoque','relatorios','configuracoes'].includes(view);
    $('#employeeView').hidden = view !== 'equipe'; $('#ownerView').hidden = view !== 'owner'; $('#storageView').hidden = view !== 'bau';
    $('#ordersView').hidden = view !== 'encomendas'; $('#clientsView').hidden = view !== 'clientes';
    if (view === 'equipe') renderEmployees();
    else if (view === 'bau') { renderStorageCatalog(); renderStorage(); }
    else if (view === 'encomendas') { renderProducts(); renderOrders(); }
    else if (view === 'clientes') renderClients();
    else if (view === 'owner') applySiteSettings();
    else if(view !== 'inicio') toast(`${titles[view]}: seção pronta para personalizar.`);
    $('#sidebar').classList.remove('open'); $('.mobile-nav-backdrop')?.classList.remove('show');
  }
  document.querySelectorAll('[data-view]').forEach(link => link.addEventListener('click', e => { e.preventDefault(); showView(link.dataset.view); }));
  $('#settingAccent').addEventListener('input', e => { $('#accentValue').textContent = e.target.value.toUpperCase(); });
  $('#ownerSettingsForm').addEventListener('submit', e => {
    e.preventDefault();
    if (hasDonoAccount() && String(getStorageMember()?.role || '').toLocaleLowerCase('pt-BR') !== 'dono') return toast('Somente o Dono pode editar as configurações do site.');
    siteSettings = { companyName: $('#settingCompanyName').value.trim(), serverName: $('#settingServerName').value.trim(), ownerName: $('#settingOwnerName').value.trim(), accent: $('#settingAccent').value };
    saveLocalState('vertice_site_settings', JSON.stringify(siteSettings)); applySiteSettings(); toast('Identidade do site atualizada.');
  });
  $('#resetOwnerSettings').addEventListener('click', () => { if (hasDonoAccount() && String(getStorageMember()?.role || '').toLocaleLowerCase('pt-BR') !== 'dono') return toast('Somente o Dono pode editar as configurações do site.'); siteSettings = { ...defaultSiteSettings }; localStorage.removeItem('vertice_site_settings'); applySiteSettings(); toast('Configurações padrão restauradas.'); });
  $('#toggleSiteEditor').addEventListener('click', () => { if (hasDonoAccount() && String(getStorageMember()?.role || '').toLocaleLowerCase('pt-BR') !== 'dono') return toast('Somente o Dono pode editar o site.'); setSiteEditMode(!siteEditMode); });
  const siteEditToolbar = document.createElement('div');
  siteEditToolbar.id = 'siteEditToolbar'; siteEditToolbar.className = 'site-edit-toolbar'; siteEditToolbar.hidden = true;
  siteEditToolbar.innerHTML = '<span>Modo de edição ativo · alterações salvas automaticamente</span><button type="button" class="button button-quiet" id="resetSiteCopy">Restaurar textos</button><button type="button" class="button button-primary" id="finishSiteEditing">Concluir edição</button>';
  document.body.appendChild(siteEditToolbar);
  $('#finishSiteEditing').addEventListener('click', () => setSiteEditMode(false));
  $('#resetSiteCopy').addEventListener('click', () => {
    if (!window.confirm('Restaurar todos os textos editados para o conteúdo original?')) return;
    siteCopy = {}; localStorage.removeItem('vertice_site_copy'); window.location.reload();
  });
  function renderEmployees() {
    const query = ($('#employeeSearch').value || '').trim().toLocaleLowerCase('pt-BR');
    const filtered = employees.filter(x => [x.name,x.server_id,x.role,x.phone].some(v => String(v || '').toLocaleLowerCase('pt-BR').includes(query)));
    $('#employeeTotal').textContent = employees.length; $('#employeeActive').textContent = employees.filter(x => x.status === 'active').length;
    $('#employeeRoles').textContent = memberRoles.length;
    $('#employeeListCaption').textContent = `${employees.length} ${employees.length === 1 ? 'membro cadastrado' : 'membros cadastrados'}`;
    $('#employeeRows').innerHTML = filtered.map(x => {
      const initials = String(x.name || '?').split(/\s+/).slice(0,2).map(n => n[0]).join('').toUpperCase();
      const hasAccount = Boolean(memberAccounts[String(x.server_id)]);
      return `<tr><td><span class="employee-person"><i class="avatar avatar-blue">${safe(initials)}</i><b>${safe(x.name)}<small>${safe(x.role)}</small></b></span></td><td>${safe(x.server_id || '—')}</td><td>${safe(x.role || '—')}</td><td>${safe(x.phone || '—')}</td><td><span class="employee-status ${x.status === 'inactive' ? 'inactive' : ''}">${x.status === 'inactive' ? 'Inativo' : 'Ativo'}</span></td><td><button class="employee-access" data-member-account="${safe(x.server_id)}">${hasAccount ? 'Alterar login' : 'Criar login'}</button> <button class="employee-delete" data-delete-employee="${safe(x.id)}" title="Remover membro" aria-label="Remover ${safe(x.name)}">×</button></td></tr>`;
    }).join('');
    $('#employeeEmpty').hidden = filtered.length > 0;
    document.querySelectorAll('[data-delete-employee]').forEach(button => button.addEventListener('click', () => deleteEmployee(button.dataset.deleteEmployee)));
    document.querySelectorAll('[data-member-account]').forEach(button => button.addEventListener('click', () => openMemberAccount(button.dataset.memberAccount)));
    renderMemberPermissions();
  }
  function renderRoles() {
    const roleSelect = $('#employeeRole');
    const selectedRole = roleSelect.value;
    roleSelect.innerHTML = '<option value="">Selecione um cargo</option>' + memberRoles.map(role => `<option value="${safe(role)}">${safe(role)}</option>`).join('');
    roleSelect.value = memberRoles.includes(selectedRole) ? selectedRole : '';
    $('#roleList').innerHTML = memberRoles.map(role => `<div class="role-item"><span>${safe(role)}</span><button type="button" class="role-delete" data-remove-role="${safe(role)}" aria-label="Excluir cargo ${safe(role)}">Excluir</button></div>`).join('') || '<div class="role-empty">Nenhum cargo cadastrado. Crie um cargo para continuar.</div>';
    document.querySelectorAll('[data-remove-role]').forEach(button => button.addEventListener('click', () => {
      const role = button.dataset.removeRole;
      if (String(role).toLocaleLowerCase('pt-BR') === 'dono') return toast('O cargo Dono é necessário para controlar o acesso da Gestão do site.');
      if (!window.confirm(`Excluir o cargo “${role}”? Os membros já cadastrados continuarão com esse cargo registrado.`)) return;
      memberRoles = memberRoles.filter(item => item !== role);
      delete rolePermissions[role]; saveLocalState('vertice_role_permissions',JSON.stringify(rolePermissions));
      saveLocalState('vertice_member_roles', JSON.stringify(memberRoles)); renderRoles(); renderEmployees();
      toast('Cargo removido da lista.');
    }));
  }
  $('#roleForm').addEventListener('submit', event => {
    event.preventDefault();
    const role = $('#newRoleName').value.trim();
    if (!role) return;
    if (memberRoles.some(item => item.toLocaleLowerCase('pt-BR') === role.toLocaleLowerCase('pt-BR'))) return toast('Esse cargo já está cadastrado.');
    memberRoles.push(role); saveLocalState('vertice_member_roles', JSON.stringify(memberRoles));
    $('#roleForm').reset(); renderRoles(); renderEmployees(); toast('Cargo criado.');
  });
  async function loadEmployees() {
    renderEmployees();
  }
  $('#employeeSearch').addEventListener('input', renderEmployees);
  $('#resetAllData').addEventListener('click', async () => {
    const accepted = window.confirm('Isso apagará funcionários, movimentações, encomendas, produtos, itens do baú e personalizações salvos neste navegador e no Supabase compartilhado. Deseja continuar?');
    if (!accepted) return;
    if (config.url && config.key) {
      try {
        await cloudWriteChain;
        cloudSyncReady = false;
        const base = config.url.replace(/\/$/,'');
        const [stateResponse, txResponse, employeeResponse] = await Promise.all([
          fetch(`${base}/rest/v1/app_state?key=not.is.null`, { method:'DELETE', headers:headers() }),
          fetch(`${base}/rest/v1/transactions?id=not.is.null`, { method:'DELETE', headers:headers() }),
          fetch(`${base}/rest/v1/employees?id=not.is.null`, { method:'DELETE', headers:headers() })
        ]);
        if (!stateResponse.ok || !txResponse.ok || !employeeResponse.ok) throw new Error('O Supabase recusou a exclusão. Confira as políticas no arquivo SQL. Nenhum dado local foi apagado.');
      } catch (error) { toast(error.message || 'Não foi possível limpar os dados remotos.'); return; }
    }
    Object.keys(localStorage).filter(key => key.startsWith('vertice_') && key !== 'vertice_supabase').forEach(key => localStorage.removeItem(key));
    transactions = []; employees = []; storageMovements = []; storageCatalog = []; orders = []; clients = []; products = []; memberAccounts = {}; rolePermissions = {}; memberPermissions = {}; sessionStorage.removeItem(storageSessionKey); memberRoles = [...defaultRoles]; siteSettings = { ...defaultSiteSettings };
     saveLocalState('vertice_transactions','[]'); saveLocalState('vertice_employees','[]'); saveLocalState('vertice_storage_movements','[]'); saveLocalState('vertice_storage_catalog','[]'); saveLocalState('vertice_orders','[]'); saveLocalState('vertice_clients','[]'); saveLocalState('vertice_products','[]'); saveLocalState('vertice_role_permissions','{}'); saveLocalState('vertice_member_permissions','{}'); saveLocalState('vertice_member_roles',JSON.stringify(memberRoles)); saveLocalState('vertice_reset_completed','true');
     cloudSyncReady = Boolean(config.url && config.key); applyTheme('light'); applySiteSettings(); renderRoles(); renderEmployees(); renderStorageCatalog(); renderStorage(); renderProducts(); renderOrders(); renderClients(); updateMetrics(); renderActivity(); syncOwnerNavigation();
    document.querySelectorAll('.team-table .team-row:not(.team-head)').forEach(row => row.remove());
    toast('Informações apagadas.');
  });
  $('#newEmployee').addEventListener('click', () => { $('#employeeName').focus(); $('#employeeFormPanel').scrollIntoView({behavior:'smooth',block:'center'}); });
  $('#employeeForm').addEventListener('submit', async e => {
    e.preventDefault();
    const record = {name:$('#employeeName').value.trim(),server_id:$('#employeeServerId').value.trim(),role:$('#employeeRole').value,phone:$('#employeePhone').value.trim(),status:$('#employeeStatus').value};
    if (!record.name || !record.server_id || !record.role) return;
    if (employees.some(x => String(x.server_id).toLowerCase() === record.server_id.toLowerCase())) { toast('Já existe um membro com esse ID de servidor.'); return; }
    employees.unshift({...record,id:`local-${Date.now()}`}); saveLocalState('vertice_employees',JSON.stringify(employees));
    $('#employeeForm').reset(); renderEmployees(); toast(cloudSyncReady ? 'Membro salvo e sincronizado.' : 'Membro salvo neste navegador.');
  });
  async function deleteEmployee(id) {
    const employee = employees.find(x => String(x.id) === String(id)); if (!employee) return;
    employees = employees.filter(x => String(x.id) !== String(id)); delete memberAccounts[String(employee.server_id)]; delete memberPermissions[String(employee.server_id)]; saveLocalState('vertice_member_accounts',JSON.stringify(memberAccounts)); saveLocalState('vertice_member_permissions',JSON.stringify(memberPermissions)); if (String(employee.server_id) === sessionStorage.getItem(storageSessionKey)) sessionStorage.removeItem(storageSessionKey); saveLocalState('vertice_employees',JSON.stringify(employees)); renderEmployees(); renderStorage(); syncOwnerNavigation(); toast('Membro removido.');
  }
  $('#menuToggle').addEventListener('click', () => { $('#sidebar').classList.toggle('open'); let back = $('.mobile-nav-backdrop'); if (!back) { back = document.createElement('div'); back.className='mobile-nav-backdrop'; document.body.appendChild(back); back.addEventListener('click', () => { $('#sidebar').classList.remove('open'); back.classList.remove('show'); }); } back.classList.toggle('show'); });
  $('#periodSelect').addEventListener('change', e => { const months = Number(e.target.value); document.querySelectorAll('#chart .bar-group').forEach((bar,i,all) => { bar.style.display = months === 3 ? (i >= all.length-3 ? 'flex':'none') : 'flex'; }); });
  if (localStorage.getItem('vertice_reset_completed') === 'true') document.querySelectorAll('.team-table .team-row:not(.team-head)').forEach(row => row.remove());
  applyTheme(localStorage.getItem('vertice_theme') || 'light');
  applyNavOrder(); renderNavOrder(); applySiteSettings(); updateMetrics(); renderActivity(); renderRoles(); renderEmployees(); renderStorageCatalog(); renderStorage(); renderProducts(); renderOrders(); renderClients(); prepareSiteCopy(); syncOwnerNavigation();
  const startupMember = getStorageMember();
  let startupView = startupMember ? memberLandingView(startupMember) : 'login';
  if (!startupView) { sessionStorage.removeItem(storageSessionKey); startupView = 'login'; $('#loginNotice').textContent = 'Sua conta ainda não tem uma área liberada. Peça ao Dono para configurar suas permissões.'; }
  requestedProtectedView = 'login'; showView(startupView);
  if (config.url && config.key) loadRemote();
})();
