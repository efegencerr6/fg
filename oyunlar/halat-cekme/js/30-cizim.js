/* HALAT ÇEKME ÇİZİMİ — çayır, toprak meydan, çamur çukuru, tebeşir çizgileri, halatlar, kurdele, hakem ve
 * bayrağı, skor tabelası, saman balyaları, sıçrayan çamur.
 * Kancalar: oyunZemin(), oyunCiz(), oyunUst(dt), oyunEkAdlar().
 */
const HALAT = '#c9a062', HALAT_KOYU = '#8a6a3a', CAMUR = '#6b4a2b', TOPRAK = '#d8b77e';
const camurDamla = [];

function yerNokta(x, z) { return pr([x, 0, z]); }
function yerCokgen(noktalar, renk, cizgi) {
  const p = noktalar.map(([x, z]) => yerNokta(x, z));
  if (p.some(q => !q.ok))
    return;
  c.beginPath();
  p.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
  c.closePath();
  c.fillStyle = renk;
  c.fill();
  if (cizgi) {
    c.strokeStyle = cizgi;
    c.lineWidth = 2;
    c.stroke();
  }
}

let cayirBoya = null;
function oyunZemin() {
  if (!cayirBoya) {
    cayirBoya = c.createLinearGradient(0, 0, 0, GH);
    cayirBoya.addColorStop(0, '#5f8f3a');
    cayirBoya.addColorStop(0.5, '#7fae4e');
    cayirBoya.addColorStop(1, '#6f9f44');
  }
  c.fillStyle = cayirBoya;
  c.fillRect(0, 0, GW, GH);
  // çayırda çim tutamları: yere sabit, kamera kayınca birlikte kayar
  c.strokeStyle = 'rgba(40,70,20,0.35)';
  c.lineWidth = 2;
  for (let i = 0; i < 70; i++) {
    const x = ((i * 37) % 23) - 11.5, z = ((i * 53) % 17) - 5, p = yerNokta(x, z);
    if (!p.ok || p.y < 0 || p.y > GH)
      continue;
    const h = 0.12 * p.s;
    c.beginPath();
    c.moveTo(p.x - h * 0.3, p.y);
    c.lineTo(p.x - h * 0.5, p.y - h);
    c.moveTo(p.x, p.y);
    c.lineTo(p.x, p.y - h * 1.2);
    c.moveTo(p.x + h * 0.3, p.y);
    c.lineTo(p.x + h * 0.5, p.y - h);
    c.stroke();
  }
  const arka = (D.satir - 1) * ARA_Z, w = ON_BOS + SUTUN * ARA_X + 0.8;
  // toprak meydan
  yerCokgen([[-w, -0.9], [w, -0.9], [w, arka + 0.7], [-w, arka + 0.7]], TOPRAK, '#b08f5a');
  // çamur çukuru: kenarı vuruşla hafifçe kabarır
  const cm = [], n = 18, kab = 1 + 0.02 * calgi.dumP;
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, rx = 0.8 * kab + 0.05 * Math.sin(i * 2.7), rz = (arka + 1.3) / 2 * kab + 0.06 * Math.cos(i * 3.1);
    cm.push([Math.cos(a) * rx, arka / 2 + Math.sin(a) * rz]);
  }
  yerCokgen(cm, CAMUR, '#4a3019');
  yerCokgen(cm.map(([x, z]) => [x * 0.62 + 0.05, arka / 2 + (z - arka / 2) * 0.7]), '#7d5835');
  // çamur kabarcıkları
  for (let i = 0; i < 6; i++) {
    const t = ((B * 0.5 + i * 0.37) % 1), x = Math.sin(i * 4.1) * 0.45, z = arka / 2 + Math.cos(i * 2.3) * (arka / 2 + 0.3), p = yerNokta(x, z);
    if (p.ok) {
      c.strokeStyle = 'rgba(40,24,10,' + (0.6 * (1 - t)).toFixed(2) + ')';
      c.lineWidth = 1.5;
      c.beginPath();
      c.ellipse(p.x, p.y, 0.06 * p.s * t, 0.03 * p.s * t, 0, 0, TAU);
      c.stroke();
    }
  }
  // tebeşir çizgileri: kurdele bunlardan birini geçince tur biter
  for (const yan of [-1, 1]) {
    const x = yan * KAZAN;
    yerCokgen([[x - 0.04, -0.75], [x + 0.04, -0.75], [x + 0.04, arka + 0.55], [x - 0.04, arka + 0.55]], 'rgba(255,255,255,0.88)');
    // çizginin önünde mahallenin rengi
    yerCokgen([[x - 0.18, -0.85], [x + 0.18, -0.85], [x + 0.18, -0.68], [x - 0.18, -0.68]], MAH[yan < 0 ? 0 : 1].renk);
  }
  for (const k of herkes())
    if (!k.dus)
      golge(k.x, k.z, 0.27 * k.g.boy, 0.13 * k.g.boy);
  golge(hakem.x, hakem.z, 0.27 * hakem.g.boy, 0.13 * hakem.g.boy);
  // altın kemerlinin ayağında altın halka
  if (D.lider && D.lider.yer > 0.5) {
    const g = yerNokta(D.lider.x, D.lider.z);
    if (g.ok) {
      const r = 1 + 0.08 * Math.sin(B * TAU);
      c.strokeStyle = ALTIN;
      c.lineWidth = Math.max(2, g.s * 0.035);
      c.beginPath();
      c.ellipse(g.x, g.y, 0.4 * g.s * r, 0.2 * g.s * r, 0, 0, TAU);
      c.stroke();
    }
  }
}

