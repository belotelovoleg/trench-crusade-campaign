"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { Box, Button, Typography, CircularProgress, MenuItem, Select, FormControl, InputLabel, Paper } from "@mui/material";
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import adminStyles from '../../admin.module.css';

export const dynamic = "force-dynamic";

function WarbandStoriesPageInner() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const searchParams = useSearchParams();
  const warbandId = searchParams?.get('id');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<number>(0);
  const [games, setGames] = useState<any[]>([]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
    ],
    content: '',
  });
  // Завантаження історій та ігор
  useEffect(() => {
    if (!warbandId || !campaignId) return;
    setLoading(true);
    fetch(`/api/campaigns/${campaignId}/admin/warbands/${warbandId}/stories`)
      .then(res => res.json())
      .then(data => {
        setStories(data.stories || []);
        setGames(data.games || []);
        // Якщо є історія для 0, підставити її
        const found = (data.stories || []).find((s:any) => s.number === 0);
        if (found && editor) editor.commands.setContent(found.html || "");
      })
      .catch(() => setError("Не вдалося завантажити оповідання"))
      .finally(() => setLoading(false));
  }, [warbandId, campaignId, editor]);

  // При зміні номера гри — підвантажити текст
  useEffect(() => {
    if (!editor) return;
    const found = stories.find((s:any) => s.number === selectedNumber);
    editor.commands.setContent(found ? found.html : "");
  }, [selectedNumber, stories, editor]);

  const handleSave = async () => {
    if (!editor || !warbandId || !campaignId) return;
    setSaving(true);
    setError("");
    setSuccess(false);    const res = await fetch(`/api/campaigns/${campaignId}/admin/warbands/${warbandId}/stories`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: selectedNumber, html: editor.getHTML() }),
    });
    if (!res.ok) setError("Помилка збереження");
    else setSuccess(true);
    setSaving(false);
    // Оновити список історій після збереження
    const updated = await res.json();
    setStories(updated.stories || []);
  };
  
  if (loading || !editor) return (
    <div className={adminStyles.adminContainer}>
        <div className={adminStyles.adminCenterBox}>
        <CircularProgress />
      </div>
    </div>
  );

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox}>
        <Typography variant="h5" sx={{ mb: 2 }}>Оповідання для варбанди #{warbandId}</Typography>
        <Box sx={{ mb: 2 }}>
          <FormControl>
            <InputLabel>Номер гри</InputLabel>
            <Select
              value={selectedNumber}
              label="Номер гри"
              onChange={e => setSelectedNumber(Number(e.target.value))}
              sx={{ minWidth: 120 }}
            >
              {[...Array(13).keys()].map(i => (
                <MenuItem key={i} value={i}>{i === 0 ? 'Преамбула' : `Гра ${i}`}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Результати ігор:</Typography>
          {games.length === 0 ? (
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography color="text.secondary">Ігор ще немає</Typography>
            </Paper>
          ) : (
            null
          )}
          {/* Деталі вибраної гри */}
          {games.length > 0 && (
            (() => {
              const g = games.find(g => g.number === selectedNumber);
              if (!g) return null;
              return (
                <Paper sx={{ p: 2, mb: 2 }}>
                  <div><b>Гра {g.number}:</b> vs {g.opponent}</div>
                  <div>VP: {g.vp} / {g.opponent_vp}</div>
                  <div>GP: {g.gp} / {g.opponent_gp}</div>
                  <div>Статус: {g.status}</div>
                </Paper>
              );
            })()
          )}
        </Box>
        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, minHeight: 200, mb: 2, p: 1, background: '#fafbfc', width: '100%' }}>
          <EditorContent editor={editor} className={adminStyles.tiptapContent} />
        </Box>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {success && <Typography color="success.main" sx={{ mb: 2 }}>Збережено!</Typography>}
        <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Збереження..." : "Зберегти"}
        </Button>
        <Button 
          variant="outlined" 
          onClick={() => router.push(`/campaign/${campaignId}/admin/warbands`)} 
          sx={{ ml: 2 }}
        >
          Назад до варбанд
        </Button>
      </div>
    </div>
  );
}

export default function CampaignWarbandStoriesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WarbandStoriesPageInner />
    </Suspense>
  );
}
