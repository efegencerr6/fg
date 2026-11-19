/* HALAT ÇEKME HAREKETİ — çekişlerin halata geçmesi, turun bitmesi ve yeniden başlaması, herkesin pozu.
 * aktiflikTopla(): takımındakinin yorumu ve beğenisi halatı çeker · halatIlerle(dt): kurdele, tur
 * pehlivanIlerle(): en büyük hediyenin gösterisi · karakterHareket(k, dt) · cekisPoz(k) · hakemHareket(dt)
 * Kancalar: oyunGuncelle(dt), oyunKamera().
 */

// Çekirdek yorumun ve beğeninin kime ait olduğunu oyuna söylemez; sahnedeki izleyicinin k.son'u tazelenir.
// Bunu her karede yakalarız: tazelenen ve o an hediye atmamış olan bir yorum ya da beğeni göndermiştir. O karede
// sayılan beğeniler (D.begeni artışı) onlar arasında bölünür. Yorumun metni balondan okunur (takım seçimi).
function aktiflikTopla() {
  let dB = D.begeni - D._beg;
  D._beg = D.begeni;
  if (dB < 0)
    dB = 0;
  const aktif = [];
  for (const k of D.oy.values()) {
    if (k.cikiyor || (k.takim !== 0 && k.takim !== 1))
      continue;
    if (k.balon && k.balon.t0 !== k._balonT) {
      k._balonT = k.balon.t0;
      const t = yorumTakim(k.balon.m);
      if (t >= 0)
        takimDegistir(k, t);
    }
    if (k.son !== k._son) {
      k._son = k.son;
      if (k._hediyeT !== k.son)
        aktif.push(k);
    }
  }
  for (const k of aktif) {
    const kat = D.koyBit[k.takim] > B ? 2 : 1;
    cekisEkle(MAH[k.takim].yan * (0.035 + Math.min(0.2, dB * 0.008 / aktif.length)) * kat);
    k.cek0 = B;
  }
}

function halatIlerle(dt) {
  const tur = D.tur;
  if (tur.durum === 'cekis') {
    // birikmiş çekiş halata yumuşakça geçer; kalabalık takım çok az da olsa kendi yanına ağır basar
    const n = mahalleSay(), gec = D.itme * Math.min(1, dt * 2.2);
    D.itme -= gec;
    D.ip += gec + (n[1] - n[0]) * 0.0025 * dt;
    if (Math.abs(D.ip) >= KAZAN) {
      // olay selinde bir karede çizginin çok ötesine geçmesin
      D.ip = Math.sign(D.ip) * KAZAN;
      turBitir(D.ip > 0 ? 1 : 0);
    }
  }
  else if (tur.durum === 'bitti') {
    D.ip += (Math.sign(D.ip) * (KAZAN + 0.12) - D.ip) * Math.min(1, dt * 3);
    if (B >= tur.bit) {
      tur.durum = 'donus';
      for (const k of D.oy.values())
        k.dus = false;
    }
  }
  else {
    D.ip += (0 - D.ip) * Math.min(1, dt * 1.6);
    if (Math.abs(D.ip) < 0.02) {
      D.ip = 0;
      tur.durum = 'cekis';
      tur.kazanan = -1;
      pankart('Yeni tur', 'Asılın!');
    }
  }
}
function turBitir(t) {
  const tur = D.tur, v = Math.ceil(B);
  tur.durum = 'bitti';
  tur.kazanan = t;
  tur.bit = v + 8;
  D.itme = 0;
  D.skor[t]++;
  // kaybedenin ön sırası çamura düşer, kazananlar halatı bırakıp sevinir
  for (const k of D.oy.values()) {
    if (k.takim === 1 - t && k.onde < SUTUN)
      k.dus = true;
    if (k.takim === t) {
      k.zip0 = v;
      k.zip1 = v + 6;
    }
  }
  pankart(MAH[t].ad + ' kazandı!', 'Skor ' + D.skor[0] + ' – ' + D.skor[1]);
  konfeti(110, 1);
  D.sarsinti = 0.8;
  camurSicrat(MAH[1 - t].yan);
}

