/* AYAR — Dolmuş oyununun bütün yazıları, hediye kademeleri, açılış kalabalığı ve sahte yorumları.
 * Derlemede HER ZAMAN İLK dosyadır; çekirdek OYUN'u buradan okur (docs/KANCALAR.md).
 * Oyun: üstü açık bir dolmuş yolda kameraya doğru gider. Yorum yazan dolmuşa biner: koltuklar dolunca ayakta
 * kalır. Beğeni gaza bastırır. En çok hediye atan direksiyona geçer, şoför olur. Hediyeler korna çaldırır,
 * "müsait bir yerde" dedirtip fren yaptırır, kaset taktırır, viraj aldırır; en büyüğünde dolmuş havalanır.
 */
const OYUN = {
  id: 'dolmus',
  ad: 'Dolmuş',
  logo: ['Dolmuş', 'Hattı'],
  nasil: { yorum: 'Yorum: dolmuşa bin', begeni: 'Beğeni: gaz', hediye: '' },
  yazi: {
    sira: 'Direksiyon sırası', gosterge: 'Gaz', bos: 'Dolmuş boş. İlk binen direksiyona geçer.',
    birim: 'yolcu', ses: 'Kaseti başlat', sahne: 'Dolmuş sahnesi', giris: 'dolmuşa biner', bosalt: 'Dolmuşu boşalt'
  },
  kapasite: 20,
  // Büyükten küçüğe. tip, oyunHediye'nin hangi etkiyi başlatacağını seçer; etki paneldeki tabloda yazar.
  kademe: [
    { min: 1000, ad: 'Dolmuş uçuyor', tip: 'ucus', etki: 'Dolmuş havalanır, gönderen kaputun üstünde el sallar' },
    { min: 200, ad: 'Sert viraj', tip: 'viraj', etki: 'Dolmuş virajı sert alır, herkes yana savrulur' },
    { min: 50, ad: 'Kaset tak', tip: 'kaset', etki: 'Kaset çalar, bütün dolmuş oynar' },
    { min: 10, ad: 'Müsait bir yerde', tip: 'fren', etki: 'Dolmuş sert fren yapar, herkes öne savrulur' },
    { min: 1, ad: 'Korna', tip: 'korna', etki: 'Dolmuş korna çalar, gönderen el sallar' }
  ],
  tohum: [['zeyno.47', 320], ['urfalı_bekir', 140], ['gülizar_teyze', 60], ['dj_mahmut', 25], ['elif_naz', 10], ['hasan.usta', 5], ['pınar_34', 0], ['köyün_delisi', 0], ['berfin_gül', 0], ['muhtar_emmi', 0], ['sude_nur', 0]],
  sahteAd: ['şoför_nevzat', 'muavin_cemil', 'zeyno.47', 'urfalı_bekir', 'gülizar_teyze', 'mert.can.21', 'elif_naz', 'dj_mahmut', 'karadenizli.cemo', 'sibel_abla', 'ozan_dayı', 'mardinli_rojin', 'tuğçe.sk', 'hasan.usta', 'pınar_34', 'köyün_delisi', 'berfin_gül', 'yusuf.63', 'nazlı_can', 'durakta_bekleyen', 'şahin_k', 'melo.27', 'arka_koltuk', 'fatoş_01', 'efe_tr', 'cano_23', 'zilan.d', 'hüso_baba', 'ayten_hanım', 'kemo_44', 'deniz.yıldızı', 'rıza_amca', 'baran.21', 'ipek_böceği', 'muhtar_emmi', 'selo_02', 'songül.k', 'laz_ziya', 'egeli_duru', 'bozkır_ali', 'nur.sena'],
  sahteYorum: ['şoför bey müsait bir yerde', 'iki kişi arkadan', 'paraları uzatır mısın', 'ben de biniyorum', 'yer var mı', 'kaseti değiştir abi', 'yavaş abi yavaş', 'çarşıya gidiyor mu', 'üstü kalsın', 'arkaya ilerleyelim', 'kapı açık kaldı', 'İzmir’den bindim', 'ayaktayım ama mutluyum', 'korna çal!', 'durakta bekliyorum', 'cam açın sıcak', 'şoför kim ya', 'ön koltuk benim', 'adımı gördüm', 'inecek var!'],
  // Yaz öğleden sonrası, sıcak asfalt. Tema koyu (sahne üstü kutular ve masa okunur); yolu oyunZemin çizer.
  renk: { zemin: '#1c1f2e', zemin2: '#2a2f45', zemin3: '#3e4664', cizgi: '#566082', vurgu: '#ffd166', sicak: '#ef5a3c', serin: '#2fc4b2', soluk: '#c9cede' },
  // Yüksekten bakan kamera: sıralar ekranda açılır, arka sıranın yüzleri öndekilerin adlarının üstünde kalır.
  kamera: { egim: 0.72, enYakin: 3, ustPay: 1.05, altPay: 0.2 },
  etiket: { ustSinir: true, altSinir: true, disari: 'gizle', balonSira: 'derinlik' },
  sahneYazi: { pankart: 'alt' },
  // Müzik: dolmuş kaseti gibi düğün takımı (darbuka, def zili, klarnet, alttan bas); konvoyun havaları değil, bu
  // oyunun iki özgün havası. Yazım docs/MUZIK.md. Tempo dolmuşun sallantısıdır.
  muzik: {
    takim: 'dugun',
    havalar: [
      { id: 'durak', ad: 'Durak Havası', bpm: 108, spb: 4, bar: 8, tonik: 293.7,
        dizi: [0, 100, 300, 500, 700, 800, 1000],                       // kürdi
        davul: { ana: 'D.kTD.kT', cesni: 'D.kTDkkT', gecis: 'DkTkTrTr' },
        ust: { ana: 'z...z.z.', cesni: 'z.z.z.z.', gecis: 'z.zzz.zz' },
        bas: { ana: '1...5...', cesni: '1...5.8.', gecis: '1.5.8.5.' },
        bolum: {
          A: "0:2 1:2 2:2 3:2 | 4:4 3:2 2:2 | 3:2 4:2 5:2 4:2 | 3:4 -:4 | 4:2 3:2 2:2 1:2 | 2:2 3:2 2:4 | 1:2 0:2 -1:2 1:2 | 0~:8",
          B: "4:2 5:2 7:4 | 6:2 5:2 4:4 | 5:2 6:2 5:2 4:2 | 3:4 2:4 | 3:2 4:2 3:2 2:2 | 1:4 2:4 | 1:2 0:2 1:2 -1:2 | 0~:8",
          D: '-:8 -:8 -:8 -:8'
        },
        eslik: { A: '0:16 3:16 0:16 0:16', B: '3:16 0:16 3:8 4:8 0:16' },
        form: 'AABBD' },
      { id: 'hat', ad: 'Son Durak', bpm: 92, spb: 3, bar: 6, tonik: 349.2,
        dizi: [0, 150, 300, 500, 700, 800, 1000],                       // uşşak
        davul: { ana: 'D.kT.k', cesni: 'D.kTkr', gecis: 'DkTkTr' },
        ust: { ana: 'z..z..', cesni: 'z..zz.', gecis: 'z.zzzz' },
        bas: { ana: '1..5..', cesni: '1..8..', gecis: '1.5.8.' },
        bolum: {
          A: "4:2 3:1 4:3 | 5:2 4:1 3:3 | 2:2 3:1 4:2 3:1 | 2:6 | 3:2 2:1 1:3 | 2:2 3:1 2:3 | 1:2 0:1 1:2 -1:1 | 0~:6",
          B: "7:3 6:2 5:1 | 6:2 5:1 4:3 | 5:2 6:1 5:2 4:1 | 3:6 | 4:2 3:1 2:3 | 3:2 2:1 1:3 | 2:2 1:1 0:2 -1:1 | 0~:6",
          D: '-:6 -:6 -:6 -:6'
        },
        eslik: { A: '0:12 3:12 0:12 0:12', B: '3:12 4:12 3:6 4:6 0:12' },
        form: 'AABBD' }
    ]
  }
};
