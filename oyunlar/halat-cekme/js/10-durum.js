/* HALAT ÇEKME DURUMU — iki mahalle, halatın konumu, turlar, hediye etkileri, altın kemer.
 * D'ye eklenenler: ip (halatın ortasındaki kurdelenin x'i; 0 orta, eksi İstanbul'un yanı), itme (halata
 * henüz geçmemiş çekiş, metre), skor ([İstanbul, Ankara]), tur ({ durum: 'cekis' | 'bitti' | 'donus', kazanan, bit }),
 * hepBit / koyBit (takımın "hep beraber" ve "köy arkanda" etkilerinin bittiği vuruş), pehlivan ({ k, b0 } ya da
 * null), satir (en kalabalık takımın sıra sayısı), _beg (son karede sayılan beğeni).
 * Kancalar: oyunYerlesim, oyunGiris, oyunHediye, oyunLiderDegisti, oyunBaslat, oyunBosalt, oyunDurum.
 */

// Takımlar: 0 solda İstanbul (yorumda 1), 1 sağda Ankara (yorumda 2). yan: halatı kendi yanına çekmek ip'i bu yöne götürür.
const MAH = [
  { ad: 'İstanbul', ek: '’a', kisa: 'İSTANBUL', no: '1', yan: -1, renk: '#e23d2f', acik: '#f7b9a6', koyu: '#6e1a14' },
  { ad: 'Ankara', ek: '’ya', kisa: 'ANKARA', no: '2', yan: 1, renk: '#3d5bd0', acik: '#b9c7f4', koyu: '#16265f' }
];
const SUTUN = 3;          // bir sırada (halatta) bir takımdan kaç kişi: az sütun, çok sıra ki 9:16 kadraj dolsun
const ARA_X = 0.66;       // halatta iki kişi arası (metre; iri başlar birbirine binmesin)
const ARA_Z = 0.95;       // iki halat (sıra) arası
const ON_BOS = 1.3;       // takımın en öndekinin ortaya uzaklığı
const KAZAN = 1.0;        // kurdele bu kadar kayınca (tebeşir çizgisi) tur biter: kaybedenin önü çamurdadır
const IP_Y = 0.36;        // halatın yerden yüksekliği (ellerin tuttuğu yer)
const ALTIN = '#ffd166';

Object.assign(D, { ip: 0, itme: 0, skor: [0, 0], tur: { durum: 'cekis', kazanan: -1, bit: -1 }, hepBit: [-1, -1], koyBit: [-1, -1], pehlivan: null, satir: 1, _beg: 0 });

// Hakem izleyici değildir: D.oy'da durmaz, etiketi oyunEkAdlar'dan gelir.
const hakem = karakterYap('__hakem', 'Hakem');
Object.assign(hakem, { mod: 'hakem', ozel: true, ciddi: true });
Object.assign(hakem.g, { kadin: false, ten: '#e8b48a', sac: '#2a1c16', boy: 1.12, gomlek: '#f6ecd9', yelek: '#191a2a', alt: '#191a2a', kusak: '#191a2a', baslik: 'kasket', baslikRenk: '#191a2a', biyik: true });

// Takımı yoksa az kişili takıma (eşitse kimliğe göre) girer; forması (yelek, kuşak) takım rengine boyanır.
function mahalleHazir(k) {
  if (k.takim === 0 || k.takim === 1)
    return;
  const n = mahalleSay();
  k.takim = n[0] === n[1] ? ozet(k.id) % 2 : n[0] < n[1] ? 0 : 1;
  k._son = -1;
  k._balonT = -1;
  k.kay0 = -9;
  k.cek0 = -9;
  k.g0 = { yelek: k.g.yelek, gomlek: k.g.gomlek, kusak: k.g.kusak, boy: k.g.boy, baslik: k.g.baslik };
  formaGiy(k);
}
function mahalleSay() {
  const n = [0, 0];
  for (const k of D.oy.values())
    if (!k.cikiyor && (k.takim === 0 || k.takim === 1))
      n[k.takim]++;
  return n;
}
function formaGiy(k) {
  const m = MAH[k.takim];
  k.g.yelek = m.renk;
  // başlık takım renginde: kalabalıkta kim hangi takımda, baştan okunur
  k.g.baslik = k.g0.baslik === 'yok' || k.g0.baslik === 'cicek' ? (k.g.kadin ? 'yazma' : 'bere') : k.g0.baslik;
  k.g.baslikRenk = m.renk;
  if (k.g.kadin)
    k.g.gomlek = m.acik;
  k.g.kusak = k === D.lider ? ALTIN : m.koyu;
}
// Yorumdaki 1 / 2 (ya da mahallenin adı) takımı seçer. Yorumun metni çekirdekte yalnız konuşma balonunda durur:
// balonlar kapalıysa sayı okunamaz, izleyici az kişili takımda kalır.
function yorumTakim(m) {
  const s = String(m).toLocaleLowerCase('tr');
  const bir = /(^|[^0-9])1([^0-9]|$)/.test(s) || /kırmızı|istanbul/.test(s), iki = /(^|[^0-9])2([^0-9]|$)/.test(s) || /mavi|ankara/.test(s);
  return bir === iki ? -1 : bir ? 0 : 1;
}
function takimDegistir(k, t) {
  if (k.takim === t)
    return;
  k.takim = t;
  formaGiy(k);
  oyunYerlesim();
  bildir(k.ad, MAH[t].ad + MAH[t].ek + ' geçti');
}

