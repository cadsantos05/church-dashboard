"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

const CHURCH_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const STATUS_MAP: Record<string, { label: string; color: string }> = {
  scheduled: { label: "Escalado", color: "bg-yellow-100 text-yellow-700" },
  confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Serviu", color: "bg-green-100 text-green-700" },
  absent: { label: "Faltou", color: "bg-red-100 text-red-700" },
};

interface Area {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  volunteer_count?: number;
}

interface Assignment {
  id: string;
  service_date: string;
  status: string;
  members: { full_name: string };
  volunteer_areas: { name: string };
}

interface Member {
  id: string;
  full_name: string;
}

export default function VoluntariosPage() {
  const [areas, setAreas] = useState<Area[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    area_id: "", member_id: "", service_date: new Date().toISOString().split("T")[0],
  });
  const [tab, setTab] = useState<"areas" | "schedule">("areas");

  useEffect(() => {
    loadAreas();
    loadMembers();
    loadAssignments();
  }, []);

  async function loadMembers() {
    const { data } = await supabase.from("members").select("id, full_name")
      .eq("church_id", CHURCH_ID).eq("active", true).order("full_name");
    setMembers(data ?? []);
  }

  async function loadAreas() {
    const { data } = await supabase.from("volunteer_areas").select("*")
      .eq("church_id", CHURCH_ID).order("name");
    if (data) {
      const withCount = await Promise.all(data.map(async (a) => {
        const { count } = await supabase.from("volunteer_assignments")
          .select("*", { count: "exact", head: true })
          .eq("volunteer_area_id", a.id)
          .eq("status", "completed");
        return { ...a, volunteer_count: count ?? 0 };
      }));
      setAreas(withCount);
    }
  }

  async function loadAssignments() {
    const { data } = await supabase.from("volunteer_assignments")
      .select("*, members:member_id(full_name), volunteer_areas:volunteer_area_id(name)")
      .order("service_date", { ascending: false })
      .limit(30);
    setAssignments((data as any) ?? []);
  }

  async function handleAddArea() {
    if (!newAreaName.trim()) return;
    await supabase.from("volunteer_areas").insert({
      church_id: CHURCH_ID, name: newAreaName.trim(),
    });
    setNewAreaName("");
    setShowAreaForm(false);
    loadAreas();
  }

  async function handleDeleteArea(id: string, name: string) {
    if (!confirm(`Remover área "${name}"? As escalas desta área serão removidas.`)) return;
    await supabase.from("volunteer_assignments").delete().eq("volunteer_area_id", id);
    await supabase.from("volunteer_areas").delete().eq("id", id);
    loadAreas();
  }

  async function handleSchedule() {
    if (!scheduleForm.area_id || !scheduleForm.member_id) return;
    await supabase.from("volunteer_assignments").insert({
      volunteer_area_id: scheduleForm.area_id,
      member_id: scheduleForm.member_id,
      service_date: scheduleForm.service_date,
      status: "scheduled",
    });
    setScheduleForm({ area_id: "", member_id: "", service_date: new Date().toISOString().split("T")[0] });
    setShowScheduleForm(false);
    loadAssignments();
    loadAreas();
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await supabase.from("volunteer_assignments").update({ status: newStatus }).eq("id", id);
    loadAssignments();
    loadAreas();
  }

  async function handleDeleteAssignment(id: string) {
    await supabase.from("volunteer_assignments").delete().eq("id", id);
    loadAssignments();
    loadAreas();
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voluntários</h1>
          <p className="text-gray-500 text-sm mt-1">Áreas de serviço e escalas</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => { setShowAreaForm(!showAreaForm); setShowScheduleForm(false); }}
            className="border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            + Área
          </button>
          <button onClick={() => { setShowScheduleForm(!showScheduleForm); setShowAreaForm(false); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            + Escalar
          </button>
        </div>
      </div>

      {/* Add area form */}
      {showAreaForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Nova Área de Serviço</h3>
          <div className="flex gap-3">
            <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Nome da área (ex: Louvor, Recepção)"
              value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} autoFocus />
            <button onClick={handleAddArea} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Criar</button>
            <button onClick={() => setShowAreaForm(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">Cancelar</button>
          </div>
        </div>
      )}

      {/* Schedule form */}
      {showScheduleForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Escalar Voluntário</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={scheduleForm.member_id} onChange={(e) => setScheduleForm({ ...scheduleForm, member_id: e.target.value })}>
              <option value="">Selecionar pessoa...</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={scheduleForm.area_id} onChange={(e) => setScheduleForm({ ...scheduleForm, area_id: e.target.value })}>
              <option value="">Selecionar área...</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" type="date"
              value={scheduleForm.service_date} onChange={(e) => setScheduleForm({ ...scheduleForm, service_date: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={handleSchedule} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex-1">Escalar</button>
              <button onClick={() => setShowScheduleForm(false)} className="border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-600">✕</button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("areas")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === "areas" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
          Áreas de Serviço
        </button>
        <button onClick={() => setTab("schedule")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === "schedule" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
          Escala / Histórico
        </button>
      </div>

      {tab === "areas" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {areas.map((a) => (
            <div key={a.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">🙋</div>
                  <div>
                    <p className="font-semibold text-gray-900">{a.name}</p>
                    <p className="text-xs text-gray-500">{a.volunteer_count} escalas completas</p>
                  </div>
                </div>
                <button onClick={() => handleDeleteArea(a.id, a.name)}
                  className="text-xs text-red-400 hover:text-red-600">✕</button>
              </div>
            </div>
          ))}
          {areas.length === 0 && (
            <div className="col-span-full bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-4xl mb-4">🙋</p>
              <h2 className="text-lg font-semibold text-gray-900">Nenhuma área cadastrada</h2>
              <p className="text-gray-500 text-sm mt-2">Clique em "+ Área" para criar a primeira.</p>
            </div>
          )}
        </div>
      )}

      {tab === "schedule" && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Voluntário</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Área</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {assignments.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                        {a.members?.full_name?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900">{a.members?.full_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{a.volunteer_areas?.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{new Date(a.service_date).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <select
                      className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${STATUS_MAP[a.status]?.color || "bg-gray-100 text-gray-600"}`}
                      value={a.status}
                      onChange={(e) => handleStatusChange(a.id, e.target.value)}>
                      <option value="scheduled">Escalado</option>
                      <option value="confirmed">Confirmado</option>
                      <option value="completed">Serviu</option>
                      <option value="absent">Faltou</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleDeleteAssignment(a.id)}
                      className="text-xs text-red-400 hover:text-red-600">Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {assignments.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Nenhuma escala registrada. Clique em "+ Escalar" para começar.</p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
