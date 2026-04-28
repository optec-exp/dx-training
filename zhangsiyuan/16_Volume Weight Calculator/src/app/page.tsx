"use client";

import { AppProvider } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { FreightSettings } from '@/components/FreightSettings';
import { CargoFormPanel } from '@/components/CargoFormPanel';
import { CargoResultTable } from '@/components/CargoResultTable';
import { SummaryCards } from '@/components/SummaryCards';
import { DiagramPanel } from '@/components/DiagramPanel';

export default function Page() {
  return (
    <AppProvider>
      <div className="app">
        <Header />
        <main className="main">
          <FreightSettings />
          <div className="content-grid">
            <CargoFormPanel />
            <CargoResultTable />
          </div>
          <SummaryCards />
          <DiagramPanel />
        </main>
      </div>
    </AppProvider>
  );
}
