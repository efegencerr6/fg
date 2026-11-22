/* KÖYLÜLER — meydan boşken de maç sürsün diye her takımda iki köylü (oyunun kendi karakteri, izleyici değil).
 * Bir takımda gerçek izleyici ikiden azsa eksik kadar köylü halata geçer ve kendiliğinden asılır; izleyici geldikçe
 * köylüler sahneden çıkar. Köylüler D.oy'da durmaz: sıralamaya, lider tablosuna, jetona girmez; adları hakem gibi
 * oyunEkAdlar'dan, "özel" etiketle (vurgu renginde) gelir. Gerçek yayında da görünürler: sahte izleyici değil, köyün
 * kendi pehlivanlarıdır (çekirdeğin sahte izleyicisi gerçek yayında yine kapalıdır).
 * herkes(): sahnedeki izleyiciler + görünen köylüler · koyluGuncelle(): hangi köylü sahnede · koyluCek(): kendi çekişleri
 */
const KOYLU_SAYI = 2;
const KOYLULER = [[0, 'Muhtar', 'kasket', true], [0, 'Demirci', 'bere', true], [1, 'Bekçi', 'kasket', true], [1, 'Çoban', 'bere', false]].map(([t, ad, baslik, biyik], i) => {
  const k = karakterYap('__koylu' + i, ad);
  Object.assign(k, { mod: 'koylu', ozel: true, takim: t, _son: -1, _balonT: -1, kay0: -9, cek0: -9, aktif: false, gorunur: false, cikiyor: true, gitti: true });
  Object.assign(k.g, { kadin: false, baslik, biyik, boy: 1.04 + i * 0.03 });
  k.g0 = { yelek: k.g.yelek, gomlek: k.g.gomlek, kusak: k.g.kusak, boy: k.g.boy, baslik };
  k.x = MAH[t].yan * 7.6;
  formaGiy(k);
  return k;
});
Object.assign(D, { koyluYan: 0, _koyluB: -1 });

function herkes() {
  const l = [...D.oy.values()];
  for (const k of KOYLULER)
    if (k.gorunur)
      l.push(k);
  return l;
}
// İzleyici sayısına göre her takımda kaç köylü kalacağını seçer; çıkan köylü kendi yanından sahneyi terk eder.
function koyluGuncelle() {
  const n = mahalleSay(), say = [0, 0];
  for (const k of KOYLULER) {
    const aktif = say[k.takim] < KOYLU_SAYI - n[k.takim];
    say[k.takim]++;
    if (aktif && !k.aktif) {
      k.cikiyor = false;
      k.gitti = false;
      k.yer = 0;
      k.x = MAH[k.takim].yan * 7;
    }
    if (!aktif && k.aktif)
      k.cikiyor = true;
    k.aktif = aktif;
  }
}
// Köylüler takımın en arkasında durur; izleyiciler önde.
function koyluEkle(ekip) {
  for (const k of KOYLULER)
    if (k.aktif)
      ekip[k.takim].push(k);
}
// Köylülerin çekişi: her vuruşta yarı yarıya asılırlar; sekiz vuruşta bir şans bir takımdan yana döner, böylece
// meydan boşken de kurdele bir yana kayar, tur yaklaşık bir dakikada biter. İzleyicinin çekişi bundan güçlüdür.
function koyluCek() {
  const v = Math.floor(B);
  if (v === D._koyluB || D.tur.durum !== 'cekis')
    return;
  D._koyluB = v;
  if (v % 8 === 0)
    D.koyluYan = Math.random() < 0.5 ? 0 : 1;
  for (const k of KOYLULER) {
    if (!k.aktif || k.yer < 0.5)
      continue;
    if (Math.random() < (k.takim === D.koyluYan ? 0.68 : 0.32)) {
      cekisEkle(MAH[k.takim].yan * 0.06);
      k.cek0 = B;
    }
  }
}
function koyluHareket(dt) {
  for (const k of KOYLULER) {
    if (!k.gorunur && !k.aktif)
      continue;
    karakterHareket(k, dt);
    k.gorunur = k.aktif || !k.gitti;
  }
}
