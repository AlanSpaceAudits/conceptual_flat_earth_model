# Koncepční model FE — Legenda a referenční přehled funkcí

Interaktivní pískoviště ukazující, co jeden pozorovatel skutečně vidí na rovině s hranicí viditelnosti. Žádné fyzikální jednotky, žádný předpokládaný poloměr Země. Vše je postaveno kolem jednoho fiktivního pozorovatele, který spojuje nebeskou sféru s pozemskou mřížkou tím, že vztahuje geocentrický úhel hvězdy k času, kdy přechází nad hlavou.

Živě na [alanspaceaudits.github.io/conceptual_flat_earth_model](https://alanspaceaudits.github.io/conceptual_flat_earth_model/).

---

## Dvě vrstvy, jeden pozorovatel

- **Optická klenba** — kupole nad hlavou, na kterou se promítá Slunce, Měsíc, planety a hvězdné pole. V pohledu z první osoby (Optický) je kupole striktní polokoule, takže vykreslená elevace odpovídá hlášené elevaci 1:1.
- **Skutečné pozice** — čtení nebeské klenby, které umisťuje každé těleso do jeho geografického pozemního bodu. Zapnuto pro zobrazení účetnictví; vypnuto pro zobrazení pouze toho, co dosáhne oka pozorovatele.

## Disciplína jednotek

Všechny vzdálenosti jsou bezrozměrné. `FE_RADIUS = 1`. Žádný poloměr Země, žádná AU, žádné kilometry, žádná trigonometrie velkých kružnic. Sférický rámec Země je zde čistě konceptuální.

---

# Spodní lišta — legenda ikon

Tmavý pruh běží po celé šířce zobrazení. Zleva doprava:

## Přehrávání (levý shluk)

| Ikona | Význam |
| --- | --- |
| 🌐 / 👁 | Přepnutí klenby. 🌐 = aktuálně **Nebeská orbita**; 👁 = aktuálně **Optický pohled z první osoby**. Klikněte pro přepnutí. |
| ⏪ | Přetočit. První kliknutí obrátí směr; další kliknutí zdvojnásobí zápornou velikost. |
| ▶ / ⏸ | Přehrát / Pauza. Stisknutí ▶ resetuje automatické přehrávání na předvolbu Den. Během demo přehrávání toto pozastaví / obnoví demo bez jeho ukončení. |
| ⏩ | Rychle vpřed. Zrcadlo ⏪. |
| ½× | Polovina aktuální velikosti rychlosti. Směr zachován. |
| 2× | Zdvojnásobení aktuální velikosti rychlosti. Směr zachován. |
| Ukončit demo | Zobrazí se pouze během aktivního dema. Klikněte pro zastavení a reset. |

## Kompasový shluk (středopravá část)

Dvouřádkové podmřížky: 3 × 2 mřížka režimů, 2 × 2 cyklický řádek a 2 × 2 mřížka světových stran.

### Mřížka režimů

| Ikona | Význam |
| --- | --- |
| 🌙 | Přepnout **Trvalou noc** (`NightFactor` připnut, takže hvězdy zůstávají viditelné). |
| ◉ | Přepnout **Skutečné pozice** — značky na nebeské klenbě ukazující geografický pozemní směr každého tělesa. |
| 🎯 | **Režim určeného sledovače** — zúžit scénu pouze na aktivní `FollowTarget`. Vypnuto = celá `TrackerTargets`. |
| ▦ | Kombinovaný přepínač mřížek — zapne / vypne **FE mřížku + mřížku optické klenby + azimutální kruh + kruh délky** současně. |
| 📍 | Přejde přímo na skupinu **Pozorovatel** v záložce Pohled (šířka / délka / směr / nadmořská výška). |
| 🎥 | Režim **Volné kamery**. Šipky otáčejí / naklánějí orbitální kameru místo pohybu pozorovatele. |

### Cyklický řádek

| Ikona | Význam |
| --- | --- |
| 🗺 | Otevře nastavení **Projekce mapy** (HQ mapová grafika + generovaná matematická projekce). |
| ✨ | Cyklus **Hvězdné pole**: náhodné / mapa tmavá / mapa světlá / Cel Nav / AE Aries 1-3. |
| 🧭 | Přepne úplné kompasové čtení (azimutální kruh + pozemní kruh délky + mřížka optické klenby). |
| EN / CZ / ES / … | **Tlačítko jazyka.** Klikněte pro otevření Info → Výběr jazyka. Tvář tlačítka zobrazuje aktuální 2místný kód. |

### Mřížka světových stran

| Ikona | Význam |
| --- | --- |
| N | Přichytit `ObserverHeading` na sever (0°). |
| E | Přichytit na východ (90°). |
| W | Přichytit na západ (270°). |
| S | Přichytit na jih (180°). |

Světová strana, jejíž směr aktuálně odpovídá (do 0,5°), získá akcentový rámeček.

## Vyhledávací pole (vlevo od záložky Pohled)

- **Vyhledávání těles** — napište 3+ znaky názvu nebeského tělesa (Slunce, Měsíc, jakákoli planeta, jakákoli hvězda / černá díra / kvazar / galaxie / satelit, plus Pluto). Návrhy barevně kódované podle kategorie. Enter / kliknutí spustí protokol sledování.
- **Vyhledávání viditelnosti** — napište 2+ znaky jakéhokoli nastavení záložky Zobrazit nebo Sledovač. Výsledky uvádějí cestu `Záložka › Skupina`; klikněte pro otevření a rozbalení.

## Záložky (zcela vpravo)

**Pohled / Čas / Zobrazit / Sledovač / Ukázky / Info**. Každá otevírá vyskakovací okno ukotvené nad svým tlačítkem. Klikněte znovu nebo stiskněte <kbd>Esc</kbd> pro zavření. Současně je otevřené pouze jedno vyskakovací okno; sourozenecké skupiny v rámci vyskakovacího okna se navzájem vylučují.

---

# Záložka Pohled

## Pozorovatel

- **Postava** — postava pozorovatele na disku: Muž, Žena, Želva, Medvěd (sprite), Lama, Husa, Černá kočka, Velký pyrenejský pes, Sova, Žába, Klokan, **Not Nikki Minaj** (výchozí), Žádná.
- **ObserverLat / ObserverLong** — pozice pozorovatele na FE mřížce, krok 0,0001°.
- **Elevace** — výška pozorovatele nad diskem.
- **Směr** — kompasový směr 0–360° po směru hodinových ručiček od severu.
- Tlačítka jemného nastavení: ±1°, ±1′, ±1″.
- Šipky posouvají šířku/délku; <kbd>Mezerník</kbd> přepíná přehrávání/pauzu.

## Kamera (Nebeská orbita)

- **CameraDir** — orbitální azimut, −180° … +180°.
- **CameraHeight** — orbitální elevace, −30° … +89,9°.
- **CameraDist** — orbitální vzdálenost, 2–100.
- **Zoom** — orbitální zoom, 0,1–10×.

Pohled z první osoby používá svůj vlastní `OpticalZoom`; hodnoty mezi nimi nepronikají.

## Nebeská klenba

- **VaultSize / VaultHeight** — horizontální poloměr a poměr zploštělé kupole pro nebeskou kupoli.

## Optická klenba

- **Velikost / Výška** — horizontální poloměr a vertikální rozsah optické kupole při pohledu z nebeské klenby. Pohled z první osoby je nezávislý na `Výšce`.

## Klenby těles

Výšky pro umístění jednotlivých promítaných teček: Hvězdné pole, Měsíc, Slunce, Merkur, Venuše, Mars, Jupiter, Saturn, Uran, Neptun.

## Paprsky

- **RayParam** — zakřivení pro bezier paprsky.

---

# Záložka Čas

## Kalendář

- **Časové pásmo** — odchylka od UTC v minutách.
- **Datum / čas** — přímé zadání data a času; k dispozici je i posuvník.

## Datum / Čas

- **DayOfYear / Time / DateTime** — tři posuvníky pro absolutní okamžik.

## Automatické přehrávání

- **▶ Pauza / Pokračovat**, **stav**, předvolby rychlosti **Den / Týden / Měsíc / Rok**.
- **Rychlost** — jemný posuvník v d/s (dny za reálnou sekundu), logaritmická škála.

---

# Záložka Zobrazit

Skupiny viditelnosti, vzájemně se vylučující sbalitelné:

- **Nebeská klenba** — klenba, mřížka klenby, stopy Slunce / Měsíce.
- **Optická klenba** — klenba, mřížka, azimutální kruh, vektor směru, nebeské póly, deklinační kruhy.
- **Země / Disk** — FE mřížka, obratníky / polární kruhy, GP Slunce / Měsíce, kruh délky, stín.
- **Paprsky** — paprsky klenby, paprsky optické klenby, projekční paprsky, mnoho paprsků.
- **Kosmologie** — Axis Mundi: žádný / Yggdrasil / Mt. Meru / vír / vír 2 / Discworld.
- **Projekce mapy** — dva selektory vedle sebe:
  - **HQ Mapa** — přibalené rastrové mapy: Prázdná, Equirect Den / Noc, AE Equatorial dvou-pólová, AE Polární Den / Noc, Gleasonova, Stínovaný reliéf světa, Ortografický globus.
  - **Generované** — matematické projekce: Výchozí AE, Hellerick, Proporcionální AE, AE Equatorial, Equirect, Mercator, Mollweide, Robinson, Winkel Tripel, Hammer, Aitoff, Sinusoidal, Equal Earth, Eckert IV, Ortografická, Prázdná.
- **Různé** — Planety, Tmavé pozadí, Logo.

---

# Záložka Sledovač

Sledovač je jediný zdroj pravdy pro viditelnost těles. Zaškrtávací políčko **Zobrazit** v každé podnabídce hradí celou kategorii; **TrackerTargets** rozhoduje, která jednotlivá ID se vykreslí. **Povolit vše** osazuje vše v této kategorii; **Zakázat vše** vyčistí.

## Efemeridy

- **Zdroj** — vybírá, který z pěti efemeridových potrubí Slunce/Měsíce/planet pohání skutečně vykreslené pozice. Všech pět běží na pozadí každý snímek, takže srovnávací panel zůstává platný; tato rozbalovací nabídka pouze volí, který se *vykreslí*.
  - **HelioC** — Schlyterův zjednodušený Kepler kombinovaný se geocentrickou orbitou Slunce. Lehký; ~stupňová úroveň pro vnitřní planety, rychlý.
  - **GeoC** — Kepler s ohniskem v Zemi, jediná elipsa na planetu, žádná fáze Slunce. Koncepčně čistý, záměrně méně přesný.
  - **Ptolemaios** — Deferent + epicykl z *Almagestu*, portováno přes Almagest Ephemeris Calculator. Dopadá ~5–10° od moderních pozic, přesně jako v původních zdrojích.
  - **DE405** — Denní efemeridy AstroPixels od Freda Espenaka 2019–2030. Moderní reference; výchozí.
  - **VSOP87** — Bretagnonova a Francouova analytická teorie z roku 1988. Měsíc delegován na Meeuse. Vysoká přesnost pro planety; Meeusův Měsíc má známý posun ~2,5° vs DE405.
- **Srovnání efemerid** — když je zapnuto, každá karta sledovače v Live Ephemeris HUD zobrazuje až pět řádků RA / Dec, jeden na potrubí. Užitečné pro pozorování, jak daleko Ptolemaios driftuje vs DE405, nebo jak blízko je VSOP87, v reálném čase.
- **Precese** — klasická precese J2000-do-data aplikovaná na fixní RA / Dec hvězd. Vypnuto = hvězdy zůstávají na hodnotách katalogu J2000; Zapnuto = posouvají se vpřed k zobrazenému datu.
- **Nutace** — krátkoperiodické kolísání nebeského pólu (~18,6 r). Malé (~10″), ale viditelné na přesných čteních sledovače.
- **Aberace** — roční aberace: hvězdy zdánlivě posunuté až ~20″ ve směru pohybu Země během roku. Vypnuto = katalogové průměrné pozice.
- **Trepidace** — historický pre-newtonovský model oscilující obliquity. Poskytováno vedle precese, aby uživatelé mohli porovnat, jak tento starší rámec předpovídal stejný jev. Výchozí vypnuto.

## Hvězdné pole

Vybírá aktivní vykreslení hvězdného pole a režim (náhodný, tři varianty mapy, Cel Nav, tři varianty AE Aries), Dynamický / Statický fade, Trvalá noc.

## Možnosti sledovače

- **Režim určeného sledovače** — když je zapnuto, jediné vykreslené těleso je `FollowTarget`; každé jiné sledované ID je skryto. Použijte k uzamčení pozornosti na jeden objekt během dema nebo měření. Výchozí vypnuto.
- **Přepis GP** — zobrazí pozemní bod tělesa (sub-stelární / sub-solární) na disku, i když je hlavní přepínač `Zobrazit pozemní body` vypnutý. Umožňuje studovat pouze GP bez přepínání globální viditelnosti.
- **Skutečné pozice** — značky nebeské klenby ukazující skutečný geografický směr zdroje každého tělesa (kde je, ne kde se zdá). Zrcadleno tlačítkem ◉ ve spodní liště.
- **Trasa GP (24 h)** — když je zapnuto, každé sledované těleso vyrůstá 24hodinovou polylinií sub-bodu na disku. Slunce / Měsíc / planety vzorkují aktivní efemeridy; hvězdy používají fixní RA/Dec + GMST; satelity používají svou dvoutělesovou funkci sub-bodu. Užitečné pro stopy ve tvaru analemy a pro pohled na denní pohyb.

## Podnabídky

Každá podnabídka má stejné čtyři chrome řádky nad svou tlačítkovou mřížkou:

- **Zobrazit** — hradí celou kategorii. Vypnuto = nic v této kategorii se nevykreslí, bez ohledu na to, která jednotlivá ID jsou v `TrackerTargets`.
- **Přepis GP** — přepíše hlavní přepínač `Zobrazit pozemní body` pro položky v této kategorii, takže jejich GP se vykreslují bez ohledu.
- **Povolit vše** — sjednotí každé ID v této kategorii do `TrackerTargets`. Stávající výběry z jiných kategorií zůstávají.
- **Zakázat vše** — odstraní každé ID v této kategorii z `TrackerTargets`. Ostatní kategorie nedotčeny.

Tlačítková mřížka pod tím uvádí každou položku (abecedně). Klikněte na položku pro přepnutí jejího členství v `TrackerTargets`; aktivní položky získávají akcentový rámeček.

### Obsah podle kategorie

- **Nebeská tělesa** — Slunce, Měsíc, Merkur, Venuše, Mars, Jupiter, Saturn, Uran, Neptun.
- **Cel Nav** — 58 navigačních hvězd Námořního almanachu (teple žluté tečky).
- **Souhvězdí** — pojmenované katalogové hvězdy (bílé tečky) bez překryvů s Cel Nav. Nese další přepínač **Obrysy**, který kreslí spojnice mezi primárními hvězdami každého souhvězdí.
- **Černé díry** — 11 položek (Sgr A*, M87*, M31*, Cygnus X-1, V404 Cygni, NGC 4258, A0620-00, NGC 1275, NGC 5128, M81*, 3C 273 BH).
- **Kvazary** — 19 originálů (3C 273, OJ 287, BL Lacertae atd.); BSC přidává dalších 700.
- **Galaxie** — 20 originálů (M31, M82, M104, NGC 5128, LMC, SMC atd.) plus položka **Mléčná dráha (Galaktické centrum)**; BSC přidává dalších 700.
- **Satelity** — 12 základních orbitálních položek: ISS, Hubble, Tiangong, osm reprezentantů Starlink, James Webb (L2). Dvoutělesové Keplerovy elementy; ~1°/den drift od epochy 2024-04-15 — koncepční, ne přesné sledování.
- **Katalog jasných hvězd (BSC)** — sjednocený katalog ~2 967 položek sestavený z každé další kategorie plus extras. Má **vlastní** seznam `BscTargets` (nezávislý od `TrackerTargets`) a **vlastní** vykreslovací bránu `ShowBsc`. **Povolit vše** v BSC zapisuje pouze do `BscTargets`, takže zvýraznění se objeví okamžitě, ale žádné tečky se nevykreslí, dokud není zaškrtnuto `Zobrazit`. Vykreslovač BSC kreslí všechny vybrané položky s barvami podle zdroje. Další tlačítko **Zakázat satelity** odstraní každé ID `star:sat_*` z `BscTargets`.

Rozdělení obsahu BSC:

| Zdroj | Počet |
| --- | --- |
| Cel-nav hvězdy | 58 |
| Katalogové hvězdy (primáry souhvězdí) | 47 |
| Černé díry | 11 |
| Galaxie (originály + 200 OpenNGC + 500 OpenNGC) | 720 |
| Kvazary (originály + 200 VizieR + 500 VizieR) | 719 |
| Pojmenované hvězdy (393 IAU/HYG mag ≤ 8 + 500 dalších nejjasnějších bez jména) | 892 |
| Satelity (12 + ~500 CelesTrak) | 509 |
| Tělesa sluneční soustavy + Pluto | 10 |
| **Celkem (deduplikováno)** | **2 967** |

Každé katalogové těleso se vykresluje ve své vlastní barvě: Cel Nav teple žluté, katalogové bílé, černé díry fialové, kvazary azurové, galaxie růžové, satelity limetkově zelené, BSC barva podle zdrojové kategorie.

---

# Záložka Ukázky

Prohlížeč skriptovaných animací. Ovládací prvky nahoře: **Stop**, **Pauza / Pokračovat**, **Předchozí / Další**. Když ukázka přehrává, ▶ / ⏸ ve spodní liště pozastaví ukázku na místě; ½× / 2× škálují tempo; **Ukončit demo** se objeví v zásobníku rychlosti. Sekce:

- **24 h Slunce (4)** — ukázky polárního slunce (Alert NU, Západní Antarktida, půlnoční slunce S/J).
- **Obecné (6)** — rovnodennost na rovníku, letní / zimní slunovrat na 45°N, měsíc fází Měsíce, cestování pozorovatele, 78°N 24hodinové denní světlo.
- **Sluneční Analemma / Měsíční Analemma / Sluneční + Měsíční Analemma** — 5 variant zeměpisné šířky (90°N, 45°N, 0°, 45°J, 90°J). Pozorovatel fixní; čas fixní na 12:00 UTC; jeden denní krok na 30/365 s. Drží na konci, abyste mohli studovat křivku.
- **Zatmění Slunce (44 položek, 2021–2040)** — jedno na skutečné zatmění Slunce (Espenak). Demo zpřesňuje čas syzygy pomocí vlastního Slunce + Měsíce aktivního potrubí a umisťuje pozorovatele na subsolární bod tohoto potrubí.
- **Zatmění Měsíce (67 položek, 2021–2040)** — stejná struktura, včetně 22 polostínových.
- **Předpovědi zatmění FE** — placeholder pro budoucí Saros-harmonický prediktor.

---

# Záložka Info

Skupiny externích odkazů na komunity a tvůrce kolem této práce (Space Audits, Shane St. Pierre, Man of Stone, Globebusters, Aether Cosmology CZ-SK, Discord, Clubhouse, Twitter Community).

---

# Panely HUD

- **Hlavní HUD (vlevo nahoře, sbalitelný)** — záhlaví `Živé fáze Měsíce`. Tělo obsahuje DateTime, az/el Slunce + Měsíce, % fáze Měsíce, odpočet do dalšího zatmění Slunce + Měsíce, plátno fáze Měsíce (ilustrace + lišta osvětlení + název fáze).
- **Live Ephemeris tracker HUD** — přepíná tlačítkem pod HUD. Jedna karta na sledované těleso s az/el a řádky RA/Dec na potrubí.
- **Spodní info pruh** — Šíř · Dél · El · Az · Mouse El · Mouse Az · efem · čas · aktuální rychlost (`+0.042 d/s`) nahoře; `Tracking: <jméno>` dole.
- **Varovný banner Meeus** — červený pruh, když aktivní BodySource závisí na Meeusově Měsíci (HelioC / GeoC / VSOP87).
- **Cadence chip (pouze Optický)** — chip vpravo nahoře s aktivní kadencí (15° / 5° / 1°), FOV, směr.
- **Dynamická popisná zápatí** — jednořádkový stav pod plátnem (zeměpisná šířka + stav Slunce + fáze soumraku). Ukázky to přepisují vyprávěcím textem.

---

# Interaktivní sledování (libovolný pohled)

- **Hover** — kurzor zobrazuje tooltip (`Jméno / Az / Alt`) nad jakýmkoli viditelným tělesem. Optický zasahuje přes az/el; Nebeský přes promítané obrazové pixely (40 px poloměr).
- **Klikněte pro zámek** — zapíná `FollowTarget`. V Optickém: přichytí směr + pitch k tělesu. V Nebeském: zapne volnou kameru s předvolbou ptačího pohledu.
- **Volná kamera (Nebeský + sledování)** — orbita ukotvuje kolem pozemního bodu tělesa, ne kolem počátku disku. GP se vykresluje bez ohledu na hlavní přepínač Zobrazit pozemní body.
- **Zlomte zámek** — jakékoli skutečné tažení (≥ 4 px) vyčistí `FollowTarget` a `FreeCamActive`.

---

# Klávesnice

- **Šipky** — pohybují šířkou/délkou pozorovatele (nebo otáčí kamerou v režimu volné kamery).
- **<kbd>Mezerník</kbd>** — přepíná přehrávání / pauzu.
- **<kbd>Esc</kbd>** — zavřete otevřené vyskakovací okno → pozastavte aktivní ukázku → vyčistěte sledování, v pořadí priority.

---

# Jazyky

18 podporovaných přes přepínač jazyka ve spodní liště:

EN · CZ · ES · FR · DE · IT · PT · PL · NL · SK · RU · AR · HE · ZH · JA · KO · TH · HI

Štítky záložek, názvy skupin, štítky řádků, štítky tlačítek, sloty info pruhu, chrome automatického přehrávání, tooltipy přepravy, text záhlaví, čtení stavu a záhlaví Live panelů — vše se překládá živě. Arabština a hebrejština převrátí směr dokumentu na RTL.

---

# Trvanlivost orientace

Každé pole stavu žije v hash URL, takže nastavení sim může být sdíleno jako odkaz. URL je verzováno — když se výchozí nastavení mezi vydáními změní, nárůst verze říká loaderu, aby zahodil zastaralé klíče a použil nový default.

---

# Poděkování

- **Fred Espenak** (NASA GSFC v důchodu, AstroPixels) — denní efemeridy DE405, katalogy zatmění.
- **R.H. van Gent** (Utrecht) — Almagest Ephemeris Calculator, zdroj pro Ptolemaiovský port.
- **Bretagnon & Francou** — VSOP87 planetární teorie.
- **Sonia Keys / commenthol** — MIT-licencovaný JS port koeficientů VSOP87.
- **Jean Meeus** — *Astronomical Algorithms* (1998).
- **Shane St. Pierre** — koncepční rámcování a podnět skutečně vybudovat funkční interaktivní demonstraci.
- **Walter Bislin** — vizualizační inspirace.
- **HYG v41** (David Nash / astronexus) — data jasných hvězd.
- **OpenNGC** (Mattia Verga) — katalog galaxií.
- **VizieR / CDS** (Véron-Cetty & Véron 2010) — katalog kvazarů.
- **CelesTrak** (Dr. T.S. Kelso) — TLE kanály pro satelity.
