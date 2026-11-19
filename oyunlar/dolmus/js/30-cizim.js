/* DOLMUŞ ÇİZİMİ — akan yol, kaldırım, ağaçlar ve direkler; üstü açık dolmuş (taban, tekerler, yanlar, koltuklar,
 * tutamak, kaput, ön cam ve hat tabelası); korna, kaset notaları, hız çizgileri.
 * Dolmuşun parçaları otoKutu ile yerel ölçüde kurulur (OTO dönüşümü, 10-durum.js).
 * Kancalar: oyunZemin(), oyunCiz(), oyunUst(dt).
 */
const GOVDE = '#f2c84b', SERIT_KIRMIZI = '#d8402f', KOLTUK = '#7a2f3a', CAM = 'rgba(190,228,255,0.16)';

// Yerel kutu (x sağa, z arkaya): kutuCiz'in yerel ekseninde ileri = -(z - 2).
function otoKutu(x0, x1, y0, y1, z0, z1, renk, cizgi) {
  return kutuCiz(OTO, x0, x1, y0, y1, 2 - z1, 2 - z0, renk, cizgi === undefined ? 1.5 : cizgi);
}
function otoDerinlik(x, y, z) { return pr(otoNokta(x, y, z)).d; }
function yolCokgen(nok, renk) {
  const p = nok.map(([x, z]) => pr([x, 0, z]));
  if (p.some(q => !q.ok))
    return;
  cokgenCiz(p, renk);
}

let gokBoya = null;
function oyunZemin() {
  if (!gokBoya) {
    gokBoya = c.createLinearGradient(0, 0, 0, GH);
    gokBoya.addColorStop(0, '#6f9c4a');
    gokBoya.addColorStop(1, '#4f7d35');
  }
  c.fillStyle = gokBoya;
  c.fillRect(0, 0, GW, GH);
  const Z0 = -6, Z1 = 40;
  // kaldırımlar, asfalt, kenar çizgileri
  yolCokgen([[-5.2, Z0], [5.2, Z0], [5.2, Z1], [-5.2, Z1]], '#b8b1a2');
  yolCokgen([[-3.1, Z0], [3.1, Z0], [3.1, Z1], [-3.1, Z1]], '#8a8a8a');
  yolCokgen([[-2.95, Z0], [2.95, Z0], [2.95, Z1], [-2.95, Z1]], '#4b4f5a');
  for (const x of [-2.75, 2.75])
    yolCokgen([[x - 0.06, Z0], [x + 0.06, Z0], [x + 0.06, Z1], [x - 0.06, Z1]], '#f4f1e6');
  // kaldırım taşları: yol aktıkça geriye kayar
  const yol = D.yol % 1.2;
  for (const yan of [-1, 1])
    for (let z = Z0 - 1.2; z < Z1; z += 1.2) {
      const zz = z + yol, x0 = yan * 3.1, x1 = yan * 5.2;
      yolCokgen([[x0, zz], [x1, zz], [x1, zz + 0.05], [x0, zz + 0.05]], 'rgba(90,80,70,0.35)');
    }
  // orta şerit: kesikli, dolmuşun solunda
  const kes = D.yol % 4;
  for (let z = Z0 - 4; z < Z1; z += 4) {
    const zz = z + kes;
    yolCokgen([[-1.62, zz], [-1.5, zz], [-1.5, zz + 1.7], [-1.62, zz + 1.7]], '#f4f1e6');
  }
  // dolmuşun gölgesi: havalanınca küçülür, açılır
  const g = 1 - D.otoY * 0.5;
  const gp = [[-1.15, -0.75], [1.15, -0.75], [1.15, 4.3], [-1.15, 4.3]].map(([x, z]) => pr([D.otoX + x * g, 0, z * g + 2 * (1 - g)]));
  if (gp.every(q => q.ok)) {
    c.globalAlpha = 0.35 * g;
    cokgenCiz(gp, '#10131c');
    c.globalAlpha = 1;
  }
  // tekerler (gövdenin altından görünür) ve taban: en altta, her şeyden önce
  for (const z of [-0.3, 3.5])
    for (const x of [-1.04, 1.04])
      tekerCiz(x, z);
  const t = [otoNokta(-1.08, TABAN, -0.05), otoNokta(1.08, TABAN, -0.05), otoNokta(1.08, TABAN, 4.25), otoNokta(-1.08, TABAN, 4.25)].map(pr);
  if (t.every(q => q.ok)) {
    cokgenCiz(t, '#5b4d43', 2);
    // taban oluklu lastik
    c.strokeStyle = 'rgba(30,20,15,0.35)';
    c.lineWidth = 1;
    for (let z = 0.2; z < 4.2; z += 0.3) {
      const a = pr(otoNokta(-1.0, TABAN, z)), b = pr(otoNokta(1.0, TABAN, z));
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(b.x, b.y);
      c.stroke();
    }
  }
}
function tekerCiz(x, z) {
  const m = pr(otoNokta(x, 0.24, z));
  if (!m.ok)
    return;
  const don = (D.yol * 3) % TAU;
  c.fillStyle = '#16181f';
  c.beginPath();
  c.ellipse(m.x, m.y, 0.14 * m.s, 0.24 * m.s, 0, 0, TAU);
  c.fill();
  c.strokeStyle = '#8f939e';
  c.lineWidth = Math.max(1, m.s * 0.02);
  c.beginPath();
  c.ellipse(m.x, m.y, 0.07 * m.s, 0.12 * m.s, don, 0, TAU);
  c.stroke();
}

