"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Box, Button, Paper, Typography, CircularProgress, Stack, IconButton, Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import FormatUnderlinedIcon from '@mui/icons-material/FormatUnderlined';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import ImageIcon from '@mui/icons-material/Image';
import HighlightIcon from '@mui/icons-material/Highlight';
import FormatAlignLeftIcon from '@mui/icons-material/FormatAlignLeft';
import FormatAlignCenterIcon from '@mui/icons-material/FormatAlignCenter';
import FormatAlignRightIcon from '@mui/icons-material/FormatAlignRight';
import clsx from "clsx";
import adminStyles from '../admin.module.css';

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Link.configure({ openOnClick: false }),
      Image,
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }), // додано 'image'
    ],
    content: '',
  });

  // Завантаження about
  useEffect(() => {
    fetch("/api/admin/about")
      .then((res) => res.json())
      .then((data) => editor?.commands.setContent(data.content || ""))
      .catch(() => setError("Не вдалося завантажити опис кампанії"))
      .finally(() => setLoading(false));
  }, [editor]);

  // Збереження
  const handleSave = async () => {
    if (!editor) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    const res = await fetch("/api/admin/about", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editor.getHTML() }),
    });
    if (!res.ok) setError("Помилка збереження");
    else setSuccess(true);
    setSaving(false);
  };

  // Додавання зображення (upload у public/about/)
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('/api/admin/about/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.url) {
      editor
        ?.chain()
        .focus()
        .insertContent({
          type: 'image',
          attrs: { src: data.url, textAlign: 'center' },
        })
        .run();
    }
  }, [editor]);

  if (loading || !editor) return (
    <div className={adminStyles.adminContainer}>
      <div style={{ minHeight: '100vh', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    </div>
  );

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox}>
        <Typography variant="h5" sx={{ mb: 2 }}>Опис кампанії</Typography>
        <TiptapToolbar editor={editor} onImageUpload={handleImageUpload} />
        <Box sx={{ border: '1px solid #ccc', borderRadius: 2, minHeight: 200, mb: 2, p: 1, background: '#fafbfc', width: '100%' }}>
          <EditorContent editor={editor} className={clsx(adminStyles.tiptapContent)} />
        </Box>
        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
        {success && <Typography color="success.main" sx={{ mb: 2 }}>Збережено!</Typography>}
        <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Збереження..." : "Зберегти"}
        </Button>
      </div>
    </div>
  );
}

function TiptapToolbar({ editor, onImageUpload }: { editor: any, onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  if (!editor) return null;
  return (
    <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
      <Tooltip title="Жирний"><IconButton onClick={() => editor.chain().focus().toggleBold().run()} color={editor.isActive('bold') ? 'primary' : 'default'}><FormatBoldIcon /></IconButton></Tooltip>
      <Tooltip title="Курсив"><IconButton onClick={() => editor.chain().focus().toggleItalic().run()} color={editor.isActive('italic') ? 'primary' : 'default'}><FormatItalicIcon /></IconButton></Tooltip>
      <Tooltip title="Підкреслення"><IconButton onClick={() => editor.chain().focus().toggleUnderline().run()} color={editor.isActive('underline') ? 'primary' : 'default'}><FormatUnderlinedIcon /></IconButton></Tooltip>
      <Tooltip title="Виділення"><IconButton onClick={() => editor.chain().focus().toggleHighlight().run()} color={editor.isActive('highlight') ? 'primary' : 'default'}><HighlightIcon /></IconButton></Tooltip>
      <Tooltip title="Список"><IconButton onClick={() => editor.chain().focus().toggleBulletList().run()} color={editor.isActive('bulletList') ? 'primary' : 'default'}><FormatListBulletedIcon /></IconButton></Tooltip>
      <Tooltip title="Нумерований список"><IconButton onClick={() => editor.chain().focus().toggleOrderedList().run()} color={editor.isActive('orderedList') ? 'primary' : 'default'}><FormatListNumberedIcon /></IconButton></Tooltip>
      <Tooltip title="Вставити посилання"><IconButton onClick={() => {
        const url = prompt('Введіть URL');
        if (url) editor.chain().focus().setLink({ href: url }).run();
      }} color={editor.isActive('link') ? 'primary' : 'default'}><InsertLinkIcon /></IconButton></Tooltip>
      <Tooltip title="Вставити зображення">
        <IconButton component="label">
          <ImageIcon />
          <input type="file" accept="image/*" hidden onChange={onImageUpload} />
        </IconButton>
      </Tooltip>
      <Tooltip title="Вирівняти ліворуч"><IconButton onClick={() => editor.chain().focus().setTextAlign('left').run()} color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}><FormatAlignLeftIcon /></IconButton></Tooltip>
      <Tooltip title="Вирівняти по центру"><IconButton onClick={() => editor.chain().focus().setTextAlign('center').run()} color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}><FormatAlignCenterIcon /></IconButton></Tooltip>
      <Tooltip title="Вирівняти праворуч"><IconButton onClick={() => editor.chain().focus().setTextAlign('right').run()} color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}><FormatAlignRightIcon /></IconButton></Tooltip>
    </Stack>
  );
}
