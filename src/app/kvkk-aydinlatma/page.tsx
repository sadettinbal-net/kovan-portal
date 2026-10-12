import type { Metadata } from "next";
import Link from "next/link";
import { SITE_EPOSTA } from "@/lib/site";
import { KVKK_SURUM } from "@/lib/telefonTalebi";

// TASLAK: Yayına almadan önce bir hukukçuya kontrol ettirilmeli (veri sorumlusu unvanı, adres, VERBİS durumu).

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni | Kovan Portal",
  description: "Firma telefon numarası ve e-posta bilgisi eklerken işlenen kişisel veriler hakkında aydınlatma metni.",
};

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="text-lg font-semibold text-[#1a3a6b] mb-2">{baslik}</h2>
      <div className="text-sm text-gray-700 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function KvkkAydinlatmaPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1a3a6b] mb-2">KVKK Aydınlatma Metni</h1>
      <p className="text-sm text-gray-500 mb-8">Firma iletişim bilgisi ekleme · Sürüm {KVKK_SURUM}</p>

      <Bolum baslik="1. Veri sorumlusu">
        <p>
          6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verileriniz, veri sorumlusu sıfatıyla
          Kovan Portal tarafından aşağıda açıklanan şekilde işlenir.
        </p>
      </Bolum>

      <Bolum baslik="2. Hangi verileri işliyoruz?">
        <ul className="list-disc pl-5 space-y-1">
          <li>Google hesabınızın e-posta adresi ve adınız soyadınız,</li>
          <li>Firmanız için girdiğiniz telefon numarası,</li>
          <li>Doğrulama kayıtları: doğrulama zamanı, bu metni onayladığınız zaman ve sürüm, IP adresi.</li>
        </ul>
        <p>SMS doğrulama kodu ve e-posta onay bağlantısı tarafımızda açık hâliyle saklanmaz.</p>
      </Bolum>

      <Bolum baslik="3. Hangi amaçla işliyoruz?">
        <ul className="list-disc pl-5 space-y-1">
          <li>Telefon numaranızı ve e-posta adresinizi firmanızın sayfasında yayınlayarak müşterilerin size ulaşmasını sağlamak,</li>
          <li>Numaranın gerçekten işletme sahibine ait olduğunu doğrulamak ve kötüye kullanımı önlemek,</li>
          <li>Firma kaydınızı Google hesabınızla eşleştirerek ileride bilgilerinizi kendinizin güncelleyebilmesini sağlamak.</li>
        </ul>
      </Bolum>

      <Bolum baslik="4. Hukuki sebep">
        <p>
          Verileriniz, açık rızanız (KVKK m. 5/1) ve bir hakkın tesisi ile meşru menfaatimiz için zorunlu olması
          (KVKK m. 5/2-f) hukuki sebeplerine dayanılarak işlenir.
        </p>
      </Bolum>

      <Bolum baslik="5. Kimlere aktarılır?">
        <p>
          Onayladığınız telefon numarası ve e-posta adresi firma sayfasında herkese açık olarak yayınlanır. Doğrulama
          için SMS ve e-posta gönderim hizmeti aldığımız firmalara yalnızca gönderim için gereken bilgi (numara veya
          e-posta adresi) iletilir. Veriler, barındırma hizmeti aldığımız altyapı sağlayıcılarında saklanır.
        </p>
      </Bolum>

      <Bolum baslik="6. Ne kadar süre saklanır?">
        <p>
          Yayındaki iletişim bilgileri, siz kaldırılmasını isteyene kadar; doğrulama kayıtları ise ispat amacıyla
          en fazla 2 yıl saklanır.
        </p>
      </Bolum>

      <Bolum baslik="7. Haklarınız">
        <p>
          KVKK m. 11 kapsamında verilerinizin işlenip işlenmediğini öğrenme, düzeltilmesini veya silinmesini isteme,
          işlemeye itiraz etme gibi haklara sahipsiniz. Talebinizi{" "}
          <a href={`mailto:${SITE_EPOSTA}`} className="text-[#1a3a6b] underline">{SITE_EPOSTA}</a> adresine veya{" "}
          <Link href="/iletisim" className="text-[#1a3a6b] underline">iletişim sayfasına</Link> iletebilirsiniz.
        </p>
      </Bolum>
    </div>
  );
}
