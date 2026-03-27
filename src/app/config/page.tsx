"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

const CHURCH_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export default function ConfigPage() {
  const [church, setChurch] = useState<any>(null);
  const [form, setForm] = useState({ name: "", admin_pin: "", primary_color: "#2563EB", logo_url: "" });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadChurch(); }, []);

  async function loadChurch() {
    const { data } = await supabase.from("churches").select("*").eq("id", CHURCH_ID).single();
    if (data) {
      setChurch(data);
      setForm({
        name: data.name || "",
        admin_pin: data.admin_pin || "",
        primary_color: data.primary_color || "#2563EB",
        logo_url: data.logo_url || "",
      });
    }
  }

  async function handleSave() {
    setSaving(true);
    await supabase.from("churches").update({
      name: form.name,
      admin_pin: form.admin_pin,
      primary_color: form.primary_color,
      logo_url: form.logo_url || null,
    }).eq("id", CHURCH_ID);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
        <p className="text-gray-500 text-sm mt-1">Dados da igreja e sistema</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Church info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Dados da Igreja</h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Nome da igreja</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">URL do logo</label>
              <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="https://..."
                value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} />
              {form.logo_url && (
                <img src={form.logo_url} alt="Logo" className="w-16 h-16 rounded-full mt-2 object-cover" />
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">Cor principal</label>
              <div className="flex items-center gap-3">
                <input type="color" value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer" />
                <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32"
                  value={form.primary_color} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} />
                <div className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: form.primary_color }}>
                  Preview
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600 block mb-1">PIN do Check-in (admin)</label>
              <input className="w-32 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-center tracking-widest"
                value={form.admin_pin} onChange={(e) => setForm({ ...form, admin_pin: e.target.value })} maxLength={6} />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button onClick={handleSave} disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
            {saved && <span className="text-green-600 text-sm">✓ Salvo!</span>}
          </div>
        </div>

        {/* Check-in link */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-900 mb-2">Link do Check-in Kids</h3>
          <p className="text-sm text-gray-500 mb-3">Use este link nos tablets da igreja:</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-blue-600">
              https://church-checkin-snowy.vercel.app
            </code>
            <button onClick={() => navigator.clipboard.writeText("https://church-checkin-snowy.vercel.app")}
              className="border border-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-gray-50">
              Copiar
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
