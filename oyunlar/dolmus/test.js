// Dolmuşa özgü kontroller: lider şoför koltuğunda, koltuklar dolunca ayakta kalınır, her hediye kademesi kendi
// etkisini başlatır, havalanan dolmuş iner ve gönderen yerine döner. Çekirdek testleri ayrıca çalışır.
// Çalıştırma: node oyunlar/dolmus/test.js
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
  const durum = () => p.evaluate(() => CanliOyun.durum());

  // şoför ve ayakta kalanlar
  await bosalt();
  await O({ tip: 'yorum', kullanici: { id: 'a', ad: 'Ali' }, metin: 'selam' });
  await O({ tip: 'yorum', kullanici: { id: 'b', ad: 'Bora' }, metin: 'selam' });
  await O({ tip: 'hediye', kullanici: { id: 'b', ad: 'Bora' }, jeton: 5 });
  let d = await durum();
  const pk = await p.evaluate(() => document.getElementById('pankart-yeri').textContent);
  kontrol('En çok hediye atan şoför olur, pankart yeni şoförü yazar', d.sofor === 'Bora' && /Direksiyon el değiştirdi/.test(pk) && pk.includes('Bora'), [d.sofor, pk]);
  const yer = await p.evaluate(() => CanliOyun._test.D.oy.get('b').yerTur);
  kontrol('Şoför şoför koltuğunda oturur', yer === 'sofor', yer);
  for (let i = 0; i < 25; i++)
    await O({ tip: 'yorum', kullanici: { id: 'y' + i, ad: 'y' + i }, metin: 'bindim' });
  d = await durum();
  kontrol('Dolmuş 20 yolcuda dolar, koltuk kalmayınca 4 kişi ayakta', d.kisi === 20 && d.ayakta === 4, [d.kisi, d.ayakta]);

  // her kademe kendi etkisini başlatır
  await bosalt();
  for (const id of ['a', 'b', 'c'])
    await O({ tip: 'yorum', kullanici: { id, ad: id }, metin: 'selam' });
  const kd = await p.evaluate(() => {
    const D = CanliOyun._test.D, cik = {};
    for (const j of [1, 9, 10, 49, 50, 199, 200, 999]) {
      D.fren = -99; D.kaset = -99; D.viraj = null; D.kornaB = -99;
      CanliOyun._test.zamanEkle(0.1);
      CanliOyun.olay({ tip: 'hediye', kullanici: { id: 'c', ad: 'c' }, jeton: j });
      const d = CanliOyun.durum(), B = d.vurus;
      cik[j] = { korna: B - D.kornaB < 1, fren: D.fren > B - 1, kaset: D.kaset > B - 1, viraj: !!D.viraj, ucus: !!D.ucus };
    }
    D.fren = -99; D.kaset = -99; D.viraj = null;
    return cik;
  });
  const e = (j, korna, fren, kaset, viraj) => kd[j].korna === korna && kd[j].fren === fren && kd[j].kaset === kaset && kd[j].viraj === viraj && !kd[j].ucus;
  kontrol('1–9 jeton: korna', e(1, true, false, false, false) && e(9, true, false, false, false), [kd[1], kd[9]]);
  kontrol('10–49 jeton: müsait bir yerde, fren', e(10, false, true, false, false) && e(49, false, true, false, false), [kd[10], kd[49]]);
  kontrol('50–199 jeton: kaset çalar', e(50, true, false, true, false) && e(199, true, false, true, false), [kd[50], kd[199]]);
  kontrol('200–999 jeton: sert viraj', e(200, false, false, false, true) && e(999, false, false, false, true), [kd[200], kd[999]]);

  // fren dolmuşu durdurur
  await p.evaluate(() => { CanliOyun._test.D.hiz = 3; });
  await O({ tip: 'hediye', kullanici: { id: 'a', ad: 'a' }, jeton: 10 });
  await durumBekle(p, 'dolmuş durdu', () => CanliOyun._test.D.hiz < 0.3, undefined, 6000);
  kontrol('Frende dolmuş durur', (await p.evaluate(() => CanliOyun._test.D.hiz)) < 0.3);

  // havalanma: gönderen kaputa çıkar, dolmuş yükselir, sonra iner, gönderen yerine döner
  await O({ tip: 'hediye', kullanici: { id: 'b', ad: 'b' }, jeton: 1000 });
  d = await durum();
  kontrol('1000+ jeton: dolmuş uçar, gönderen yıldız olur', d.ucus === 'b' && await p.evaluate(() => CanliOyun._test.D.oy.get('b').yildiz), d.ucus);
  await durumBekle(p, 'dolmuş havada', () => CanliOyun._test.D.otoY > 0.5, undefined, 8000);
  await p.locator('#sahne').screenshot({ path: CIKTI + '/d-ucus.png' });
  await durumBekle(p, 'uçuş bitti', () => !CanliOyun.durum().ucus, undefined, 15000);
  const son = await p.evaluate(() => ({ y: CanliOyun._test.D.otoY, yildiz: CanliOyun._test.D.oy.get('b').yildiz }));
  kontrol('Uçuş biter, dolmuş yere iner, gönderen yıldızlıktan çıkar', son.y === 0 && !son.yildiz, son);

  kontrol('Dolmuş testlerinde sayfada hata çıkmadı', hatalar.length === 0, hatalar.slice(0, 4).join(' | '));
  await b.close();
  process.exit(raporla(sonuc) ? 1 : 0);
})().catch(e => { console.error('TEST ÇÖKTÜ', e); process.exit(1); });