function oyunCiz() {
  for (const k of herkes())
    insanEkle(k);
  if (insanEkle(hakem))
    bayrakCiz();
  halatlarCiz();
  tabelaCiz();
  const w = ON_BOS + SUTUN * ARA_X + 0.5, arka = (D.satir - 1) * ARA_Z;
  for (const [x, z] of [[-w, -0.4], [w, -0.4], [-w - 0.3, arka + 0.5], [w + 0.3, arka + 0.5]])
    balyaCiz(x, z);
}

// Her sıranın bir halatı var. Halat iki takımın o sıradaki en arkadakisinin biraz gerisine kadar uzanır; bir
// takımın o sırada kimsesi yoksa halatın ucu o takımın ön hizasında yerde yatar.
function halatlarCiz() {
  for (let s = 0; s < D.satir; s++) {
    const z = s * ARA_Z - 0.16;
    let sol = null, sag = null;
    for (const k of herkes()) {
      if (k.sira !== s || k.yer < 0.5 || k.cikiyor || k.dus)
        continue;
      if (k.takim === 0)
        sol = sol === null ? k.x : Math.min(sol, k.x);
      else
        sag = sag === null ? k.x : Math.max(sag, k.x);
    }
    const y = IP_Y * (D.tur.durum === 'cekis' ? 1 : 0.85);
    const nok = [];
    if (sol === null)
      nok.push([D.ip - ON_BOS * 0.8, 0.03]);
    else
      nok.push([sol - 0.45, 0.03], [sol - 0.12, y]);
    if (sag === null)
      nok.push([D.ip + ON_BOS * 0.8, 0.03]);
    else
      nok.push([sag + 0.12, y], [sag + 0.45, 0.03]);
    // uzun parçaları böl ki derinlik sıralaması insanların arasında doğru çıksın
    let onceki = null;
    for (let i = 0; i < nok.length - 1; i++) {
      const [x0, y0] = nok[i], [x1, y1] = nok[i + 1], adim = Math.max(1, Math.ceil(Math.abs(x1 - x0) / 0.35));
      for (let j = 0; j <= adim; j++) {
        const t = j / adim, sark = (y0 === y1 ? Math.sin(t * Math.PI) * 0.03 : 0), p = pr([lerp(x0, x1, t), lerp(y0, y1, t) - sark, z]);
        if (onceki && p.ok && onceki.ok)
          kap(onceki, 0.042, p, 0.042, HALAT);
        onceki = p;
      }
    }
    kurdeleCiz(D.ip, y, z);
  }
}
function kurdeleCiz(x, y, z) {
  const p = pr([x, y, z]);
  if (!p.ok)
    return;
  ozel(p.d - 0.05, () => {
    const s = p.s, sal = Math.sin(TAU * B) * 0.04 * s;
    c.lineWidth = Math.max(1, s * 0.012);
    c.strokeStyle = MUREKKEP;
    for (const [dx, renk] of [[-0.05, '#e23d2f'], [0.05, '#ffd166']]) {
      c.beginPath();
      c.moveTo(p.x + dx * s * 0.4, p.y);
      c.lineTo(p.x + dx * s * 1.6 + sal, p.y + 0.26 * s);
      c.lineTo(p.x + dx * s * 0.2 + sal * 0.6, p.y + 0.22 * s);
      c.closePath();
      c.fillStyle = renk;
      c.fill();
      c.stroke();
    }
    c.beginPath();
    c.arc(p.x, p.y, 0.045 * s, 0, TAU);
    c.fillStyle = '#e23d2f';
    c.fill();
    c.stroke();
  });
}

