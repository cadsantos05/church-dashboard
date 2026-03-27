"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/lib/supabase";

const CHURCH_ID = "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const ROLES = [
  { value: "minister", label: "Ministro" },
  { value: "soprano", label: "Soprano" },
  { value: "tenor", label: "Tenor" },
  { value: "alto", label: "Contralto" },
  { value: "bass_vocal", label: "Baixo (voz)" },
  { value: "guitar", label: "Guitarra" },
  { value: "acoustic", label: "Violão" },
  { value: "keys", label: "Teclado" },
  { value: "drums", label: "Bateria" },
  { value: "bass_guitar", label: "Baixo" },
];

interface Song {
  id: string;
  title: string;
  artist: string | null;
  original_key: string | null;
  bpm: number | null;
  lyrics: string | null;
  chords: string | null;
  audio_url: string | null;
  source: string;
}

interface ServiceSong {
  id: string;
  song_order: number;
  song_key: string | null;
  notes: string | null;
  songs: Song;
  roles?: { id: string; role: string; members: { full_name: string } }[];
}

export default function MusicasPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"library" | "setlist">("library");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "", artist: "", original_key: "G", bpm: "", lyrics: "", chords: "", audio_url: "",
  });
  const [saving, setSaving] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);

  // Set list state
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [setlistDate, setSetlistDate] = useState(new Date().toISOString().split("T")[0]);
  const [setlist, setSetlist] = useState<ServiceSong[]>([]);
  const [addSongId, setAddSongId] = useState("");
  const [addSongKey, setAddSongKey] = useState("G");
  const [members, setMembers] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    loadSongs();
    loadServices();
    loadMembers();
  }, []);

  useEffect(() => {
    if (selectedService && setlistDate) loadSetlist();
  }, [selectedService, setlistDate]);

  async function loadSongs() {
    const { data } = await supabase.from("songs").select("*")
      .eq("church_id", CHURCH_ID).eq("active", true).order("title");
    setSongs(data ?? []);
  }

  async function loadServices() {
    const { data } = await supabase.from("services").select("id, name")
      .eq("church_id", CHURCH_ID).eq("active", true);
    setServices(data ?? []);
    if (data && data.length > 0 && !selectedService) setSelectedService(data[0].id);
  }

  async function loadMembers() {
    const { data } = await supabase.from("volunteer_members")
      .select("member_id, members:member_id(id, full_name)")
      .eq("active", true);
    const unique = new Map();
    (data ?? []).forEach((d: any) => { if (d.members) unique.set(d.members.id, d.members); });
    setMembers(Array.from(unique.values()));
  }

  async function loadSetlist() {
    const { data } = await supabase.from("service_songs")
      .select("*, songs(*)")
      .eq("church_id", CHURCH_ID)
      .eq("service_id", selectedService)
      .eq("service_date", setlistDate)
      .order("song_order");

    if (data) {
      const withRoles = await Promise.all(data.map(async (ss: any) => {
        const { data: roles } = await supabase.from("song_roles")
          .select("*, members:member_id(full_name)")
          .eq("service_song_id", ss.id);
        return { ...ss, roles: roles ?? [] };
      }));
      setSetlist(withRoles);
    }
  }

  // Song CRUD
  async function handleSaveSong() {
    if (!form.title.trim()) return;
    setSaving(true);

    const payload = {
      church_id: CHURCH_ID,
      title: form.title.trim(),
      artist: form.artist.trim() || null,
      original_key: form.original_key || null,
      bpm: form.bpm ? parseInt(form.bpm) : null,
      lyrics: form.lyrics.trim() || null,
      chords: form.chords.trim() || null,
      audio_url: form.audio_url.trim() || null,
      source: "manual",
    };

    if (editingSong) {
      await supabase.from("songs").update(payload).eq("id", editingSong.id);
    } else {
      await supabase.from("songs").insert(payload);
    }

    setSaving(false);
    setShowForm(false);
    setEditingSong(null);
    setForm({ title: "", artist: "", original_key: "G", bpm: "", lyrics: "", chords: "", audio_url: "" });
    loadSongs();
  }

  function handleEdit(song: Song) {
    setEditingSong(song);
    setForm({
      title: song.title,
      artist: song.artist ?? "",
      original_key: song.original_key ?? "G",
      bpm: song.bpm?.toString() ?? "",
      lyrics: song.lyrics ?? "",
      chords: song.chords ?? "",
      audio_url: song.audio_url ?? "",
    });
    setShowForm(true);
    setTab("library");
  }

  async function handleDeleteSong(id: string, title: string) {
    if (!confirm(`Remover "${title}"?`)) return;
    await supabase.from("songs").update({ active: false }).eq("id", id);
    loadSongs();
  }

  // Set list
  async function handleAddToSetlist() {
    if (!addSongId || !selectedService) return;
    const nextOrder = setlist.length + 1;
    await supabase.from("service_songs").insert({
      church_id: CHURCH_ID,
      service_id: selectedService,
      service_date: setlistDate,
      song_id: addSongId,
      song_order: nextOrder,
      song_key: addSongKey,
    });
    setAddSongId("");
    loadSetlist();
  }

  async function handleRemoveFromSetlist(id: string) {
    await supabase.from("song_roles").delete().eq("service_song_id", id);
    await supabase.from("service_songs").delete().eq("id", id);
    loadSetlist();
  }

  async function handleAddRole(serviceSongId: string, memberId: string, role: string) {
    if (!memberId || !role) return;
    await supabase.from("song_roles").insert({
      service_song_id: serviceSongId,
      member_id: memberId,
      role,
    });
    loadSetlist();
  }

  async function handleRemoveRole(roleId: string) {
    await supabase.from("song_roles").delete().eq("id", roleId);
    loadSetlist();
  }

  const filtered = songs.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    (s.artist ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Músicas</h1>
          <p className="text-gray-500 text-sm mt-1">{songs.length} músicas na biblioteca</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); setEditingSong(null); setForm({ title: "", artist: "", original_key: "G", bpm: "", lyrics: "", chords: "", audio_url: "" }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          + Nova Música
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("library")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === "library" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
          Biblioteca
        </button>
        <button onClick={() => setTab("setlist")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition ${tab === "setlist" ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
          Set List do Culto
        </button>
      </div>

      {/* ===== ADD/EDIT SONG FORM ===== */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">{editingSong ? "Editar Música" : "Nova Música"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Título *"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm" placeholder="Artista"
              value={form.artist} onChange={(e) => setForm({ ...form, artist: e.target.value })} />
            <div className="flex gap-2">
              <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1"
                value={form.original_key} onChange={(e) => setForm({ ...form, original_key: e.target.value })}>
                {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <input className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-24" placeholder="BPM" type="number"
                value={form.bpm} onChange={(e) => setForm({ ...form, bpm: e.target.value })} />
            </div>
          </div>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4" placeholder="Link do áudio (YouTube, Spotify...)"
            value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Letra</label>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" rows={8}
                placeholder="Cole a letra aqui..."
                value={form.lyrics} onChange={(e) => setForm({ ...form, lyrics: e.target.value })} />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Cifra</label>
              <textarea className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono" rows={8}
                placeholder="Cole a cifra aqui..."
                value={form.chords} onChange={(e) => setForm({ ...form, chords: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveSong} disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
              {saving ? "Salvando..." : editingSong ? "Atualizar" : "Salvar"}
            </button>
            <button onClick={() => { setShowForm(false); setEditingSong(null); }}
              className="border border-gray-200 px-4 py-2 rounded-lg text-sm text-gray-600">Cancelar</button>
          </div>
        </div>
      )}

      {/* ===== LIBRARY TAB ===== */}
      {tab === "library" && (
        <>
          <input className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white mb-4"
            placeholder="Buscar por título ou artista..."
            value={search} onChange={(e) => setSearch(e.target.value)} />

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Título</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Artista</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tom</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">BPM</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Cifra</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{s.title}</p>
                      {s.audio_url && <a href={s.audio_url} target="_blank" className="text-xs text-blue-500">🎵 ouvir</a>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{s.artist || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">{s.original_key || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{s.bpm || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {s.chords ? <span className="text-xs text-green-600">✓</span> : <span className="text-xs text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleEdit(s)} className="text-xs text-blue-600 mr-3">Editar</button>
                      <button onClick={() => handleDeleteSong(s.id, s.title)} className="text-xs text-red-400">Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <p className="text-center text-gray-400 text-sm py-8">Nenhuma música encontrada</p>}
          </div>
        </>
      )}

      {/* ===== SET LIST TAB ===== */}
      {tab === "setlist" && (
        <>
          {/* Service + Date selector */}
          <div className="flex gap-3 mb-4">
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={selectedService} onChange={(e) => setSelectedService(e.target.value)}>
              {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <input type="date" className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={setlistDate} onChange={(e) => setSetlistDate(e.target.value)} />
          </div>

          {/* Add song to setlist */}
          <div className="flex gap-2 mb-6">
            <select className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
              value={addSongId} onChange={(e) => setAddSongId(e.target.value)}>
              <option value="">Adicionar música ao set list...</option>
              {songs.map((s) => <option key={s.id} value={s.id}>{s.title} - {s.artist} ({s.original_key})</option>)}
            </select>
            <select className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white w-20"
              value={addSongKey} onChange={(e) => setAddSongKey(e.target.value)}>
              {KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
            <button onClick={handleAddToSetlist} disabled={!addSongId}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-30">
              Adicionar
            </button>
          </div>

          {/* Set list */}
          {setlist.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
              <p className="text-4xl mb-4">🎵</p>
              <h2 className="text-lg font-semibold text-gray-900">Set list vazio</h2>
              <p className="text-gray-500 text-sm mt-2">Adicione músicas acima para montar o set list deste culto.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {setlist.map((ss, idx) => (
                <div key={ss.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{ss.songs.title}</p>
                      <p className="text-xs text-gray-500">{ss.songs.artist}</p>
                    </div>
                    <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded">Tom: {ss.song_key || ss.songs.original_key}</span>
                    <button onClick={() => handleRemoveFromSetlist(ss.id)} className="text-xs text-red-400">✕</button>
                  </div>

                  {/* Roles */}
                  <div className="ml-12">
                    {(ss.roles ?? []).map((r: any) => (
                      <div key={r.id} className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-medium">
                          {ROLES.find((rl) => rl.value === r.role)?.label || r.role}
                        </span>
                        <span className="text-xs text-gray-600">{r.members.full_name}</span>
                        <button onClick={() => handleRemoveRole(r.id)} className="text-xs text-red-300">✕</button>
                      </div>
                    ))}

                    {/* Add role inline */}
                    <div className="flex gap-2 mt-2">
                      <select id={`member-${ss.id}`} className="border border-gray-200 rounded px-2 py-1 text-xs flex-1">
                        <option value="">Pessoa...</option>
                        {members.map((m) => <option key={m.id} value={m.id}>{m.full_name}</option>)}
                      </select>
                      <select id={`role-${ss.id}`} className="border border-gray-200 rounded px-2 py-1 text-xs">
                        <option value="">Função...</option>
                        {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                      <button onClick={() => {
                        const memberEl = document.getElementById(`member-${ss.id}`) as HTMLSelectElement;
                        const roleEl = document.getElementById(`role-${ss.id}`) as HTMLSelectElement;
                        handleAddRole(ss.id, memberEl.value, roleEl.value);
                        memberEl.value = "";
                        roleEl.value = "";
                      }}
                        className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
