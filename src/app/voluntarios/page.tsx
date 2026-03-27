"use client";

import DashboardLayout from "@/components/DashboardLayout";

export default function VoluntariosPage() {
  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Voluntários</h1>
        <p className="text-gray-500 text-sm mt-1">Em breve - escala e gestão de voluntários</p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
        <p className="text-4xl mb-4">🙋</p>
        <h2 className="text-lg font-semibold text-gray-900">Em desenvolvimento</h2>
        <p className="text-gray-500 text-sm mt-2">A escala de voluntários e áreas de serviço será implementada em breve.</p>
      </div>
    </DashboardLayout>
  );
}
