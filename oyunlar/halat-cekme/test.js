// Halat çekmeye özgü kontroller: yorumdaki 1 / 2 takımı seçer, takımın yorumu ve beğenisi halatı kendi yanına
// çeker, her hediye kademesi kendi etkisini başlatır, kurdele çizgiyi geçince tur biter ve yeniden başlar.
// Çekirdek testleri ayrıca çalışır (cekirdek/test/cekirdek.test.js halat-cekme). Çalıştırma: node oyunlar/halat-cekme/test.js
'use strict';
const path = require('path');
const { OYUN_URL, CIKTI, tarayici, raporla, kontrolcu, bekle: durumBekle, hazirBekle, kareBekle } = require(path.join(__dirname, '..', '..', 'cekirdek', 'test', 'ortak'));
const { sonuc, kontrol } = kontrolcu();

(async () => {
  const b = await tarayici();
  const hatalar = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  p.on('pageerror', e => hatalar.push('SAYFA HATASI: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' && !/ERR_TUNNEL|Failed to load resource/.test(m.text())) hatalar.push(m.text()); });
  await p.goto(OYUN_URL);
  await hazirBekle(p);
  const bosalt = () => p.evaluate(() => { document.getElementById('bosalt').click(); });
  const O = o => p.evaluate(o2 => CanliOyun.olay(o2), o);
  const takim = id => p.evaluate(i => CanliOyun._test.D.oy.get(i).takim, id);
  const kare = n => kareBekle(p, n);

  // yorumdaki sayı takımı seçer, sonradan değiştirir
  await bosalt();
  await O({ tip: 'yorum', kullanici: { id: 'a', ad: 'Ali' }, metin: '1' });
  await O({ tip: 'yorum', kullanici: { id: 'b', ad: 'Bora' }, metin: '1 istanbul' });
  await O({ tip: 'yorum', kullanici: { id: 'c', ad: 'Cem' }, metin: 'ben 2 deyim' });
  await kare(3);
  kontrol('Yorumda 1 yazan İstanbul’a, 2 yazan Ankara’ya girer', (await takim('a')) === 0 && (await takim('b')) === 0 && (await takim('c')) === 1, [await takim('a'), await takim('b'), await takim('c')]);
  await O({ tip: 'yorum', kullanici: { id: 'b', ad: 'Bora' }, metin: 'ankara' });
  await kare(3);
  kontrol('Sonraki yorum takımı değiştirir', (await takim('b')) === 1, await takim('b'));
  await O({ tip: 'yorum', kullanici: { id: 'd', ad: 'Dilan' }, metin: 'selam' });
  await kare(3);
  const n = await p.evaluate(() => CanliOyun.durum().mahalle);
  kontrol('Sayı yazmayan az kişili takıma girer', n[0] === 2 && n[1] === 2, n);

  // takımın yorumu ve beğenisi halatı kendi yanına çeker
  await bosalt();
  await O({ tip: 'yorum', kullanici: { id: 'a', ad: 'Ali' }, metin: '1' });
  await O({ tip: 'yorum', kullanici: { id: 'c', ad: 'Cem' }, metin: '2' });
  await kare(30);
  const ip0 = await p.evaluate(() => CanliOyun._test.D.ip);
  for (let i = 0; i < 8; i++) {
    await O({ tip: 'begeni', kullanici: { id: 'a', ad: 'Ali' }, adet: 10 });
    await kare(2);
  }
  await kare(40);
  const ip1 = await p.evaluate(() => CanliOyun._test.D.ip);
  kontrol('İstanbul’un beğenisi halatı sola çeker', ip1 < ip0 - 0.05, [ip0, ip1]);
  for (let i = 0; i < 16; i++) {
    await O({ tip: 'yorum', kullanici: { id: 'c', ad: 'Cem' }, metin: 'çek' });
    await O({ tip: 'begeni', kullanici: { id: 'c', ad: 'Cem' }, adet: 10 });
    await kare(2);
  }
  await kare(40);
  const ip2 = await p.evaluate(() => CanliOyun._test.D.ip);
  kontrol('Ankara’nın yorumu ve beğenisi halatı sağa çeker', ip2 > ip1 + 0.05, [ip1, ip2]);

  // her kademe kendi etkisini başlatır
  await bosalt();
  for (const [id, m] of [['a', '1'], ['b', '1'], ['c', '1'], ['x', '2'], ['y', '2'], ['z', '2']])
    await O({ tip: 'yorum', kullanici: { id, ad: id }, metin: m });
  await kare(3);
  const kd = await p.evaluate(() => {
    const T = CanliOyun._test, D = T.D, cik = {};
    for (const j of [1, 9, 10, 49, 50, 199, 200, 999]) {
      D.itme = 0; D.hepBit = [-1, -1]; D.koyBit = [-1, -1];
      for (const k of D.oy.values()) k.kay0 = -9;
      CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'a', ad: 'a' }, jeton: j });
      const B = CanliOyun.durum().vurus;
      cik[j] = { itme: D.itme, hep: D.hepBit[0] > B, koy: D.koyBit[0] > B, kay: [...D.oy.values()].filter(k => k.takim === 1 && k.kay0 > B - 1).length };
    }
    D.itme = 0;
    return cik;
  });
  const kts = (j, hep, koy, kay) => kd[j].itme < 0 && kd[j].hep === hep && kd[j].koy === koy && kd[j].kay === kay;
  kontrol('1–9 jeton: yalnız biraz çeker', kts(1, false, false, 0) && kts(9, false, false, 0), [kd[1], kd[9]]);
  kontrol('10–49 jeton: takım hep beraber asılır', kts(10, true, false, 0) && kts(49, true, false, 0), [kd[10], kd[49]]);
  kontrol('50–199 jeton: rakibin ön sırası kayar', kts(50, false, false, 3) && kts(199, false, false, 3), [kd[50], kd[199]]);
  kontrol('200–999 jeton: köy arkanda, çift güç', kts(200, true, true, 0) && kts(999, true, true, 0), [kd[200], kd[999]]);

  // pehlivan turu kazandırır; tur bitince skor yazılır, kaybedenin önü çamura düşer, sonra yeni tur başlar
  await p.evaluate(() => { const D = CanliOyun._test.D; D.ip = 0; D.itme = 0; });
  await O({ tip: 'hediye', kullanici: { id: 'x', ad: 'x' }, jeton: 1000 });
  let d = await p.evaluate(() => CanliOyun.durum());
  kontrol('1000+ jeton: gönderen pehlivan olur', d.pehlivan === 'x', d.pehlivan);
  await durumBekle(p, 'pehlivan turu bitirdi', () => CanliOyun.durum().tur === 'bitti', undefined, 10000);
  d = await p.evaluate(() => CanliOyun.durum());
  const dus = await p.evaluate(() => [...CanliOyun._test.D.oy.values()].filter(k => k.dus).map(k => k.takim));
  kontrol('Pehlivanın takımı turu kazanır, skor yazılır', d.kazanan === 1 && d.skor[1] === 1 && d.skor[0] === 0, d);
  kontrol('Kaybedenin önü çamura düşer', dus.length > 0 && dus.every(t => t === 0), dus);
  await p.locator('#sahne').screenshot({ path: CIKTI + '/h-kazandi.png' });
  await durumBekle(p, 'yeni tur başladı', () => CanliOyun.durum().tur === 'cekis', undefined, 20000);
  d = await p.evaluate(() => CanliOyun.durum());
  kontrol('Yeni tur ortadan başlar', Math.abs(d.ip) < 0.05 && d.skor[1] === 1, d);

  // köylüler: meydan boşken iki yanda ikişer, kendileri çeker; izleyici gelince yerlerini bırakır
  await bosalt();
  await kareBekle(p, 3);
  let kd0 = await p.evaluate(() => CanliOyun.durum());
  kontrol('Meydan boşken her takımda iki köylü var; sıralamaya girmezler', kd0.koylu[0] === 2 && kd0.koylu[1] === 2 && kd0.kisi === 0, [kd0.koylu, kd0.kisi]);
  await durumBekle(p, 'köylüler halatı oynattı', () => Math.abs(CanliOyun._test.D.ip) > 0.05 || CanliOyun.durum().tur !== 'cekis', undefined, 20000);
  kontrol('Köylüler meydan boşken de halatı çeker', true);
  await O({ tip: 'yorum', kullanici: { id: 'k1', ad: 'k1' }, metin: '1' });
  await O({ tip: 'yorum', kullanici: { id: 'k2', ad: 'k2' }, metin: '1' });
  await kareBekle(p, 3);
  kd0 = await p.evaluate(() => CanliOyun.durum());
  kontrol('Bir takıma iki izleyici gelince o takımın köylüleri çekilir, öbür takımınkiler kalır', kd0.koylu[0] === 0 && kd0.koylu[1] === 2, kd0.koylu);

  // olay selinde halat sınırda kalır, sayfa ayakta
  await bosalt();
  const sel = await p.evaluate(() => {
    for (let i = 0; i < 3000; i++) {
      const id = 's' + (i % 300);
      CanliOyun.olay(i % 3 ? { tip: 'begeni', kullanici: { id, ad: id }, adet: 20 } : { tip: 'hediye', kullanici: { id, ad: id }, jeton: [1, 10, 50, 200, 1000][i % 5] });
    }
    return CanliOyun.durum();
  });
  await kare(60);
  const ipSel = await p.evaluate(() => CanliOyun.durum().ip);
  kontrol('Selde halat sayı kalır ve iki çizginin ötesine kaçmaz', Number.isFinite(ipSel) && Math.abs(ipSel) <= 1.3, [sel.kisi, ipSel]);

  kontrol('Halat çekme testlerinde sayfada hata çıkmadı', hatalar.length === 0, hatalar.slice(0, 4).join(' | '));
  await b.close();
  process.exit(raporla(sonuc) ? 1 : 0);
})().catch(e => { console.error('TEST ÇÖKTÜ', e); process.exit(1); });
