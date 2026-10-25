import type { Metadata } from "next";
import Link from "next/link";
import { SITE_ADI, SITE_EPOSTA, SITE_URL } from "@/lib/site";
import { KVKK_SURUM } from "@/lib/telefonTalebi";

// TASLAK — Yayına almadan önce bir hukukçuya kontrol ettirilmeli.
// Doldurulması gerekenler: VERI_SORUMLUSU, VERI_SORUMLUSU_ADRES ve (veri sorumlusu yurt dışındaysa) TR_TEMSILCI.
// Çerez bandı Kabul/Reddet seçeneklidir; AdSense yalnızca "Kabul Et" ile yüklenir (components/AdSenseYukle.tsx).
// Metin değiştiğinde lib/telefonTalebi.ts içindeki KVKK_SURUM da güncellenmeli (telefon onaylarında saklanır).

const VERI_SORUMLUSU = "[Veri sorumlusunun adı soyadı / unvanı]";
const VERI_SORUMLUSU_ADRES = "[Veri sorumlusunun açık adresi]";
// Veri sorumlusu yurt dışında yerleşikse Türkiye'deki veri sorumlusu temsilcisi (yoksa boş bırakın)
const TR_TEMSILCI = "";
const KEP_ADRESI = ""; // varsa KEP adresi

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | Kovan Portal",
  description:
    "Kovan Portal'da işlenen kişisel veriler, işleme amaçları, hukuki sebepler, aktarım, saklama süreleri ve KVKK kapsamındaki haklarınız.",
};

