import { Suspense } from 'react';
import UstMenu from '@/components/site/UstMenu';
import AltBilgi from '@/components/site/AltBilgi';
import FirmalarListesi from './FirmalarListesi';

export default function FirmalarPage() {
  return (
    <div className="min-h-screen bg-[#f4f6f9] text-gray-800">
      <UstMenu />
      <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-500">Yükleniyor...</div>}>
        <FirmalarListesi />
      </Suspense>
      <AltBilgi />
    </div>
  );
}
