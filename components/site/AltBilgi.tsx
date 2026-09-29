import Link from 'next/link';

// Yeni tasarımın lacivert alt bilgisi
export default function AltBilgi() {
  return (
    <footer className="bg-[#1a3a6b] text-white/80 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-sm">
        <div>
          <p className="font-black text-white text-lg">🐝 KOVAN PORTAL</p>
          <p className="mt-2 leading-relaxed">
            Türkiye&apos;nin sanayi rehberi. Sanayi sitelerindeki ustalara ve firmalara kolayca ulaşın.
          </p>
        </div>
        <div>
          <p className="font-bold text-white mb-3">Hızlı Erişim</p>
          <ul className="space-y-2">
            <li><Link href="/firmalar" className="hover:text-white">Firmalar</Link></li>
            <li><Link href="/firma-ekle" className="hover:text-white">Firma Ekle</Link></li>
            <li><Link href="/" className="hover:text-white">Konuma Göre Ara</Link></li>
            <li><Link href="/iletisim" className="hover:text-white">İletişim</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-white mb-3">Üyelik</p>
          <ul className="space-y-2">
            <li><Link href="/uye-ol" className="hover:text-white">Üye Ol</Link></li>
            <li><Link href="/giris" className="hover:text-white">Giriş Yap</Link></li>
          </ul>
        </div>
        <div>
          <p className="font-bold text-white mb-3">İletişim</p>
          <p>Soru ve önerileriniz için iletişim formunu kullanabilirsiniz.</p>
          <Link
            href="/iletisim"
            className="inline-block mt-3 bg-[#e8a020] hover:bg-[#c8851a] text-white font-bold px-4 py-2 rounded-md transition"
          >
            Bize Yazın
          </Link>
        </div>
      </div>
      <div className="bg-[#0f2548] text-center text-xs py-3">© {new Date().getFullYear()} Kovan Portal</div>
    </footer>
  );
}
