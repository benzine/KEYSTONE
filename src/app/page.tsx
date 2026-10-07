"use client";

/**
 * Keystone Collective — React reconstruction of the original single-file
 * cinematic scroll site. Page composition + modal state ownership.
 */

import { useCallback, useState } from "react";
import { KcProvider } from "@/components/keystone/KcProvider";
import Preloader from "@/components/keystone/Preloader";
import Chrome from "@/components/keystone/Chrome";
import Nav from "@/components/keystone/Nav";
import Hero from "@/components/keystone/Hero";
import About from "@/components/keystone/About";
import Ledger from "@/components/keystone/Ledger";
import Services from "@/components/keystone/Services";
import Process from "@/components/keystone/Process";
import Cases from "@/components/keystone/Cases";
import Insights from "@/components/keystone/Insights";
import Tools from "@/components/keystone/Tools";
import Team from "@/components/keystone/Team";
import Contact from "@/components/keystone/Contact";
import Footer from "@/components/keystone/Footer";
import CaseModal from "@/components/keystone/CaseModal";
import KcmModal from "@/components/keystone/KcmModal";
import MatModal from "@/components/keystone/MatModal";
import Elara from "@/components/keystone/Elara";
import Dock from "@/components/keystone/Dock";
import Plumb from "@/components/keystone/Plumb";
import Veil from "@/components/keystone/Veil";
import type { KcmPayload } from "@/lib/keystone/kc-core";

interface CaseOpen {
  key: string | null;
  trigger: HTMLElement | null;
}

export default function KeystonePage() {
  const [caseOpen, setCaseOpen] = useState<CaseOpen>({
    key: null,
    trigger: null,
  });
  const [kcmOpen, setKcmOpen] = useState<KcmPayload | null>(null);

  const openCase = useCallback((key: string, trigger?: HTMLElement | null) => {
    setCaseOpen({ key, trigger: trigger ?? null });
  }, []);

  const openKcm = useCallback((payload: KcmPayload) => {
    setKcmOpen(payload);
  }, []);

  const closeCase = useCallback(() => setCaseOpen({ key: null, trigger: null }), []);
  const closeKcm = useCallback(() => setKcmOpen(null), []);

  return (
    <KcProvider openCase={openCase} openKcm={openKcm}>
      <Preloader />
      <Chrome />
      <Nav />
      <main>
        <Hero />
        <About />
        <Ledger />
        <Services />
        <Process />
        <Cases />
        <Insights />
        <Tools />
        <Team />
        <Contact />
      </main>
      <Footer />
      <CaseModal
        caseKey={caseOpen.key}
        trigger={caseOpen.trigger}
        onClose={closeCase}
      />
      <KcmModal payload={kcmOpen} onClose={closeKcm} />
      <MatModal />
      <Elara />
      <Dock />
      <Plumb />
      <Veil />
    </KcProvider>
  );
}