// Hakemin bayrağı: tur sürerken sarı, tur bitince kazananın renginde ve onun yanına uzanır.
function bayrakCiz() {
  const p = hakem.p, el = p['ha' + hakem.bayrakEl];
  if (!el || !el.ok)
    return;
  const j = hakem.j['ha' + hakem.bayrakEl], ust = pr([j[0], j[1] + 0.45, j[2]]), alt = pr([j[0], j[1] - 0.12, j[2]]);
  if (!ust.ok || !alt.ok)
    return;
  kap(alt, 0.012, ust, 0.012, '#5a3a1e', el.d - 0.2);
  const yan = hakem.bayrakYan, renk = yan ? MAH[yan < 0 ? 0 : 1].renk : '#ffd166', yon = yan || (hakem.bayrakEl === 'L' ? 1 : -1);
  ozel(el.d - 0.21, () => {
    const s = ust.s, dal = Math.sin(TAU * B * 2) * 0.03 * s;
    c.beginPath();
    c.moveTo(ust.x, ust.y);
    c.quadraticCurveTo(ust.x + yon * 0.2 * s, ust.y + dal, ust.x + yon * 0.36 * s, ust.y + 0.04 * s + dal);
    c.lineTo(ust.x + yon * 0.34 * s, ust.y + 0.22 * s + dal);
    c.quadraticCurveTo(ust.x + yon * 0.18 * s, ust.y + 0.2 * s - dal, ust.x, ust.y + 0.2 * s);
    c.closePath();
    c.fillStyle = renk;
    c.fill();
    c.strokeStyle = MUREKKEP;
    c.lineWidth = Math.max(1, s * 0.012);
    c.stroke();
  });
}

