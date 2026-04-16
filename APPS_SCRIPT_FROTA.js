// ============================================================
// MMC FROTA — Apps Script (ADICIONAR ao Apps Script existente)
// ============================================================
// Este código deve ser ADICIONADO ao Apps Script que já existe
// na planilha. NÃO apague o código existente do painel de máquinas.
// Cole ABAIXO do código existente.
// ============================================================

const FROTA_VEICULOS = 'Frota_Veiculos';
const FROTA_OPERADORES = 'Frota_Operadores';
const FROTA_ESCALA = 'Frota_Escala';
const FROTA_HIST = 'Frota_Historico';

const VH = ['id','tipo','placa','modelo','apelido','status','observacoes'];
const OH = ['id','nome','habilitacoes','telefone','status','observacoes'];
const EH = ['id','data','veiculo_id','veiculo_nome','operador_id','operador_nome','servico','destino','cliente','maquina','prioridade','status','hora_saida','hora_retorno','observacoes'];
const FHH = ['timestamp','data','hora','tipo','descricao'];

function ensureFrotaSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Veiculos
  let sv = ss.getSheetByName(FROTA_VEICULOS);
  if (!sv) {
    sv = ss.insertSheet(FROTA_VEICULOS);
    sv.getRange(1,1,1,VH.length).setValues([VH]);
    sv.getRange(1,1,1,VH.length).setFontWeight('bold').setBackground('#1E3A8A').setFontColor('#fff');
    sv.setFrozenRows(1);
  }
  
  // Operadores
  let so = ss.getSheetByName(FROTA_OPERADORES);
  if (!so) {
    so = ss.insertSheet(FROTA_OPERADORES);
    so.getRange(1,1,1,OH.length).setValues([OH]);
    so.getRange(1,1,1,OH.length).setFontWeight('bold').setBackground('#1E3A8A').setFontColor('#fff');
    so.setFrozenRows(1);
  }
  
  // Escala
  let se = ss.getSheetByName(FROTA_ESCALA);
  if (!se) {
    se = ss.insertSheet(FROTA_ESCALA);
    se.getRange(1,1,1,EH.length).setValues([EH]);
    se.getRange(1,1,1,EH.length).setFontWeight('bold').setBackground('#F5A623').setFontColor('#1E3A8A');
    se.setFrozenRows(1);
  }
  
  // Historico
  let sh = ss.getSheetByName(FROTA_HIST);
  if (!sh) {
    sh = ss.insertSheet(FROTA_HIST);
    sh.getRange(1,1,1,FHH.length).setValues([FHH]);
    sh.getRange(1,1,1,FHH.length).setFontWeight('bold').setBackground('#5B21B6').setFontColor('#fff');
    sh.setFrozenRows(1);
  }
}

function frotaFmt(v) {
  if (!v) return '';
  if (v instanceof Date) return v.getFullYear()+'-'+String(v.getMonth()+1).padStart(2,'0')+'-'+String(v.getDate()).padStart(2,'0');
  return String(v);
}

// ── GET ALL VEICULOS ──
function frotaGetVeiculos() {
  ensureFrotaSheets();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FROTA_VEICULOS);
  const d = sh.getDataRange().getValues();
  const r = [];
  for (let i=1; i<d.length; i++) {
    if (!d[i][0]) continue;
    const obj = {};
    VH.forEach((h,j) => obj[h] = String(d[i][j]||''));
    r.push(obj);
  }
  return r;
}

// ── GET ALL OPERADORES ──
function frotaGetOperadores() {
  ensureFrotaSheets();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FROTA_OPERADORES);
  const d = sh.getDataRange().getValues();
  const r = [];
  for (let i=1; i<d.length; i++) {
    if (!d[i][0]) continue;
    const obj = {};
    OH.forEach((h,j) => obj[h] = String(d[i][j]||''));
    r.push(obj);
  }
  return r;
}

// ── GET ESCALA (by date range) ──
function frotaGetEscala(dateFrom, dateTo) {
  ensureFrotaSheets();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FROTA_ESCALA);
  const d = sh.getDataRange().getValues();
  const r = [];
  for (let i=1; i<d.length; i++) {
    if (!d[i][0]) continue;
    const obj = {};
    EH.forEach((h,j) => obj[h] = frotaFmt(d[i][j]));
    // Filter by date if provided
    if (dateFrom && obj.data < dateFrom) continue;
    if (dateTo && obj.data > dateTo) continue;
    r.push(obj);
  }
  return r;
}

// ── ADD/UPDATE/DELETE helpers ──
function frotaFindRow(sheetName, headers, id) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const d = sh.getDataRange().getValues();
  for (let i=1; i<d.length; i++) if (String(d[i][0])===String(id)) return i+1;
  return -1;
}

