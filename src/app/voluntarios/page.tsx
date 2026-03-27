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
  members: VolunteerMember[];
}

interface VolunteerMember {
  id: string;
  member_id: string;
  active: boolean;
  members: { full_name: string };
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
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [showAreaForm, setShowAreaForm] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [newAreaName, setNewAreaName] = useState("");
  const [scheduleForm, setScheduleForm] = useState({
    area_id: "", member_id: "", service_date: new Date().toISOString().split("T")[0],
  });
  const [expandedArea, setExpandedArea] = useState<string | null>(null);
  const [addMemberToArea, setAddMemberToArea] = useState("");
  const [tab, setTab] = useState<"areas" | "schedule">("areas");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    loadAreas();
    loadMembers();
    loadAssignments();
  }

  async function loadMembers() {
    const { data } = await supabase.from("members").select("id, full_name")
      .eq("church_id", CHURCH_ID).eq("active", true).order("full_name");
    setAllMembers(data ?? []);
  }

  async function loadAreas() {
    const { data: areasData } = await supabase.from("volunteer_areas").select("id, name")
      .eq("church_id", CHURCH_ID).order("name");

    if (areasData) {
      const withMembers = await Promise.all(areasData.map(async (a) => {
        const { data: vm } = await supabase.from("volunteer_members")
          .select("id, member_id, active, members:member_id(full_name)")
          .eq("volunteer_area_id", a.id)
          .order("active", { ascending: false });
        return { ...a, members: (vm as any) ?? [] };
      }));
      setAreas(withMembers);
    }
  }

  async function loadAssignments() {
    const { data } = await supabase.from("volunteer_assignments")
      .select("*, members:member_id(full_name), volunteer_areas:volunteer_area_id(name)")
      .order("service_date", { ascending: false }).limit(30);
    setAssignments((data as any) ?? []);
  }

  // --- Area CRUD ---
  async function handleAddArea() {
    if (!newAreaName.trim()) return;
    await supabase.from("volunteer_areas").insert({ church_id: CHURCH_ID, name: newAreaName.trim() });
    setNewAreaName("");
    setShowAreaForm(false);
    loadAreas();
  }

  async function handleDeleteArea(id: string, name: string) {
    if (!confirm(`Remover área "${name}"? Os vínculos e escalas serão removidos.`)) return;
    await supabase.from("volunteer_assignments").delete().eq("volunteer_area_id", id);
    await supabase.from("volunteer_members").delete().eq("volunteer_area_id", id);
    await supabase.from("volunteer_areas").delete().eq("id", id);
    setExpandedArea(null);
    loadAreas();
  }

  // --- Volunteer Member (vínculo) ---
  async function handleAddVolunteer(areaId: string) {
    if (!addMemberToArea) return;
    await supabase.from("volunteer_members").insert({
      volunteer_area_id: areaId, member_id: addMemberToArea,
    });
    setAddMemberToArea("");
    loadAreas();
  }

  async function handleRemoveVolunteer(vmId: string) {
    await supabase.from("volunteer_members").delete().eq("id", vmId);
    loadAreas();
  }

  async function handleToggleActive(vmId: string, currentActive: boolean) {
    await supabase.from("volunteer_members").update({ active: !currentActive }).eq("id", vmId);
    loadAreas();
  }

  // --- Schedule ---
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
  }

  async function handleStatusChange(id: string, newStatus: string) {
    await supabase.from("volunteer_assignments").update({ status: newStatus }).eq("id", id);
    loadAssignments();
  }

  async function handleDeleteAssignment(id: string) {
    await supabase.from("volunteer_assignments").delete().eq("id", id);
    loadAssignments();
  }

  // Get area members for scheduling (only active volunteers from that area)
  const selectedAreaMembers = scheduleForm.area_id
    ? areas.find((a) => a.id === scheduleForm.area_id)?.members.filter((m) => m.active) ?? []
    : [];

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Voluntários</h1>
          <p className="text-gray-500 text-sm mt-1">Áreas, vínculos e escalas</p>
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
            <input className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="Nome da área (ex: Louvor, Recepção)" autoFocus
              value={newAreaName} onChange={(e) => setNewAreaName(e.target.value)} />
            <button onClick={handleAddArea} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">Criar</button>
            <button onClick={() => setShowAreaForm(false)} className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">Cancelar</button>
          </div>
        </div>
      )}

      {/* Schedule form - only shows members linked to selected area */}
      {showScheduleForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Escalar Voluntário</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={scheduleForm.area_id}
              onChange={(e) => setScheduleForm({ ...scheduleForm, area_id: e.target.value, member_id: "" })}>
              <option value="">1. Selecionar área...</option>
              {areas.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.members.filter(m => m.active).length})</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={scheduleForm.member_id}
              onChange={(e) => setScheduleForm({ ...scheduleForm, member_id: e.target.value })}
              disabled={!scheduleForm.area_id}>
              <option value="">2. Selecionar voluntário...</option>
              {selectedAreaMembers.map((m) => (
                <option key={m.member_id} value={m.member_id}>{m.members.full_name}</option>
              ))}
            </select>
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" type="date"
              value={scheduleForm.service_date}
              onChange={(e) => setScheduleForm({ ...scheduleForm, service_date: e.target.value })} />
            <div className="flex gap-2">
              <button onClick={handleSchedule}
                disabled={!scheduleForm.area_id || !scheduleForm.member_id}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex-1 disabled:opacity-30">
                Escalar
              </button>
              <button onClick={() => setShowScheduleForm(false)}
                className="border border-gray-200 px-3 py-2 rounded-lg text-sm text-gray-600">✕</button>
            </div>
          </div>
          {scheduleForm.area_id && selectedAreaMembers.length === 0 && (
            <p className="text-sm text-amber-600 mt-3">⚠️ Nenhum voluntário ativo vinculado a esta área. Vincule pessoas primeiro.</p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("areas")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === "areas" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
          Áreas e Voluntários
        </button>
        <button onClick={() => setTab("schedule")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === "schedule" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
          Escalas
        </button>
      </div>

      {/* ===== AREAS TAB ===== */}
      {tab === "areas" && (
        <div className="space-y-3">
          {areas.map((area) => {
            const activeCount = area.members.filter((m) => m.active).length;
            const isExpanded = expandedArea === area.id;

            return (
              <div key={area.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Area header */}
                <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50/50"
                  onClick={() => setExpandedArea(isExpanded ? null : area.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">🙋</div>
                    <div>
                      <p className="font-semibold text-gray-900">{area.name}</p>
                      <p className="text-xs text-gray-500">
                        {activeCount} voluntário{activeCount !== 1 ? "s" : ""} ativo{activeCount !== 1 ? "s" : ""}
                        {area.members.length > activeCount ? ` • ${area.members.length - activeCount} inativo(s)` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {activeCount}
                    </span>
                    <span className="text-gray-300 text-xs">{isExpanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* Expanded: volunteers list */}
                {isExpanded && (
                  <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                    {/* Add volunteer to area */}
                    <div className="flex gap-2 mb-4">
                      <select className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                        value={addMemberToArea} onChange={(e) => setAddMemberToArea(e.target.value)}>
                        <option value="">Vincular pessoa a esta área...</option>
                        {allMembers
                          .filter((m) => !area.members.some((vm) => vm.member_id === m.id))
                          .map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                      <button onClick={() => handleAddVolunteer(area.id)} disabled={!addMemberToArea}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30">
                        Vincular
                      </button>
                      <button onClick={() => handleDeleteArea(area.id, area.name)}
                        className="text-red-400 hover:text-red-600 px-3 py-2 text-sm">
                        Excluir área
                      </button>
                    </div>

                    {/* Volunteers list */}
                    {area.members.length === 0 ? (
                      <p className="text-gray-400 text-sm">Nenhum voluntário vinculado</p>
                    ) : (
                      <div className="space-y-2">
                        {area.members.map((vm) => (
                          <div key={vm.id}
                            className={`flex items-center justify-between bg-white rounded-lg p-3 border border-gray-100 ${!vm.active ? "opacity-50" : ""}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">
                                {vm.members.full_name.charAt(0)}
                              </div>
                              <span className="text-sm font-medium text-gray-900">{vm.members.full_name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => handleToggleActive(vm.id, vm.active)}
                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  vm.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                }`}>
                                {vm.active ? "Ativo" : "Inativo"}
                              </button>
                              <button onClick={() => handleRemoveVolunteer(vm.id)}
                                className="text-xs text-red-400 hover:text-red-600">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {areas.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-4xl mb-4">🙋</p>
              <h2 className="text-lg font-semibold text-gray-900">Nenhuma área cadastrada</h2>
              <p className="text-gray-500 text-sm mt-2">Clique em "+ Área" para criar a primeira.</p>
            </div>
          )}
        </div>
      )}

      {/* ===== SCHEDULE TAB ===== */}
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
            <p className="text-center text-gray-400 text-sm py-8">Nenhuma escala registrada.</p>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