// Skor tabelası: hakemin arkasında, iki direkli tahta pano.
function tabelaCiz() {
  const z = hakemZ() + 0.8, gen = 1.25, y0 = 0.95, y1 = 1.6;
  for (const x of [-gen + 0.15, gen - 0.15]) {
    const a = pr([x, 0, z]), b = pr([x, y0, z]);
    if (a.ok && b.ok)
      kap(a, 0.04, b, 0.04, '#7a4f2a', a.d + 0.02);
  }
  const m = pr([0, (y0 + y1) / 2, z]);
  if (!m.ok)
    return;
  ozel(m.d + 0.01, () => {
    const k = [pr([-gen, y1, z]), pr([gen, y1, z]), pr([gen, y0, z]), pr([-gen, y0, z])];
    if (k.some(q => !q.ok))
      return;
    c.beginPath();
    k.forEach((q, i) => (i ? c.lineTo(q.x, q.y) : c.moveTo(q.x, q.y)));
    c.closePath();
    c.fillStyle = '#a8743f';
    c.fill();
    c.strokeStyle = MUREKKEP;
    c.lineWidth = Math.max(1.5, m.s * 0.015);
    c.stroke();
    // tahta çizgileri
    c.strokeStyle = 'rgba(70,40,15,0.35)';
    c.lineWidth = 1;
    for (let i = 1; i < 3; i++) {
      const yy = lerp(k[0].y, k[3].y, i / 3);
      c.beginPath();
      c.moveTo(k[0].x + 4, yy);
      c.lineTo(k[1].x - 4, yy);
      c.stroke();
    }
    const s = m.s, cx = m.x, cy = m.y, vur = 1 + 0.06 * calgi.dumP;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = Math.round(0.36 * s * vur) + 'px "Paytone One", Rubik, system-ui, sans-serif';
    c.lineWidth = Math.max(2, s * 0.03);
    c.strokeStyle = MUREKKEP;
    const yaz = (t, x, renk) => {
      c.strokeText(t, x, cy);
      c.fillStyle = renk;
      c.fillText(t, x, cy);
    };
    yaz(String(D.skor[0]), cx - 0.42 * s, MAH[0].renk);
    yaz('–', cx, '#fff4dc');
    yaz(String(D.skor[1]), cx + 0.42 * s, MAH[1].renk);
    c.font = '700 ' + Math.round(0.12 * s) + 'px Rubik, system-ui, sans-serif';
    c.lineWidth = Math.max(1.5, s * 0.02);
    for (const t of [0, 1]) {
      const x = cx + (t ? 1 : -1) * 0.88 * s;
      c.strokeText(MAH[t].kisa, x, cy - 0.12 * s);
      c.fillStyle = '#fff4dc';
      c.fillText(MAH[t].kisa, x, cy - 0.12 * s);
      c.font = Math.round(0.2 * s) + 'px "Paytone One", Rubik, system-ui, sans-serif';
      c.strokeText(MAH[t].no, x, cy + 0.1 * s);
      c.fillStyle = MAH[t].renk;
      c.fillText(MAH[t].no, x, cy + 0.1 * s);
      c.font = '700 ' + Math.round(0.12 * s) + 'px Rubik, system-ui, sans-serif';
    }
  });
}

function balyaCiz(x, z) {
  const T = donusum(x, 0, z, Math.PI + 0.3 * Math.sign(x)), m = pr([x, 0.25, z]);
  if (!m.ok)
    return;
  ozel(m.d, () => {
    const g = kutuCiz(T, -0.45, 0.45, 0, 0.42, -0.28, 0.28, '#e8c45a', 1.5);
    if (g.on) {
      c.strokeStyle = 'rgba(140,100,30,0.6)';
      c.lineWidth = 1.2;
      for (const a of [-0.2, 0.2]) {
        const p0 = pr(yerelNokta(T, a, 0.02, 0.285)), p1 = pr(yerelNokta(T, a, 0.4, 0.285));
        if (p0.ok && p1.ok) {
          c.beginPath();
          c.moveTo(p0.x, p0.y);
          c.lineTo(p1.x, p1.y);
          c.stroke();
        }
      }
    }
  });
}

