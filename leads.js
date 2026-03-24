// Formatter
const formatMoney = (val) => 'R$ ' + val.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2});

// -------------------------------------------------------------
// CENTRAL DATA STATE
// -------------------------------------------------------------
const names = ['Ana Paula', 'Thiago Silva', 'João Carlos', 'Lucas Moura', 'Maria Fernanda', 'Pedro Henrique', 'Camila Santos', 'Rafael Costa', 'Juliana Alves', 'Diego Martins', 'Fernanda Lima', 'Bruno Gomes', 'Marcos Oliveira', 'Patricia Souza', 'Rodrigo Pereira', 'Amanda Castro', 'Leandro Rodrigues', 'Vanessa Barbosa', 'Felipe Santos', 'Gabriela Silva', 'Ricardo Almeida', 'Carla Mendes', 'Paulo Vitor', 'Luana Costa', 'Marcelo Souza', 'Renata Garcia', 'Anderson Silva'];
const mockSellerGroups = ['G1', 'G2', 'G3', 'Nenhum'];

// Generate Base Core Mocks
const sellerBaseStats = names.map(name => {
    const id = name.split(' ')[0].toLowerCase();
    const grupo = mockSellerGroups[Math.floor(Math.random() * mockSellerGroups.length)];

    const callsExpected = Math.floor(800 + Math.random() * 1200);
    const callsInatExpected = Math.floor(200 + Math.random() * 400);
    const meta = Math.floor(500000 + Math.random() * 1500000);

    const callsMade = Math.floor(callsExpected * (0.6 + Math.random() * 0.5)); 
    const callsInatMade = Math.floor(callsInatExpected * (0.4 + Math.random() * 0.6)); 

    const totalAssignedCallsContext = callsMade + callsInatMade;
    const closedSales = Math.floor(totalAssignedCallsContext * (0.05 + Math.random() * 0.1)); 
    const lostSales = Math.floor(totalAssignedCallsContext * (0.1 + Math.random() * 0.15)); 
    const leadsAberto = Math.floor(totalAssignedCallsContext * (0.2 + Math.random() * 0.2)); 
    const leadsSemContato = Math.floor(totalAssignedCallsContext * (0.1 + Math.random() * 0.2)); 
    
    const leadsTotaisGerais = Math.floor(totalAssignedCallsContext * (1.1 + Math.random() * 0.2)); 

    const revenueClosed = closedSales * (2000 + Math.random() * 5000); 
    const revenueLost = lostSales * (1500 + Math.random() * 4000); 

    const convAtivos = 15 + Math.random() * 15; 
    const convOpor = 5 + Math.random() * 15; 
    const clientesReativados = Math.floor(callsInatMade * (0.05 + Math.random() * 0.15)); 

    const clientesRisco = Math.floor(Math.random() * 30 + 5);
    const riscoReal = clientesRisco * (1500 + Math.random() * 4000);
    const riscoHistPercent = (2 + Math.random() * 10).toFixed(1); 

    return {
        id, name, grupo,
        callsExpected, callsInatExpected, meta, callsMade, callsInatMade,
        leadsTotaisGerais, lostSales, closedSales, leadsAberto, leadsSemContato,
        revenueClosed, revenueLost, convAtivos, convOpor,
        clientesReativados, clientesRisco, riscoReal, riscoHistPercent
    };
});

// -------------------------------------------------------------
// FILTER PIPELINE BI LOGIC
// -------------------------------------------------------------
function applyLeadsFilters() {
    const qGlobal = document.getElementById('globalEmpresa') ? document.getElementById('globalEmpresa').value.toLowerCase() : '';
    const vGrupo = document.getElementById('globalGrupo').value;
    const vVendedor = document.getElementById('globalVendedor').value; // Matches predefined mock select tags ('ana', 'thiago')
    const vPeriodo = document.getElementById('globalPeriodo').value;

    let scaler = 1.0;
    if (vPeriodo === 'mes') scaler = 0.15; // Simulate a single month of operational volume
    if (vPeriodo === '3m') scaler = 0.45; // Simulate quarter
    if (vPeriodo === '6m') scaler = 0.70; // Simulate half-year

    let filteredParams = sellerBaseStats.filter(s => {
        let m = true;
        if(qGlobal) m = m && s.name.toLowerCase().includes(qGlobal);
        if(vGrupo !== 'all') m = m && s.grupo === vGrupo; // Not explicitly coded to match selects, acts as dummy visual interaction
        if(vVendedor !== 'all') m = m && s.id === vVendedor;
        return m;
    });

    // Translate temporal scaling mapping logic creating a decoupled reactive copy
    const reactiveDataset = filteredParams.map(s => ({
        ...s,
        callsExpected: Math.round(s.callsExpected * scaler),
        callsInatExpected: Math.round(s.callsInatExpected * scaler),
        meta: s.meta * scaler,
        callsMade: Math.round(s.callsMade * scaler),
        callsInatMade: Math.round(s.callsInatMade * scaler),
        leadsTotaisGerais: Math.round(s.leadsTotaisGerais * scaler),
        lostSales: Math.round(s.lostSales * scaler),
        closedSales: Math.round(s.closedSales * scaler),
        leadsAberto: Math.round(s.leadsAberto * scaler),
        leadsSemContato: Math.round(s.leadsSemContato * scaler),
        revenueClosed: s.revenueClosed * scaler,
        revenueLost: s.revenueLost * scaler,
        clientesReativados: Math.round(s.clientesReativados * scaler),
        clientesRisco: Math.max(0, Math.round(s.clientesRisco * scaler)),
        riscoReal: s.riscoReal * scaler
    }));

    // Rank Engine Sorting Strategy
    reactiveDataset.sort((a,b) => (b.revenueClosed/b.meta) - (a.revenueClosed/a.meta));

    updateLeadsDashboardViews(reactiveDataset);
}

