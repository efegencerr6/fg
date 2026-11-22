/* DOLMUŞ DURUMU — koltuklar, kim nereye oturur, hediye etkileri, direksiyonun el değiştirmesi.
 * Dolmuşun kendi ekseni (yerel): x sağa, z arkaya (0 ön cam, 4,5 arka); dünyaya otoNokta ile çevrilir, böylece
 * viraj ve havalanma bütün dolmuşu (içindekilerle) birlikte döndürür ve kaldırır.
 * D'ye eklenenler: yol (gidilen yol, metre), hiz (vuruş başına metre), yaw (dolmuşun dönüşü), otoY (havalanma),
 * fren / kaset / viraj / ucus (etkilerin başladığı vuruş ve süresi), kornaB (son korna), _B (önceki karenin vuruşu).
 * Kancalar: oyunYerlesim, oyunGiris, oyunHediye, oyunLiderDegisti, oyunBaslat, oyunBosalt, oyunDurum.
 */
const TABAN = 0.25;          // dolmuşun tabanının yerden yüksekliği
const OTURAK = 0.3;          // koltuğun tabandan yüksekliği
const KAPI = [1.55, 0.95];   // binenin geldiği yer (sağ ön kapının dışı)

// Yerler, öncelik sırasıyla: şoför (lider), ön koltuklar, üç sıra üçlü koltuk, arka dörtlü, ayakta (toplam 20).
// Sıralar 0,8 m arayla: arkadakinin yüzü öndekinin adının altında kalmasın.
const YERLER = [['sofor', -0.55, 0.42], ['koltuk', 0.15, 0.42], ['koltuk', 0.72, 0.42]];
for (const z of [1.25, 2.05, 2.85])
  YERLER.push(['koltuk', -0.72, z], ['koltuk', -0.13, z], ['koltuk', 0.72, z]);
for (const x of [-0.78, -0.26, 0.26, 0.78])
  YERLER.push(['koltuk', x, 3.7]);
for (const z of [1.65, 2.45, 3.25, 0.9])
  YERLER.push(['ayakta', 0.32, z]);
const KOLTUKLAR = YERLER.filter(y => y[0] !== 'ayakta');

Object.assign(D, { yol: 0, hiz: 1.4, yaw: 0, otoY: 0, otoX: 0, fren: -99, kaset: -99, viraj: null, ucus: null, kornaB: -99, _B: 0 });

// Dolmuşun dönüşümü: her karede oyunGuncelle kurar. Yerel (x, y, z) → dünya.
let OTO = donusum(0, 0, 2, Math.PI);
function otoNokta(x, y, z) { return yerelNokta(OTO, x, y, -(z - 2)); }

function yolcuHazir(k) {
  if (k.yx !== undefined)
    return;
  k.yx = KAPI[0];
  k.yz = KAPI[1];
  k.lurk = 0;
}
// Jetona göre: lider şoför koltuğunda, sonra öndeki koltuklar; koltuk kalmazsa ayakta.
function oyunYerlesim() {
  D.sira.forEach((k, i) => {
    yolcuHazir(k);
    const y = YERLER[Math.min(i, YERLER.length - 1)];
    k.yerTur = y[0];
    k.hx = y[1];
    k.hz = y[2];
    k.sn = i;
  });
}
function oyunGiris(k) {
  k.yx = KAPI[0] + 0.6;
  k.yz = KAPI[1];
}

function oyunHediye(k, jeton, kd) {
  const v = Math.ceil(B);
  k.selam = v;
  if (kd.tip === 'korna')
    D.kornaB = B;
  else if (kd.tip === 'fren') {
    D.fren = v;
    // yayıncı balonları kapatmadıysa gönderen bağırır (çekirdeğin konuşma balonu)
    if (ayar.balon)
      k.balon = { m: 'Müsait bir yerde!', t0: zaman };
  }
  else if (kd.tip === 'kaset') {
    D.kaset = Math.max(D.kaset, v);
    D.kornaB = B;
    konfeti(30, 0.4);
  }
  else if (kd.tip === 'viraj') {
    D.viraj = { b0: v, yon: ozet(k.id + v) % 2 ? 1 : -1 };
    D.sarsinti = Math.max(D.sarsinti, 0.5);
  }
  else if (kd.tip === 'ucus') {
    konfeti(120, 1);
    D.sarsinti = 1;
    if (!D.ucus) {
      D.ucus = { k, b0: v };
      k.yildiz = true;
      pankart('Dolmuş uçuyor!', k.ad + ' kaputun üstünde');
    }
  }
  muzik.sov = B < D.kaset + 16;
}
// Direksiyon el değiştirir: eski şoför arkaya geçer, yeni şoför kasketi takar.
function oyunLiderDegisti(eski, yeni) {
  pankart('Direksiyon el değiştirdi', 'Yeni şoför: ' + yeni.ad);
  konfeti(90, 0.9);
  D.kornaB = B;
  D.sarsinti = Math.max(D.sarsinti, 0.5);
}
function oyunBaslat() {
  for (const k of D.sira) {
    yolcuHazir(k);
    k.yx = k.hx;
    k.yz = k.hz;
    k.yer = 1;
    k.yeni = -9;
  }
  D._B = B;
}
function oyunBosalt() {
  D.fren = -99;
  D.kaset = -99;
  D.viraj = null;
  D.ucus = null;
  D.yaw = 0;
  D.otoY = 0;
  muzik.sov = false;
}
function oyunDurum(d) {
  d.sofor = D.lider ? D.lider.ad : null;
  d.ayakta = D.sira.filter(k => k.yerTur === 'ayakta').length;
  d.hiz = Math.round(D.hiz * 100) / 100;
  d.fren = B < D.fren + 4;
  d.kaset = B < D.kaset + 16;
  d.viraj = !!D.viraj;
  d.ucus = D.ucus ? D.ucus.k.ad : null;
}