function oyunCiz() {
  for (const k of D.oy.values())
    if (insanEkle(k) && k.yerTur === 'sofor' && k.direksiyon)
      direksiyonCiz(k);
  koltuklarCiz();
  govdeCiz();
  cevreCiz();
}

function koltuklarCiz() {
  for (const [tur, x, z] of KOLTUKLAR) {
    const m = otoDerinlik(x, TABAN + 0.3, z + 0.05);
    ozel(m + 0.05, () => {
      otoKutu(x - 0.25, x + 0.25, TABAN + 0.05, TABAN + OTURAK, z - 0.16, z + 0.2, KOLTUK);
      otoKutu(x - 0.26, x + 0.26, TABAN + OTURAK, TABAN + 0.86, z + 0.2, z + 0.3, tur === 'sofor' ? '#2c2f3a' : '#8a3644');
    });
  }
  // ayakta duranların tutamağı: koridor boyunca
  const a = pr(otoNokta(0.32, TABAN + 1.34, 0.7)), b = pr(otoNokta(0.32, TABAN + 1.34, 3.4));
  if (a.ok && b.ok) {
    kap(a, 0.022, b, 0.022, '#c9ccd4');
    for (const [z, p] of [[0.7, a], [3.4, b]]) {
      const yer = pr(otoNokta(0.32, TABAN, z));
      if (yer.ok)
        kap(p, 0.02, yer, 0.02, '#c9ccd4');
    }
  }
}