// Her takım kendi içinde jetona göre dizilir: en çok atan ipin en önünde (ortaya en yakın, kameraya en yakın sırada).
// Sıra sıra dizilir: her sırada SUTUN kişi, tek sıralar yarım adım kayar ki arkadakinin yüzü görünsün.
function oyunYerlesim() {
  const ekip = [[], []];
  for (const k of D.sira) {
    mahalleHazir(k);
    ekip[k.takim].push(k);
  }
  koyluGuncelle();
  koyluEkle(ekip);
  let satir = 1;
  ekip.forEach((liste, t) => {
    // pehlivan gösterisi sürerken pehlivan takımının en önüne geçer
    if (D.pehlivan && D.pehlivan.k.takim === t) {
      const i = liste.indexOf(D.pehlivan.k);
      if (i > 0)
        liste.unshift(liste.splice(i, 1)[0]);
    }
    const yan = MAH[t].yan;
    liste.forEach((k, i) => {
      const s = Math.floor(i / SUTUN), yer = i % SUTUN;
      k.hedefX = yan * (ON_BOS + yer * ARA_X + (s % 2 ? ARA_X / 2 : 0));
      k.hedefZ = s * ARA_Z;
      k.sira = s;
      k.onde = i;
    });
    satir = Math.max(satir, Math.ceil(liste.length / SUTUN));
  });
  D.satir = satir;
}
// Yeni gelen kendi takımının yanından, sahnenin dışından koşarak gelir.
function oyunGiris(k) {
  k.x = MAH[k.takim].yan * 7;
  k.z = k.hedefZ;
}

// Hediye: gönderenin takımı çeker; kademe büyüdükçe çekiş sertleşir.
function oyunHediye(k, jeton, kd) {
  k._hediyeT = zaman;
  k.cek0 = B;
  const t = k.takim, yan = MAH[t].yan, v = Math.ceil(B), kat = D.koyBit[t] > B ? 2 : 1;
  if (D.tur.durum !== 'cekis')
    return;
  if (kd.tip === 'hih')
    cekisEkle(yan * Math.min(0.18, 0.05 + jeton * 0.012) * kat);
  else if (kd.tip === 'hep') {
    D.hepBit[t] = Math.max(D.hepBit[t], v + 4);
    cekisEkle(yan * 0.28 * kat);
  }
  else if (kd.tip === 'kay') {
    // rakibin ön sırası (ilk üç kişi) kayar, halat bir anda bu yana geçer
    for (const r of herkes())
      if (r.takim === 1 - t && r.onde < 3)
        r.kay0 = v;
    cekisEkle(yan * 0.45 * kat);
    D.sarsinti = Math.max(D.sarsinti, 0.4);
  }
  else if (kd.tip === 'koy') {
    D.koyBit[t] = Math.max(D.koyBit[t], v + 16);
    D.hepBit[t] = Math.max(D.hepBit[t], v + 4);
    cekisEkle(yan * 0.3);
    konfeti(40, 0.5);
    pankart(MAH[t].ad + ' coştu!', 'Köy arkanda: çift güç');
  }
  else if (kd.tip === 'pehlivan') {
    konfeti(120, 1);
    D.sarsinti = 1;
    if (!D.pehlivan) {
      D.pehlivan = { k, b0: v };
      k.yildiz = true;
      oyunYerlesim();
      pankart('Pehlivan meydanda!', k.ad + ' halatı tek başına çekiyor');
    }
    else
      cekisEkle(yan * 0.6);
  }
  muzik.sov = B < Math.max(D.koyBit[0], D.koyBit[1]);
}
function cekisEkle(m) {
  if (D.tur.durum === 'cekis')
    D.itme += m;
}
// Altın kemer en çok hediye atanın belinde: el değiştirince eskisinin kuşağı takım rengine döner.
function oyunLiderDegisti(eski, yeni) {
  if (eski && (eski.takim === 0 || eski.takim === 1))
    eski.g.kusak = MAH[eski.takim].koyu;
  mahalleHazir(yeni);
  yeni.g.kusak = ALTIN;
  pankart('Altın kemer el değiştirdi', yeni.ad + ' · ' + MAH[yeni.takim].ad);
  konfeti(90, 0.9);
  D.sarsinti = Math.max(D.sarsinti, 0.6);
}
function oyunBaslat() {
  oyunYerlesim();
  for (const k of [...D.sira, ...KOYLULER.filter(k => k.aktif)]) {
    mahalleHazir(k);
    k.x = k.hedefX;
    k.z = k.hedefZ;
    k.yer = 1;
    k.yon = MAH[k.takim].yan > 0 ? -HP : HP;
    k.yeni = -9;
    k.gorunur = true;
  }
  if (D.lider)
    D.lider.g.kusak = ALTIN;
  hakem.x = 0;
  hakem.z = hakemZ();
  hakem.yer = 1;
  D._beg = D.begeni;
}
function oyunBosalt() {
  D.ip = 0;
  D.itme = 0;
  D.skor = [0, 0];
  D.tur = { durum: 'cekis', kazanan: -1, bit: -1 };
  D.hepBit = [-1, -1];
  D.koyBit = [-1, -1];
  D.pehlivan = null;
  D.satir = 1;
  D._beg = D.begeni;
  muzik.sov = false;
  oyunYerlesim();
}
function oyunDurum(d) {
  const n = mahalleSay();
  d.ip = Math.round(D.ip * 100) / 100;
  d.skor = D.skor.slice();
  d.tur = D.tur.durum;
  d.kazanan = D.tur.kazanan;
  d.mahalle = n;
  d.pehlivan = D.pehlivan ? D.pehlivan.k.ad : null;
  d.koylu = [0, 1].map(t => KOYLULER.filter(k => k.aktif && k.takim === t).length);
}
function hakemZ() { return (D.satir - 1) * ARA_Z + 1.0; }
