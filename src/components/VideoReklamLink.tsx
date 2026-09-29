"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const VideoReklamModal = dynamic(() => import("./VideoReklamModal"), { ssr: false });

type Props = {
  href: string;
  className?: string;
  children: React.ReactNode;
  kategori?: string;
};

export default function VideoReklamLink({ href, className, children, kategori }: Props) {
  const router = useRouter();
  const [modalAcik, setModalAcik] = useState(false);

  const handleClick = () => setModalAcik(true);

  const tamamlandi = useCallback(() => {
    setModalAcik(false);
    router.push(href);
  }, [href, router]);

  return (
    <>
      {modalAcik && <VideoReklamModal onTamamlandi={tamamlandi} kategori={kategori} />}
      <button onClick={handleClick} className={className}>
        {children}
      </button>
    </>
  );
}
