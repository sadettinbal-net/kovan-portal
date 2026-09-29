import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası ve Çerez Politikası | Ümraniye Sanayi Sitesi",
  description: "Ümraniye Sanayi Sitesi kişisel verilerin korunması, gizlilik politikası ve çerez kullanımı hakkında bilgilendirme.",
};

export default function GizlilikPolitikasiPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-[#1a3a6b] mb-2">Gizlilik & Çerez Politikası</h1>
      <p className="text-sm text-gray-500 mb-8">Son güncelleme: Nisan 2025</p>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#1a3a6b] mb-3">1. Çerez (Cookie) Nedir?</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Çerezler, ziyaret ettiğiniz web sitesi tarafından tarayıcınıza kaydedilen küçük metin dosyalarıdır. Oturum yönetimi, tercih hatırlama ve site kullanımının analiz edilmesi gibi amaçlarla kullanılır.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#1a3a6b] mb-3">2. Kullandığımız Çerezler</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-[#1a3a6b] text-white">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Çerez Adı</th>
                <th className="px-4 py-2 text-left font-medium">Tür</th>
                <th className="px-4 py-2 text-left font-medium">Amaç</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">sb-*-auth-token</td>
                <td className="px-4 py-2 text-gray-600">Zorunlu</td>
                <td className="px-4 py-2 text-gray-600">Google OAuth oturum yönetimi (Supabase)</td>
              </tr>
              <tr className="bg-gray-50">
                <td className="px-4 py-2 font-mono text-xs">cerez-onay</td>
                <td className="px-4 py-2 text-gray-600">Zorunlu</td>
                <td className="px-4 py-2 text-gray-600">Çerez onayınızın kaydedilmesi</td>
              </tr>
              <tr className="bg-white">
                <td className="px-4 py-2 font-mono text-xs">sb-*-code-verifier</td>
                <td className="px-4 py-2 text-gray-600">Zorunlu</td>
                <td className="px-4 py-2 text-gray-600">Güvenli OAuth PKCE akışı doğrulaması</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#1a3a6b] mb-3">3. Kişisel Verilerin İşlenmesi (KVKK)</h2>
        <p className="text-sm text-gray-700 leading-relaxed mb-3">
          Google hesabınızla giriş yaptığınızda, <strong>ad-soyad</strong> ve <strong>e-posta adresiniz</strong> sistemimizde saklanır. Bu veriler yalnızca;
        </p>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-2">
          <li>Üyelik ve oturum yönetimi</li>
          <li>Kullanıcı deneyiminin kişiselleştirilmesi</li>
          <li>Yasal yükümlülüklerin yerine getirilmesi</li>
        </ul>
        <p className="text-sm text-gray-700 leading-relaxed mt-3">
          amacıyla, 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında işlenmektedir. Verileriniz üçüncü şahıslarla paylaşılmaz ve satılmaz.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-[#1a3a6b] mb-3">4. Haklarınız</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          KVKK&apos;nın 11. maddesi kapsamında; verilerinize erişim, düzeltme, silme, işlemenin kısıtlanması ve itiraz haklarına sahipsiniz. Talepleriniz için{" "}
          <a href="/iletisim" className="text-[#1a3a6b] underline font-medium hover:text-[#e8a020] transition-colors">
            iletişim sayfamızı
          </a>{" "}
          kullanabilirsiniz.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-[#1a3a6b] mb-3">5. Çerezleri Devre Dışı Bırakma</h2>
        <p className="text-sm text-gray-700 leading-relaxed">
          Tarayıcı ayarlarınızdan çerezleri devre dışı bırakabilirsiniz. Ancak zorunlu çerezleri kapatmanız durumunda Google ile giriş gibi bazı özellikler çalışmayabilir.
        </p>
      </section>
    </div>
  );
}