function govdeCiz() {
  // yan duvarlar: parça parça, ki aradaki yolcularla derinliği doğru sıralansın. Sağda ön kapı açık.
  for (let z = -0.05; z < 4.2; z += 0.5) {
    const z1 = Math.min(4.25, z + 0.5);
    for (const yan of [-1, 1]) {
      if (yan > 0 && z1 > 0.55 && z < 1.3)
        continue;
      const x0 = yan < 0 ? -1.08 : 1.0, x1 = yan < 0 ? -1.0 : 1.08;
      ozel(otoDerinlik(yan * 1.04, 0.6, (z + z1) / 2), () => {
        otoKutu(x0, x1, TABAN - 0.1, 0.98, z, z1, GOVDE, 1.2);
        // kırmızı şerit
        const g = [otoNokta(yan * 1.085, 0.6, z), otoNokta(yan * 1.085, 0.6, z1), otoNokta(yan * 1.085, 0.7, z1), otoNokta(yan * 1.085, 0.7, z)].map(pr);
        if (g.every(q => q.ok))
          cokgenCiz(g, SERIT_KIRMIZI);
      });
    }
  }
  // arka duvar ve arka cam
  ozel(otoDerinlik(0, 0.7, 4.2), () => {
    otoKutu(-1.08, 1.08, TABAN - 0.1, 1.2, 4.15, 4.25, GOVDE);
  });
  // ön: torpido, kaput, tampon, farlar
  ozel(otoDerinlik(0, 0.5, -0.35), () => {
    otoKutu(-1.08, 1.08, 0.18, 0.72, -0.65, -0.05, GOVDE);
    otoKutu(-1.12, 1.12, 0.12, 0.3, -0.75, -0.63, '#c9ccd4');
    for (const x of [-0.75, 0.75]) {
      const f = pr(otoNokta(x, 0.52, -0.66));
      daireCiz(f, 0.12, B - D.kornaB < 1 && Math.sin(TAU * B * 4) > 0 ? '#fff6b0' : '#f6f1df', 1.5);
    }
    // ızgara
    const iz = [otoNokta(-0.45, 0.34, -0.655), otoNokta(0.45, 0.34, -0.655), otoNokta(0.45, 0.62, -0.655), otoNokta(-0.45, 0.62, -0.655)].map(pr);
    if (iz.every(q => q.ok))
      cokgenCiz(iz, '#2c2f3a', 1.5);
  });
  ozel(otoDerinlik(0, 0.6, 0.02), () => {
    otoKutu(-1.02, 1.02, TABAN, 0.86, -0.08, 0.1, '#2c2f3a');
  });
  // ön cam: saydam, iki yan dikme ve üstte hat tabelası
  const cam = [otoNokta(-1.04, 0.86, -0.05), otoNokta(1.04, 0.86, -0.05), otoNokta(1.0, 1.6, 0.25), otoNokta(-1.0, 1.6, 0.25)].map(pr);
  if (cam.every(q => q.ok)) {
    ozel(cam[0].d - 0.6, () => {
      cokgenCiz(cam, CAM);
      c.strokeStyle = 'rgba(255,255,255,0.35)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(lerp(cam[0].x, cam[1].x, 0.15), lerp(cam[0].y, cam[3].y, 0.2));
      c.lineTo(lerp(cam[0].x, cam[1].x, 0.3), lerp(cam[0].y, cam[3].y, 0.75));
      c.stroke();
    });
    for (const [a, b] of [[0, 3], [1, 2]])
      kap(cam[a], 0.035, cam[b], 0.035, '#2c2f3a', cam[a].d - 0.62);
    tabelaCiz();
  }
}
function tabelaCiz() {
  const k = [otoNokta(-0.75, 1.82, 0.27), otoNokta(0.75, 1.82, 0.27), otoNokta(0.75, 1.56, 0.25), otoNokta(-0.75, 1.56, 0.25)].map(pr);
  if (!k.every(q => q.ok))
    return;
  ozel(k[2].d - 0.65, () => {
    cokgenCiz(k, '#fff4dc', 1.5);
    const m = pr(otoNokta(0, 1.69, 0.26));
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '700 ' + Math.round(0.13 * m.s) + 'px Rubik, system-ui, sans-serif';
    c.fillStyle = '#1d2433';
    c.fillText('MEYDAN – ÇARŞI', m.x, m.y);
  });
}
function direksiyonCiz(k) {
  const m = pr(k.direksiyon);
  if (!m.ok)
    return;
  ozel(m.d - 0.02, () => {
    c.strokeStyle = '#1b1d26';
    c.lineWidth = Math.max(2, m.s * 0.035);
    c.beginPath();
    c.ellipse(m.x, m.y, 0.15 * m.s, 0.08 * m.s, k.direksiyonDon * 0.6, 0, TAU);
    c.stroke();
  });
}