function updateLeadsDashboardViews(dataset) {
    if(dataset.length === 0) {
        document.getElementById('rankingTbody').innerHTML = '<tr><td colspan="7" class="text-center" style="padding:40px; color:var(--text-muted)">Nenhum operador encontrado com os filtros atuais.</td></tr>';
        return; // Zero out logic gracefully bypassed
    }
    renderKPIs(dataset);
    renderGamificationTable(dataset);
}

// -------------------------------------------------------------
// RENDERERS (REACTIVE TO SCALED DATASET STATE)
// -------------------------------------------------------------
function renderKPIs(dataset) {
    const totalSucesso = dataset.reduce((sum, s) => sum + s.closedSales, 0);
    const totalPerdido = dataset.reduce((sum, s) => sum + s.lostSales, 0);
    const totalAberto = dataset.reduce((sum, s) => sum + s.leadsAberto, 0);
    const totalSemContato = dataset.reduce((sum, s) => sum + s.leadsSemContato, 0);
    
    const totalContatos = totalSucesso + totalPerdido + totalAberto + totalSemContato;
    let baseGeralTotal = dataset.reduce((sum, s) => sum + s.leadsTotaisGerais, 0);
    
    // Fix: Assure Base > Contacts in scaled temporal scenarios
    if(baseGeralTotal < totalContatos) baseGeralTotal = Math.floor(totalContatos * 1.15);

    // Sync POC Ecosystem context
    localStorage.setItem('muvstok_carteira_total', baseGeralTotal.toString());

    const pctSucesso = totalContatos > 0 ? ((totalSucesso/totalContatos)*100).toFixed(1) : 0;
    const pctPerdido = totalContatos > 0 ? ((totalPerdido/totalContatos)*100).toFixed(1) : 0;
    const pctAberto = totalContatos > 0 ? ((totalAberto/totalContatos)*100).toFixed(1) : 0;
    const pctSemContato = totalContatos > 0 ? ((totalSemContato/totalContatos)*100).toFixed(1) : 0;
    
    const totalValVendido = dataset.reduce((sum, s) => sum + s.revenueClosed, 0);
    const totalValPerdido = dataset.reduce((sum, s) => sum + s.revenueLost, 0);
    const totalRiscoValor = dataset.reduce((sum, s) => sum + s.riscoReal, 0);

    const baseInativosMockPipeline = dataset.reduce((sum, s) => sum + s.callsInatExpected, 0);
    const oportunidadesGanhoReais = baseInativosMockPipeline * 3500;

    // Card 1
    document.getElementById('kpi-total-geral').textContent = baseGeralTotal.toLocaleString('pt-BR');
    document.getElementById('kpi-total-contatos').textContent = totalContatos.toLocaleString('pt-BR');
    document.getElementById('kpi-vend-perd-funil').textContent = totalPerdido.toLocaleString('pt-BR');
    document.getElementById('kpi-tx-conv').textContent = pctSucesso + '%';

    // Card 2
    document.getElementById('kpi-sf-aberto').textContent = `${totalAberto.toLocaleString('pt-BR')} (${pctAberto}%)`;
    document.getElementById('kpi-sf-sucesso').textContent = `${totalSucesso.toLocaleString('pt-BR')} (${pctSucesso}%)`;
    document.getElementById('kpi-sf-perdido').textContent = `${totalPerdido.toLocaleString('pt-BR')} (${pctPerdido}%)`;
    document.getElementById('kpi-sf-scontato').textContent = `${totalSemContato.toLocaleString('pt-BR')} (${pctSemContato}%)`;

    // Card 3
    document.getElementById('kpi-rf-val-suc').textContent = formatMoney(totalValVendido);
    document.getElementById('kpi-rf-qtd-suc').textContent = `(${totalSucesso.toLocaleString('pt-BR')} vendas)`;
    document.getElementById('kpi-rf-val-perd').textContent = formatMoney(totalValPerdido);
    document.getElementById('kpi-rf-qtd-perd').textContent = `(${totalPerdido.toLocaleString('pt-BR')} perdas)`;

    // Card 4
    document.getElementById('kpi-opor-rs').textContent = formatMoney(oportunidadesGanhoReais);
    document.getElementById('kpi-opor-qtd').textContent = `(${baseInativosMockPipeline.toLocaleString('pt-BR')} clientes)`;
    document.getElementById('kpi-risco-rs-card').textContent = formatMoney(totalRiscoValor); 
    const avgHist = (dataset.reduce((sum, s) => sum + parseFloat(s.riscoHistPercent), 0) / dataset.length).toFixed(1);
    document.getElementById('kpi-risco-pct-card').textContent = `(${avgHist}% Base Histórica)`;
}

