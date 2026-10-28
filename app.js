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
  let cloudWritesPending = 0;
  let cloudLoadBusy = false;
  let lastRemoteStateSignature = null;
  let localStateRevision = 0;
  const readLocal = () => { try { return JSON.parse(localStorage.getItem('vertice_transactions') || '[]'); } catch { return []; } };
  const readSiteCopy = () => { try { return JSON.parse(localStorage.getItem('vertice_site_copy') || '{}'); } catch { return {}; } };
  let siteCopy = readSiteCopy();
  let siteEditMode = false;
  let transactions = readLocal();
  let storageMovements = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_storage_movements') || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } })();
  let storageCatalog = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_storage_catalog') || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } })();
  let pendingStorageMovements = [];
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
  let personalAreaTabs = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_personal_area_tabs') || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } })();
  let personalGoals = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_personal_goals') || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } })();
  let goalNotifications = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_goal_notifications') || '[]'); return Array.isArray(data) ? data : []; } catch { return []; } })();
  let personalMessages = (() => { try { const data = JSON.parse(localStorage.getItem('vertice_personal_messages') || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } })();
  let selectedPersonalMemberId = '';
  let selectedPersonalTabId = 'profile';
  let editingPersonalTab = false;
  let editingPersonalGoalId = '';
  const defaultNavOrder = ['owner','equipe','bau','encomendas','clientes','pessoal'];
  const navLabels = {owner:'Gestão do site',equipe:'Cadastro de membros',bau:'Controle de baú',encomendas:'Encomendas',clientes:'Cadastro de clientes',pessoal:'Área pessoal'};
  let navOrder = (() => { try { const saved = JSON.parse(localStorage.getItem('vertice_nav_order') || '[]'); return [...new Set([...(Array.isArray(saved) ? saved : []).filter(view => defaultNavOrder.includes(view)),...defaultNavOrder])]; } catch { return [...defaultNavOrder]; } })();
  let accountTargetServerId = null;
  let config = readConfig();
  localStorage.removeItem('vertice_owner_account');
  localStorage.removeItem('vertice_employee_credentials');
  const defaultSiteSettings = { companyName: 'Sua Empresa', serverName: 'Cidade Alta RP', ownerName: 'Proprietário', accent: '#28b8ff' };
  let siteSettings = (() => { try { return { ...defaultSiteSettings, ...JSON.parse(localStorage.getItem('vertice_site_settings') || '{}') }; } catch { return { ...defaultSiteSettings }; } })();
  if ((siteSettings.companyName || '').trim().toLocaleLowerCase('pt-BR') === 'vértice motors') {
    siteSettings.companyName = defaultSiteSettings.companyName;
    saveLocalState('vertice_site_settings', JSON.stringify(siteSettings));
  }
  const headers = () => ({ apikey: config.key, ...(String(config.key || '').startsWith('sb_publishable_') ? {} : { Authorization: `Bearer ${config.key}` }), 'Content-Type': 'application/json', Prefer: 'return=representation' });
  function saveLocalState(key, value) {
    rawSetLocal(key, value);
    localStateRevision += 1;
    if (!cloudSyncReady || !config.url || !config.key || !String(key).startsWith('vertice_') || key === 'vertice_supabase') return;
    let parsed; try { parsed = JSON.parse(value); } catch { parsed = value; }
    const row = { key, value: parsed, updated_at: new Date().toISOString() };
    cloudWritesPending += 1;
    cloudWriteChain = cloudWriteChain.then(async () => {
      const response = await fetch(`${config.url.replace(/\/$/,'')}/rest/v1/app_state?on_conflict=key`, { method: 'POST', headers: { ...headers(), Prefer: 'resolution=merge-duplicates,return=minimal' }, body: JSON.stringify(row) });
      if (!response.ok) throw new Error(`Falha ao sincronizar ${key} (${response.status}).`);
      cloudWriteErrorShown = false;
    }).catch(error => { if (!cloudWriteErrorShown) { cloudWriteErrorShown = true; toast(`${error.message} Confira se executou supabase-schema.sql.`); } })
      .finally(() => { cloudWritesPending = Math.max(0, cloudWritesPending - 1); });
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
    const excluded = 'script,style,svg,path,input,textarea,select,option,img,br,#toggleSiteEditor,#activityList,#employeeRows,#chart,.team-table,.avatar-stack,.avatar,.nav-icon,.metric-icon,.activity-icon,.live-dot,.notification-dot,.connection-dot,#previewCompanyName,#previewServerName,#previewCompanyIcon';
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
  function hasActiveEditing() {
    const active = document.activeElement;
    return Boolean(
      document.querySelector('.modal-backdrop.open') ||
      active?.matches?.('input, textarea, select, [contenteditable="true"]') ||
      active?.closest?.('[contenteditable="true"]')
    );
  }
  const remoteSignature = rows => rows
    .map(row => `${row.key}:${JSON.stringify(row.value)}`)
    .sort()
    .join('|');
  async function loadRemote(silent = false) {
    if (!config.url || !config.key) { setConnection(false); return; }
    if (cloudLoadBusy) return;
    cloudLoadBusy = true;
    const revisionAtLoadStart = localStateRevision;
    try {
      if (!silent) cloudSyncReady = false;
      const res = await fetch(`${config.url.replace(/\/$/,'')}/rest/v1/app_state?select=key,value`, { headers: headers() });
      if (!res.ok) throw new Error(res.status === 404 ? 'Tabela app_state não encontrada. Execute o arquivo supabase-schema.sql no Supabase.' : `Supabase respondeu ${res.status}. Confira a URL, a chave pública e as políticas.`);
      const rows = await res.json();
      const signature = remoteSignature(rows);
      if (lastRemoteStateSignature !== null && signature === lastRemoteStateSignature) {
        cloudSyncReady = true;
        if (!silent) setConnection(true);
        return;
      }
      // A consulta pode terminar depois que alguém começou a preencher um formulário.
      if (silent && (hasActiveEditing() || localStateRevision !== revisionAtLoadStart)) return;
      if (rows.length) {
        Object.keys(localStorage).filter(key => key.startsWith('vertice_') && !['vertice_supabase','vertice_saved_profiles'].includes(key)).forEach(key => localStorage.removeItem(key));
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
        lastRemoteStateSignature = remoteSignature(seed);
      }
      if (rows.length) lastRemoteStateSignature = signature;
      hydrateSharedState(); cloudSyncReady = true; setConnection(true);
    } catch (err) {
      if (!silent) { cloudSyncReady = false; setConnection(false); toast(err.message || 'Não foi possível conectar ao Supabase.'); }
    } finally { cloudLoadBusy = false; }
  }
  function hydrateSharedState() {
    const readArray = (key, fallback = []) => { try { const data = JSON.parse(localStorage.getItem(key) || 'null'); return Array.isArray(data) ? data : fallback; } catch { return fallback; } };
    const readObject = key => { try { const data = JSON.parse(localStorage.getItem(key) || '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } };
    transactions = readArray('vertice_transactions'); storageMovements = readArray('vertice_storage_movements'); storageCatalog = readArray('vertice_storage_catalog'); orders = readArray('vertice_orders'); clients = readArray('vertice_clients'); products = readArray('vertice_products'); goalNotifications = readArray('vertice_goal_notifications');
    employees = readArray('vertice_employees', localStorage.getItem('vertice_reset_completed') === 'true' ? [] : demoEmployees);
    memberAccounts = readObject('vertice_member_accounts'); rolePermissions = readObject('vertice_role_permissions'); memberPermissions = readObject('vertice_member_permissions'); personalAreaTabs = readObject('vertice_personal_area_tabs'); personalGoals = readObject('vertice_personal_goals'); personalMessages = readObject('vertice_personal_messages');
    const savedRoles = readArray('vertice_member_roles', defaultRoles); memberRoles = [...new Set(['Dono', ...savedRoles])];
    const savedOrder = readArray('vertice_nav_order', defaultNavOrder); navOrder = [...new Set([...savedOrder.filter(view => defaultNavOrder.includes(view)), ...defaultNavOrder])];
    siteSettings = { ...defaultSiteSettings, ...readObject('vertice_site_settings') }; siteCopy = readObject('vertice_site_copy');
    applyTheme(); applyNavOrder(); renderNavOrder(); applySiteSettings(); renderRoles(); renderEmployees(); renderStorageCatalog(); renderStorage(); renderProducts(); renderOrders(); renderClients(); renderPersonalArea(); renderActivity(); updateMetrics(); prepareSiteCopy(); syncOwnerNavigation();
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
  $('#notifications').addEventListener('click', () => {
    if (!getStorageMember() || !canReceiveGoalNotifications()) return toast('As notificações de metas ficam disponíveis para Donos e Gerentes.');
    renderGoalNotifications(); $('#goalNotificationsBackdrop').classList.add('open'); markGoalNotificationsRead();
  });
  function applyTheme() {
    document.documentElement.dataset.theme = 'dark';
    rawSetLocal('vertice_theme', JSON.stringify('dark'));
  }
  const titles = {login:'Entrar',inicio:'Visão geral',financeiro:'Financeiro',equipe:'Cadastro de membros',bau:'Controle de baú',encomendas:'Encomendas',clientes:'Cadastro de clientes',pessoal:'Área pessoal',operacoes:'Operações',estoque:'Estoque',relatorios:'Relatórios',configuracoes:'Configurações',owner:'Gestão do site'};
  const orderStatuses = ['Recebida','Em andamento','Pronta','Entregue','Cancelada'];
  function setOrderFormOpen(open) {
    const modal = $('#orderFormModal'), button = $('#openOrderForm'); if (!modal || !button) return;
    modal.hidden = !open; button.setAttribute('aria-expanded',String(open));
    document.body.classList.toggle('order-modal-open',open);
    if (open) setTimeout(() => $('#orderFamily')?.focus(),80);
    else button.focus({preventScroll:true});
  }
  $('#openOrderForm').addEventListener('click', () => setOrderFormOpen(true));
  $('#closeOrderForm').addEventListener('click', () => setOrderFormOpen(false));
  $('#orderFormModal').addEventListener('click', event => { if (event.target === $('#orderFormModal')) setOrderFormOpen(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !$('#orderFormModal').hidden) setOrderFormOpen(false); });
  function setRecordModalOpen(id,open,focusSelector) {
    const modal = $(`#${id}`); if (!modal) return;
    if (open) modal.dataset.opener = document.activeElement?.id || '';
    modal.hidden = !open;
    document.body.classList.toggle('record-modal-open',Boolean($('#memberFormModal:not([hidden])') || $('#clientFormModal:not([hidden])')));
    if (open) setTimeout(() => $(focusSelector)?.focus(),60);
    else { const opener = modal.dataset.opener && $(`#${modal.dataset.opener}`); opener?.focus({preventScroll:true}); }
  }
  ['memberFormModal','clientFormModal'].forEach(id => $(`#${id}`).addEventListener('click',event => { if (event.target.id === id) setRecordModalOpen(id,false); }));
  document.addEventListener('keydown',event => { if (event.key !== 'Escape') return; const openModal = ['clientFormModal','memberFormModal'].map(id => $(`#${id}`)).find(modal => modal && !modal.hidden); if (openModal) setRecordModalOpen(openModal.id,false); });
  $('#closeMemberForm').addEventListener('click',() => { $('#employeeForm').reset(); setRecordModalOpen('memberFormModal',false); });
  $('#cancelMemberForm').addEventListener('click',() => { $('#employeeForm').reset(); setRecordModalOpen('memberFormModal',false); });
  $('#closeClientForm').addEventListener('click',() => { resetClientForm(); setRecordModalOpen('clientFormModal',false); });
  $('#cancelClientForm').addEventListener('click',() => { resetClientForm(); setRecordModalOpen('clientFormModal',false); });
  $('#cancelClientEdit').addEventListener('click',() => { resetClientForm(); setRecordModalOpen('clientFormModal',false); });
  $('#cancelOrderForm').addEventListener('click', () => { $('#orderForm').reset(); resetOrderLines(); renderOrderFamilies(); updateOrderPrice(); setOrderFormOpen(false); });
  $('#toggleProductCatalog').addEventListener('click', () => {
    const content = $('#productCatalogContent'), open = content.hidden;
    content.hidden = !open; $('#toggleProductCatalog').setAttribute('aria-expanded',String(open));
    $('#toggleProductCatalog').innerHTML = open ? 'Fechar catálogo <span>⌃</span>' : 'Gerenciar produtos <span>⌄</span>';
  });
  function renderOrderProductChoices(row, query = '') {
    const select = row?.querySelector('[data-order-product]'); if (!select) return;
    const selected = select.value, normalizedQuery = normalizeSearchText(query);
    let matches = products.map(product => ({product,score:normalizedQuery ? fuzzySearchScore(product.name,normalizedQuery) : 0})).filter(result => result.score !== null).sort((a,b) => a.score-b.score || a.product.name.localeCompare(b.product.name,'pt-BR')).map(result => result.product);
    const selectedProduct = products.find(product => String(product.id) === selected);
    if (selectedProduct && !matches.some(product => String(product.id) === selected)) matches.unshift(selectedProduct);
    select.innerHTML = '<option value="">Selecione um produto</option>' + matches.map(product => `<option value="${safe(product.id)}">${safe(product.name)} · ${money(product.unitValue)}</option>`).join('');
    select.value = matches.some(product => String(product.id) === selected) ? selected : !normalizedQuery && products.length === 1 ? String(products[0].id) : '';
  }
  const orderLineTemplate = () => `<div class="order-line-item"><label class="order-product-picker"><span>Produto</span><input data-order-product-search type="search" placeholder="Buscar pelo nome..." autocomplete="off"><select data-order-product required aria-label="Selecionar produto"><option value="">Selecione um produto</option></select><small data-order-stock-hint>Selecione um produto para consultar o estoque.</small></label><label>Qtd.<input data-order-quantity type="number" min="1" step="1" required value="1"></label><label>Unitário<input data-order-unit type="text" readonly placeholder="R$ 0,00"></label><label>Subtotal<input data-order-subtotal type="text" readonly placeholder="R$ 0,00"></label><button type="button" class="employee-delete order-line-remove" data-remove-order-line aria-label="Remover produto">×</button></div>`;
  function addOrderLine() { const list = $('#orderLineItems'); if (!list) return; list.insertAdjacentHTML('beforeend',orderLineTemplate()); const row = list.lastElementChild; renderOrderProductChoices(row); updateOrderPrice(); updateOrderLineRemoveButtons(); row.querySelector('[data-order-product-search]')?.focus(); }
  function resetOrderLines() { $('#orderLineItems').innerHTML = ''; addOrderLine(); }
  function updateOrderLineRemoveButtons() { const rows = document.querySelectorAll('.order-line-item'); rows.forEach(row => { const button = row.querySelector('[data-remove-order-line]'); button.disabled = rows.length === 1; }); }
  $('#addOrderLine').addEventListener('click',addOrderLine);
  $('#orderLineItems').addEventListener('input',event => { const row = event.target.closest('.order-line-item'); if (!row) return; if (event.target.matches('[data-order-product-search]')) renderOrderProductChoices(row,event.target.value); if (event.target.matches('[data-order-product-search],[data-order-quantity]')) updateOrderPrice(); });
  $('#orderLineItems').addEventListener('change',event => { if (event.target.matches('[data-order-product]')) updateOrderPrice(); });
  $('#orderLineItems').addEventListener('click',event => { const button = event.target.closest('[data-remove-order-line]'); if (!button || document.querySelectorAll('.order-line-item').length <= 1) return; button.closest('.order-line-item').remove(); updateOrderPrice(); updateOrderLineRemoveButtons(); });
  function updateOrderPrice() {
    let total = 0;
    document.querySelectorAll('.order-line-item').forEach(row => {
      const product = products.find(item => String(item.id) === row.querySelector('[data-order-product]')?.value), quantity = Number(row.querySelector('[data-order-quantity]')?.value || 0), unitValue = Number(product?.unitValue || 0), subtotal = unitValue * quantity;
      row.querySelector('[data-order-unit]').value = product ? money(unitValue) : '';
      row.querySelector('[data-order-subtotal]').value = product && quantity ? money(subtotal) : '';
      const hint = row.querySelector('[data-order-stock-hint]');
      if (hint) { const existsInStorage = product && storageCatalog.some(item => item.name.toLocaleLowerCase('pt-BR') === product.name.toLocaleLowerCase('pt-BR')); const stock = product ? getStorageItemBalances(product.name) : null; const requested = product ? [...document.querySelectorAll('.order-line-item')].reduce((sum,line) => sum + (line.querySelector('[data-order-product]').value === String(product.id) ? Number(line.querySelector('[data-order-quantity]').value || 0) : 0),0) : 0; hint.textContent = !product ? 'Selecione um produto para consultar o estoque.' : !existsInStorage ? 'Este produto ainda não foi cadastrado no catálogo do baú.' : `Disponível: ${stock.total.toLocaleString('pt-BR')} un. · QG ${stock.QG.toLocaleString('pt-BR')} · Casa ${stock.Casa.toLocaleString('pt-BR')}${requested > stock.total ? ` · Pedido: ${requested}; estoque insuficiente` : ''}`; hint.classList.toggle('is-stock-warning',Boolean(product && existsInStorage && requested > stock.total)); }
      if (product && quantity > 0) total += subtotal;
    });
    $('#orderValue').value = total ? money(total) : '';
  }
  function getStorageItemBalances(itemName) {
    const balances = {QG:0,Casa:0};
    const key = String(itemName || '').trim().toLocaleLowerCase('pt-BR');
    storageMovements.forEach(move => { if (String(move.item || '').trim().toLocaleLowerCase('pt-BR') !== key) return; const location = move.location === 'Casa' ? 'Casa' : 'QG'; balances[location] += move.type === 'entry' ? Number(move.quantity) : -Number(move.quantity); });
    balances.QG = Math.max(0,balances.QG); balances.Casa = Math.max(0,balances.Casa); balances.total = balances.QG + balances.Casa;
    return balances;
  }
  function renderProducts() {
    const canManageProducts = canMemberDo('encomendas.manageProducts'), canDeleteProducts = canMemberDo('encomendas.deleteProducts');
    $('#productForm').hidden = !canManageProducts;
    const selected = [...document.querySelectorAll('.order-line-item')].map(row => row.querySelector('[data-order-product]')?.value || '');
    $('#productRows').innerHTML = products.map(product => { const existsInStorage = storageCatalog.some(item => item.name.toLocaleLowerCase('pt-BR') === product.name.toLocaleLowerCase('pt-BR')); const stock = getStorageItemBalances(product.name); const stockLabel = existsInStorage ? `<b>${stock.total.toLocaleString('pt-BR')} un.</b><small>QG ${stock.QG} · Casa ${stock.Casa}</small>` : '<span class="product-stock-missing">Não cadastrado no baú</span>'; return `<tr><td>${safe(product.name)}</td><td>${money(product.unitValue)}</td><td class="product-stock-cell">${stockLabel}</td><td>${canManageProducts ? `<button type="button" class="employee-access" data-product-edit="${safe(product.id)}" title="Editar valor de ${safe(product.name)}">Editar valor</button>` : ''} ${canDeleteProducts ? `<button type="button" class="employee-delete" data-product-delete="${safe(product.id)}" title="Excluir produto" aria-label="Excluir ${safe(product.name)}">×</button>` : ''}</td></tr>`; }).join('');
    $('#productEmpty').hidden = products.length > 0;
    document.querySelectorAll('.order-line-item').forEach((row,index) => { const select = row.querySelector('[data-order-product]'); select.value = products.some(product => String(product.id) === selected[index]) ? selected[index] : ''; renderOrderProductChoices(row,row.querySelector('[data-order-product-search]').value); });
    document.querySelectorAll('[data-product-edit]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('encomendas.manageProducts')) return toast('O Dono não liberou a edição de produtos para este membro.');
      const product = products.find(item => String(item.id) === String(button.dataset.productEdit)); if (!product) return;
      const entered = window.prompt(`Novo valor unitário para ${product.name} (R$):`, String(product.unitValue).replace('.',','));
      if (entered === null) return;
      const rawValue = entered.trim(), normalizedValue = rawValue.includes(',') ? rawValue.replace(/\./g,'').replace(',','.') : rawValue;
      const unitValue = Number(normalizedValue);
      if (!Number.isFinite(unitValue) || unitValue <= 0) return toast('Informe um valor maior que zero.');

      product.unitValue = unitValue; saveLocalState('vertice_products',JSON.stringify(products)); renderProducts(); renderOrders(); toast('Valor do produto atualizado. Pedidos já cadastrados mantêm o valor original.');
    }));
    document.querySelectorAll('[data-product-delete]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('encomendas.deleteProducts')) return toast('O Dono não liberou a exclusão de produtos para este membro.');
      const product = products.find(item => String(item.id) === String(button.dataset.productDelete)); if (!product) return;
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
  resetOrderLines();
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
    const canCreateOrders = canMemberDo('encomendas.create'), canUpdateOrders = canMemberDo('encomendas.updateStatus'), canDeleteOrders = canMemberDo('encomendas.deleteOrders');
    if (!canCreateOrders) setOrderFormOpen(false);
    $('#openOrderForm').hidden = !canCreateOrders;
    const query = normalizeSearchText($('#orderSearch').value);
    const statusFilter = $('#orderStatusFilter').value;
    const dateFrom = $('#orderDateFrom').value, dateTo = $('#orderDateTo').value;
    const orderCreatedDate = order => { if (!order.createdAt) return ''; const date = new Date(order.createdAt); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };
    const orderSearchText = order => [order.customer,order.familyName,order.familyMember,order.item,(order.items || []).map(line => line.item).join(' '),order.responsible,order.status].map(value => String(value || '')).join(' ');
    const filtered = orders.map(order => ({order,score:fuzzySearchScore(orderSearchText(order),query),createdDate:orderCreatedDate(order)})).filter(result => result.score !== null && (!statusFilter || result.order.status === statusFilter) && (!dateFrom || !result.createdDate || result.createdDate >= dateFrom) && (!dateTo || !result.createdDate || result.createdDate <= dateTo)).sort((a,b) => a.score-b.score || new Date(b.order.createdAt)-new Date(a.order.createdAt)).map(result => result.order);
    const hasApproximateOrders = Boolean(query && filtered.length && !filtered.some(order => normalizeSearchText(orderSearchText(order)).includes(query)));
    $('#orderTotal').textContent = orders.length;
    $('#orderPending').textContent = orders.filter(order => ['Recebida','Em andamento'].includes(order.status)).length;
    $('#orderReady').textContent = orders.filter(order => order.status === 'Pronta').length;
    $('#orderRevenue').textContent = money(orders.filter(order => order.status !== 'Cancelada').reduce((sum,order) => sum + Number(order.value || 0),0));
    $('#orderListCaption').textContent = `${filtered.length} de ${orders.length} ${orders.length === 1 ? 'encomenda' : 'encomendas'}${hasApproximateOrders ? ' · resultados aproximados' : ''}`;
    $('#orderRows').innerHTML = filtered.map(order => { const itemsLabel = Array.isArray(order.items) && order.items.length ? order.items.map(line => `${line.item} × ${Number(line.quantity).toLocaleString('pt-BR')}`).join(' · ') : order.item; return `<tr><td><b>${safe(order.familyName || order.customer)}</b>${order.familyMember ? `<small class="order-details">${safe(order.familyMember)}</small>` : order.familyName ? '<small class="order-details">Família</small>' : ''}</td><td><b>${safe(itemsLabel)}</b>${order.details ? `<small class="order-details">${safe(order.details)}</small>` : ''}</td><td>${Number(order.quantity).toLocaleString('pt-BR')}</td><td>${money(order.value)}</td><td>${safe(order.responsible || '—')}</td><td>${order.dueDate ? new Date(`${order.dueDate}T00:00:00`).toLocaleDateString('pt-BR') : '—'}</td><td>${canUpdateOrders ? `<select class="order-status-select status-${order.status.toLocaleLowerCase('pt-BR').replaceAll(' ','-')}" data-order-status="${safe(order.id)}" aria-label="Status da encomenda de ${safe(order.familyName || order.customer)}">${orderStatuses.map(status => `<option value="${status}" ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select>` : `<span class="order-status-select status-${order.status.toLocaleLowerCase('pt-BR').replaceAll(' ','-')}">${safe(order.status)}</span>`}</td><td>${canDeleteOrders ? `<button class="employee-delete" data-delete-order="${safe(order.id)}" title="Excluir encomenda" aria-label="Excluir encomenda de ${safe(order.familyName || order.customer)}">×</button>` : ''}</td></tr>`; }).join('');
    $('#orderEmpty').hidden = filtered.length > 0;
    if (orders.length && !filtered.length) { $('#orderEmpty b').textContent = 'Nenhuma encomenda encontrada'; $('#orderEmpty small').textContent = 'Ajuste a busca, o período ou o status.'; } else { $('#orderEmpty b').textContent = 'Nenhuma encomenda cadastrada'; $('#orderEmpty small').textContent = 'Cadastre o primeiro pedido para acompanhar sua entrega.'; }
    document.querySelectorAll('[data-order-status]').forEach(select => select.addEventListener('change', () => {
      if (!canMemberDo('encomendas.updateStatus')) return toast('O Dono não liberou a edição do status dos pedidos para este membro.');
      const order = orders.find(item => String(item.id) === String(select.dataset.orderStatus)); if (!order) return;
      order.status = select.value; saveLocalState('vertice_orders',JSON.stringify(orders)); renderOrders(); toast(`Encomenda atualizada: ${order.status}.`);
    }));
    document.querySelectorAll('[data-delete-order]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('encomendas.deleteOrders')) return toast('O Dono não liberou a exclusão de pedidos para este membro.');
      const order = orders.find(item => String(item.id) === String(button.dataset.deleteOrder)); if (!order) return;
      orders = orders.filter(item => String(item.id) !== String(order.id)); saveLocalState('vertice_orders',JSON.stringify(orders)); renderOrders(); toast('Encomenda excluída.');
    }));
  }
  $('#orderForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!canMemberDo('encomendas.create')) return toast('O Dono não liberou a criação de pedidos para este membro.');
    if (!canMemberDo('bau.move')) return toast('Criar pedidos também baixa o estoque. Peça ao Dono a permissão de movimentar o baú.');
    const orderItems = [...document.querySelectorAll('.order-line-item')].map(row => { const product = products.find(item => String(item.id) === row.querySelector('[data-order-product]').value); return product ? {productId:product.id,item:product.name,quantity:Number(row.querySelector('[data-order-quantity]').value),unitValue:Number(product.unitValue),value:Number(product.unitValue) * Number(row.querySelector('[data-order-quantity]').value)} : null; });
    if (!orderItems.length || orderItems.some(item => !item)) return toast('Selecione um produto em cada linha antes de salvar a encomenda.');
    if (orderItems.some(item => !Number.isInteger(item.quantity) || item.quantity < 1)) return toast('Informe uma quantidade válida para cada produto.');
    const family = clients.find(item => String(item.id) === $('#orderFamily').value);
    if (!family) return toast('Cadastre e selecione uma família antes de salvar a encomenda.');
    const familyMemberIndex = $('#orderFamilyMember').value;
    const familyMember = familyMemberIndex === '' ? '' : family.members?.[Number(familyMemberIndex)]?.name || '';
    const groupedItems = new Map();
    orderItems.forEach(line => { const key = normalizeSearchText(line.item), existing = groupedItems.get(key); if (existing) existing.quantity += line.quantity; else groupedItems.set(key,{...line}); });
    for (const item of groupedItems.values()) {
      const storageItem = storageCatalog.find(entry => normalizeSearchText(entry.name) === normalizeSearchText(item.item));
      if (!storageItem) return toast(`Cadastre “${item.item}” também no catálogo do baú antes de vender.`);
      const stock = getStorageItemBalances(item.item);
      if (item.quantity > stock.total) return toast(`Estoque insuficiente de ${item.item} no baú. Disponível: ${stock.total}.`);
    }
    const familyName = family.familyName || family.name;
    const orderId = `order-${Date.now()}`, createdAt = new Date().toISOString(), responsible = $('#orderResponsible').value.trim() || getStorageMember()?.name || 'Encomendas';
    const stockMovementsForOrder = [];
    for (const item of groupedItems.values()) {
      const stock = getStorageItemBalances(item.item); let remaining = item.quantity;
      ['QG','Casa'].forEach(location => { const taken = Math.min(Math.max(0,stock[location]),remaining); if (taken > 0) { const movementId = `storage-move-${Date.now()}-${location}-${stockMovementsForOrder.length}`; stockMovementsForOrder.push({id:movementId,type:'withdrawal',item:item.item,location,quantity:taken,responsible,memberServerId:getStorageMember()?.server_id || '',note:`Venda da encomenda ${orderId}`,createdAt}); remaining -= taken; } });
    }
    storageMovements.unshift(...stockMovementsForOrder);
    saveLocalState('vertice_storage_movements',JSON.stringify(storageMovements));
    orders.unshift({id:orderId,productId:orderItems.length === 1 ? orderItems[0].productId : undefined,productIds:orderItems.map(item => item.productId),items:orderItems,customer:familyName,familyId:family.id,familyName,familyMember,item:orderItems.map(item => item.item).join(', '),quantity:orderItems.reduce((sum,item) => sum + item.quantity,0),value:orderItems.reduce((sum,item) => sum + item.value,0),responsible:$('#orderResponsible').value.trim() || responsible,dueDate:$('#orderDueDate').value,details:$('#orderDetails').value.trim(),status:'Recebida',stockMovementIds:stockMovementsForOrder.map(move => move.id),createdAt});
    saveLocalState('vertice_orders',JSON.stringify(orders)); event.target.reset(); resetOrderLines(); renderProducts(); renderStorage(); renderOrderFamilies(); renderOrders(); setOrderFormOpen(false); toast('Encomenda cadastrada e estoque do baú atualizado.');
  });
  $('#orderSearch').addEventListener('input', renderOrders);
  $('#orderStatusFilter').addEventListener('change', renderOrders);
  $('#orderDateFrom').addEventListener('change', renderOrders);
  $('#orderDateTo').addEventListener('change', renderOrders);
  let editingClientId = null;
  const familyMemberRow = member => `<div class="family-member-row"><label>Nome do membro<input class="family-member-name" required maxlength="80" value="${safe(member?.name || '')}" placeholder="Ex.: Rafael Oliveira"></label><label>Cargo<input class="family-member-role" required maxlength="50" value="${safe(member?.role || '')}" placeholder="Ex.: Gerente"></label><label>Telefone para contato<input class="family-member-phone" maxlength="40" value="${safe(member?.phone || '')}" placeholder="Ex.: 555-0142"></label><button type="button" class="employee-delete family-member-remove" aria-label="Remover membro" title="Remover membro">×</button></div>`;
  function updateFamilyMemberRemoveButtons() { const buttons = document.querySelectorAll('.family-member-remove'); buttons.forEach(button => { button.disabled = buttons.length === 1; }); $('#familyMemberCount').textContent = `${buttons.length} ${buttons.length === 1 ? 'membro' : 'membros'}`; }
  function renderClients() {
    const canManageFamilies = canMemberDo('clientes.manageFamilies'), canDeleteFamilies = canMemberDo('clientes.deleteFamilies');
    if (!canManageFamilies) setRecordModalOpen('clientFormModal',false);
    $('#newClient').hidden = !canManageFamilies;
    const query = normalizeSearchText($('#clientSearch').value);
    const familySearchText = client => [client.familyName,...(client.members || []).flatMap(member => [member.name,member.role,member.phone])].map(value => String(value || '')).join(' ');
    const filtered = clients.map(client => ({client,score:fuzzySearchScore(familySearchText(client),query)})).filter(result => result.score !== null).sort((a,b) => a.score-b.score || (a.client.familyName || '').localeCompare(b.client.familyName || '','pt-BR')).map(result => result.client);
    const hasApproximateFamilies = Boolean(query && filtered.length && !filtered.some(client => normalizeSearchText(familySearchText(client)).includes(query)));
    $('#clientListCaption').textContent = query ? `${filtered.length} de ${clients.length} famílias${hasApproximateFamilies ? ' · resultados aproximados' : ''}` : `${clients.length} ${clients.length === 1 ? 'família cadastrada' : 'famílias cadastradas'}`;
    $('#clientRows').innerHTML = filtered.map(client => { const members = client.members || []; const familyName = client.familyName || client.name; const memberCards = members.map(member => { const initials = (member.name || 'Membro').trim().split(/\s+/).slice(0,2).map(part => part[0] || '').join('').toLocaleUpperCase('pt-BR'); const phone = String(member.phone || ''); const phoneLink = phone.replace(/[^\d+]/g,''); return `<div class="family-member-card"><span class="family-member-avatar">${safe(initials || 'M')}</span><div class="family-member-info"><b>${safe(member.name || 'Membro sem nome')}</b><span class="family-member-role">${safe(member.role || 'Cargo não informado')}</span></div>${phone ? `<a class="family-member-contact" href="tel:${safe(phoneLink)}" title="Ligar para ${safe(member.name || 'membro')}">☎ <span>${safe(phone)}</span></a>` : '<small class="family-member-no-contact">Sem telefone</small>'}</div>`; }).join(''); return `<article class="family-card"><header class="family-card-header"><span class="family-card-icon">♧</span><div class="family-card-title"><small class="family-card-kicker">FAMÍLIA</small><h3>${safe(familyName)}</h3><span class="family-card-member-count">${members.length} ${members.length === 1 ? 'membro' : 'membros'}</span></div><div class="family-card-actions">${canManageFamilies ? `<button class="employee-access" type="button" data-edit-client="${safe(client.id)}" title="Editar família">Editar</button>` : ''}${canDeleteFamilies ? `<button class="employee-delete" type="button" data-delete-client="${safe(client.id)}" title="Excluir família" aria-label="Excluir ${safe(familyName)}">×</button>` : ''}</div></header><div class="family-member-list">${memberCards || '<small class="family-member-no-contact">Nenhum membro cadastrado</small>'}</div></article>`; }).join('');
    $('#clientEmpty').hidden = filtered.length > 0;
    $('#clientEmpty b').textContent = clients.length && query ? 'Nenhuma família encontrada' : 'Nenhuma família cadastrada';
    $('#clientEmpty small').textContent = clients.length && query ? 'Tente buscar por outro nome, cargo ou telefone.' : 'Cadastre a primeira família para começar sua lista.';
    document.querySelectorAll('[data-delete-client]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('clientes.deleteFamilies')) return toast('O Dono não liberou a exclusão de famílias para este membro.');
      const client = clients.find(item => String(item.id) === String(button.dataset.deleteClient)); if (!client) return;
      clients = clients.filter(item => String(item.id) !== String(client.id)); saveLocalState('vertice_clients',JSON.stringify(clients)); renderClients(); toast('Família removida.');
    }));
    document.querySelectorAll('[data-edit-client]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('clientes.manageFamilies')) return toast('O Dono não liberou a edição de famílias para este membro.');
      const client = clients.find(item => String(item.id) === String(button.dataset.editClient)); if (!client) return;
      editingClientId = String(client.id); $('#clientFamilyName').value = client.familyName || client.name || ''; $('#familyMembers').innerHTML = (client.members?.length ? client.members : [{name:client.name || '',role:'',phone:client.phone || ''}]).map(familyMemberRow).join(''); updateFamilyMemberRemoveButtons();
      $('#clientFormTitle').textContent = 'Editar família'; $('#saveClientButton').innerHTML = 'Salvar alterações <span>→</span>'; $('#cancelClientEdit').hidden = false; $('#cancelClientForm').hidden = true; setRecordModalOpen('clientFormModal',true,'#clientFamilyName');
    }));
    renderOrderFamilies();
  }
  function resetClientForm() { editingClientId = null; $('#clientForm').reset(); $('#clientFamilyName').value = ''; $('#familyMembers').innerHTML = familyMemberRow({}); updateFamilyMemberRemoveButtons(); $('#clientFormTitle').textContent = 'Nova família'; $('#saveClientButton').innerHTML = 'Salvar família <span>→</span>'; $('#cancelClientEdit').hidden = true; $('#cancelClientForm').hidden = false; }
  $('#familyMembers').innerHTML = familyMemberRow({}); updateFamilyMemberRemoveButtons();
  $('#addFamilyMember').addEventListener('click', () => { $('#familyMembers').insertAdjacentHTML('beforeend',familyMemberRow({})); updateFamilyMemberRemoveButtons(); $('#familyMembers .family-member-row:last-child .family-member-name').focus(); });
  $('#familyMembers').addEventListener('click', event => { const remove = event.target.closest('.family-member-remove'); if (remove && $('#familyMembers .family-member-row').length > 1) { remove.closest('.family-member-row').remove(); updateFamilyMemberRemoveButtons(); } });
  $('#clientSearch').addEventListener('input', renderClients);
  $('#newClient').addEventListener('click', () => { resetClientForm(); setRecordModalOpen('clientFormModal',true,'#clientFamilyName'); });
  $('#clientForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!canMemberDo('clientes.manageFamilies')) return toast('O Dono não liberou a edição de famílias para este membro.');
    const wasEditing = Boolean(editingClientId);
    const family = {familyName:$('#clientFamilyName').value.trim(),members:[...document.querySelectorAll('.family-member-row')].map(row => ({name:row.querySelector('.family-member-name').value.trim(),role:row.querySelector('.family-member-role').value.trim(),phone:row.querySelector('.family-member-phone').value.trim()})),createdAt:new Date().toISOString()};
    const duplicate = clients.some(item => String(item.id) !== String(editingClientId) && (item.familyName || item.name || '').toLocaleLowerCase('pt-BR') === family.familyName.toLocaleLowerCase('pt-BR'));
    if (duplicate) return toast('Já existe uma família com esse nome.');
    if (editingClientId) { const index = clients.findIndex(item => String(item.id) === editingClientId); if (index < 0) return resetClientForm(); clients[index] = {...clients[index],...family,createdAt:clients[index].createdAt}; }
    else clients.unshift({id:`client-${Date.now()}`,...family});
    saveLocalState('vertice_clients',JSON.stringify(clients)); resetClientForm(); setRecordModalOpen('clientFormModal',false); renderClients(); toast(wasEditing ? 'Família atualizada.' : 'Família cadastrada.');
  });
  const storageSessionKey = 'vertice_storage_member_session';
  const idleActivityKey = 'vertice_member_last_activity';
  const memberIdleLimitMs = 7 * 24 * 60 * 60 * 1000;
  const savedProfilesKey = 'vertice_saved_profiles';
  let requestedProtectedView = 'login';
  const getStorageMember = () => employees.find(member => String(member.server_id) === sessionStorage.getItem(storageSessionKey) && member.status !== 'inactive') || null;
  const isCurrentOwner = () => String(getStorageMember()?.role || '').trim().toLocaleLowerCase('pt-BR') === 'dono';
  const getSessionMember = () => employees.find(member => String(member.server_id) === sessionStorage.getItem(storageSessionKey)) || null;
  const isSoleActiveOwner = member => String(member?.role || '').trim().toLocaleLowerCase('pt-BR') === 'dono' && !employees.some(item => String(item.server_id) !== String(member.server_id) && item.status !== 'inactive' && String(item.role || '').trim().toLocaleLowerCase('pt-BR') === 'dono' && memberAccounts[String(item.server_id)]);
  const canManageEmployeeStatus = () => ['dono','gerente'].includes(String(getStorageMember()?.role || '').trim().toLocaleLowerCase('pt-BR')) || !hasDonoAccount();
  let memberIdleTimer = 0, lastIdleActivityWrite = 0;
  function deactivateIdleMember() {
    const member = getStorageMember(); if (!member || String(member.role || '').toLocaleLowerCase('pt-BR') === 'dono' && isSoleActiveOwner(member)) return;
    member.status = 'inactive'; saveLocalState('vertice_employees',JSON.stringify(employees));
    sessionStorage.removeItem(storageSessionKey); sessionStorage.removeItem(idleActivityKey);
    requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Seu perfil foi marcado como inativo após 7 dias sem movimentação. Peça a um Gerente ou Dono para reativá-lo.';
    renderEmployees(); syncOwnerNavigation(); showView('login'); toast('Perfil marcado como inativo por falta de atividade.');
  }
  function startMemberInactivityMonitor() {
    clearTimeout(memberIdleTimer);
    const member = getStorageMember(); if (!member || isSoleActiveOwner(member)) return;
    const now = Date.now(); let last = Number(sessionStorage.getItem(idleActivityKey));
    if (!Number.isFinite(last) || last <= 0) { last = now; sessionStorage.setItem(idleActivityKey,String(last)); }
    const remaining = memberIdleLimitMs - (now - last);
    if (remaining <= 0) { deactivateIdleMember(); return; }
    memberIdleTimer = setTimeout(deactivateIdleMember,remaining);
  }
  function recordMemberActivity() {
    if (!getStorageMember() || isSoleActiveOwner(getStorageMember())) return;
    const now = Date.now(); if (now - lastIdleActivityWrite < 1000) return;
    lastIdleActivityWrite = now; sessionStorage.setItem(idleActivityKey,String(now)); startMemberInactivityMonitor();
  }
  const getSavedProfileIds = () => {
    try { const parsed = JSON.parse(localStorage.getItem(savedProfilesKey) || '[]'); return Array.isArray(parsed) ? [...new Set(parsed.map(String))].filter(id => employees.some(member => String(member.server_id) === id && member.status !== 'inactive')) : []; }
    catch { return []; }
  };
  const saveProfileId = id => { const ids = getSavedProfileIds(); if (!ids.includes(String(id))) ids.push(String(id)); rawSetLocal(savedProfilesKey,JSON.stringify(ids)); };
  const forgetProfileId = id => rawSetLocal(savedProfilesKey,JSON.stringify(getSavedProfileIds().filter(savedId => savedId !== String(id))));
  function renderSavedProfiles() {
    const activeId = sessionStorage.getItem(storageSessionKey);
    const ids = getSavedProfileIds();
    rawSetLocal(savedProfilesKey,JSON.stringify(ids));
    $('#savedProfilesList').innerHTML = ids.length ? ids.map(id => {
      const member = employees.find(item => String(item.server_id) === id);
      return `<div class="saved-profile-row"><div class="saved-profile-avatar">${safe((member.name || '?').trim().slice(0,1).toLocaleUpperCase('pt-BR'))}</div><div class="saved-profile-copy"><b>${safe(member.name)}</b><small>${safe(member.role || 'Membro')} · ID ${safe(member.server_id)}</small></div>${id === activeId ? '<span class="saved-profile-current">Em uso</span>' : `<button class="button button-quiet saved-profile-switch" type="button" data-switch-profile="${safe(id)}">Alternar</button>`}<button class="saved-profile-forget" type="button" data-forget-profile="${safe(id)}" aria-label="Remover perfil salvo de ${safe(member.name)}" title="Remover perfil">×</button></div>`;
    }).join('') : '<div class="saved-profiles-empty">Nenhum perfil salvo neste dispositivo.</div>';
  }
  const hasDonoAccount = () => Object.values(memberAccounts).some(account => employees.some(member => String(member.server_id) === String(account.serverId) && member.status !== 'inactive' && String(member.role).toLocaleLowerCase('pt-BR') === 'dono'));
  const canManagePermissions = () => !hasDonoAccount() || String(getStorageMember()?.role || '').toLocaleLowerCase('pt-BR') === 'dono';
  const hasRolePermission = (member, view) => String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono' || rolePermissions[member?.role]?.[view] === true;
  const hasMemberPermission = (member, view) => { if (String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono') return true; const overrides = memberPermissions[String(member?.server_id)] || {}; return Object.prototype.hasOwnProperty.call(overrides,view) ? overrides[view] !== false : hasRolePermission(member,view); };
  const legacyActionAliases = {'encomendas.updateStatus':'encomendas.manageOrders','encomendas.deleteOrders':'encomendas.manageOrders','encomendas.deleteProducts':'encomendas.manageProducts'};
  const hasMemberAction = (member, action) => { if ((!member && !hasDonoAccount()) || String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono') return true; const permissions = memberPermissions[String(member?.server_id)] || {}; if (Object.prototype.hasOwnProperty.call(permissions,action)) return permissions[action] === true; const legacy = legacyActionAliases[action]; return Boolean(legacy && permissions[legacy] === true); };
  const canManagePersonalAreas = () => ['dono','gerente'].includes(String(getStorageMember()?.role || '').trim().toLocaleLowerCase('pt-BR'));
  const canDefinePersonalGoals = () => String(getStorageMember()?.role || '').trim().toLocaleLowerCase('pt-BR') === 'dono';
  const canReceiveGoalNotifications = () => ['dono','gerente'].includes(String(getStorageMember()?.role || '').trim().toLocaleLowerCase('pt-BR'));
  const goalNotificationReadKey = () => `ducaps_goal_notifications_read_${String(getStorageMember()?.server_id || 'signed-out')}`;
  const readGoalNotificationIds = () => { try { const data = JSON.parse(localStorage.getItem(goalNotificationReadKey()) || '[]'); return Array.isArray(data) ? data.map(String) : []; } catch { return []; } };
  function renderGoalNotifications() {
    const allowed = canReceiveGoalNotifications(), readIds = readGoalNotificationIds();
    const visible = allowed ? goalNotifications.filter(item => item.type === 'goal_reached').slice().sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)) : [];
    const unreadCount = visible.filter(item => !readIds.includes(String(item.id))).length;
    $('#notificationDot').hidden = unreadCount === 0;
    $('#notifications').setAttribute('aria-label',unreadCount ? `Notificações, ${unreadCount} não lidas` : 'Notificações');
    $('#goalNotificationsList').innerHTML = visible.length ? visible.slice(0,50).map(item => `<article class="goal-notification-card ${readIds.includes(String(item.id)) ? '' : 'unread'}"><span class="goal-notification-icon">✓</span><div><b>Meta atingida: ${safe(item.goalTitle)}</b><p>${safe(item.memberName)} completou a meta de depósito de dinheiro sujo.</p><small>${item.createdAt ? new Date(item.createdAt).toLocaleString('pt-BR') : ''}</small></div></article>`).join('') : '<div class="goal-notifications-empty">Nenhuma meta concluída ainda.</div>';
    $('#markGoalNotificationsRead').hidden = unreadCount === 0;
  }
  function markGoalNotificationsRead() {
    if (!canReceiveGoalNotifications()) return;
    rawSetLocal(goalNotificationReadKey(),JSON.stringify(goalNotifications.map(item => String(item.id)))); renderGoalNotifications();
  }
  $('#closeGoalNotifications').addEventListener('click',() => $('#goalNotificationsBackdrop').classList.remove('open'));
  $('#closeGoalNotificationsAction').addEventListener('click',() => $('#goalNotificationsBackdrop').classList.remove('open'));
  $('#goalNotificationsBackdrop').addEventListener('click',event => { if (event.target.id === 'goalNotificationsBackdrop') $('#goalNotificationsBackdrop').classList.remove('open'); });
  $('#markGoalNotificationsRead').addEventListener('click',markGoalNotificationsRead);
  function notifyCompletedDirtyMoneyGoals(movements) {
    const depositedMemberIds = [...new Set(movements.filter(move => move.type === 'entry' && !move.transferId && normalizeSearchText(move.item) === 'dinheiro sujo' && move.memberServerId).map(move => String(move.memberServerId)))];
    if (!depositedMemberIds.length) return;
    let changed = false;
    depositedMemberIds.forEach(serverId => {
      const member = employees.find(item => String(item.server_id) === serverId);
      if (!member) return;
      (Array.isArray(personalGoals[serverId]) ? personalGoals[serverId] : []).filter(goal => goal.type === 'dirty_money').forEach(goal => {
        const notificationId = `goal-reached:${serverId}:${goal.id}`;
        const current = storageMovements.filter(move => String(move.memberServerId || '') === serverId && move.type === 'entry' && !move.transferId && normalizeSearchText(move.item) === 'dinheiro sujo' && (!goal.createdAt || new Date(move.createdAt) >= new Date(goal.createdAt))).reduce((sum,move) => sum + Math.max(0,Number(move.quantity) || 0),0);
        const target = Math.max(1,Number(goal.targetQuantity) || 1);
        if (current >= target && !goalNotifications.some(item => String(item.id) === notificationId)) {
          goalNotifications.unshift({id:notificationId,type:'goal_reached',memberServerId:serverId,memberName:member.name || 'Membro',goalId:String(goal.id),goalTitle:goal.title || 'Meta de depósito',createdAt:new Date().toISOString()}); changed = true;
        }
      });
    });
    if (changed) { saveLocalState('vertice_goal_notifications',JSON.stringify(goalNotifications)); renderGoalNotifications(); if (canReceiveGoalNotifications()) toast('Uma meta foi atingida.'); }
  }
  function weekStartDate(dateValue = new Date()) {
    const date = new Date(dateValue); date.setHours(0,0,0,0);
    const daysFromMonday = (date.getDay() + 6) % 7; date.setDate(date.getDate() - daysFromMonday); return date;
  }
  const isTrackedDirtyMoneyDeposit = move => move.type === 'entry' && !move.transferId && normalizeSearchText(move.item) === 'dinheiro sujo' && move.memberServerId && normalizeSearchText(move.note) !== 'saldo inicial do cadastro';
  function weeklyDirtyMoneySeries(serverId = null) {
    const currentWeek = weekStartDate(), weeks = [];
    for (let offset = 7; offset >= 0; offset--) { const start = new Date(currentWeek); start.setDate(start.getDate() - offset * 7); const end = new Date(start); end.setDate(end.getDate() + 7); weeks.push({key:`${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`,start,end,total:0}); }
    const relevant = storageMovements.filter(move => isTrackedDirtyMoneyDeposit(move) && (serverId == null || String(move.memberServerId) === String(serverId)));
    relevant.forEach(move => { const date = new Date(move.createdAt); if (!Number.isFinite(date.getTime())) return; const start = weekStartDate(date), key = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,'0')}-${String(start.getDate()).padStart(2,'0')}`, week = weeks.find(item => item.key === key); if (week) week.total += Math.max(0,Number(move.quantity) || 0); });
    return weeks;
  }
  function weeklyChartMarkup(weeks,emptyText='Nenhum depósito registrado nessas semanas.') {
    const max = Math.max(1,...weeks.map(week => week.total));
    if (!weeks.some(week => week.total > 0)) return `<p class="personal-empty-note weekly-chart-empty">${emptyText}</p>`;
    return weeks.map((week,index) => { const percent = week.total ? Math.max(4,Math.round(week.total / max * 100)) : 0, label = week.start.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'}); return `<div class="weekly-chart-column ${index === weeks.length-1 ? 'current' : ''}" title="Semana de ${week.start.toLocaleDateString('pt-BR')} — ${money(week.total)}"><b>${week.total ? money(week.total) : '—'}</b><div class="weekly-chart-track"><span style="height:${percent}%"></span></div><small>${label}${index === weeks.length-1 ? ' · atual' : ''}</small></div>`; }).join('');
  }
  function scheduleWeeklyDepositRefresh() {
    const nextWeek = weekStartDate(); nextWeek.setDate(nextWeek.getDate() + 7);
    setTimeout(() => { renderPersonalArea(); scheduleWeeklyDepositRefresh(); },Math.max(1000,nextWeek.getTime() - Date.now() + 1000));
  }
  const canMemberDo = action => {
    const member = getStorageMember();
    const area = action.startsWith('bau.') ? 'bau' : action.startsWith('encomendas.') ? 'encomendas' : action.startsWith('clientes.') ? 'clientes' : '';
    return (!area || hasMemberPermission(member,area)) && hasMemberAction(member,action);
  };
  const memberLandingView = member => String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono' ? 'owner' : navOrder.find(view => ['bau','encomendas','clientes'].includes(view) && hasMemberPermission(member,view)) || (['financeiro.income','financeiro.expense','relatorios.export'].some(action => memberPermissions[String(member?.server_id)]?.[action] === true) ? 'inicio' : 'pessoal');
  const syncOwnerNavigation = () => {
    const member = getStorageMember();
    const storedSessionId = sessionStorage.getItem(storageSessionKey);
    if (storedSessionId && !member) { sessionStorage.removeItem(storageSessionKey); sessionStorage.removeItem(idleActivityKey); requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Seu perfil está inativo. Peça a um Gerente ou Dono para reativá-lo.'; showView('login'); }
    const allowed = !hasDonoAccount() || String(member?.role || '').toLocaleLowerCase('pt-BR') === 'dono';
    document.querySelector('.nav-item[data-view="owner"]').hidden = !allowed;
    $('#employeeNavItem').hidden = !canManageEmployeeStatus();
    document.querySelector('.nav-item[data-view="bau"]').hidden = Boolean(member) && !hasMemberPermission(member,'bau');
    document.querySelector('.nav-item[data-view="encomendas"]').hidden = Boolean(member) && !hasMemberPermission(member,'encomendas');
    document.querySelector('.nav-item[data-view="clientes"]').hidden = Boolean(member) && !hasMemberPermission(member,'clientes');
    $('#personalNavItem').hidden = !member;
    $('#memberSessionButton').textContent = member ? `Perfis ▾` : getSavedProfileIds().length ? 'Perfis salvos' : 'Entrar';
    $('#setupOwnerAccess').hidden = hasDonoAccount();
    $('#newAction').hidden = !canMemberDo('financeiro.income') && !canMemberDo('financeiro.expense');
    document.querySelectorAll('[data-action="income"]').forEach(button => { button.hidden = !canMemberDo('financeiro.income'); });
    document.querySelectorAll('[data-action="expense"]').forEach(button => { button.hidden = !canMemberDo('financeiro.expense'); });
    document.querySelectorAll('[data-action="employee"]').forEach(button => { button.hidden = !allowed; });
    $('#exportBtn').hidden = !canMemberDo('relatorios.export');
    renderPersonalArea();
    renderMemberPermissions();
    renderGoalNotifications();
    renderEmployees();
    startMemberInactivityMonitor();
    const activeView = document.querySelector('.nav-item.active')?.dataset.view;
    if (activeView && ['bau','encomendas','clientes'].includes(activeView) && member && !hasMemberPermission(member,activeView)) {
      const destination = memberLandingView(member);
      if (destination && destination !== activeView) showView(destination);
      else { sessionStorage.removeItem(storageSessionKey); showView('login'); }
    }
    if (!allowed && activeView === 'owner' || !canManageEmployeeStatus() && activeView === 'equipe') { setSiteEditMode(false); showView('login'); }
  };
  function requestMemberLogin(view) {
    requestedProtectedView = view;
    $('#loginNotice').textContent = view === 'owner' ? 'Entre com a conta do Dono para abrir esta área.' : view === 'equipe' ? 'Entre com uma conta de Gerente ou Dono para gerenciar os status dos membros.' : 'Entre para acessar as áreas liberadas para sua conta.';
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
      {title:'Encomendas',permissions:[{key:'encomendas',label:'Acesso às encomendas',view:true},{key:'encomendas.create',label:'Criar pedidos'},{key:'encomendas.manageProducts',label:'Cadastrar e editar produtos'},{key:'encomendas.deleteProducts',label:'Excluir produtos'},{key:'encomendas.updateStatus',label:'Editar status dos pedidos'},{key:'encomendas.deleteOrders',label:'Excluir pedidos'}]},
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
  function renderPersonalArea() {
    const activeMember = getStorageMember();
    if (!activeMember || !$('#personalView')) return;
    const manager = canManagePersonalAreas(), activeEmployees = employees.filter(member => member.status !== 'inactive');
    if (!manager || !activeEmployees.some(member => String(member.server_id) === String(selectedPersonalMemberId))) selectedPersonalMemberId = String(activeMember.server_id);
    const person = manager ? activeEmployees.find(member => String(member.server_id) === String(selectedPersonalMemberId)) || activeMember : activeMember;
    const serverId = String(person.server_id), tabs = Array.isArray(personalAreaTabs[serverId]) ? personalAreaTabs[serverId] : [], goals = Array.isArray(personalGoals[serverId]) ? personalGoals[serverId] : [], messages = Array.isArray(personalMessages[serverId]) ? personalMessages[serverId] : [];
    const dirtyMoneyProgress = goal => storageMovements.filter(move => String(move.memberServerId || '') === serverId && move.type === 'entry' && !move.transferId && normalizeSearchText(move.item) === 'dinheiro sujo' && (!goal.createdAt || new Date(move.createdAt) >= new Date(goal.createdAt))).reduce((sum,move) => sum + Math.max(0,Number(move.quantity) || 0),0);
    const isGoalComplete = goal => goal.type === 'dirty_money' ? dirtyMoneyProgress(goal) >= Math.max(1,Number(goal.targetQuantity) || 1) : goal.status === 'concluida';
    if (!['profile','history','goals','contact','weekly'].includes(selectedPersonalTabId) && !tabs.some(tab => String(tab.id) === String(selectedPersonalTabId))) selectedPersonalTabId = 'profile';
    $('#personalMemberPanel').hidden = !manager;
    $('#personalView').classList.toggle('is-member-view',!manager);
    $('#personalMemberWelcome').hidden = manager;
    $('#personalWelcomeName').textContent = (activeMember.name || 'membro').trim().split(/\s+/)[0];
    $('#personalWelcomeAvatar').textContent = (activeMember.name || 'M').trim().split(/\s+/).slice(0,2).map(part => part[0] || '').join('').toLocaleUpperCase('pt-BR');
    $('#personalWelcomeGoals').textContent = goals.length;
    $('#personalWelcomeCompleted').textContent = goals.filter(isGoalComplete).length;
    $('#personalIntro').textContent = manager ? 'Selecione um membro para visualizar metas e conversar diretamente com ele.' : 'Acompanhe suas metas e converse diretamente com a gestão.';
    $('#personalAccessBadge').textContent = manager ? 'GESTÃO DE ÁREAS' : 'ÁREA PESSOAL';
    const memberQuery = normalizeSearchText($('#personalMemberSearch')?.value || '');
    const visibleEmployees = activeEmployees.filter(member => !memberQuery || normalizeSearchText(`${member.name} ${member.role} ${member.server_id}`).includes(memberQuery));
    $('#personalMemberTabs').innerHTML = manager ? (visibleEmployees.map(member => `<button type="button" role="tab" aria-selected="${String(member.server_id) === serverId}" class="personal-member-tab ${String(member.server_id) === serverId ? 'active' : ''}" data-personal-member="${safe(member.server_id)}"><span class="personal-channel-mark">#</span><span><b>${safe(member.name)}</b><small>${safe(member.role || 'Membro')}</small></span></button>`).join('') || '<p class="personal-empty-note">Nenhum membro encontrado.</p>') : '';
    $('#personalMemberName').textContent = person.name || 'Membro';
    $('#personalMemberCaption').textContent = `${person.role || 'Cargo não informado'} · ID ${person.server_id || '—'}${manager && String(person.server_id) !== String(activeMember.server_id) ? ' · Visualização da gestão' : ''}`;
    $('#personalMemberStatus').textContent = person.status === 'inactive' ? 'INATIVO' : 'ATIVO';
    $('#personalProfileDetails').innerHTML = `<div class="personal-profile-facts"><div><small>Cargo</small><b>${safe(person.role || 'Não informado')}</b></div><div><small>ID no servidor</small><b>${safe(person.server_id || '—')}</b></div><div><small>Telefone</small><b>${safe(person.phone || 'Não informado')}</b></div><div><small>Status</small><b>${person.status === 'inactive' ? 'Inativo' : 'Ativo'}</b></div></div>`;
    const recent = collapseStorageTransferRecords(storageMovements.filter(move => String(move.memberServerId || '') === serverId)).slice(0,100);
    $('#personalHistory').innerHTML = `<h3>Histórico do baú</h3><p class="personal-history-caption">Movimentações registradas com o acesso deste membro.</p>${recent.length ? `<div class="personal-recent-list">${recent.map(move => `<div class="personal-recent-row"><span class="storage-movement ${move.transferId ? 'transfer' : move.type}">${move.transferId ? `Transferência · ${safe(storageMovementTransferRoute(move))}` : move.type === 'entry' ? 'Entrada' : 'Retirada'}</span><b>${safe(move.item)}</b><span>${safe(move.transferId ? storageMovementTransferRoute(move) : move.location || 'QG')} · ${Number(move.quantity).toLocaleString('pt-BR')} un.</span><small>${move.createdAt ? new Date(move.createdAt).toLocaleString('pt-BR') : ''}</small></div>`).join('')}</div>` : '<p class="personal-empty-note">Nenhuma movimentação registrada com este acesso.</p>'}`;
    $('#personalWorkspaceTitle').textContent = `Espaço de ${person.name || 'membro'}`;
    $('#personalGoalCount').textContent = `${goals.length} ${goals.length === 1 ? 'meta' : 'metas'}`;
    const weeklySeries = weeklyDirtyMoneySeries(serverId), thisWeekDeposits = weeklySeries.at(-1)?.total || 0;
    $('#personalWeeklyTotal').textContent = money(thisWeekDeposits);
    $('#personalWeeklyChart').innerHTML = weeklyChartMarkup(weeklySeries,'Você ainda não registrou depósitos nas últimas semanas.');
    $('#personalWeeklyCurrentLabel').textContent = 'Semana atual';
    $('#personalGoalForm').hidden = !canDefinePersonalGoals();
    $('#personalGoalTargetField').hidden = $('#personalGoalType').value !== 'dirty_money';
    $('#personalGoalList').innerHTML = goals.length ? goals.map(goal => {
      const isMoneyGoal = goal.type === 'dirty_money';
      const goalActions = canDefinePersonalGoals() ? `<div class="personal-goal-actions"><button class="personal-goal-edit" type="button" data-edit-goal="${safe(goal.id)}">Editar</button><button class="personal-goal-delete" type="button" data-delete-goal="${safe(goal.id)}" aria-label="Remover meta">×</button></div>` : '';
      if (isMoneyGoal) {
        const target = Math.max(1,Number(goal.targetQuantity) || 1), current = dirtyMoneyProgress(goal), percent = Math.min(100,Math.round(current / target * 100)), reached = current >= target;
        return `<article class="personal-goal-card personal-money-goal"><svg class="personal-goal-ring" viewBox="0 0 52 52" role="progressbar" aria-label="Progresso da meta ${safe(goal.title)}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><circle class="personal-goal-ring-track" cx="26" cy="26" r="21" pathLength="100"></circle><circle class="personal-goal-ring-fill" cx="26" cy="26" r="21" pathLength="100" transform="rotate(-90 26 26)" stroke-dasharray="100" stroke-dashoffset="${100-percent}" style="--goal-ring-offset:${100-percent}"></circle><text x="26" y="29">${percent}%</text></svg><div class="personal-goal-copy"><b>${safe(goal.title)}</b><p>${safe(goal.description || 'Deposite Dinheiro sujo no baú para avançar nesta meta.')}</p>${goal.dueDate ? `<small>Prazo: ${new Date(`${goal.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</small>` : ''}<div class="personal-goal-progress" role="progressbar" aria-label="Quantidade depositada" aria-valuemin="0" aria-valuemax="${target}" aria-valuenow="${Math.min(current,target)}"><span style="width:${percent}%"></span></div><small>${current.toLocaleString('pt-BR')} / ${target.toLocaleString('pt-BR')} unidades depositadas</small></div><span class="personal-money-goal-state ${reached ? 'reached' : ''}">${reached ? 'Meta atingida' : 'Em andamento'}</span>${goalActions}</article>`;
      }
      return `<article class="personal-goal-card"><div class="personal-goal-copy"><b>${safe(goal.title)}</b>${goal.description ? `<p>${safe(goal.description)}</p>` : ''}${goal.dueDate ? `<small>Prazo: ${new Date(`${goal.dueDate}T12:00:00`).toLocaleDateString('pt-BR')}</small>` : ''}</div><select class="personal-goal-status status-${safe(goal.status || 'pendente')}" data-goal-status="${safe(goal.id)}" aria-label="Andamento da meta ${safe(goal.title)}"><option value="pendente" ${goal.status === 'pendente' || !goal.status ? 'selected' : ''}>Pendente</option><option value="andamento" ${goal.status === 'andamento' ? 'selected' : ''}>Em andamento</option><option value="concluida" ${goal.status === 'concluida' ? 'selected' : ''}>Concluída</option></select>${goalActions}</article>`;
    }).join('') : '<p class="personal-empty-note">Nenhuma meta cadastrada para este membro.</p>';
    $('#personalChatTitle').textContent = `Conversa com ${person.name || 'membro'}`;
    $('#personalChatAvatar').textContent = (person.name || 'M').trim().split(/\s+/).slice(0,2).map(part => part[0] || '').join('').toLocaleUpperCase('pt-BR');
    $('#personalMessages').innerHTML = messages.length ? messages.map(message => { const own = String(message.senderServerId) === String(activeMember.server_id); return `<article class="personal-message ${own ? 'own-message' : ''}"><div><b>${safe(message.senderName || 'Membro')}</b><small>${message.createdAt ? new Date(message.createdAt).toLocaleString('pt-BR') : ''}</small></div><p>${safe(message.text).replace(/\n/g,'<br>')}</p></article>`; }).join('') : '<p class="personal-empty-note">Comece uma conversa direta com este membro.</p>';
    $('#personalMessages').scrollTop = $('#personalMessages').scrollHeight;
    $('#personalContentTabs').innerHTML = `<button type="button" role="tab" aria-selected="${selectedPersonalTabId === 'profile'}" class="personal-content-tab ${selectedPersonalTabId === 'profile' ? 'active' : ''}" data-personal-tab="profile">Perfil</button><button type="button" role="tab" aria-selected="${selectedPersonalTabId === 'weekly'}" class="personal-content-tab ${selectedPersonalTabId === 'weekly' ? 'active' : ''}" data-personal-tab="weekly">Depósitos da semana</button><button type="button" role="tab" aria-selected="${selectedPersonalTabId === 'goals'}" class="personal-content-tab ${selectedPersonalTabId === 'goals' ? 'active' : ''}" data-personal-tab="goals">Metas <span class="personal-tab-count">${goals.length}</span></button><button type="button" role="tab" aria-selected="${selectedPersonalTabId === 'contact'}" class="personal-content-tab ${selectedPersonalTabId === 'contact' ? 'active' : ''}" data-personal-tab="contact">Contato direto${messages.length ? ` <span class="personal-tab-count">${messages.length}</span>` : ''}</button><button type="button" role="tab" aria-selected="${selectedPersonalTabId === 'history'}" class="personal-content-tab ${selectedPersonalTabId === 'history' ? 'active' : ''}" data-personal-tab="history">Histórico do baú</button>${tabs.map(tab => `<button type="button" role="tab" aria-selected="${String(tab.id) === String(selectedPersonalTabId)}" class="personal-content-tab ${String(tab.id) === String(selectedPersonalTabId) ? 'active' : ''}" data-personal-tab="${safe(tab.id)}">${safe(tab.title)}</button>`).join('')}`;
    const selectedTab = tabs.find(tab => String(tab.id) === String(selectedPersonalTabId));
    $('#personalProfileDetails').hidden = selectedPersonalTabId !== 'profile';
    $('#personalProfilePanel').hidden = selectedPersonalTabId !== 'profile';
    $('#personalHistory').hidden = selectedPersonalTabId !== 'history';
    $('#personalWeeklyDeposits').hidden = selectedPersonalTabId !== 'weekly';
    $('#personalGoals').hidden = selectedPersonalTabId !== 'goals';
    $('#personalChat').hidden = selectedPersonalTabId !== 'contact';
    $('#personalTabContent').hidden = !selectedTab;
    $('#personalTabContent').innerHTML = selectedTab ? `<h3>${safe(selectedTab.title)}</h3><div class="personal-tab-copy">${safe(selectedTab.content || 'Esta aba ainda não tem conteúdo.').replace(/\n/g,'<br>')}</div>` : '';
    $('#personalTabActions').hidden = !manager || !selectedTab;
  }
  $('#personalMemberSearch').addEventListener('input', renderPersonalArea);
  $('#personalWelcomeGoalsButton').addEventListener('click', () => { selectedPersonalTabId = 'goals'; renderPersonalArea(); });
  $('#personalWelcomeContactButton').addEventListener('click', () => { selectedPersonalTabId = 'contact'; renderPersonalArea(); });
  $('#personalMemberTabs').addEventListener('click', event => { const button = event.target.closest('[data-personal-member]'); if (!button || !canManagePersonalAreas()) return; if (String(selectedPersonalMemberId) !== String(button.dataset.personalMember)) resetPersonalGoalEditor(); selectedPersonalMemberId = button.dataset.personalMember; selectedPersonalTabId = 'profile'; renderPersonalArea(); });
  $('#personalContentTabs').addEventListener('click', event => { const button = event.target.closest('[data-personal-tab]'); if (!button) return; selectedPersonalTabId = button.dataset.personalTab; renderPersonalArea(); });
  $('#personalGoalType').addEventListener('change', event => {
    const moneyGoal = event.target.value === 'dirty_money'; $('#personalGoalTargetField').hidden = !moneyGoal;
    if (moneyGoal && !$('#personalGoalTitle').value.trim()) $('#personalGoalTitle').value = 'Depositar dinheiro sujo';
  });
  const personalGoalCancelButton = document.createElement('button');
  personalGoalCancelButton.type = 'button'; personalGoalCancelButton.id = 'cancelPersonalGoalEdit'; personalGoalCancelButton.className = 'button button-quiet personal-goal-cancel'; personalGoalCancelButton.textContent = 'Cancelar edição'; personalGoalCancelButton.hidden = true;
  const personalGoalFormActions = document.createElement('div');
  personalGoalFormActions.className = 'personal-goal-form-actions';
  const personalGoalSubmitButton = $('#personalGoalForm button[type="submit"]');
  personalGoalFormActions.append(personalGoalCancelButton,personalGoalSubmitButton);
  $('#personalGoalForm').append(personalGoalFormActions);
  function resetPersonalGoalEditor() {
    editingPersonalGoalId = ''; $('#personalGoalForm').reset(); $('#personalGoalTargetField').hidden = true;
    $('#personalGoalForm button[type="submit"]').innerHTML = '＋ Adicionar meta'; personalGoalCancelButton.hidden = true;
    $('#personalGoalForm').classList.remove('is-editing-goal');
  }
  personalGoalCancelButton.addEventListener('click',() => resetPersonalGoalEditor());
  $('#personalGoalForm').addEventListener('submit', event => {
    event.preventDefault(); if (!canDefinePersonalGoals()) return toast('Somente o Dono pode cadastrar metas.');
    const serverId = String(selectedPersonalMemberId), goals = Array.isArray(personalGoals[serverId]) ? [...personalGoals[serverId]] : [], title = $('#personalGoalTitle').value.trim(), type = $('#personalGoalType').value, targetQuantity = Number($('#personalGoalTarget').value);
    if (!title) return;
    if (type === 'dirty_money' && (!Number.isInteger(targetQuantity) || targetQuantity < 1)) return toast('Informe a quantidade total de Dinheiro sujo para a meta.');
    const now = new Date().toISOString(), existingIndex = goals.findIndex(goal => String(goal.id) === String(editingPersonalGoalId));
    if (existingIndex >= 0) {
      const oldGoal = goals[existingIndex];
      goals[existingIndex] = {...oldGoal,type,title,description:$('#personalGoalDescription').value.trim(),dueDate:$('#personalGoalDueDate').value,targetQuantity:type === 'dirty_money' ? targetQuantity : null,createdAt:type === 'dirty_money' && oldGoal.type !== 'dirty_money' ? now : oldGoal.createdAt || now};
    } else goals.unshift({id:`goal-${Date.now()}`,type,title,description:$('#personalGoalDescription').value.trim(),dueDate:$('#personalGoalDueDate').value,targetQuantity:type === 'dirty_money' ? targetQuantity : null,status:'pendente',createdAt:now});
    personalGoals[serverId] = goals; saveLocalState('vertice_personal_goals',JSON.stringify(personalGoals)); resetPersonalGoalEditor(); renderPersonalArea(); toast(existingIndex >= 0 ? 'Meta atualizada.' : 'Meta adicionada ao membro.');
  });
  $('#personalGoalList').addEventListener('change', event => {
    const select = event.target.closest('[data-goal-status]'); if (!select) return;
    const serverId = String(selectedPersonalMemberId), goals = Array.isArray(personalGoals[serverId]) ? personalGoals[serverId] : [], goal = goals.find(item => String(item.id) === String(select.dataset.goalStatus)); if (!goal) return;
    goal.status = select.value; saveLocalState('vertice_personal_goals',JSON.stringify(personalGoals)); renderPersonalArea();
  });
  $('#personalGoalList').addEventListener('click', event => {
    const editButton = event.target.closest('[data-edit-goal]'), deleteButton = event.target.closest('[data-delete-goal]');
    if ((!editButton && !deleteButton) || !canDefinePersonalGoals()) return;
    const serverId = String(selectedPersonalMemberId), goals = Array.isArray(personalGoals[serverId]) ? [...personalGoals[serverId]] : [];
    if (editButton) {
      const goal = goals.find(item => String(item.id) === String(editButton.dataset.editGoal)); if (!goal) return;
      editingPersonalGoalId = String(goal.id); $('#personalGoalType').value = goal.type === 'dirty_money' ? 'dirty_money' : 'manual';
      $('#personalGoalTitle').value = goal.title || ''; $('#personalGoalDescription').value = goal.description || ''; $('#personalGoalDueDate').value = goal.dueDate || ''; $('#personalGoalTarget').value = goal.targetQuantity || '';
      $('#personalGoalTargetField').hidden = goal.type !== 'dirty_money'; $('#personalGoalForm button[type="submit"]').innerHTML = 'Salvar alterações'; personalGoalCancelButton.hidden = false; $('#personalGoalForm').classList.add('is-editing-goal'); $('#personalGoalTitle').focus(); $('#personalGoalForm').scrollIntoView({behavior:'smooth',block:'center'}); return;
    }
    personalGoals[serverId] = goals.filter(goal => String(goal.id) !== String(deleteButton.dataset.deleteGoal)); if (!personalGoals[serverId].length) delete personalGoals[serverId];
    if (String(editingPersonalGoalId) === String(deleteButton.dataset.deleteGoal)) resetPersonalGoalEditor();
    saveLocalState('vertice_personal_goals',JSON.stringify(personalGoals)); renderPersonalArea(); toast('Meta removida.');
  });
  $('#personalMessageForm').addEventListener('submit', event => {
    event.preventDefault(); const activeMember = getStorageMember(), serverId = String(selectedPersonalMemberId), text = $('#personalMessageInput').value.trim(); if (!activeMember || !text) return;
    const messages = Array.isArray(personalMessages[serverId]) ? [...personalMessages[serverId]] : [];
    messages.push({id:`message-${Date.now()}-${Math.random().toString(36).slice(2,6)}`,senderName:activeMember.name,senderServerId:String(activeMember.server_id),text,createdAt:new Date().toISOString()});
    personalMessages[serverId] = messages.slice(-300); saveLocalState('vertice_personal_messages',JSON.stringify(personalMessages)); $('#personalMessageInput').value = ''; renderPersonalArea(); $('#personalMessageInput').focus();
  });
  function openPersonalTabEditor(tab = null) {
    if (!canManagePersonalAreas()) return toast('Somente Dono e Gerente podem editar as abas pessoais.');
    const person = employees.find(member => String(member.server_id) === String(selectedPersonalMemberId)); if (!person) return;
    editingPersonalTab = Boolean(tab);
    $('#personalTabModalTitle').textContent = editingPersonalTab ? 'Editar aba pessoal' : 'Nova aba pessoal';
    $('#personalTabModalMember').textContent = `Área de ${person.name} · ID ${person.server_id}`;
    $('#personalTabMemberId').value = String(person.server_id); $('#personalTabId').value = tab?.id || '';
    $('#personalTabTitle').value = tab?.title || ''; $('#personalTabText').value = tab?.content || '';
    $('#personalTabBackdrop').classList.add('open'); $('#personalTabTitle').focus();
  }
  const closePersonalTabEditor = () => $('#personalTabBackdrop').classList.remove('open');
  $('#editPersonalTab').addEventListener('click', () => { const tab = (personalAreaTabs[selectedPersonalMemberId] || []).find(item => String(item.id) === String(selectedPersonalTabId)); if (tab) openPersonalTabEditor(tab); });
  $('#deletePersonalTab').addEventListener('click', () => {
    if (!canManagePersonalAreas()) return toast('Somente Dono e Gerente podem remover abas pessoais.');
    const serverId = String(selectedPersonalMemberId), tabs = Array.isArray(personalAreaTabs[serverId]) ? personalAreaTabs[serverId] : [];
    personalAreaTabs[serverId] = tabs.filter(tab => String(tab.id) !== String(selectedPersonalTabId)); if (!personalAreaTabs[serverId].length) delete personalAreaTabs[serverId];
    saveLocalState('vertice_personal_area_tabs',JSON.stringify(personalAreaTabs)); selectedPersonalTabId = 'profile'; renderPersonalArea(); toast('Aba removida da área pessoal.');
  });
  $('#closePersonalTab').addEventListener('click', closePersonalTabEditor);
  $('#cancelPersonalTab').addEventListener('click', closePersonalTabEditor);
  $('#personalTabBackdrop').addEventListener('click', event => { if (event.target.id === 'personalTabBackdrop') closePersonalTabEditor(); });
  $('#personalTabForm').addEventListener('submit', event => {
    event.preventDefault(); if (!canManagePersonalAreas()) return toast('Somente Dono e Gerente podem editar as abas pessoais.');
    const serverId = String($('#personalTabMemberId').value), title = $('#personalTabTitle').value.trim(), content = $('#personalTabText').value.trim(), tabId = $('#personalTabId').value || `personal-tab-${Date.now()}`;
    const tabs = Array.isArray(personalAreaTabs[serverId]) ? [...personalAreaTabs[serverId]] : [];
    if (tabs.some(tab => String(tab.id) !== String(tabId) && normalizeSearchText(tab.title) === normalizeSearchText(title))) return toast('Já existe uma aba com esse nome para este membro.');
    const updated = {id:tabId,title,content}; const existingIndex = tabs.findIndex(tab => String(tab.id) === String(tabId));
    if (existingIndex >= 0) tabs[existingIndex] = updated; else tabs.push(updated);
    personalAreaTabs[serverId] = tabs; saveLocalState('vertice_personal_area_tabs',JSON.stringify(personalAreaTabs));
    selectedPersonalMemberId = serverId; selectedPersonalTabId = tabId; closePersonalTabEditor(); renderPersonalArea(); toast(editingPersonalTab ? 'Aba pessoal atualizada.' : 'Aba pessoal criada.');
  });
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
    if (getStorageMember() || getSavedProfileIds().length) { renderSavedProfiles(); $('#savedProfilesBackdrop').classList.add('open'); }
    else { requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Entre para acessar as áreas liberadas para sua conta.'; showView('login'); $('#loginScreenName').focus(); }
  });
  $('#closeSavedProfiles').addEventListener('click', () => $('#savedProfilesBackdrop').classList.remove('open'));
  $('#savedProfilesBackdrop').addEventListener('click', event => { if (event.target.id === 'savedProfilesBackdrop') $('#savedProfilesBackdrop').classList.remove('open'); });
  $('#addSavedProfile').addEventListener('click', () => {
    requestedProtectedView = 'switchProfile';
    $('#savedProfilesBackdrop').classList.remove('open');
    $('#memberLoginCopy').textContent = 'Entre uma vez para adicionar este perfil à lista deste dispositivo.';
    $('#memberLoginForm').reset();
    $('#memberLoginRememberProfile').checked = true;
    $('#memberLoginBackdrop').classList.add('open');
    $('#memberLoginName').focus();
  });
  $('#logoutCurrentProfile').addEventListener('click', () => {
    sessionStorage.removeItem(storageSessionKey); $('#savedProfilesBackdrop').classList.remove('open'); syncOwnerNavigation();
    requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Entre para acessar as áreas liberadas para sua conta.'; showView('login'); toast('Perfil encerrado.');
  });
  $('#savedProfilesList').addEventListener('click', event => {
    const switchButton = event.target.closest('[data-switch-profile]');
    const forgetButton = event.target.closest('[data-forget-profile]');
    if (forgetButton) { forgetProfileId(forgetButton.dataset.forgetProfile); renderSavedProfiles(); syncOwnerNavigation(); return; }
    if (!switchButton) return;
    const member = employees.find(item => String(item.server_id) === switchButton.dataset.switchProfile && item.status !== 'inactive');
    if (!member) { forgetProfileId(switchButton.dataset.switchProfile); renderSavedProfiles(); return; }
    sessionStorage.setItem(storageSessionKey,String(member.server_id));
    sessionStorage.setItem(idleActivityKey,String(Date.now()));
    $('#savedProfilesBackdrop').classList.remove('open'); syncOwnerNavigation();
    const destination = memberLandingView(member) || 'pessoal';
    showView(destination); toast(`Perfil alterado para ${member.name}.`);
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
    $('#memberLoginRememberProfile').checked = $('#loginScreenRememberProfile').checked;
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
      if (!member) { $('#loginNotice').textContent = 'Este perfil está inativo. Peça a um Gerente ou Dono para reativá-lo antes de entrar.'; return toast('Acesso bloqueado: o perfil está inativo.'); }
      if (requestedProtectedView === 'owner' && String(member.role).toLocaleLowerCase('pt-BR') !== 'dono') return toast('A Gestão do site é exclusiva do cargo Dono.');
      if (requestedProtectedView === 'equipe' && hasDonoAccount() && !['dono','gerente'].includes(String(member.role).trim().toLocaleLowerCase('pt-BR'))) return toast('Somente Gerentes e Donos podem reativar membros.');
      if (['bau','encomendas','clientes'].includes(requestedProtectedView) && !hasMemberPermission(member,requestedProtectedView)) return toast('Seu acesso não está liberado para esta área.');
      let destination = requestedProtectedView;
      if (destination === 'login' || destination === 'switchProfile') {
        destination = memberLandingView(member);
        if (!destination) { $('#loginNotice').textContent = 'Sua conta ainda não tem uma área liberada. Peça ao Dono para configurar suas permissões.'; return; }
      }
      sessionStorage.setItem(storageSessionKey,String(member.server_id)); sessionStorage.setItem(idleActivityKey,String(Date.now()));
      if ($('#memberLoginRememberProfile').checked) saveProfileId(member.server_id); else forgetProfileId(member.server_id);
      $('#memberLoginBackdrop').classList.remove('open'); $('#memberLoginForm').reset(); $('#loginScreenForm').reset(); $('#memberLoginCopy').textContent = 'Use o login e a senha vinculados ao seu cadastro de membro.'; syncOwnerNavigation(); showView(destination); toast(`Olá, ${member.name}.`);
    } catch (error) { toast(error.message || 'Não foi possível validar o login.'); }
  });
  $('#storageSessionButton').addEventListener('click', () => {
    if (getStorageMember()) { sessionStorage.removeItem(storageSessionKey); renderStorage(); syncOwnerNavigation(); requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Entre para acessar as áreas liberadas para sua conta.'; showView('login'); toast('Sessão encerrada.'); }
    else { requestMemberLogin('bau'); }
  });
  $('#ownerLogoutButton').addEventListener('click', () => { sessionStorage.removeItem(storageSessionKey); syncOwnerNavigation(); requestedProtectedView = 'login'; $('#loginNotice').textContent = 'Entre para acessar as áreas liberadas para sua conta.'; showView('login'); toast('Sessão do Dono encerrada.'); });
  function renderStorageCatalog() {
    const canCreateItems = canMemberDo('bau.createItems'), canManageItems = canMemberDo('bau.manageItems');
    const query = normalizeSearchText($('#storageCatalogSearch').value);
    const catalogMatches = storageCatalog.map(item => ({item,score:fuzzySearchScore(item.name,query)})).filter(result => result.score !== null).sort((a,b) => a.score-b.score || a.item.name.localeCompare(b.item.name,'pt-BR'));
    const visibleCatalog = catalogMatches.map(result => result.item), hasExactCatalogMatch = visibleCatalog.some(item => normalizeSearchText(item.name).includes(query));
    $('#storageCatalogCount').textContent = `${visibleCatalog.length} de ${storageCatalog.length} itens${query && visibleCatalog.length && !hasExactCatalogMatch ? ' · resultados próximos' : ''}`;
    $('#storageItemForm').hidden = !canCreateItems;
    $('#storageCatalogRows').innerHTML = visibleCatalog.map(item => { const image = storageItemImage(item.name); return `<tr><td class="storage-item-name-cell">${image ? `<img class="storage-item-thumb ${storageItemRarityClass(item.name)}" src="${image}" alt="" loading="lazy">` : ''}<span>${safe(item.name)}</span></td><td>${safe(item.location || 'QG')}</td><td>${canManageItems ? `<div class="storage-catalog-actions"><button type="button" class="employee-access" data-storage-item-edit="${safe(item.id)}" title="Editar ${safe(item.name)}">Editar</button><button type="button" class="employee-delete" data-storage-item-delete="${safe(item.id)}" title="Excluir item" aria-label="Excluir ${safe(item.name)}">×</button></div>` : ''}</td></tr>`; }).join('');
    $('#storageCatalogEmpty').hidden = storageCatalog.length > 0;
    $('#storageCatalogSearchEmpty').hidden = storageCatalog.length === 0 || !query || visibleCatalog.length > 0;
    document.querySelectorAll('[data-storage-item-edit]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('bau.manageItems')) return toast('O Dono não liberou a gestão de itens para este membro.');
      const item = storageCatalog.find(entry => String(entry.id) === String(button.dataset.storageItemEdit)); if (!item) return;
      $('#storageEditItemId').value = String(item.id); $('#storageEditItemName').value = item.name; $('#storageEditItemLocation').value = item.location || 'QG'; $('#storageEditItemBackdrop').classList.add('open'); $('#storageEditItemName').focus();
    }));
    document.querySelectorAll('[data-storage-item-delete]').forEach(button => button.addEventListener('click', () => {
      if (!canMemberDo('bau.manageItems')) return toast('O Dono não liberou a gestão de itens para este membro.');
      const item = storageCatalog.find(entry => String(entry.id) === String(button.dataset.storageItemDelete)); if (!item) return;
      const itemKey = normalizeSearchText(item.name), relatedProductIds = new Set(products.filter(product => normalizeSearchText(product.name) === itemKey).map(product => String(product.id)));
      storageCatalog = storageCatalog.filter(entry => String(entry.id) !== String(item.id));
      storageMovements = storageMovements.filter(move => normalizeSearchText(move.item) !== itemKey);
      products = products.filter(product => normalizeSearchText(product.name) !== itemKey);
      orders = orders.flatMap(order => {
        if (!Array.isArray(order.items)) return normalizeSearchText(order.item) === itemKey || relatedProductIds.has(String(order.productId)) ? [] : [order];
        const keptItems = order.items.filter(line => normalizeSearchText(line.item) !== itemKey && !relatedProductIds.has(String(line.productId)));
        if (keptItems.length === order.items.length) return [order];
        if (!keptItems.length) return [];
        order.items = keptItems; order.item = keptItems.map(line => line.item).join(', '); order.productIds = keptItems.map(line => line.productId); order.productId = keptItems.length === 1 ? keptItems[0].productId : undefined; order.quantity = keptItems.reduce((sum,line) => sum + Number(line.quantity || 0),0); order.value = keptItems.reduce((sum,line) => sum + Number(line.value || Number(line.unitValue || 0) * Number(line.quantity || 0)),0); order.stockMovementIds = (order.stockMovementIds || []).filter(id => storageMovements.some(move => String(move.id) === String(id))); return [order];
      });
      pendingStorageMovements = pendingStorageMovements.filter(move => normalizeSearchText(move.item) !== itemKey && String(move.itemId || '') !== String(item.id));
      saveLocalState('vertice_storage_catalog',JSON.stringify(storageCatalog)); saveLocalState('vertice_storage_movements',JSON.stringify(storageMovements)); saveLocalState('vertice_products',JSON.stringify(products)); saveLocalState('vertice_orders',JSON.stringify(orders));
      renderStorageCatalog(); renderStorage(); renderProducts(); renderOrders(); renderStorageBatch(); toast(`“${item.name}” e os registros vinculados foram removidos das listas.`);
    }));
  }
  const closeStorageEditItem = () => $('#storageEditItemBackdrop').classList.remove('open');
  $('#closeStorageEditItem').addEventListener('click', closeStorageEditItem);
  $('#cancelStorageEditItem').addEventListener('click', closeStorageEditItem);
  $('#storageEditItemBackdrop').addEventListener('click', event => { if (event.target.id === 'storageEditItemBackdrop') closeStorageEditItem(); });
  $('#storageEditItemForm').addEventListener('submit', event => {
    event.preventDefault(); if (!canMemberDo('bau.manageItems')) return toast('O Dono não liberou a gestão de itens para este membro.');
    const item = storageCatalog.find(entry => String(entry.id) === String($('#storageEditItemId').value)); if (!item) return closeStorageEditItem();
    const oldName = item.name, oldKey = normalizeSearchText(oldName), name = $('#storageEditItemName').value.trim(), key = normalizeSearchText(name), location = $('#storageEditItemLocation').value;
    if (!name) return toast('Informe o nome do item.');
    if (storageCatalog.some(entry => String(entry.id) !== String(item.id) && normalizeSearchText(entry.name) === key)) return toast('Já existe um item cadastrado com esse nome.');
    const relatedProductIds = new Set(products.filter(product => normalizeSearchText(product.name) === oldKey).map(product => String(product.id)));
    item.name = name; item.location = location;
    storageMovements.forEach(move => { if (normalizeSearchText(move.item) === oldKey) move.item = name; });
    pendingStorageMovements.forEach(move => { if (normalizeSearchText(move.item) === oldKey || String(move.itemId || '') === String(item.id)) { move.item = name; move.itemId = String(item.id); } });
    products.forEach(product => { if (normalizeSearchText(product.name) === oldKey) product.name = name; });
    orders.forEach(order => { if (normalizeSearchText(order.item) === oldKey || relatedProductIds.has(String(order.productId))) order.item = name; (order.items || []).forEach(line => { if (normalizeSearchText(line.item) === oldKey || relatedProductIds.has(String(line.productId))) line.item = name; }); if (order.items?.length) order.item = order.items.map(line => line.item).join(', '); });
    saveLocalState('vertice_storage_catalog',JSON.stringify(storageCatalog)); saveLocalState('vertice_storage_movements',JSON.stringify(storageMovements)); saveLocalState('vertice_products',JSON.stringify(products)); saveLocalState('vertice_orders',JSON.stringify(orders));
    closeStorageEditItem(); renderStorageCatalog(); renderStorage(); renderProducts(); renderOrders(); renderStorageBatch(); toast(`“${oldName}” atualizado em todas as listas vinculadas.`);
  });
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
    updateStorageMovementAction();
    $('#storageMovementBackdrop').classList.add('open');
    $('#storageQuantity').focus();
  }
  function updateStorageMovementAction() {
    const isTransfer = $('#storageType').value === 'transfer', source = $('#storageLocation').value, destination = source === 'Casa' ? 'QG' : 'Casa';
    $('#storageLocationCaption').textContent = isTransfer ? 'Origem' : 'Local';
    $('#storageTransferDestination').hidden = !isTransfer;
    $('#storageTransferDestination').textContent = isTransfer ? `Destino da transferência: ${destination}` : '';
  }
  function closeStorageMovement() { $('#storageMovementBackdrop').classList.remove('open'); $('#storageMovementForm').reset(); $('#storageQuantity').value = '1'; updateStorageMovementAction(); }
  $('#storageType').addEventListener('change', updateStorageMovementAction);
  $('#storageLocation').addEventListener('change', updateStorageMovementAction);
  $('#closeStorageMovement').addEventListener('click', closeStorageMovement);
  $('#cancelStorageMovement').addEventListener('click', closeStorageMovement);
  $('#storageMovementBackdrop').addEventListener('click', event => { if (event.target.id === 'storageMovementBackdrop') closeStorageMovement(); });
  $('#storageItemCards').addEventListener('click', event => { const card = event.target.closest('[data-storage-card]'); if (card) openStorageMovement(card.dataset.storageCard); });
  $('#storageSearch').addEventListener('input', () => renderStorage());
  $('#storageHistorySearch').addEventListener('input', () => renderStorage());
  $('#storageHistoryTypeFilter').addEventListener('change', () => renderStorage());
  $('#storageHistoryDateFilter').addEventListener('change', () => renderStorage());
  $('#storageCatalogSearch').addEventListener('input', renderStorageCatalog);
  $('#storageInventorySearch').addEventListener('input', () => renderStorage());
  function zeroStorageLocation(location) {
    if (!isCurrentOwner()) return toast('Somente o Dono pode zerar o estoque.');
    if (pendingStorageMovements.length) return toast('Confirme ou limpe as movimentações selecionadas antes de zerar o estoque.');
    const accepted = window.confirm(`Tem certeza de que deseja zerar o estoque da ${location}?\n\nTodas as quantidades desse local serão registradas como retiradas no histórico. Os produtos ficarão sem saldo disponível para encomendas até que novas entradas sejam registradas.`);
    if (!accepted) return;
    const owner = getStorageMember();
    const withdrawals = storageCatalog.map(item => ({item,quantity:getStorageItemBalances(item.name)[location]})).filter(entry => entry.quantity > 0);
    if (!withdrawals.length) return toast(`O estoque da ${location} já está zerado.`);
    const now = Date.now();
    const resetMoves = withdrawals.map(({item,quantity},index) => ({id:`storage-zero-${location.toLocaleLowerCase('pt-BR')}-${now}-${index}`,type:'withdrawal',itemId:String(item.id),item:item.name,location,quantity,responsible:owner.name,memberServerId:owner.server_id,note:`Zeragem do estoque da ${location} pelo Dono`,createdAt:new Date(now+index).toISOString()}));
    storageMovements = [...resetMoves,...storageMovements];
    saveLocalState('vertice_storage_movements',JSON.stringify(storageMovements));
    renderStorageCatalog(); renderStorage(); renderProducts(); renderOrders(); renderPersonalArea();
    toast(`Estoque da ${location} zerado. ${resetMoves.length} ${resetMoves.length === 1 ? 'item foi registrado' : 'itens foram registrados'} no histórico.`);
  }
  $('#zeroHouseStock').addEventListener('click', () => zeroStorageLocation('Casa'));
  $('#zeroQGStock').addEventListener('click', () => zeroStorageLocation('QG'));
  function normalizeSearchText(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR').replace(/[^\p{L}\p{N}\s-]/gu,' ').replace(/\s+/g,' ').trim(); }
  const storageItemImages = {
    'municao submetralhadora':'assets/item-upload-01.png','municao rifle':'assets/item-municao-rifle.png','hacking':'assets/item-upload-02.png','explosivo c4':'assets/item-upload-03.png','lockpick':'assets/item-upload-04.png','chip ilegal':'assets/item-upload-05.png',
    'attachs m4':'assets/item-upload-06.png','attachs sig sauer':'assets/item-upload-07.png','attachs uzi':'assets/item-upload-08.png','attachs tec9':'assets/item-upload-09.png','attachs five':'assets/item-upload-10.png','attachs g36c mk2':'assets/item-attachs-g36c-mk2.png','colete':'assets/item-colete.png','attachs m16':'assets/item-upload-13.png','attachs ap pistol':'assets/item-upload-14.png',
    'g36c mk2':'assets/item-upload-15.png','mtar-21':'assets/item-upload-16.png','micro uzi':'assets/item-upload-17.png','mp5':'assets/item-upload-18.png','five seven':'assets/item-upload-19.png','algemas':'assets/item-upload-20.png','adrenalina':'assets/item-upload-21.png','polvora':'assets/item-upload-22.png',
    'dinheiro sujo':'assets/item-dinheiro-sujo.png','glock 19':'assets/item-glock-19.png','barra macica':'assets/item-barra-macica.png','esmerilhadeira':'assets/item-esmerilhadeira.png','latao':'assets/item-latao.png'
  };
  function storageItemImage(name) { const normalized = normalizeSearchText(name); if (storageItemImages[normalized]) return storageItemImages[normalized]; if (/\b(cocaina|cocaine)\b/.test(normalized)) return 'assets/item-cocaina.png'; if (/\b(metanfetamina|metanfet|meth)\b/.test(normalized)) return 'assets/item-metanfetamina.png'; if (/\b(maconha|cannabis|weed)\b/.test(normalized)) return 'assets/item-maconha.png'; return ''; }
  function storageItemRarityClass(name) { const normalized = String(name || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-BR'); if (/\(\s*lendaria\s*\)/.test(normalized)) return 'item-rarity-legendary'; if (/\(\s*raro\s*\)/.test(normalized)) return 'item-rarity-rare'; return ''; }
  function editDistance(a,b) {
    let previous = Array.from({length:b.length+1},(_,index)=>index);
    for (let i=1;i<=a.length;i++) { const current=[i]; for (let j=1;j<=b.length;j++) current[j]=Math.min(current[j-1]+1,previous[j]+1,previous[j-1]+(a[i-1]===b[j-1]?0:1)); previous=current; }
    return previous[b.length];
  }
  function fuzzySearchScore(name,query) {
    if (!query) return 0;
    const normalizedName=normalizeSearchText(name), nameWords=normalizedName.split(/[\s-]+/).filter(Boolean), queryWords=query.split(' ').filter(Boolean); let total=0;
    for (const term of queryWords) {
      let best=Infinity;
      for (const word of nameWords) {
        if (word.includes(term) || term.includes(word)) { best=Math.min(best,0); continue; }
        const distance=editDistance(term,word), allowed=term.length<=3?1:Math.max(1,Math.ceil(term.length*.3));
        if (distance<=allowed) best=Math.min(best,distance/Math.max(term.length,word.length));
      }
      if (!Number.isFinite(best)) return null;
      total+=best;
    }
    return total/queryWords.length;
  }
  function storageMovementTransferRoute(move) {
    if (!move?.transferId) return '';
    if (move.transferRoute) return move.transferRoute;
    const transfer = storageMovements.filter(entry => String(entry.transferId) === String(move.transferId));
    const origin = transfer.find(entry => entry.type === 'withdrawal'), destination = transfer.find(entry => entry.type === 'entry');
    return origin && destination ? `${origin.location || 'QG'} → ${destination.location || 'QG'}` : '';
  }
  function collapseStorageTransferRecords(movements, universe = storageMovements) {
    const seen = new Set(), result = [];
    movements.forEach(move => {
      if (!move.transferId) { result.push(move); return; }
      const id = String(move.transferId); if (seen.has(id)) return; seen.add(id);
      const pair = universe.filter(entry => String(entry.transferId || '') === id), origin = pair.find(entry => entry.type === 'withdrawal'), destination = pair.find(entry => entry.type === 'entry');
      const route = move.transferRoute || (origin && destination ? `${origin.location || 'QG'} → ${destination.location || 'QG'}` : '');
      const earliest = pair.map(entry => entry.createdAt).filter(Boolean).sort((a,b) => new Date(a)-new Date(b))[0] || move.createdAt;
      result.push({...move,type:'transfer',transferRoute:route,location:route || move.location,quantity:Number(origin?.quantity ?? destination?.quantity ?? move.quantity),note:route ? `Transferência da ${route.replace(' → ',' para ')}` : move.note,createdAt:earliest});
    });
    return result;
  }
  function mergePendingTransfersByItemAndRoute() {
    const groups = new Map(), ordered = [], seenIds = new Set();
    pendingStorageMovements.forEach(move => {
      if (!move.transferId) { ordered.push(move); return; }
      const transferId = String(move.transferId); if (seenIds.has(transferId)) return; seenIds.add(transferId);
      const pair = pendingStorageMovements.filter(entry => String(entry.transferId || '') === transferId), origin = pair.find(entry => entry.type === 'withdrawal'), destination = pair.find(entry => entry.type === 'entry');
      if (!origin || !destination) { ordered.push(move); return; }
      const route = origin.transferRoute || destination.transferRoute || `${origin.location || 'QG'} → ${destination.location || 'QG'}`;
      const key = `${String(origin.itemId || normalizeSearchText(origin.item))}|${normalizeSearchText(origin.location)}|${normalizeSearchText(destination.location)}`;
      let group = groups.get(key);
      if (group) group.quantity += Math.max(0,Number(origin.quantity) || 0);
      else { group = {transferId,route,origin:{...origin},destination:{...destination},quantity:Math.max(0,Number(origin.quantity) || 0)}; groups.set(key,group); ordered.push(group); }
    });
    pendingStorageMovements = ordered.flatMap(entry => {
      if (!entry || !entry.origin || !entry.destination) return [entry];
      const quantity = entry.quantity, transferId = entry.transferId;
      return [{...entry.origin,id:`${transferId}-out`,transferId,transferRoute:entry.route,quantity},{...entry.destination,id:`${transferId}-in`,transferId,transferRoute:entry.route,quantity}];
    });
  }
  function renderStorage() {
    renderStorageBatch();
    const activeMember = getStorageMember();
    $('#storageOwnerStockActions').hidden = !isCurrentOwner();
    $('#storageSessionButton').textContent = activeMember ? `Conectado: ${activeMember.name} · Sair` : 'Entrar como membro';
    const canMoveItems = canMemberDo('bau.move');
    const balances = new Map();
    storageMovements.forEach(move => { const key = move.item.trim().toLocaleLowerCase('pt-BR'); const location = move.location === 'Casa' ? 'Casa' : 'QG'; const row = balances.get(key) || { name: move.item, QG: 0, Casa: 0, latest: move.createdAt }; row[location] += move.type === 'entry' ? Number(move.quantity) : -Number(move.quantity); if (!row.latest || new Date(move.createdAt) > new Date(row.latest)) row.latest = move.createdAt; balances.set(key, row); });
    const inventory = [...balances.values()].map(row => ({...row, quantity:row.QG + row.Casa})).filter(row => row.quantity > 0).sort((a,b) => a.name.localeCompare(b.name,'pt-BR'));
    const stockByName = new Map([...balances.entries()]);
    const query = normalizeSearchText($('#storageSearch').value);
    const visibleItems = storageCatalog.map(item => ({item,score:fuzzySearchScore(item.name,query)})).filter(result => result.score !== null).sort((a,b) => a.score-b.score || a.item.name.localeCompare(b.item.name,'pt-BR')).map(result => result.item);
    const hasExactMatch = visibleItems.some(item => normalizeSearchText(item.name).includes(query));
    $('#storageSearchCount').textContent = `${visibleItems.length} ${visibleItems.length === 1 ? 'item' : 'itens'}${query && !hasExactMatch && visibleItems.length ? ' próximos' : ''}`;
    $('#storageSearchEmpty b').textContent = 'Nenhum item parecido encontrado';
    $('#storageSearchEmpty small').textContent = 'Tente digitar menos letras ou conferir o nome do item.';
    $('#storageItemCards').innerHTML = visibleItems.map(item => { const balance = stockByName.get(item.name.toLocaleLowerCase('pt-BR')) || {QG:0,Casa:0}; const tag = canMoveItems ? 'button' : 'div'; const attrs = canMoveItems ? `type="button" data-storage-card="${safe(item.id)}" aria-label="Movimentar ${safe(item.name)}"` : `aria-label="${safe(item.name)}"`; const action = canMoveItems ? '<span class="storage-card-action" aria-hidden="true">＋</span>' : ''; const image = storageItemImage(item.name); const art = image ? `<img class="storage-item-photo ${storageItemRarityClass(item.name)}" src="${image}" alt="${safe(item.name)}" loading="lazy">` : '<span class="storage-item-generic-icon" aria-hidden="true">📦</span>'; return `<${tag} class="storage-item-card ${image ? 'storage-item-card-illustrated' : ''} ${canMoveItems ? '' : 'storage-item-card-static'}" ${attrs}><span class="storage-item-art" aria-hidden="true">${art}</span><span class="storage-item-card-copy"><b>${safe(item.name)}</b><small class="storage-card-stock"><span>QG: ${Number(balance.QG).toLocaleString('pt-BR')}</span><span>Casa: ${Number(balance.Casa).toLocaleString('pt-BR')}</span></small></span>${action}</${tag}>`; }).join('');
    $('#storageCardsEmpty').hidden = storageCatalog.length > 0;
    $('#storageSearchEmpty').hidden = storageCatalog.length === 0 || visibleItems.length > 0;
    $('#storageItemCount').textContent = inventory.length;
    $('#storageUnitCount').textContent = inventory.reduce((sum,row) => sum + row.quantity, 0).toLocaleString('pt-BR');
    $('#storageMovementCount').textContent = storageMovements.length.toLocaleString('pt-BR');
    const inventoryQuery = normalizeSearchText($('#storageInventorySearch').value);
    const visibleInventory = inventory.map(row => ({row,score:fuzzySearchScore(row.name,inventoryQuery)})).filter(result => result.score !== null).sort((a,b) => a.score-b.score || a.row.name.localeCompare(b.row.name,'pt-BR')).map(result => result.row);
    const hasExactInventoryMatch = visibleInventory.some(row => normalizeSearchText(row.name).includes(inventoryQuery));
    $('#storageInventoryCount').textContent = `${visibleInventory.length} de ${inventory.length} itens${inventoryQuery && visibleInventory.length && !hasExactInventoryMatch ? ' · resultados próximos' : ''}`;
    $('#storageInventoryRows').innerHTML = visibleInventory.map(row => { const image = storageItemImage(row.name); return `<tr><td class="storage-item-name-cell">${image ? `<img class="storage-item-thumb ${storageItemRarityClass(row.name)}" src="${image}" alt="" loading="lazy">` : ''}<span>${safe(row.name)}</span></td><td><b>${Math.max(0,row.QG).toLocaleString('pt-BR')}</b></td><td><b>${Math.max(0,row.Casa).toLocaleString('pt-BR')}</b></td><td><b>${row.quantity.toLocaleString('pt-BR')}</b></td><td>${new Date(row.latest).toLocaleString('pt-BR')}</td></tr>`; }).join('');
    $('#storageInventoryEmpty').hidden = inventory.length > 0;
    $('#storageInventorySearchEmpty').hidden = inventory.length === 0 || !inventoryQuery || visibleInventory.length > 0;
    const historyQuery = normalizeSearchText($('#storageHistorySearch').value), historyType = $('#storageHistoryTypeFilter').value, historyDate = $('#storageHistoryDateFilter').value;
    const localHistoryDate = move => { const date = new Date(move.createdAt); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; };
    const movementSearchText = move => [move.item,move.location,move.transferRoute,storageMovementTransferRoute(move),move.responsible,move.note,move.createdAt ? new Date(move.createdAt).toLocaleDateString('pt-BR') : ''].map(value => String(value || '')).join(' ');
    const matchingMovements = storageMovements.map(move => ({move,score:fuzzySearchScore(movementSearchText(move),historyQuery)})).filter(result => result.score !== null && (!historyType || result.move.type === historyType || result.move.transferId && ['entry','withdrawal'].includes(historyType)) && (!historyDate || localHistoryDate(result.move) === historyDate)).sort((a,b) => (historyQuery ? a.score-b.score : 0) || new Date(b.move.createdAt)-new Date(a.move.createdAt)).map(result => result.move);
    const filteredMovements = collapseStorageTransferRecords(matchingMovements);
    const hasApproximateMovements = Boolean(historyQuery && filteredMovements.length && !filteredMovements.some(move => normalizeSearchText(movementSearchText(move)).includes(historyQuery)));
    const totalHistoryRecords = collapseStorageTransferRecords(storageMovements).length;
    $('#storageHistoryCaption').textContent = `${filteredMovements.length} de ${totalHistoryRecords} movimentações${hasApproximateMovements ? ' · resultados aproximados' : ''}`;
    $('#storageHistoryRows').innerHTML = filteredMovements.map(move => { const image=storageItemImage(move.item), route=storageMovementTransferRoute(move), [origin,destination]=route.split(' → '); return `<tr><td>${new Date(move.createdAt).toLocaleString('pt-BR')}</td><td><span class="storage-movement ${move.transferId ? 'transfer' : move.type}">${move.transferId ? `Transferência · ${safe(route || 'rota não informada')}` : move.type === 'entry' ? 'Entrada' : 'Retirada'}</span></td><td class="storage-item-name-cell">${image ? `<img class="storage-item-thumb ${storageItemRarityClass(move.item)}" src="${image}" alt="" loading="lazy">` : ''}<span>${safe(move.item)}</span></td><td>${safe(move.transferId ? route || move.location || 'QG' : move.location || 'QG')}</td><td>${Number(move.quantity).toLocaleString('pt-BR')}</td><td>${safe(move.responsible || '—')}${move.memberServerId ? `<small class="storage-member-id">ID ${safe(move.memberServerId)}</small>` : ''}</td><td>${safe(move.transferId ? `Transferência da ${origin || 'origem'} para ${destination || 'destino'}` : move.note || '—')}</td></tr>`; }).join('');
    $('#storageHistoryEmpty').hidden = filteredMovements.length > 0;
    if (totalHistoryRecords && !filteredMovements.length) { $('#storageHistoryEmpty b').textContent = 'Nenhuma movimentação encontrada'; $('#storageHistoryEmpty small').textContent = 'Ajuste a busca, o tipo ou a data.'; } else { $('#storageHistoryEmpty b').textContent = 'Sem movimentações registradas'; $('#storageHistoryEmpty small').textContent = 'O histórico aparecerá aqui depois da primeira operação.'; }
  }
  function renderStorageBatch() {
    const panel = $('#storageBatchPanel'); if (!panel) return;
    mergePendingTransfersByItemAndRoute();
    panel.hidden = pendingStorageMovements.length === 0;
    const visibleMoves = collapseStorageTransferRecords(pendingStorageMovements,pendingStorageMovements);
    $('#storageBatchCount').textContent = `${visibleMoves.length} ${visibleMoves.length === 1 ? 'movimentação selecionada' : 'movimentações selecionadas'}`;
    $('#storageBatchList').innerHTML = visibleMoves.map(move => { const index = move.transferId ? pendingStorageMovements.findIndex(entry => entry.transferId === move.transferId) : pendingStorageMovements.indexOf(move); const origin = pendingStorageMovements.find(entry => entry.transferId && entry.transferId === move.transferId && entry.type === 'withdrawal'); const route = move.transferRoute || storageMovementTransferRoute(move); return `<div class="storage-batch-row"><span class="storage-movement ${move.transferId ? 'transfer' : move.type}">${move.transferId ? `Transferência · ${safe(route)}` : move.type === 'entry' ? 'Adicionar' : 'Remover'}</span><b>${safe(move.item)}</b><span>${safe(move.transferId ? route : move.location)}</span><strong>${Number(origin?.quantity ?? move.quantity).toLocaleString('pt-BR')} un.</strong><button type="button" class="storage-batch-remove" data-storage-batch-remove="${index}" aria-label="Remover ${safe(move.item)} da lista">×</button></div>`; }).join('');
    $('#commitStorageBatch').disabled = pendingStorageMovements.length === 0;
  }
  $('#storageBatchList').addEventListener('click', event => { const button = event.target.closest('[data-storage-batch-remove]'); if (!button) return; const move = pendingStorageMovements[Number(button.dataset.storageBatchRemove)]; if (!move) return; if (move.transferId) pendingStorageMovements = pendingStorageMovements.filter(item => item.transferId !== move.transferId); else pendingStorageMovements.splice(Number(button.dataset.storageBatchRemove),1); renderStorageBatch(); renderStorage(); });
  $('#clearStorageBatch').addEventListener('click', () => { pendingStorageMovements = []; renderStorageBatch(); renderStorage(); });
  $('#commitStorageBatch').addEventListener('click', () => {
    const activeMember = getStorageMember();
    if (!activeMember) { requestMemberLogin('bau'); return; }
    if (!canMemberDo('bau.move')) return toast('O Dono não liberou movimentações do baú para este membro.');
    mergePendingTransfersByItemAndRoute();
    if (!pendingStorageMovements.length) return;
    const balances = new Map(), keyFor = (item,location) => `${String(item).trim().toLocaleLowerCase('pt-BR')}|${location}`;
    storageMovements.forEach(move => { const location = move.location === 'Casa' ? 'Casa' : 'QG', key = keyFor(move.item,location); balances.set(key,(balances.get(key) || 0) + (move.type === 'entry' ? Number(move.quantity) : -Number(move.quantity))); });
    for (const move of pendingStorageMovements) {
      const key = keyFor(move.item,move.location), balance = balances.get(key) || 0;
      if (move.type === 'withdrawal' && Number(move.quantity) > balance) return toast(`Estoque insuficiente de ${move.item} em ${move.location}. Saldo disponível na lista: ${Math.max(0,balance)}.`);
      balances.set(key,balance + (move.type === 'entry' ? Number(move.quantity) : -Number(move.quantity)));
    }
    const now = Date.now();
    const committed = pendingStorageMovements.map((move,index) => ({id:move.id || `storage-move-${now}-${index}`,transferId:move.transferId || '',transferRoute:move.transferRoute || '',type:move.type,item:move.item,location:move.location,quantity:Number(move.quantity),responsible:activeMember.name,memberServerId:activeMember.server_id,note:move.transferId ? move.note : 'Movimentação em lote',createdAt:new Date(now+index).toISOString()}));
    storageMovements = [...committed,...storageMovements]; saveLocalState('vertice_storage_movements',JSON.stringify(storageMovements));
    const count = collapseStorageTransferRecords(committed,committed).length; pendingStorageMovements = []; renderStorageBatch(); renderStorageCatalog(); renderStorage(); renderPersonalArea(); notifyCompletedDirtyMoneyGoals(committed); toast(`${count} ${count === 1 ? 'movimentação registrada' : 'movimentações registradas'} no baú.`);
  });
  $('#storageMovementForm').addEventListener('submit', e => {
    e.preventDefault();
    const activeMember = getStorageMember();
    if (!activeMember) { closeStorageMovement(); requestMemberLogin('bau'); return; }
    if (!canMemberDo('bau.move')) { closeStorageMovement(); return toast('O Dono não liberou movimentações do baú para este membro.'); }
    const type = $('#storageType').value, location = $('#storageLocation').value, catalogItem = storageCatalog.find(entry => String(entry.id) === $('#storageSelectedItem').value), item = catalogItem?.name || '', quantity = Number($('#storageQuantity').value);
    if (!catalogItem) return toast('Selecione um item do catálogo.');
    if (!Number.isInteger(quantity) || quantity < 1) return toast('Informe uma quantidade inteira maior que zero.');
    if (type === 'transfer') {
      const destination = location === 'Casa' ? 'QG' : 'Casa', actualAvailable = getStorageItemBalances(item)[location];
      const reserved = pendingStorageMovements.filter(move => move.item.toLocaleLowerCase('pt-BR') === item.toLocaleLowerCase('pt-BR') && move.location === location && move.type === 'withdrawal').reduce((sum,move) => sum + Number(move.quantity),0);
      const available = Math.max(0,actualAvailable - reserved);
      if (quantity > available) return toast(`Estoque insuficiente de ${item} na ${location}. Disponível para transferir: ${available}.`);
      const transferId = `storage-transfer-${Date.now()}-${Math.random().toString(36).slice(2,9)}`, route = `${location} → ${destination}`, note = `Transferência ${route}`;
      pendingStorageMovements.push(
        {id:`${transferId}-out`,transferId,transferRoute:route,note,type:'withdrawal',itemId:String(catalogItem.id),item,location,quantity},
        {id:`${transferId}-in`,transferId,transferRoute:route,note,type:'entry',itemId:String(catalogItem.id),item,location:destination,quantity}
      );
      closeStorageMovement(); renderStorageBatch(); renderStorage(); return toast(`Transferência ${route} adicionada à lista.`);
    }
    const currentBalance = storageMovements.reduce((sum,move) => move.item.trim().toLocaleLowerCase('pt-BR') === item.toLocaleLowerCase('pt-BR') && (move.location || 'QG') === location ? sum + (move.type === 'entry' ? Number(move.quantity) : -Number(move.quantity)) : sum, 0);
    const queuedBalance = pendingStorageMovements.filter(move => move.item.toLocaleLowerCase('pt-BR') === item.toLocaleLowerCase('pt-BR') && move.location === location).reduce((sum,move) => sum + (move.type === 'entry' ? Number(move.quantity) : -Number(move.quantity)),0), available = currentBalance + queuedBalance;
    if (type === 'withdrawal' && quantity > available) return toast(`Estoque insuficiente de ${item} em ${location}. Saldo disponível: ${Math.max(0,available)}.`);
    pendingStorageMovements.push({type,itemId:String(catalogItem.id),item,location,quantity});
    closeStorageMovement(); renderStorageBatch(); renderStorage(); toast(type === 'entry' ? 'Adição incluída na lista.' : 'Retirada incluída na lista.');
  });  function applySiteSettings() {
    if (String(siteSettings.accent || '').toLowerCase() === '#c8f36a') siteSettings.accent = '#28b8ff';
    document.documentElement.style.setProperty('--green', siteSettings.accent || defaultSiteSettings.accent);
    $('#brandCompanyName').textContent = siteSettings.companyName;
    $('#loginCompanyName').textContent = siteSettings.companyName;
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
      $('#employeeView').hidden = true; $('#ownerView').hidden = true; $('#storageView').hidden = true; $('#ordersView').hidden = true; $('#clientsView').hidden = true; $('#personalView').hidden = true;
      document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
      $('#crumb').textContent = titles.login;
      $('#sidebar').classList.remove('open'); $('.mobile-nav-backdrop')?.classList.remove('show');
      return;
    }
    if (view === 'owner' && hasDonoAccount() && String(getStorageMember()?.role || '').toLocaleLowerCase('pt-BR') !== 'dono') { requestMemberLogin(view); return; }
    if (view === 'equipe' && hasDonoAccount() && !canManageEmployeeStatus()) { requestMemberLogin(view); return; }
    if (view === 'pessoal' && !getStorageMember()) { requestMemberLogin(view); return; }
    if (view === 'pessoal' && !canManagePersonalAreas()) { selectedPersonalMemberId = String(getStorageMember().server_id); }
    if (['bau','encomendas','clientes'].includes(view) && !getStorageMember()) { requestMemberLogin(view); return; }
    if (['bau','encomendas','clientes'].includes(view) && !hasMemberPermission(getStorageMember(),view)) { toast('Seu acesso não está liberado para esta área.'); return; }
    document.body.classList.remove('auth-screen');
    $('#loginView').hidden = true;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
    $('#crumb').textContent = titles[view] || view;
    $('#dashboardView').hidden = !['inicio','financeiro','operacoes','estoque','relatorios','configuracoes'].includes(view);
    $('#employeeView').hidden = view !== 'equipe'; $('#ownerView').hidden = view !== 'owner'; $('#storageView').hidden = view !== 'bau';
    $('#ordersView').hidden = view !== 'encomendas'; $('#clientsView').hidden = view !== 'clientes'; $('#personalView').hidden = view !== 'pessoal';
    if (view === 'equipe') renderEmployees();
    else if (view === 'bau') { renderStorageCatalog(); renderStorage(); }
    else if (view === 'encomendas') { renderProducts(); renderOrders(); }
    else if (view === 'clientes') renderClients();
    else if (view === 'pessoal') renderPersonalArea();
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
    siteCopy = {}; localStorage.removeItem('vertice_site_copy'); window.location.reload();
  });
  function renderEmployees() {
    const ownerAccess = !hasDonoAccount() || String(getStorageMember()?.role || '').toLocaleLowerCase('pt-BR') === 'dono';
    const statusAccess = canManageEmployeeStatus();
    if (!ownerAccess) setRecordModalOpen('memberFormModal',false);
    $('#newEmployee').hidden = !ownerAccess;
    document.querySelector('.role-manager-panel').hidden = !ownerAccess;
    const query = normalizeSearchText($('#employeeSearch').value);
    const selectedRole = $('#employeeRoleFilter').value, selectedStatus = $('#employeeStatusFilter').value;
    $('#employeeRoleFilter').innerHTML = '<option value="">Todos os cargos</option>' + memberRoles.map(role => `<option value="${safe(role)}">${safe(role)}</option>`).join('');
    $('#employeeRoleFilter').value = memberRoles.includes(selectedRole) ? selectedRole : '';
    const employeeSearchText = employee => [employee.name,employee.server_id,employee.role,employee.phone].map(value => String(value || '')).join(' ');
    const filtered = employees.map(employee => ({employee,score:fuzzySearchScore(employeeSearchText(employee),query)})).filter(result => result.score !== null && (!selectedRole || result.employee.role === selectedRole) && (!selectedStatus || (result.employee.status === 'inactive' ? 'inactive' : 'active') === selectedStatus)).sort((a,b) => a.score-b.score || a.employee.name.localeCompare(b.employee.name,'pt-BR')).map(result => result.employee);
    const hasApproximateEmployees = Boolean(query && filtered.length && !filtered.some(employee => normalizeSearchText(employeeSearchText(employee)).includes(query)));
    $('#employeeTotal').textContent = employees.length; $('#employeeActive').textContent = employees.filter(x => x.status === 'active').length;
    $('#employeeRoles').textContent = memberRoles.length;
    $('#employeeListCaption').textContent = `${filtered.length} de ${employees.length} ${employees.length === 1 ? 'membro' : 'membros'}${hasApproximateEmployees ? ' · resultados aproximados' : ''}`;
    $('#employeeRows').innerHTML = filtered.map(x => {
      const initials = String(x.name || '?').split(/\s+/).slice(0,2).map(n => n[0]).join('').toUpperCase();
      const hasAccount = Boolean(memberAccounts[String(x.server_id)]);
      const memberActions = ownerAccess ? `<button class="employee-access" data-edit-member-role="${safe(x.server_id)}">Editar membro</button> <button class="employee-access" data-member-account="${safe(x.server_id)}">${hasAccount ? 'Alterar login' : 'Criar login'}</button> <button class="employee-delete" data-delete-employee="${safe(x.id)}" title="Remover membro" aria-label="Remover ${safe(x.name)}">×</button>` : statusAccess ? `<button class="employee-access" data-toggle-member-status="${safe(x.server_id)}">${x.status === 'inactive' ? 'Reativar' : 'Inativar'}</button>` : '';
      return `<tr><td><span class="employee-person"><i class="avatar avatar-blue">${safe(initials)}</i><b>${safe(x.name)}<small>${safe(x.role)}</small></b></span></td><td>${safe(x.server_id || '—')}</td><td>${safe(x.role || '—')}</td><td>${safe(x.phone || '—')}</td><td><span class="employee-status ${x.status === 'inactive' ? 'inactive' : ''}">${x.status === 'inactive' ? 'Inativo' : 'Ativo'}</span></td><td>${memberActions}</td></tr>`;
    }).join('');
    $('#employeeEmpty').hidden = filtered.length > 0;
    if (employees.length && !filtered.length) { $('#employeeEmpty b').textContent = 'Nenhum membro encontrado'; $('#employeeEmpty small').textContent = 'Ajuste a busca ou os filtros de cargo e status.'; } else { $('#employeeEmpty b').textContent = 'Nenhum membro cadastrado'; $('#employeeEmpty small').textContent = 'Adicione o primeiro membro para começar a organizar sua equipe.'; }
    document.querySelectorAll('[data-delete-employee]').forEach(button => button.addEventListener('click', () => deleteEmployee(button.dataset.deleteEmployee)));
    document.querySelectorAll('[data-member-account]').forEach(button => button.addEventListener('click', () => openMemberAccount(button.dataset.memberAccount)));
    document.querySelectorAll('[data-edit-member-role]').forEach(button => button.addEventListener('click', () => openMemberRoleEditor(button.dataset.editMemberRole)));
    document.querySelectorAll('[data-toggle-member-status]').forEach(button => button.addEventListener('click', () => {
      if (!canManageEmployeeStatus()) return toast('Somente um Gerente ou Dono pode alterar o status do membro.');
      const member = employees.find(item => String(item.server_id) === String(button.dataset.toggleMemberStatus)); if (!member) return;
      if (member.status !== 'inactive' && String(member.role || '').toLocaleLowerCase('pt-BR') === 'dono' && isSoleActiveOwner(member)) return toast('Cadastre outro Dono ativo antes de desativar esta conta.');
      member.status = member.status === 'inactive' ? 'active' : 'inactive'; saveLocalState('vertice_employees',JSON.stringify(employees));
      renderEmployees(); syncOwnerNavigation(); toast(`${member.name} agora está ${member.status === 'active' ? 'ativo' : 'inativo'}.`);
    }));
    renderMemberPermissions();
    renderPersonalArea();
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
  $('#employeeRoleFilter').addEventListener('change', renderEmployees);
  $('#employeeStatusFilter').addEventListener('change', renderEmployees);
  function openMemberRoleEditor(serverId) {
    if (!canManagePermissions()) return toast('Somente o Dono pode editar os dados dos membros.');
    const member = employees.find(item => String(item.server_id) === String(serverId)); if (!member) return;
    $('#employeeRoleEditServerId').value = String(member.server_id);
    $('#employeeRoleEditMember').textContent = `${member.name} · ID ${member.server_id}`;
    const options = [...new Set([...memberRoles, member.role].filter(Boolean))];
    $('#employeeRoleEditSelect').innerHTML = options.map(role => `<option value="${safe(role)}">${safe(role)}</option>`).join('');
    $('#employeeRoleEditSelect').value = member.role;
    $('#employeeRoleEditStatus').value = member.status === 'inactive' ? 'inactive' : 'active';
    $('#employeeRoleEditBackdrop').classList.add('open');
    $('#employeeRoleEditSelect').focus();
  }
  const closeMemberRoleEditor = () => $('#employeeRoleEditBackdrop').classList.remove('open');
  $('#closeEmployeeRoleEdit').addEventListener('click', closeMemberRoleEditor);
  $('#cancelEmployeeRoleEdit').addEventListener('click', closeMemberRoleEditor);
  $('#employeeRoleEditBackdrop').addEventListener('click', event => { if (event.target.id === 'employeeRoleEditBackdrop') closeMemberRoleEditor(); });
  $('#employeeRoleEditForm').addEventListener('submit', event => {
    event.preventDefault();
    if (!canManagePermissions()) return toast('Somente o Dono pode editar os dados dos membros.');
    const serverId = String($('#employeeRoleEditServerId').value), member = employees.find(item => String(item.server_id) === serverId), role = $('#employeeRoleEditSelect').value, status = $('#employeeRoleEditStatus').value;
    if (!member || !role) return;
    if (String(member.server_id) === String(getStorageMember()?.server_id) && status === 'inactive' && String(member.role).toLocaleLowerCase('pt-BR') === 'dono' && !employees.some(item => String(item.server_id) !== serverId && item.status !== 'inactive' && String(item.role).toLocaleLowerCase('pt-BR') === 'dono' && memberAccounts[String(item.server_id)])) return toast('Cadastre outro Dono ativo com acesso antes de desativar esta conta.');
    const roleChanged = member.role !== role, statusChanged = (member.status === 'inactive' ? 'inactive' : 'active') !== status;
    member.role = role; member.status = status; saveLocalState('vertice_employees',JSON.stringify(employees));
    closeMemberRoleEditor(); renderEmployees(); syncOwnerNavigation(); toast(statusChanged ? `${member.name} agora está ${status === 'active' ? 'ativo' : 'inativo'}.` : roleChanged ? `Cargo de ${member.name} atualizado.` : 'Dados do membro atualizados.');
  });
  $('#resetAllData').addEventListener('click', async () => {
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
    transactions = []; employees = []; storageMovements = []; storageCatalog = []; orders = []; clients = []; products = []; memberAccounts = {}; rolePermissions = {}; memberPermissions = {}; personalAreaTabs = {}; personalGoals = {}; personalMessages = {}; sessionStorage.removeItem(storageSessionKey); memberRoles = [...defaultRoles]; siteSettings = { ...defaultSiteSettings };
     saveLocalState('vertice_transactions','[]'); saveLocalState('vertice_employees','[]'); saveLocalState('vertice_storage_movements','[]'); saveLocalState('vertice_storage_catalog','[]'); saveLocalState('vertice_orders','[]'); saveLocalState('vertice_clients','[]'); saveLocalState('vertice_products','[]'); saveLocalState('vertice_role_permissions','{}'); saveLocalState('vertice_member_permissions','{}'); saveLocalState('vertice_personal_area_tabs','{}'); saveLocalState('vertice_personal_goals','{}'); saveLocalState('vertice_personal_messages','{}'); saveLocalState('vertice_member_roles',JSON.stringify(memberRoles)); saveLocalState('vertice_reset_completed','true');
     cloudSyncReady = Boolean(config.url && config.key); applyTheme(); applySiteSettings(); renderRoles(); renderEmployees(); renderStorageCatalog(); renderStorage(); renderProducts(); renderOrders(); renderClients(); renderPersonalArea(); updateMetrics(); renderActivity(); syncOwnerNavigation();
    document.querySelectorAll('.team-table .team-row:not(.team-head)').forEach(row => row.remove());
    toast('Informações apagadas.');
  });
  $('#newEmployee').addEventListener('click', () => { $('#employeeForm').reset(); setRecordModalOpen('memberFormModal',true,'#employeeName'); });
  $('#employeeForm').addEventListener('submit', async e => {
    e.preventDefault();
    const record = {name:$('#employeeName').value.trim(),server_id:$('#employeeServerId').value.trim(),role:$('#employeeRole').value,phone:$('#employeePhone').value.trim(),status:$('#employeeStatus').value};
    if (!record.name || !record.server_id || !record.role) return;
    if (employees.some(x => String(x.server_id).toLowerCase() === record.server_id.toLowerCase())) { toast('Já existe um membro com esse ID de servidor.'); return; }
    employees.unshift({...record,id:`local-${Date.now()}`}); saveLocalState('vertice_employees',JSON.stringify(employees));
    $('#employeeForm').reset(); setRecordModalOpen('memberFormModal',false); renderEmployees(); toast(cloudSyncReady ? 'Membro salvo e sincronizado.' : 'Membro salvo neste navegador.');
  });
  async function deleteEmployee(id) {
    const employee = employees.find(x => String(x.id) === String(id)); if (!employee) return;
    employees = employees.filter(x => String(x.id) !== String(id)); delete memberAccounts[String(employee.server_id)]; delete memberPermissions[String(employee.server_id)]; delete personalAreaTabs[String(employee.server_id)]; delete personalGoals[String(employee.server_id)]; delete personalMessages[String(employee.server_id)]; saveLocalState('vertice_member_accounts',JSON.stringify(memberAccounts)); saveLocalState('vertice_member_permissions',JSON.stringify(memberPermissions)); saveLocalState('vertice_personal_area_tabs',JSON.stringify(personalAreaTabs)); saveLocalState('vertice_personal_goals',JSON.stringify(personalGoals)); saveLocalState('vertice_personal_messages',JSON.stringify(personalMessages)); if (String(employee.server_id) === sessionStorage.getItem(storageSessionKey)) sessionStorage.removeItem(storageSessionKey); saveLocalState('vertice_employees',JSON.stringify(employees)); renderEmployees(); renderStorage(); syncOwnerNavigation(); toast('Membro removido.');
  }
  $('#menuToggle').addEventListener('click', () => { $('#sidebar').classList.toggle('open'); let back = $('.mobile-nav-backdrop'); if (!back) { back = document.createElement('div'); back.className='mobile-nav-backdrop'; document.body.appendChild(back); back.addEventListener('click', () => { $('#sidebar').classList.remove('open'); back.classList.remove('show'); }); } back.classList.toggle('show'); });
  $('#periodSelect').addEventListener('change', e => { const months = Number(e.target.value); document.querySelectorAll('#chart .bar-group').forEach((bar,i,all) => { bar.style.display = months === 3 ? (i >= all.length-3 ? 'flex':'none') : 'flex'; }); });
  if (localStorage.getItem('vertice_reset_completed') === 'true') document.querySelectorAll('.team-table .team-row:not(.team-head)').forEach(row => row.remove());
  applyTheme();
  applyNavOrder(); renderNavOrder(); applySiteSettings(); updateMetrics(); renderActivity(); renderRoles(); renderEmployees(); renderStorageCatalog(); renderStorage(); renderProducts(); renderOrders(); renderClients(); prepareSiteCopy(); syncOwnerNavigation(); scheduleWeeklyDepositRefresh();
  const startupMember = getStorageMember();
  let startupView = startupMember ? memberLandingView(startupMember) : 'login';
  if (!startupView) { sessionStorage.removeItem(storageSessionKey); startupView = 'login'; $('#loginNotice').textContent = 'Sua conta ainda não tem uma área liberada. Peça ao Dono para configurar suas permissões.'; }
  requestedProtectedView = 'login'; showView(startupView);
  ['pointerdown','keydown','touchstart','wheel','scroll','click'].forEach(eventName => document.addEventListener(eventName,recordMemberActivity,{capture:true,passive:true}));
  document.addEventListener('pointermove',recordMemberActivity,{passive:true});
  document.addEventListener('visibilitychange',() => { if (!document.hidden) startMemberInactivityMonitor(); });
  window.addEventListener('focus',startMemberInactivityMonitor);
  startMemberInactivityMonitor();
  if (config.url && config.key) {
    loadRemote();
    // Busca alterações feitas por outras pessoas sem interromper quem está preenchendo um campo.
    setInterval(() => {
      if (cloudSyncReady && !cloudLoadBusy && cloudWritesPending === 0 && !hasActiveEditing()) loadRemote(true);
    }, 10000);
    window.addEventListener('focus', () => {
      if (cloudSyncReady && !cloudLoadBusy && cloudWritesPending === 0 && !hasActiveEditing()) loadRemote(true);
    });
  }
})();





