// MMC Frota — Proxy de rastreamento FTrack / Fulltrack
// Guarda as chaves no servidor (Vercel env vars) e devolve só posições limpas.
// As chaves NUNCA vão pro navegador. Configure na Vercel:
//   FTRACK_API_KEY     = apiKey da conta MMC
//   FTRACK_SECRET_KEY  = secretKey da conta MMC
//   FTRACK_CLIENT_ID   = (opcional) id do cliente, se a conta tiver vários
//
// Formato de auth descoberto: headers "apiKey" + "secretKey" (camelCase).
// Endpoint de posição ao vivo: GET events/all  ("última posição de todos os veículos").

const BASE = 'https://ws.fulltrack2.com/';

// O FTrack devolve texto como bytes UTF-8 escapados como se fossem Latin-1
// (ex.: "Ç" vira "Ã\x87"). Reverte pro texto correto.
function fixEnc(str) {
  if (typeof str !== 'string' || !str) return str;
  let temMoji = false;
  for (const c of str) { const k = c.charCodeAt(0); if (k >= 0x80 && k <= 0xff) { temMoji = true; break; } }
  if (!temMoji) return str;
  try { return new TextDecoder('utf-8').decode(Uint8Array.from([...str].map(c => c.charCodeAt(0) & 0xff))); }
  catch (_) { return str; }
}

async function ft(path, key, secret) {
  const r = await fetch(BASE + path, {
    headers: { apiKey: key, secretKey: secret, Accept: 'application/json', 'User-Agent': 'MMC-Frota/1.0' }
  });
  const txt = await r.text();
  let json = null;
  try { json = JSON.parse(txt); } catch (_) {}
  return { httpStatus: r.status, json, raw: txt };
}

// "DD/MM/YYYY HH:MM:SS" (horário de Brasília, UTC-3 o ano todo) → minutos atrás
function minutosDesde(s) {
  const m = /(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/.exec(s || '');
  if (!m) return null;
  const [, d, mo, y, hh, mi, ss] = m.map(Number);
  const utcMs = Date.UTC(y, mo - 1, d, hh + 3, mi, ss); // BRT -> UTC
  return Math.round((Date.now() - utcMs) / 60000);
}

// Converte um evento cru do FTrack numa posição limpa (ou null se sem GPS válido).
function normaliza(v) {
  const lat = parseFloat(v.ras_eve_latitude);
  const lng = parseFloat(v.ras_eve_longitude);
  // filtra coordenadas inválidas / fora do Brasil (aprox.)
  const latOk = Number.isFinite(lat) && lat > -35 && lat < 6 && lat !== 0;
  const lngOk = Number.isFinite(lng) && lng > -75 && lng < -33 && lng !== 0;
  if (!latOk || !lngOk) return null;
  let mot = fixEnc((v.ras_mot_nome || '').trim());
  if (mot.toUpperCase() === 'PADRAO') mot = ''; // motorista genérico = sem motorista
  const dataGps = v.ras_eve_data_gps || '';
  const min = minutosDesde(dataGps);
  return {
    id: v.ras_vei_id || v.ras_ras_id || v.ras_vei_placa,
    placa: fixEnc(v.ras_vei_placa || ''),
    nome: fixEnc(v.ras_vei_veiculo || v.ras_vei_placa || 'Veículo'),
    motorista: mot,
    lat, lng,
    velocidade: Math.max(0, parseInt(v.ras_eve_velocidade, 10) || 0),
    ignicao: String(v.ras_eve_ignicao) === '1',
    dataGps,
    minutosAtras: min,               // null se data ilegível
    stale: min == null ? true : min > 360, // >6h sem posição = desatualizado
    dataComunicacao: v.ras_ras_data_ult_comunicacao || v.ras_eve_data_enviado || ''
  };
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  const key = process.env.FTRACK_API_KEY;
  const secret = process.env.FTRACK_SECRET_KEY;
  const clientId = process.env.FTRACK_CLIENT_ID || '';

  if (!key || !secret) {
    return res.status(200).json({
      ok: false,
      configurada: false,
      message: 'Integração ainda não configurada. Falta definir FTRACK_API_KEY e FTRACK_SECRET_KEY na Vercel.',
      vehicles: []
    });
  }

  try {
    // 1) posição ao vivo de todos os veículos
    const ev = await ft('events/all', key, secret);
    let data = ev.json && Array.isArray(ev.json.data) ? ev.json.data : [];

    // 2) fallback: se events/all vier vazio e houver client id, ao menos lista a frota
    let soLista = false;
    if (data.length === 0 && clientId) {
      const vc = await ft('vehicles/client/id/' + encodeURIComponent(clientId), key, secret);
      if (vc.json && Array.isArray(vc.json.data)) { data = vc.json.data; soLista = true; }
    }

    const vehicles = data.map(normaliza).filter(Boolean);

    return res.status(200).json({
      ok: true,
      configurada: true,
      total: data.length,          // quantos veículos o FTrack retornou
      comPosicao: vehicles.length, // quantos tinham GPS válido
      soLista,                     // true = veio só cadastro, sem posição ao vivo
      message: ev.json ? ev.json.message : '',
      atualizado: new Date().toISOString(),
      vehicles
    });
  } catch (e) {
    return res.status(200).json({ ok: false, configurada: true, message: 'Erro ao consultar o FTrack: ' + e.message, vehicles: [] });
  }
}
