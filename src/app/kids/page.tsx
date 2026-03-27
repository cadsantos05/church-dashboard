"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

const CHURCH_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export default function KidsPage() {
  const [checkins, setCheckins] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [stats, setStats] = useState({ total: 0, checkedOut: 0, stillIn: 0 });

  useEffect(() => { loadCheckins(); }, [date]);

  async function loadCheckins() {
    const { data } = await supabase
      .from("checkins")
      .select("*, children:child_id(full_name, classroom, allergies), guardians:guardian_id(full_name)")
      .eq("church_id", CHURCH_ID).eq("service_date", date)
      .order("checked_in_at", { ascending: false });

    const items = data ?? [];
    setCheckins(items);
    setStats({
      total: items.length,
      checkedOut: items.filter((c: any) => c.checked_out_at).length,
      stillIn: items.filter((c: any) => !c.checked_out_at).length,
    });
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kids Ministry</h1>
          <p className="text-gray-500 text-sm mt-1">Dados do check-in de crianças</p>
        </div>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Total check-ins</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Ainda na sala</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{stats.stillIn}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 uppercase">Check-out feito</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{stats.checkedOut}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Criança</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sala</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Responsável</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Código</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {checkins.map((ci: any) => (
              <tr key={ci.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">{ci.children?.full_name}</p>
                  {ci.children?.allergies && (
                    <p className="text-xs text-yellow-600">⚠️ {ci.children.allergies}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{ci.children?.classroom}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{ci.guardians?.full_name}</td>
                <td className="px-4 py-3 text-sm font-mono text-blue-600">{ci.security_code}</td>
                <td className="px-4 py-3">
                  {ci.checked_out_at ? (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full">Check-out ✓</span>
                  ) : (
                    <span className="text-xs bg-green-50 text-green-600 px-2 py-1 rounded-full">Na sala</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {checkins.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhum check-in nesta data</p>}
      </div>
    </DashboardLayout>
  );
}