function Bolum({ id, baslik, children }: { id?: string; baslik: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-8 scroll-mt-20">
      <h2 className="text-lg font-semibold text-[#1a3a6b] mb-2">{baslik}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

function Tablo({ basliklar, satirlar }: { basliklar: string[]; satirlar: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-xs sm:text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-[#1a3a6b] text-white">
          <tr>
            {basliklar.map((b) => (
              <th key={b} className="px-3 py-2 text-left font-medium align-top">{b}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {satirlar.map((s, i) => (
            <tr key={i} className={i % 2 ? "bg-gray-50" : "bg-white"}>
              {s.map((h, j) => (
                <td key={j} className={`px-3 py-2 align-top ${j === 0 ? "font-medium text-gray-800" : "text-gray-600"}`}>{h}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const icindekiler: [string, string][] = [
  ["veri-sorumlusu", "Veri sorumlusu"],
  ["kapsam", "Bu metin kimleri kapsar?"],
  ["veriler", "İşlenen kişisel veriler, amaçlar ve hukuki sebepler"],
  ["kamuya-acik-kaynaklar", "Kamuya açık kaynaklardan derlenen işletme kayıtları"],
  ["toplama", "Kişisel verilerin toplanma yöntemleri"],
  ["cerezler", "Çerezler ve benzeri teknolojiler"],
  ["aktarim", "Kişisel verilerin aktarılması"],
  ["saklama", "Saklama süreleri ve imha"],
  ["guvenlik", "Veri güvenliği"],
  ["haklar", "KVKK kapsamındaki haklarınız"],
  ["basvuru", "Başvuru yöntemi"],
  ["degisiklikler", "Metindeki değişiklikler"],
];

export default function KvkkAydinlatmaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1a3a6b] mb-2">Kişisel Verilerin Korunması Aydınlatma Metni</h1>
      <p className="text-sm text-gray-500 mb-6">Sürüm {KVKK_SURUM}</p>

      <p className="text-sm text-gray-700 leading-relaxed mb-6">
        {SITE_ADI} ({SITE_URL.replace(/^https?:\/\//, "")}) olarak kişisel verilerinizin güvenliğine önem veriyoruz. Bu metin,
        6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) m. 10 ve Aydınlatma Yükümlülüğünün Yerine Getirilmesinde
        Uyulacak Usul ve Esaslar Hakkında Tebliğ uyarınca; sitemizi ziyaret ettiğinizde, üye olduğunuzda, firma veya ilan
        eklediğinizde, yorum yaptığınızda ya da bizimle iletişime geçtiğinizde kişisel verilerinizin nasıl işlendiğini
        açıklamak amacıyla hazırlanmıştır.
      </p>

      <nav className="mb-8 rounded-xl border border-[#dde3ec] bg-gray-50 p-4">
        <p className="text-sm font-semibold text-[#1a3a6b] mb-2">İçindekiler</p>
        <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-0.5">
          {icindekiler.map(([id, ad]) => (
            <li key={id}>
              <a href={`#${id}`} className="hover:text-[#1a3a6b] hover:underline">{ad}</a>
            </li>
          ))}
        </ol>
      </nav>

      <Bolum id="veri-sorumlusu" baslik="1. Veri sorumlusu">
        <p>KVKK uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla aşağıda bilgileri yer alan kişi tarafından işlenir:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Veri sorumlusu:</strong> {VERI_SORUMLUSU}</li>
          <li><strong>Adres:</strong> {VERI_SORUMLUSU_ADRES}</li>
          <li>
            <strong>E-posta:</strong>{" "}
            <a href={`mailto:${SITE_EPOSTA}`} className="text-[#1a3a6b] underline">{SITE_EPOSTA}</a>
          </li>
          {KEP_ADRESI && <li><strong>KEP:</strong> {KEP_ADRESI}</li>}
          {TR_TEMSILCI && <li><strong>Türkiye’deki veri sorumlusu temsilcisi:</strong> {TR_TEMSILCI}</li>}
        </ul>
      </Bolum>

      <Bolum id="kapsam" baslik="2. Bu metin kimleri kapsar?">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Ziyaretçiler:</strong> Siteyi üye olmadan gezen herkes.</li>
          <li><strong>Üyeler:</strong> Google hesabıyla giriş yapan kullanıcılar.</li>
          <li><strong>Firma sahipleri ve yetkilileri:</strong> Firma kaydı ekleyen, kaydını yöneten veya firmasına telefon/e-posta ekleyen kişiler.</li>
          <li><strong>Yorum yapanlar ve ilan verenler.</strong></li>
          <li><strong>Başvuru ve iletişim formu kullananlar:</strong> Üyelik başvurusu, iletişim, reklam başvurusu ve kayıt kaldırma/düzeltme talebi gönderen kişiler.</li>
          <li><strong>Kamuya açık kaynaklardan derlenen işletme kayıtlarında adı geçen kişiler:</strong> Örneğin adını taşıyan muayenehane, eczane veya şahıs işletmesi sahipleri.</li>
        </ul>
      </Bolum>

      <Bolum id="veriler" baslik="3. İşlenen kişisel veriler, işleme amaçları ve hukuki sebepler">
        <p>
          Aşağıdaki tabloda hangi işlemde hangi kişisel verilerinizin, hangi amaçla ve KVKK’nın hangi hukuki sebebine dayanılarak
          işlendiği gösterilmiştir. Özel nitelikli kişisel veri (sağlık, din, etnik köken vb.) talep etmiyoruz; lütfen yorum, ilan
          veya mesajlarınıza bu tür bilgileri yazmayınız.
        </p>
        <Tablo
          basliklar={["İşlem", "İşlenen veriler", "Amaç", "Hukuki sebep (KVKK m. 5)"]}
          satirlar={[
            [
              "Siteyi ziyaret",
              "IP adresi, barındırma altyapısının IP’den tahmin ettiği şehir/ülke, ziyaret edilen sayfalar, ziyaret edilen firma sayfası, yönlendiren sayfa (referrer), cihaz tipi (mobil/tablet/masaüstü), ziyaret zamanı, anlık çevrimiçi kullanıcı sayımı için geçici oturum bilgisi",
              "Sitenin güvenliğinin sağlanması ve kötüye kullanımın önlenmesi, ziyaret istatistiklerinin tutulması, firmalara sayfa görüntülenme bilgisi sunulması, hizmet kalitesinin artırılması",
              "Meşru menfaat (m. 5/2-f); log kayıtları bakımından hukuki yükümlülük (m. 5/2-ç, 5651 sayılı Kanun)",
            ],
            [
              "Google ile giriş / üyelik",
              "Ad soyad, e-posta adresi, Google hesap kimliği, profil fotoğrafı bağlantısı, oturum bilgileri",
              "Üyelik hesabının oluşturulması ve yönetimi, oturum açılması, yorum/ilan/firma işlemlerinin hesabınızla eşleştirilmesi",
              "Sözleşmenin kurulması ve ifası (m. 5/2-c)",
            ],
            [
              "Üyelik başvuru formu",
              "Ad, soyad, sabit telefon, cep telefonu, e-posta adresi",
              "Başvurunuzun değerlendirilmesi ve sizinle iletişime geçilmesi",
              "Sözleşmenin kurulması (m. 5/2-c), meşru menfaat (m. 5/2-f)",
            ],
            [
              "Firma ekleme ve firma yönetimi",
              "Firma sahibi/yetkili adı, firma telefonu, cep telefonu, WhatsApp numarası, e-posta, adres, web sitesi ve sosyal medya hesapları, firma fotoğrafları, hesabınızın e-posta adresi",
              "Firmanızın rehberde yayımlanması, müşterilerin size ulaşabilmesi, kaydın hesabınızla eşleştirilerek güncellenebilmesi, kayıtların onaylanması",
              "Sözleşmenin kurulması ve ifası (m. 5/2-c); yayımladığınız iletişim bilgileri bakımından ilgili kişinin kendisi tarafından alenileştirilmesi (m. 5/2-d)",
            ],
            [
              "Firmaya telefon / e-posta ekleme ve doğrulama",
              "Telefon numarası, ad soyad, hesabınızın e-posta adresi, doğrulama kodu ve WhatsApp üzerinden gönderdiğiniz doğrulama mesajı, doğrulama ve onay zamanları, onaylanan metin sürümü, IP adresi",
              "Numaranın gerçekten işletme sahibine ait olduğunun doğrulanması, kötüye kullanımın önlenmesi, onaylanan bilgilerin firma sayfasında yayımlanması, ispat",
              "Açık rıza (m. 5/1) ve bir hakkın tesisi, kullanılması veya korunması (m. 5/2-e), meşru menfaat (m. 5/2-f)",
            ],
            [
              "Yorum ve değerlendirme",
              "Görünen ad, hesabınızın e-posta adresi, yorum metni, puan, tarih; şikâyet edilen yorumlarda şikâyet edenin e-posta adresi",
              "Firmalar hakkındaki değerlendirmelerin yayımlanması, her üyenin bir firmaya tek değerlendirme yapabilmesi, uygunsuz içeriklerin denetlenmesi",
              "Sözleşmenin ifası (m. 5/2-c), meşru menfaat (m. 5/2-f)",
            ],
            [
              "İlan verme",
              "İlan veren adı, e-posta adresi, telefon, ilan metni ve fotoğrafları",
              "İlanın yayımlanması ve onaylanması, ilgilenenlerin size ulaşabilmesi",
              "Sözleşmenin kurulması ve ifası (m. 5/2-c), alenileştirme (m. 5/2-d)",
            ],
            [
              "İletişim, reklam başvurusu, kayıt kaldırma/düzeltme talebi",
              "Ad soyad, telefon, e-posta, mesaj içeriği, talep ettiğiniz firma kaydı",
              "Mesaj ve taleplerinize yanıt verilmesi, reklam başvurusunun değerlendirilmesi, KVKK kapsamındaki başvuruların sonuçlandırılması",
              "Meşru menfaat (m. 5/2-f), hukuki yükümlülük (m. 5/2-ç), bir hakkın tesisi (m. 5/2-e)",
            ],
            [
              "Reklam gösterimi",
              "Çerez ve cihaz tanımlayıcıları, IP adresi, tarayıcı bilgileri (Google AdSense tarafından)",
              "Sitenin giderlerinin karşılanması için reklam gösterilmesi",
              "Açık rıza (m. 5/1) — bkz. Çerezler bölümü",
            ],
          ]}
        />
      </Bolum>

      <Bolum id="kamuya-acik-kaynaklar" baslik="4. Kamuya açık kaynaklardan derlenen işletme kayıtları">
        <p>
          Sitemizdeki işletme kayıtlarının bir kısmı işletme sahipleri tarafından eklenmemiş; kamu kurum ve kuruluşlarının, meslek
          kuruluşlarının, organize sanayi bölgelerinin, birlik ve derneklerin herkese açık olarak yayımladığı listelerden ve
          işletmelerin kendi tanıtım sayfalarından derlenmiştir (ör. il sağlık müdürlükleri, bakanlıklar, belediyeler, meslek
          odaları, sanayi bölgeleri). Bu kayıtların kaynağı ilgili işletme sayfasındaki açıklamada belirtilir.
        </p>
        <p>
          Bu kayıtlarda yalnızca işletmenin adı, kategorisi, adresi ve kaynağında yayımlanmış iş iletişim bilgileri yer alır.
          İşletmenin adı bir kişinin adını içerdiğinde (ör. muayenehane, eczane, şahıs işletmesi) bu bilgi kişisel veri niteliği
          taşıyabilir. Bu bilgiler, kişilerin işletmeye ulaşabilmesi amacıyla; ilgili kişi tarafından alenileştirilmiş olması
          (KVKK m. 5/2-d) ve meşru menfaatimiz (KVKK m. 5/2-f) hukuki sebeplerine dayanılarak işlenir.
        </p>
        <p>
          Bu bilgiler <strong>reklam, pazarlama, toplu SMS veya e-posta gönderimi amacıyla kullanılmaz</strong> ve üçüncü kişilere
          satılmaz.
        </p>
        <p>
          İşletmenin sahibi veya yetkilisiyseniz işletme sayfasındaki <strong>“Kaldırma / düzeltme talebi”</strong> bağlantısından
          kaydın yayından kaldırılmasını veya bilgilerin düzeltilmesini talep edebilirsiniz. Talepler en geç 30 gün içinde
          sonuçlandırılır. Ayrıca firmanızı Google hesabınızla sahiplenerek bilgilerinizi kendiniz güncelleyebilirsiniz.
        </p>
      </Bolum>

      <Bolum id="toplama" baslik="5. Kişisel verilerin toplanma yöntemleri">
        <ul className="list-disc pl-5 space-y-1">
          <li>Sitedeki formlar (üyelik başvurusu, firma ekleme, ilan, yorum, iletişim, kaldırma/düzeltme talebi) aracılığıyla doğrudan sizden,</li>
          <li>Google ile giriş yaptığınızda Google LLC’den (yalnızca ad, e-posta ve profil fotoğrafı bilgileri),</li>
          <li>Siteyi kullanırken tarayıcınız ve cihazınız aracılığıyla otomatik yollarla (IP adresi, ziyaret kayıtları, çerezler),</li>
          <li>Telefon doğrulamasında WhatsApp üzerinden bize gönderdiğiniz mesajla,</li>
          <li>Kamuya açık kaynaklardan (bkz. 4. bölüm).</li>
        </ul>
      </Bolum>

      <Bolum id="cerezler" baslik="6. Çerezler ve benzeri teknolojiler">
        <p>
          Sitemizde, sitenin çalışması için zorunlu çerezler ile tarayıcınızın yerel depolama alanı kullanılır. Reklam gösterimi için
          Google AdSense çerezleri yalnızca onay vermeniz halinde kullanılır.
        </p>
        <Tablo
          basliklar={["Ad", "Tür", "Amaç", "Süre"]}
          satirlar={[
            ["sb-*-auth-token, sb-*-code-verifier", "Zorunlu çerez", "Google ile giriş ve oturum güvenliği (Supabase)", "Oturum süresince / çıkış yapılana kadar"],
            ["cerez-onay", "Zorunlu (yerel depolama)", "Çerez tercihinizin (kabul/ret) hatırlanması", "Siz silene veya değiştirene kadar"],
            ["lang", "Tercih çerezi", "Dil tercihinizin hatırlanması", "Siz silene kadar"],
            ["oturum_id, ziyaret_sayfa_*", "Oturum depolaması", "Aynı oturumda aynı sayfanın tekrar sayılmaması", "Tarayıcı sekmesi kapanınca silinir"],
            ["Google AdSense çerezleri", "Reklam çerezi (üçüncü taraf)", "Reklam gösterimi ve ölçümü", "Google’ın belirlediği süre"],
          ]}
        />
        <p>
          Çerezleri tarayıcı ayarlarınızdan silebilir veya engelleyebilirsiniz; zorunlu çerezleri engellemeniz halinde giriş yapma gibi
          bazı özellikler çalışmayabilir. Reklam çerezlerine verdiğiniz onayı Gizlilik ve Çerez Politikası sayfasındaki “Çerez
          tercihlerimi değiştir” düğmesiyle dilediğiniz zaman geri alabilirsiniz. Ayrıntılı bilgi için{" "}
          <Link href="/gizlilik-politikasi" className="text-[#1a3a6b] underline">Gizlilik ve Çerez Politikası</Link> sayfasına bakabilirsiniz.
        </p>
      </Bolum>

      <Bolum id="aktarim" baslik="7. Kişisel verilerin aktarılması">
        <p>
          <strong>Yurt içi aktarım:</strong> Kişisel verileriniz, talep edilmesi halinde ve mevzuatın izin verdiği ölçüde yetkili kamu
          kurum ve kuruluşlarına, adli ve idari mercilere aktarılabilir (KVKK m. 8). Firma sayfasında yayımlanmasını onayladığınız
          iletişim bilgileri ile yorum ve ilanlarınız herkese açık olarak yayımlanır.
        </p>
        <p>
          <strong>Yurt dışı aktarım:</strong> Sitemizin teknik altyapısı yurt dışında yerleşik hizmet sağlayıcılar üzerinden
          çalıştığından kişisel verileriniz aşağıdaki hizmet sağlayıcılara, hizmetin sunulması amacıyla sınırlı olarak aktarılır. Bu
          aktarımlar KVKK m. 9’da öngörülen usul ve şartlara uygun olarak gerçekleştirilir.
        </p>
        <Tablo
          basliklar={["Hizmet sağlayıcı", "Hizmet", "Aktarılan veriler", "Konum"]}
          satirlar={[
            ["Supabase", "Veritabanı, kimlik doğrulama, dosya depolama", "Sitede işlenen tüm veriler", "Almanya (AB)"],
            ["Vercel", "Web sitesinin barındırılması", "Ziyaret sırasında iletilen veriler, IP adresi", "ABD ve diğer bölgeler"],
            ["Google LLC", "Google ile giriş, Google AdSense reklamları", "Giriş bilgileri; reklam için çerez, IP ve cihaz bilgileri", "ABD"],
            ["OpenStreetMap Vakfı", "Firma sayfalarındaki harita ve adres konumlandırma", "IP adresi, aranan firma adresi (tarayıcınızdan doğrudan)", "Birleşik Krallık ve diğer bölgeler"],
            ["Resend", "Bildirim ve doğrulama e-postalarının gönderilmesi", "E-posta adresi, e-posta içeriği", "ABD"],
            ["Meta Platforms (WhatsApp)", "Telefon doğrulama mesajları", "Telefon numarası, doğrulama mesajı", "ABD ve diğer bölgeler"],
          ]}
        />
        <p>Kişisel verileriniz hiçbir koşulda üçüncü kişilere satılmaz veya pazarlama amacıyla kiralanmaz.</p>
      </Bolum>

      <Bolum id="saklama" baslik="8. Saklama süreleri ve imha">
        <p>
          Kişisel verileriniz, işlendikleri amaç için gerekli olan süre ve ilgili mevzuatta öngörülen süreler boyunca saklanır; bu
          sürelerin sonunda silinir, yok edilir veya anonim hale getirilir.
        </p>
        <Tablo
          basliklar={["Veri", "Saklama süresi"]}
          satirlar={[
            ["Üyelik bilgileri", "Üyelik devam ettiği sürece; hesabın silinmesinden itibaren en fazla 1 yıl"],
            ["Firma ve ilan kayıtları", "Yayında kaldığı sürece; kaldırılmasından itibaren en fazla 1 yıl"],
            ["Yorumlar", "Yayında kaldığı veya siz silene kadar"],
            ["Telefon doğrulama ve onay kayıtları", "İspat amacıyla en fazla 2 yıl"],
            ["Ziyaret ve erişim kayıtları (IP dahil)", "En fazla 2 yıl"],
            ["İletişim mesajları ve talepler", "Talebin sonuçlandırılmasından itibaren en fazla 2 yıl"],
            ["Kaldırılmasını istediğiniz kamuya açık kaynak kayıtları", "Yayından derhal kaldırılır; talebin ispatı için talep kaydı en fazla 2 yıl saklanır"],
          ]}
        />
      </Bolum>

      <Bolum id="guvenlik" baslik="9. Veri güvenliği">
        <p>
          KVKK m. 12 uyarınca kişisel verilerinizin hukuka aykırı olarak işlenmesini ve erişilmesini önlemek için uygun teknik ve idari
          tedbirler alınmaktadır. Bunlar arasında şifreli bağlantı (HTTPS), veritabanında satır düzeyinde erişim kuralları, yönetim
          paneline yalnızca yetkili kişilerin erişebilmesi, şifrelerin sitemizde tutulmaması (giriş Google üzerinden yapılır) ve
          hizmet sağlayıcılarımızın güvenlik önlemleri yer alır. Kişisel verilerinizin yetkisiz kişilerce ele geçirilmesi halinde bu
          durum en kısa sürede ilgili kişilere ve Kişisel Verileri Koruma Kurulu’na bildirilir.
        </p>
      </Bolum>

      <Bolum id="haklar" baslik="10. KVKK kapsamındaki haklarınız">
        <p>KVKK m. 11 uyarınca veri sorumlusuna başvurarak:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme,</li>
          <li>İşlenmişse buna ilişkin bilgi talep etme,</li>
          <li>İşlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme,</li>
          <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme,</li>
          <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme,</li>
          <li>KVKK m. 7’de öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme,</li>
          <li>Düzeltme, silme ve yok etme işlemlerinin, kişisel verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,</li>
          <li>İşlenen verilerin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme,</li>
          <li>Kanuna aykırı işleme sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
        </ul>
        <p>haklarına sahipsiniz. Açık rızaya dayanan işlemler bakımından rızanızı dilediğiniz zaman geri alabilirsiniz.</p>
      </Bolum>

      <Bolum id="basvuru" baslik="11. Başvuru yöntemi">
        <p>
          Haklarınıza ilişkin taleplerinizi, Veri Sorumlusuna Başvuru Usul ve Esasları Hakkında Tebliğ uyarınca Türkçe olarak ve
          aşağıdaki yollardan biriyle iletebilirsiniz:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Yukarıdaki adrese ıslak imzalı dilekçe ile,</li>
          <li>
            Sistemimizde kayıtlı e-posta adresinizden{" "}
            <a href={`mailto:${SITE_EPOSTA}`} className="text-[#1a3a6b] underline">{SITE_EPOSTA}</a> adresine,
          </li>
          {KEP_ADRESI && <li>Kayıtlı elektronik posta (KEP) ile {KEP_ADRESI} adresine,</li>}
          <li>Güvenli elektronik imza veya mobil imza ile,</li>
          <li>
            Firma kayıtlarına ilişkin kaldırma ve düzeltme talepleri için işletme sayfasındaki “Kaldırma / düzeltme talebi”
            bağlantısından veya <Link href="/iletisim" className="text-[#1a3a6b] underline">iletişim sayfasından</Link>.
          </li>
        </ul>
        <p>
          Başvurunuzda adınız soyadınız, (Türk vatandaşları için) T.C. kimlik numaranız, tebligata esas adresiniz, varsa e-posta
          adresiniz ve telefon numaranız ile talep konunuzun bulunması gerekir. Başvurunuz en geç 30 gün içinde ücretsiz olarak
          sonuçlandırılır; işlemin ayrıca bir maliyet gerektirmesi halinde Kişisel Verileri Koruma Kurulu’nca belirlenen tarifedeki
          ücret alınabilir.
        </p>
        <p>
          Başvurunuzun reddedilmesi, verilen cevabı yetersiz bulmanız veya süresinde cevap verilmemesi halinde, cevabı öğrendiğiniz
          tarihten itibaren 30 gün ve her halde başvuru tarihinden itibaren 60 gün içinde Kişisel Verileri Koruma Kurulu’na şikâyette
          bulunabilirsiniz (KVKK m. 14).
        </p>
      </Bolum>

      <Bolum id="degisiklikler" baslik="12. Metindeki değişiklikler">
        <p>
          Bu aydınlatma metni, mevzuattaki ve sitemizdeki değişikliklere göre güncellenebilir. Güncel metin her zaman bu sayfada
          yayımlanır; sayfanın başındaki sürüm tarihi son güncelleme tarihini gösterir.
        </p>
      </Bolum>
    </div>
  );
}
