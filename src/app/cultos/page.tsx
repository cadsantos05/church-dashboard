"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

const CHURCH_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export default function CultosPage() {
  const [attendances, setAttendances] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [form, setForm] = useState({ service_id: "", headcount: "", visitors: "", service_date: new Date().toISOString().split("T")[0] });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadServices();
    loadAttendances();
  }, []);

  async function loadServices() {
    const { data } = await supabase.from("services").select("*")
      .eq("church_id", CHURCH_ID).eq("active", true).order("day_of_week");
    setServices(data ?? []);
  }

  async function loadAttendances() {
    const { data } = await supabase.from("service_attendance").select("*, services:service_id(name)")
      .eq("church_id", CHURCH_ID)
      .order("service_date", { ascending: false }).limit(20);
    setAttendances(data ?? []);
  }

  async function handleSave() {
    if (!form.headcount) return;
    await supabase.from("service_attendance").insert({
      church_id: CHURCH_ID,
      service_id: form.service_id || null,
      service_date: form.service_date,
      headcount: parseInt(form.headcount),
      visitors: parseInt(form.visitors) || 0,
    });
    setShowForm(false);
    setForm({ service_id: "", headcount: "", visitors: "", service_date: new Date().toISOString().split("T")[0] });
    loadAttendances();
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cultos</h1>
          <p className="text-gray-500 text-sm mt-1">Presença e contagem por culto</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Registrar Presença
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Registrar Contagem</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.service_id} onChange={(e) => setForm({ ...form, service_id: e.target.value })}>
              <option value="">Selecionar culto...</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({DAYS[s.day_of_week]})</option>
              ))}
            </select>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" type="date"
              value={form.service_date} onChange={(e) => setForm({ ...form, service_date: e.target.value })} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" type="number"
              placeholder="Total de pessoas" value={form.headcount}
              onChange={(e) => setForm({ ...form, headcount: e.target.value })} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" type="number"
              placeholder="Visitantes" value={form.visitors}
              onChange={(e) => setForm({ ...form, visitors: e.target.value })} />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Salvar</button>
            <button onClick={() => setShowForm(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">Cancelar</button>
          </div>
        </div>
      )}

      {/* Services list */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {services.map((s) => (
          <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="font-semibold text-gray-900">{s.name}</p>
            <p className="text-sm text-gray-500">{DAYS[s.day_of_week]} • {s.start_time?.slice(0, 5)}</p>
          </div>
        ))}
      </div>

      {/* Attendance history */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Culto</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Pessoas</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Visitantes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {attendances.map((a) => (
              <tr key={a.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3 text-sm text-gray-900">{new Date(a.service_date).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{a.services?.name || "—"}</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">{a.headcount}</td>
                <td className="px-4 py-3 text-right text-sm text-purple-600">{a.visitors || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {attendances.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhum registro</p>}
      </div>
    </DashboardLayout>
  );
}