function frotaAdd(sheetName, headers, item) {
  ensureFrotaSheets();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  sh.appendRow(headers.map(h => item[h]||''));
  return {success:true};
}

function frotaUpdate(sheetName, headers, item) {
  ensureFrotaSheets();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const r = frotaFindRow(sheetName, headers, item.id);
  if (r===-1) return frotaAdd(sheetName, headers, item);
  sh.getRange(r,1,1,headers.length).setValues([headers.map(h => item[h]||'')]);
  return {success:true};
}

function frotaDelete(sheetName, headers, id) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const r = frotaFindRow(sheetName, headers, id);
  if (r===-1) return {success:false};
  sh.deleteRow(r);
  return {success:true};
}

function frotaAddHist(tipo, descricao) {
  ensureFrotaSheets();
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(FROTA_HIST);
  const now = new Date();
  sh.appendRow([
    now.toISOString(),
    now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0'),
    String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'),
    tipo,
    descricao
  ]);
}

// ── PROCESS FROTA REQUESTS ──
function processFrotaRequest(body) {
  const a = body.action;
  let res;
  
  if (a==='frota_getVeiculos') res = {data: frotaGetVeiculos()};
  else if (a==='frota_getOperadores') res = {data: frotaGetOperadores()};
  else if (a==='frota_getEscala') res = {data: frotaGetEscala(body.dateFrom||'', body.dateTo||'')};
  else if (a==='frota_getAllData') {
    // Single call to get everything (faster)
    res = {
      veiculos: frotaGetVeiculos(),
      operadores: frotaGetOperadores(),
      escala: frotaGetEscala(body.dateFrom||'', body.dateTo||'')
    };
  }
  else if (a==='frota_addVeiculo') { res = frotaAdd(FROTA_VEICULOS, VH, body.item); frotaAddHist('veiculo','Veículo cadastrado: '+(body.item.apelido||body.item.placa)); }
  else if (a==='frota_updVeiculo') { res = frotaUpdate(FROTA_VEICULOS, VH, body.item); frotaAddHist('veiculo','Veículo atualizado: '+(body.item.apelido||body.item.placa)); }
  else if (a==='frota_delVeiculo') { res = frotaDelete(FROTA_VEICULOS, VH, body.id); frotaAddHist('veiculo','Veículo removido: '+body.id); }
  else if (a==='frota_addOperador') { res = frotaAdd(FROTA_OPERADORES, OH, body.item); frotaAddHist('operador','Operador cadastrado: '+(body.item.nome)); }
  else if (a==='frota_updOperador') { res = frotaUpdate(FROTA_OPERADORES, OH, body.item); frotaAddHist('operador','Operador atualizado: '+(body.item.nome)); }
  else if (a==='frota_delOperador') { res = frotaDelete(FROTA_OPERADORES, OH, body.id); frotaAddHist('operador','Operador removido: '+body.id); }
  else if (a==='frota_addEscala') { res = frotaAdd(FROTA_ESCALA, EH, body.item); frotaAddHist('escala','Escala criada: '+(body.item.veiculo_nome)+' → '+(body.item.operador_nome)); }
  else if (a==='frota_updEscala') { res = frotaUpdate(FROTA_ESCALA, EH, body.item); frotaAddHist('escala','Escala atualizada: '+(body.item.veiculo_nome)); }
  else if (a==='frota_delEscala') { res = frotaDelete(FROTA_ESCALA, EH, body.id); frotaAddHist('escala','Escala removida: '+body.id); }
  else if (a==='frota_setup') { ensureFrotaSheets(); res = {success:true, message:'Abas criadas com sucesso'}; }
  else return null; // Not a frota action
  
  return res;
}

// ============================================================
// IMPORTANTE: Modifique a função processRequest existente
// para incluir as rotas da frota. Substitua a função
// processRequest atual por esta versão:
// ============================================================

/*
function processRequest(params) {
  let body;
  if (params.payload) body = JSON.parse(decodeURIComponent(params.payload));
  else body = params;
  const a = body.action;
  
  // Try frota actions first
  if (a && a.startsWith('frota_')) {
    const frotaRes = processFrotaRequest(body);
    if (frotaRes) return ContentService.createTextOutput(JSON.stringify(frotaRes)).setMimeType(ContentService.MimeType.JSON);
  }
  
  // Original actions
  let res;
  if (a==='getAll') res = {data: getAll()};
  else if (a==='getHistory') res = {data: getHistory()};
  else if (a==='add') res = addM(body.machine);
  else if (a==='update') res = updM(body.machine);
  else if (a==='delete') res = delM(body.id);
  else res = {error: 'ação inválida'};
  
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}
*/