// Pehlivan: iki vuruş büyür, sonra halatı turu bitirecek kadar kendi yanına çeker; 12 vuruş sonra eski boyuna döner.
function pehlivanIlerle() {
  const p = D.pehlivan;
  if (!p)
    return;
  const k = p.k;
  if (!D.oy.has(k.id) || k.cikiyor) {
    pehlivanBitir();
    return;
  }
  const u = B - p.b0;
  k.g.boy = k.g0.boy * (1 + 0.45 * yumusak(clamp(u / 2, 0, 1)));
  k.basOlcek = 1 + 0.25 * yumusak(clamp(u / 2, 0, 1));
  if (u >= 2 && !p.cekti) {
    p.cekti = true;
    const yan = MAH[k.takim].yan;
    cekisEkle(yan * (KAZAN + 0.15) - D.ip);
    D.sarsinti = 1;
  }
  if (u >= 12)
    pehlivanBitir();
}
function pehlivanBitir() {
  const k = D.pehlivan.k;
  k.g.boy = k.g0.boy;
  k.basOlcek = 1;
  k.yildiz = false;
  D.pehlivan = null;
  oyunYerlesim();
}

function oyunGuncelle(dt) {
  aktiflikTopla();
  pehlivanIlerle();
  halatIlerle(dt);
  muzik.sov = B < Math.max(D.koyBit[0], D.koyBit[1]);
  for (const k of D.oy.values())
    karakterHareket(k, dt);
  hakemHareket(dt);
}

function karakterHareket(k, dt) {
  if (k.takim !== 0 && k.takim !== 1)
    mahalleHazir(k);
  const yan = MAH[k.takim].yan;
  // takım halatla birlikte kayar: herkesin yeri, kendi yeri + kurdelenin kayması
  const hx = k.cikiyor ? yan * 8 : k.hedefX + D.ip, hz = k.hedefZ;
  const dx = hx - k.x, dz = hz - k.z, uz = Math.hypot(dx, dz);
  if (uz > 0.002) {
    const adim = Math.min(uz, (2.4 + uz * 1.4) * dt);
    k.x += dx / uz * adim;
    k.z += dz / uz * adim;
  }
  k.yer += ((uz < 0.25 && !k.cikiyor ? 1 : 0) - k.yer) * Math.min(1, dt * 6);
  if (k.cikiyor)
    k.gitti = Math.abs(k.x) > 7.5;
  if (k.yer > 0.5) {
    // yerindeyken gövde ortaya (rakibe) döner, baş kameraya kırılır ki yüzü görünsün
    const bak = -yan * HP;
    k.yon += aciFark(k.yon, bak) * Math.min(1, dt * 8);
    k.basYon = k.yon - yan * 1.05;
    cekisPoz(k);
  }
  else {
    const bak = uz > 0.05 ? Math.atan2(dx, dz) : Math.PI;
    k.yon += aciFark(k.yon, bak) * Math.min(1, dt * 8);
    k.basYon = undefined;
    const poz = pozBekle(k);
    k.kos = (k.kos || 0) + dt * (uz > 0.05 ? 1 : 0);
    poz.aS[1] = Math.sin(k.kos * 9) * 0.12;
    poz.aL[1] = -Math.sin(k.kos * 9) * 0.12;
    const W = iskeletKur(k, poz);
    k.j.haR = W(-0.2, poz.hipY + 0.08, Math.sin(k.kos * 9) * 0.08);
    k.j.haL = W(0.2, poz.hipY + 0.08, -Math.sin(k.kos * 9) * 0.08);
    k.kolBoy = 1;
    kolKur(k);
  }
}