// Tur bitince kaybedenin önünden çamur sıçrar.
function camurSicrat(yan) {
  const arka = (D.satir - 1) * ARA_Z;
  for (let i = 0; i < 26; i++)
    camurDamla.push({ x: yan * (0.2 + Math.random() * 0.4), y: 0.05, z: Math.random() * (arka + 0.2), vx: (Math.random() - 0.5) * 1.6, vy: 1.6 + Math.random() * 1.8, vz: (Math.random() - 0.6) * 1.2, r: 0.03 + Math.random() * 0.05 });
}
// Sahne üstü hediye tablosu: oyuncu şeridinin en altında, TikTok'un yorum alanının hemen üstünde, tek sıra halinde.
// Sağ üst sütun çekirdeğin bildirimlerine ait (hediye, takip satırları oraya düşer); tablo orada kalsaydı üstü örtülürdü.
// Kamera bu bant için altta pay bırakır (oyunKamera, altPx), oyuncular tablonun üstünde kalır. Metinler OYUN.kademe'den.
const TABLO = { x: 16, y: 902, w: 688, h: 104 };
function hediyeTablosu() {
  const kd = OYUN.kademe.slice().sort((a, b) => a.min - b.min), T = TABLO, n = kd.length, cw = (T.w - 20) / n;
  c.save();
  c.fillStyle = 'rgba(14,24,16,0.78)';
  c.beginPath();
  c.roundRect(T.x, T.y, T.w, T.h, 14);
  c.fill();
  c.textBaseline = 'middle';
  c.textAlign = 'left';
  c.font = '700 16px Rubik, system-ui, sans-serif';
  c.fillStyle = RENK.vurgu;
  c.fillText('HEDİYE AT, HALATI ÇEK', T.x + 14, T.y + 17);
  c.textAlign = 'right';
  c.font = '600 14px Rubik, system-ui, sans-serif';
  c.fillStyle = 'rgba(246,236,217,0.8)';
  c.fillText('jeton → etki', T.x + T.w - 14, T.y + 17);
  kd.forEach((k, i) => {
    const x = T.x + 10 + i * cw, y = T.y + 34, enBuyuk = i === n - 1, nabiz = enBuyuk ? 1 + 0.15 * calgi.dumP : 1;
    c.fillStyle = enBuyuk ? 'rgba(255,209,102,0.16)' : 'rgba(255,255,255,0.06)';
    c.beginPath();
    c.roundRect(x + 3, y, cw - 6, 62, 10);
    c.fill();
    if (enBuyuk) {
      c.strokeStyle = RENK.vurgu;
      c.lineWidth = 1.5 + calgi.dumP;
      c.stroke();
    }
    // jeton: altın daire + eşik
    const m = x + cw / 2;
    c.font = '700 18px Rubik, system-ui, sans-serif';
    const yaz = k.min + '+', gen = c.measureText(yaz).width;
    c.fillStyle = '#f2b632';
    c.beginPath();
    c.arc(m - gen / 2 - 6, y + 19, 7 * nabiz, 0, TAU);
    c.fill();
    c.strokeStyle = '#8a5a12';
    c.lineWidth = 1.5;
    c.stroke();
    c.textAlign = 'left';
    c.fillStyle = '#fff4dc';
    c.fillText(yaz, m - gen / 2 + 5, y + 19);
    c.textAlign = 'center';
    c.font = '600 15px Rubik, system-ui, sans-serif';
    c.fillStyle = enBuyuk ? RENK.vurgu : '#e9f0d0';
    c.fillText(k.ad, m, y + 45);
  });
  c.restore();
}
function oyunUst(dt) {
  hediyeTablosu();
  for (let i = camurDamla.length - 1; i >= 0; i--) {
    const d = camurDamla[i];
    d.vy -= 9 * dt;
    d.x += d.vx * dt;
    d.y += d.vy * dt;
    d.z += d.vz * dt;
    if (d.y < 0) {
      camurDamla.splice(i, 1);
      continue;
    }
    const p = pr([d.x, d.y, d.z]);
    if (p.ok) {
      c.fillStyle = CAMUR;
      c.beginPath();
      c.arc(p.x, p.y, d.r * p.s, 0, TAU);
      c.fill();
    }
  }
}
function oyunEkAdlar() { return [hakem, ...KOYLULER.filter(k => k.gorunur)]; }
