/* AYAR — Köy Halat Çekme oyununun bütün yazıları, hediye kademeleri, açılış kalabalığı ve sahte yorumları.
 * Derlemede HER ZAMAN İLK dosyadır; çekirdek OYUN'u buradan okur (docs/KANCALAR.md).
 * Oyun: İstanbul ile Ankara köy meydanında halat çeker. Yorumunda 1 yazan İstanbul'a (kırmızı, sol), 2 yazan
 * Ankara'ya (mavi, sağ) geçer; sayı yazmayan az kişili takıma girer. Takımındakinin her yorumu ve beğenisi
 * halatı kendi yanına çeker, hediyeler sert asılır. Ortadaki çamur çukuruna önü düşen takım turu kaybeder.
 * En çok hediye atan altın kemeri takar, takımının en önüne geçer.
 */
const OYUN = {
  id: 'halat-cekme',
  ad: 'Köy Halat Çekme',
  logo: ['Halat', 'Çekme'],
  nasil: { yorum: 'İstanbul için 1, Ankara için 2 yaz', begeni: 'Halatı çek', hediye: '' },
  yazi: {
    sira: 'Pehlivanlar', gosterge: 'Coşku', bos: 'İstanbul için 1, Ankara için 2 yaz.',
    birim: 'kişi', ses: 'Davul zurnayı başlat', sahne: 'Köy halat çekme sahnesi', giris: 'takımına girer',
    bosalt: 'Meydanı boşalt'
  },
  kapasite: 36,
  // Büyükten küçüğe. tip, oyunHediye'nin hangi etkiyi başlatacağını seçer; etki paneldeki tabloda yazar.
  kademe: [
    { min: 1000, ad: 'Pehlivan', tip: 'pehlivan', etki: 'Gönderen dev pehlivan olur, turu tek başına çeker' },
    { min: 200, ad: 'Köy arkanda', tip: 'koy', etki: 'Takımı 16 vuruş boyunca çift güçle çeker, davul coşar' },
    { min: 50, ad: 'Ayak kaydı', tip: 'kay', etki: 'Rakip takımın ayağı kayar, halat bir anda kayar' },
    { min: 10, ad: 'Hep beraber', tip: 'hep', etki: 'Bütün takım "hıh!" diye sert asılır' },
    { min: 1, ad: 'Hıh!', tip: 'hih', etki: 'Gönderen zıplayıp asılır, halatı biraz çeker' }
  ],
  tohum: [['zeyno.47', 320], ['urfalı_bekir', 140], ['gülizar_teyze', 60], ['dj_mahmut', 25], ['elif_naz', 10], ['hasan.usta', 5], ['pınar_34', 0], ['köyün_delisi', 0], ['berfin_gül', 0], ['muhtar_emmi', 0], ['laz_ziya', 0], ['sude_nur', 0]],
  sahteAd: ['pehlivan_rıza', 'kıvırcık_ayşe', 'istanbul.34', 'zeyno.47', 'urfalı_bekir', 'gülizar_teyze', 'mert.can.21', 'elif_naz', 'dj_mahmut', 'karadenizli.cemo', 'sibel_abla', 'ozan_dayı', 'mardinli_rojin', 'tuğçe.sk', 'hasan.usta', 'pınar_34', 'köyün_delisi', 'berfin_gül', 'yusuf.63', 'nazlı_can', 'ankara_06', 'şahin_k', 'melo.27', 'halatçı_kemal', 'fatoş_01', 'efe_tr', 'cano_23', 'zilan.d', 'hüso_baba', 'ayten_hanım', 'kemo_44', 'deniz.yıldızı', 'rıza_amca', 'sude_nur', 'baran.21', 'ipek_böceği', 'muhtar_emmi', 'selo_02', 'songül.k', 'laz_ziya', 'egeli_duru', 'bozkır_ali', 'nur.sena'],
  sahteYorum: ['1', '2', '1 çekin!', '2 asılın', 'İstanbul 1', 'Ankara 2 burada', 'hıh hıh hıh', 'çek çek çek', 'bırakmayın!', 'çamura düşecekler', '1 1 1', '2 2 2', 'kolum koptu', 'halat kopacak', 'muhtar bizden yana', 'ayağım kaydı', 'pehlivan kim', 'Sivas’tan selam, 1', 'İzmir 2 diyor', 'adımı gördüm'],
  // Tema koyu orman yeşili: sahne üstü kutular ve yayın masası bundan boyanır, okunur kalır. Çayırın açık yeşilini
  // ve toprağı oyunZemin kendisi çizer (diğer oyunlar gibi; panelRenk çekirdeğin tema testini bozuyor).
  renk: { zemin: '#16261a', zemin2: '#223a26', zemin3: '#35583a', cizgi: '#4a7350', vurgu: '#ffd166', sicak: '#e23d2f', serin: '#3d5bd0', soluk: '#c8d8bf' },
  // Adlar için başın üstüne pay: ustPx oyunKamera'dan verilir.
  kamera: { ustPay: 1.05, altPay: 0.3 },
  etiket: { ustSinir: true, altSinir: true, disari: 'gizle', balonSira: 'derinlik' },
  sahneYazi: { pankart: 'alt' },
  // Müzik: köy şenliği davul zurnası, ama halayın havaları değil: bu oyunun kendi iki havası. Çekiş havası ağır ve
  // vurgulu (her düm bir "hıh!"), Meydan Şenliği hızlı. Yazım docs/MUZIK.md.
  // Sahnede jeton sayısı yok (TikTok yayın kuralları): sıra kutusunda yalnız adlar, bildirimde etkinin adı.
  sahneJeton: false,
  muzik: {
    takim: 'davul-zurna',
    havalar: [
      { id: 'cekis', ad: 'Çekiş Havası', bpm: 96, spb: 4, bar: 8, tonik: 392,
        dizi: [0, 150, 300, 500, 700, 800, 1000],
        davul: { ana: 'D...T.k.', cesni: 'D..kT.k.', gecis: 'D.TkD.TT' },
        bolum: {
          A: "0:2 2:2 3:2 4:2 | 4:4 3:2 4:2 | 5:2 4:2 3:2 2:2 | 3:4 -:4 | 2:2 3:2 4:2 3:2 | 2:2 1:2 2:4 | 1:2 0:2 1:2 2:2 | 0~:8",
          B: "7:4 6:2 5:2 | 6:2 5:2 4:4 | 5:2 6:2 7:2 6:2 | 5:4 4:4 | 4:2 5:2 4:2 3:2 | 2:4 3:4 | 2:2 1:2 0:2 1:2 | 0~:8",
          D: '-:8 -:8 -:8 -:8'
        },
        form: 'AABBD' },
      { id: 'senlik', ad: 'Meydan Şenliği', bpm: 116, spb: 4, bar: 16, tonik: 392,
        dizi: [0, 200, 350, 500, 700, 900, 1050],
        davul: { ana: 'D..kT.k.D..kT.k.', cesni: 'D..kT.k.D.D.T.k.', gecis: 'D.TkD.TkD.T.TkTT' },
        bolum: {
          A: "4:2 5:1 4:1 3:2 4:2 5:4 4:4 | 3:2 4:1 3:1 2:2 3:2 4:4 2:4 | 2:1 3:1 4:2 5:2 6':2 5:2 4:2 3:4 | 2:2 1:2 2:2 1:2 0~:8",
          B: "7:2 7:2 6':2 7:2 6:4 5:4 | 6:2 6:2 7:2 6:2 5:4 4:4 | 5:1 6:1 7:2 6:2 5:2 4:2 3:2 4:4 | 3:2 2:2 1:2 2:2 0~:8",
          D: '-:16 -:16'
        },
        form: 'AABBD' }
    ]
  }
};