// Çekiş pozu: arkaya yaslanır, ön ayak ileride, iki el halatta. Her davul vuruşunda biraz daha asılır ("hıh").
// Üstüne binenler: takımın "hep beraber"i, kişinin kendi çekişi, ayak kaydı, çamura düşme, kazanınca sevinç.
function cekisPoz(k) {
  const t = k.takim, yan = MAH[t].yan, ic = -yan, tur = D.tur;
  const kendi = clamp(1 - (B - k.cek0) / 1.5, 0, 1);
  const hep = B < D.hepBit[t] ? 0.6 + 0.4 * calgi.dumP : 0;
  const koy = B < D.koyBit[t] ? 0.3 : 0;
  const g = Math.min(1.4, 0.35 + 0.35 * calgi.dumP + kendi * 0.6 + hep + koy + D.cosku * 0.25);
  const kazandi = tur.durum === 'bitti' && tur.kazanan === t;
  const ropeZ = k.z - 0.16;
  k.kolBoy = 1.25;
  k.elSekil = { R: 'yumruk', L: 'yumruk' };

  if (k.dus) {
    // çamurda oturur, elleri havada
    const poz = pozOtur(k, 0.04), W = iskeletKur(k, poz), s = Math.sin(TAU * B) * 0.06;
    k.y0 = -0.04;
    k.j.haR = W(-0.24, poz.hipY + 0.42 + s, 0.12);
    k.j.haL = W(0.24, poz.hipY + 0.42 - s, 0.12);
    k.elSekil = { R: 'avuc', L: 'avuc' };
    kolKur(k);
    return;
  }
  k.y0 = 0;
  if (kazandi) {
    const poz = pozBekle(k), zip = B >= k.zip0 && B < k.zip1 ? 0.22 * Math.abs(Math.sin(Math.PI * (B - k.zip0))) : 0;
    poz.hipY += zip;
    poz.aS[2] += zip * 0.8;
    poz.aL[2] += zip * 0.8;
    const W = iskeletKur(k, poz);
    k.j.haR = W(-0.2, poz.hipY + 0.62 + zip, 0.05);
    k.j.haL = W(0.2, poz.hipY + 0.62 + zip, 0.05);
    k.elSekil = { R: 'avuc', L: 'avuc' };
    k.kolBoy = 1.2;
    kolKur(k);
    return;
  }
  const kay = B >= k.kay0 && B < k.kay0 + 3 ? Math.sin(Math.PI * (B - k.kay0) / 3) : 0;
  const zip = B >= k.zip0 && B < k.zip1 ? 0.1 * Math.abs(Math.sin(Math.PI * (B - k.zip0))) : 0;
  const poz = {
    hipX: 0, hipY: KALCA - 0.035 - 0.03 * g - kay * 0.06 + zip, egim: -0.06 - 0.06 * g + kay * 0.2, yat: 0, omL: 0, omR: 0,
    aS: [-0.085, 0.12 + kay * 0.16, zip * 0.6], aL: [0.085, -0.1 - 0.03 * g, zip * 0.6]
  };
  iskeletKur(k, poz);
  // eller halatta: öndeki el ortaya doğru, arkadaki gövdenin hizasında
  const boy = k.g.boy, hy = k.y0 + IP_Y * (tur.durum === 'cekis' ? 1 : 0.85) + zip * boy * 0.5;
  k.j.haR = [k.x + ic * 0.27 * boy, hy, ropeZ];
  k.j.haL = [k.x + ic * 0.08 * boy, hy - 0.01, ropeZ];
  kolKur(k);
}

// Hakem halatın ortasında, takımların arkasında durur; tur bitince bayrağı kazananın yanına kaldırır.
function hakemHareket(dt) {
  hakem.z += (hakemZ() - hakem.z) * Math.min(1, dt * 3);
  hakem.x += (D.ip * 0.3 - hakem.x) * Math.min(1, dt * 3);
  const yan = D.tur.durum === 'bitti' ? MAH[D.tur.kazanan].yan : 0;
  hakem.yon = Math.PI;
  const poz = pozBekle(hakem), W = iskeletKur(hakem, poz);
  // Hakem kameraya bakar: W'nin "yana" ekseni dünyada +x'tir, sol eli (L) +x yanındadır. Bayrak hep o yandaki
  // elde: kazanan soldaysa sağ el, sağdaysa sol el yana uzanır; tur sürerken bayrak sol elde, havada.
  const el = yan < 0 ? 'R' : 'L', oteki = el === 'L' ? 'R' : 'L', es = el === 'L' ? 1 : -1;
  if (yan)
    hakem.j['ha' + el] = W(es * 0.55, poz.hipY + 0.5, 0.05);
  else
    hakem.j['ha' + el] = W(es * 0.2, poz.hipY + 0.62 + 0.03 * Math.sin(TAU * B), 0.08);
  hakem.j['ha' + oteki] = W(-es * 0.2, poz.hipY + 0.07, 0.06);
  hakem.bayrakEl = el;
  hakem.bayrakYan = yan;
  hakem.elSekil = { [el]: 'yumruk' };
  hakem.kolBoy = 1.2;
  kolKur(hakem);
}

// Kadraj: iki takımın en geniş hâli kadar (en az iki sütun), arka sıraya ve hakeme kadar. Halat kayınca takımlar
// da kaydığı için kenara kurdelenin en çok kayacağı kadar pay eklenir.
function oyunKamera() {
  const n = mahalleSay(), sutun = clamp(Math.max(n[0], n[1], 2), 2, SUTUN);
  const w = ON_BOS + (sutun - 1) * ARA_X + (D.satir > 1 ? ARA_X / 2 : 0) + KAZAN * 0.6;
  const arka = (D.satir - 1) * ARA_Z;
  return { noktalar: [[-w, 0], [w, 0], [-w, arka], [w, arka], [0, hakemZ()]], x: 0, ustPx: 36 };
}