function renderGamificationTable(dataset) {
    const tbody = document.getElementById('rankingTbody');
    let html = '';

    dataset.forEach((s, idx) => {
        let medalHtml = `<span class="rank-badge">${idx + 1}</span>`;
        if(idx === 0) medalHtml = `<span class="rank-badge gold"><i class="fa-solid fa-crown"></i></span>`;
        else if(idx === 1) medalHtml = `<span class="rank-badge silver">${idx+1}</span>`;
        else if(idx === 2) medalHtml = `<span class="rank-badge bronze">${idx+1}</span>`;

        const ligPct = s.callsExpected > 0 ? Math.min(100, Math.round((s.callsMade / s.callsExpected) * 100)) : 0;
        let ligColorClass = ligPct < 80 ? 'danger' : (ligPct >= 100 ? 'ok' : '');

        const fatPct = s.meta > 0 ? Math.min(100, Math.round((s.revenueClosed / s.meta) * 100)) : 0;
        let fatColorClass = fatPct < 70 ? 'danger' : (fatPct >= 100 ? 'ok' : ''); 

        html += `
            <tr>
                <td>
                    <div class="seller-td">
                        ${medalHtml}
                        <span style="font-weight:700; font-size:11.5px; white-space:nowrap;">${s.name}</span>
                    </div>
                </td>
                
                <td>
                    <div class="progress-container">
                        <div class="progress-labels">
                            <span>Feitas: <strong style="color:var(--text-primary)">${s.callsMade}</strong></span>
                            <span>/ Prev: ${s.callsExpected} (${ligPct}%)</span>
                        </div>
                        <div class="progress-rail">
                            <div class="progress-fill ${ligColorClass}" style="width: ${ligPct}%"></div>
                        </div>
                    </div>
                </td>

                <td class="text-center" style="color:var(--color-ok); font-weight:800; font-size:12px;">
                    ${s.convAtivos.toFixed(1)}%
                </td>

                <td class="text-center">
                    <div style="font-size:13px; font-weight:900; color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:2px;">
                        <div style="display:flex; align-items:center; gap:4px;">
                            <i class="fa-solid fa-arrow-rotate-left" style="color:var(--muv-orange); font-size:10px;"></i>
                            <span>${s.clientesReativados}</span>
                        </div>
                        <span style="font-size:8px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">reativados</span>
                    </div>
                </td>

                <td class="text-center" style="font-weight:800; font-size:12px;">
                    <span style="color:var(--text-muted)">${s.convOpor.toFixed(1)}%</span>
                </td>

                <td class="text-right highlight-col-td" style="padding:14px;">
                    <span style="color:var(--muv-orange); font-weight:800; font-size:12.5px;">${formatMoney(s.riscoReal)}</span><br>
                    <span style="font-size:10px; color:white; font-family:monospace;">${s.clientesRisco} clientes críticos</span>
                    <span style="font-size:8.5px; color:var(--text-muted); display:block; margin-top:2px;">(${s.riscoHistPercent}% da Base Histórica)</span>
                </td>

                <td style="padding-left:14px;">
                    <div class="progress-container">
                        <div class="progress-labels">
                            <span style="color:white; font-family:monospace; font-size:10px;">${formatMoney(s.revenueClosed)}</span>
                            <span>Meta: ${fatPct}%</span>
                        </div>
                        <div class="progress-rail" style="height:8px;">
                            <div class="progress-fill ${fatColorClass}" style="width: ${fatPct}%"></div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// -------------------------------------------------------------
// INITIALIZATION
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    applyLeadsFilters(); // Implicitly triggers full startup chain scaling to default temporal scope

    const filterRefs = ['globalEmpresa', 'globalGrupo', 'globalVendedor', 'globalPeriodo'];
    filterRefs.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', applyLeadsFilters);
            el.addEventListener('change', applyLeadsFilters);
        }
    });
});
