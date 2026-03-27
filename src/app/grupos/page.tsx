"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function GruposPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grupos / Células</h1>
        <p className="text-gray-500 text-sm mt-1">Em breve - gestão de grupos e células</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-4xl mb-4">🏘️</p>
        <h2 className="text-lg font-semibold text-gray-900">Em desenvolvimento</h2>
        <p className="text-gray-500 text-sm mt-2">A gestão de grupos e células será integrada com o app da igreja.</p>
      </div>
    </DashboardLayout>
  );
}
