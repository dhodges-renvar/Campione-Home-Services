'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
export default function ProspectsIndex() {
  const router = useRouter();
  useEffect(() => { router.replace('/leads?tab=builders'); }, [router]);
  return null;
}