// Kaldırımda ağaçlar ve sokak lambaları: yol aktıkça geriye (uzağa) kayar.
function cevreCiz() {
  const boy = 36;
  for (let i = 0; i < 12; i++) {
    const yan = i % 2 ? 1 : -1, z = ((i * 3 + D.yol) % boy) - 6, x = yan * (i % 4 < 2 ? 4.2 : 3.6);
    if (i % 4 < 2)
      agacCiz(x, z, i);
    else
      lambaCiz(x, z, yan);
  }
}
function agacCiz(x, z, i) {
  const a = pr([x, 0, z]), b = pr([x, 1.2, z]);
  if (!a.ok || !b.ok)
    return;
  kap(a, 0.09, b, 0.07, '#6b4426');
  const yesil = ['#3f7d3a', '#4f8f44', '#367035'][i % 3];
  for (const [dx, dy, r] of [[0, 1.55, 0.6], [-0.35, 1.3, 0.45], [0.35, 1.35, 0.45]]) {
    const p = pr([x + dx, dy + 0.03 * Math.sin(TAU * B / 2 + i), z]);
    if (p.ok)
      top(p, r, yesil, p.d, 1.5);
  }
}
function lambaCiz(x, z, yan) {
  const a = pr([x, 0, z]), b = pr([x, 2.4, z]), u = pr([x - yan * 0.5, 2.4, z]);
  if (!a.ok || !b.ok || !u.ok)
    return;
  kap(a, 0.05, b, 0.04, '#3b3f4c');
  kap(b, 0.035, u, 0.035, '#3b3f4c');
  top(u, 0.1, '#fff1b8', u.d - 0.01, 1.5);
}

// Üste: korna yazısı, kaset notaları, hızlıyken yanlarda hız çizgileri.
function oyunUst() {
  if (B - D.kornaB < 1.5) {
    const m = pr(otoNokta(0, 1.0, -0.9)), t = (B - D.kornaB) / 1.5;
    if (m.ok) {
      c.save();
      c.globalAlpha = 1 - t;
      c.textAlign = 'center';
      c.font = Math.round(0.42 * m.s * (1 + t * 0.4)) + 'px "Paytone One", Rubik, system-ui, sans-serif';
      c.lineWidth = Math.max(3, m.s * 0.05);
      c.strokeStyle = MUREKKEP;
      c.strokeText('DIT DIIT!', m.x, m.y - t * 40);
      c.fillStyle = RENK.vurgu;
      c.fillText('DIT DIIT!', m.x, m.y - t * 40);
      c.restore();
    }
  }
  if (B < D.kaset + 16) {
    c.font = '30px Rubik, system-ui, sans-serif';
    c.textAlign = 'center';
    for (let i = 0; i < 6; i++) {
      const t = (B * 0.5 + i / 6) % 1, p = pr(otoNokta(-0.9 + i * 0.36, 1.4 + t * 1.4, 1.2 + (i % 3) * 1.2));
      if (!p.ok)
        continue;
      c.globalAlpha = Math.sin(t * Math.PI);
      c.fillStyle = ['#ffd166', '#ef5a3c', '#2fc4b2'][i % 3];
      c.fillText(i % 2 ? '♪' : '♫', p.x, p.y);
    }
    c.globalAlpha = 1;
  }
  if (D.hiz > 2.6) {
    const a = clamp((D.hiz - 2.6) / 2, 0, 1);
    c.strokeStyle = 'rgba(255,255,255,' + (0.5 * a).toFixed(2) + ')';
    c.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
      const yan = i % 2 ? 1 : -1, z = ((i * 1.7 + D.yol * 1.5) % 9) - 1, p0 = pr([yan * 1.7, 0.6 + (i % 3) * 0.3, z]), p1 = pr([yan * 1.7, 0.6 + (i % 3) * 0.3, z + 1.2]);
      if (p0.ok && p1.ok) {
        c.beginPath();
        c.moveTo(p0.x, p0.y);
        c.lineTo(p1.x, p1.y);
        c.stroke();
      }
    }
  }
}
