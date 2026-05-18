'use client';

import { usePathname } from 'next/navigation';

export default function CanonicalLink() {
  const pathname = usePathname();
  return <link rel="canonical" href={`https://pauseapp.space${pathname}`} />;
}