"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, useCallback } from "react";
import { Box, Button, Paper, Typography, CircularProgress, Stack, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Switch, FormControlLabel, List, ListItem, ListItemText, ListItemSecondaryAction, Chip } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
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
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import clsx from "clsx";
import adminStyles from '../admin.module.css';

interface Article {
  id: number;
  title: string;
  content: string | null;
  excerpt: string | null;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  showFullContent: boolean | null;
  sortOrder?: number;
}

export default function AdminAboutPage() {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id;

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [showFullContent, setShowFullContent] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Excerpt editor (simpler, no images or complex formatting)
  const excerptEditor = useEditor({
    extensions: [
      StarterKit.configure({
        // Disable some extensions that aren't needed for excerpts
        heading: false,
        codeBlock: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({ openOnClick: false }),
      Underline,
      Highlight,
    ],
    content: '',
  });

  // Load articles
  const loadArticles = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/campaigns/${campaignId}/admin/about`);
      if (res.ok) {
        const data = await res.json();
        setArticles(data.articles || []);
      } else {
        setError("Не вдалося завантажити статті");
      }
    } catch (err) {
      setError("Помилка завантаження статей");
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Reset form
  const resetForm = () => {
    setTitle("");
    setIsPublished(true);
    setShowFullContent(false);
    editor?.commands.setContent('');
    excerptEditor?.commands.setContent('');
    setEditingArticle(null);
  };

  // Open create dialog
  const handleCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleEdit = (article: Article) => {
    setTitle(article.title || "");
    setIsPublished(article.isPublished);
    setShowFullContent(article.showFullContent || false);
    editor?.commands.setContent(article.content || '');
    excerptEditor?.commands.setContent(article.excerpt || '');
    setEditingArticle(article);
    setDialogOpen(true);
  };

  // Save article
  const handleSave = async () => {
    if (!title.trim()) {
      setError("Заголовок обов'язковий");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const articleData = {
        title: title.trim(),
        content: editor?.getHTML() || '',
        excerpt: excerptEditor?.getHTML() || '',
        isPublished,
        showFullContent,
      };

      let res;
      if (editingArticle) {
        // Update existing article
        res = await fetch(`/api/campaigns/${campaignId}/admin/about/${editingArticle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
        });
      } else {
        // Create new article
        res = await fetch(`/api/campaigns/${campaignId}/admin/about`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(articleData),
        });
      }

      if (res.ok) {
        setDialogOpen(false);
        resetForm();
        loadArticles();
      } else {
        const errorData = await res.json();
        console.error('API Error:', errorData);
        setError(errorData.error || `Помилка збереження (${res.status})`);
      }
    } catch (err) {
      console.error('Save error:', err);
      setError("Помилка збереження статті: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setSaving(false);
    }
  };

  // Delete article
  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/admin/about/${articleToDelete.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDeleteDialogOpen(false);
        setArticleToDelete(null);
        loadArticles();
      } else {
        setError("Помилка видалення статті");
      }
    } catch (err) {
      setError("Помилка видалення статті");
    }
  };

  // Toggle publish status
  const togglePublish = async (article: Article) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/admin/about/${article.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !article.isPublished }),
      });

      if (res.ok) {
        loadArticles();
      } else {
        setError("Помилка зміни статусу публікації");
      }
    } catch (err) {
      setError("Помилка зміни статусу публікації");
    }
  };

  // Move article up
  const moveArticleUp = async (index: number) => {
    if (index === 0) return; // Can't move the first item up
    
    const newArticles = [...articles];
    // Swap with previous article
    [newArticles[index - 1], newArticles[index]] = [newArticles[index], newArticles[index - 1]];
    
    try {
      const articleIds = newArticles.map(article => article.id);
      const res = await fetch(`/api/campaigns/${campaignId}/admin/about/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds }),
      });

      if (res.ok) {
        setArticles(newArticles);
      } else {
        setError("Помилка зміни порядку статей");
      }
    } catch (err) {
      setError("Помилка зміни порядку статей");
    }
  };

  // Move article down
  const moveArticleDown = async (index: number) => {
    if (index === articles.length - 1) return; // Can't move the last item down
    
    const newArticles = [...articles];
    // Swap with next article
    [newArticles[index], newArticles[index + 1]] = [newArticles[index + 1], newArticles[index]];
    
    try {
      const articleIds = newArticles.map(article => article.id);
      const res = await fetch(`/api/campaigns/${campaignId}/admin/about/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds }),
      });

      if (res.ok) {
        setArticles(newArticles);
      } else {
        setError("Помилка зміни порядку статей");
      }
    } catch (err) {
      setError("Помилка зміни порядку статей");
    }
  };

  // Image upload handler
  const handleImageUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      editor
        ?.chain()
        .focus()
        .insertContent({
          type: 'image',
          attrs: { src: base64, textAlign: 'center' },
        })
        .run();
    };
    reader.readAsDataURL(file);
  }, [editor]);

  if (loading) return (
    <div className={adminStyles.adminContainer}>
      <div style={{ minHeight: 'calc(100vh - var(--navbar-height))', minWidth: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    </div>
  );

  return (
    <div className={adminStyles.adminContainer}>
      <div className={adminStyles.adminCenterBox}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5">Статті про кампанію</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
            Нова стаття
          </Button>
        </Box>

        {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}

        {articles.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center', mt: 2 }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              📝 Поки що немає статей
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Створіть першу статтю про вашу кампанію!
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreate}>
              Створити статтю
            </Button>
          </Paper>
        ) : (
          <List>
            {articles.map((article, index) => (
              <ListItem
                key={article.id}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'flex-start',
                  p: 2,
                  flexDirection: { xs: 'column', sm: 'row' }, // Stack on mobile, side-by-side on desktop
                  gap: { xs: 2, sm: 1 },
                }}
              >
                <Box sx={{ flex: 1, mr: { xs: 0, sm: 2 } }}>
                  {/* Title and chips */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                    <Typography variant="h6" component="h3" sx={{ wordBreak: 'break-word' }}>
                      {article.title}
                    </Typography>
                    <Chip 
                      label={article.isPublished ? 'Опубліковано' : 'Чернетка'} 
                      color={article.isPublished ? 'success' : 'default'}
                      size="small"
                    />                      <Chip 
                        label={(article.showFullContent || false) ? 'Повний контент' : 'З кнопкою "читати далі"'} 
                        color={(article.showFullContent || false) ? 'primary' : 'secondary'}
                        size="small"
                        variant="outlined"
                      />
                  </Box>
                  
                  {/* Excerpt and update date */}
                  {article.excerpt && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 1, wordBreak: 'break-word' }}
                      dangerouslySetInnerHTML={{ __html: article.excerpt }}
                    />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Оновлено: {new Date(article.updatedAt).toLocaleString('uk-UA')}
                  </Typography>
                </Box>
                <Stack 
                  direction="row" 
                  spacing={1} 
                  sx={{ 
                    flexShrink: 0,
                    alignSelf: { xs: 'stretch', sm: 'flex-start' },
                    justifyContent: { xs: 'space-around', sm: 'flex-end' }
                  }}
                >
                  {/* Move Up/Down buttons */}
                  <Tooltip title="Перемістити вгору">
                    <IconButton 
                      onClick={() => moveArticleUp(index)} 
                      size="small"
                      disabled={index === 0}
                    >
                      <KeyboardArrowUpIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Перемістити вниз">
                    <IconButton 
                      onClick={() => moveArticleDown(index)} 
                      size="small"
                      disabled={index === articles.length - 1}
                    >
                      <KeyboardArrowDownIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title={article.isPublished ? 'Зняти з публікації' : 'Опублікувати'}>
                    <IconButton onClick={() => togglePublish(article)} size="small">
                      {article.isPublished ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Редагувати">
                    <IconButton onClick={() => handleEdit(article)} size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Видалити">
                    <IconButton 
                      onClick={() => {
                        setArticleToDelete(article);
                        setDeleteDialogOpen(true);
                      }}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Перемістити вгору">
                    <span>
                      <IconButton 
                        onClick={() => moveArticleUp(index)} 
                        size="small"
                        disabled={index === 0}
                      >
                        <KeyboardArrowUpIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Перемістити вниз">
                    <span>
                      <IconButton 
                        onClick={() => moveArticleDown(index)} 
                        size="small"
                        disabled={index === articles.length - 1}
                      >
                        <KeyboardArrowDownIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </ListItem>
            ))}
          </List>
        )}

        {/* Article Edit/Create Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          maxWidth="md" 
          fullWidth
        >
          <DialogTitle>
            {editingArticle ? 'Редагувати статтю' : 'Нова стаття'}
          </DialogTitle>
          <DialogContent>
            <TextField
              label="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              margin="normal"
              required
            />
            
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>Короткий опис (excerpt):</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Короткий опис для попереднього перегляду
            </Typography>
            <TiptapToolbar 
              editor={excerptEditor} 
              onImageUpload={handleImageUpload}
              hideImageButton={true} 
              hideAlignmentButtons={true} 
            />
            <Box sx={{ border: '1px solid #ccc', borderRadius: 2, minHeight: 120, mb: 2, p: 1, background: '#fafbfc', width: '100%' }}>
              <EditorContent editor={excerptEditor} className={clsx(adminStyles.tiptapContent)} />
            </Box>
            <FormControlLabel
              control={
                <Switch
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                />
              }
              label="Опублікувати статтю"
              sx={{ mt: 1, mb: 1 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showFullContent}
                  onChange={(e) => setShowFullContent(e.target.checked)}
                />
              }
              label="Показувати повний контент (без кнопки 'читати далі')"
              sx={{ mt: 0, mb: 2 }}
            />
            
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Зміст статті:</Typography>
            <TiptapToolbar editor={editor} onImageUpload={handleImageUpload} />
            <Box sx={{ border: '1px solid #ccc', borderRadius: 2, minHeight: 200, mb: 2, p: 1, background: '#fafbfc', width: '100%' }}>
              <EditorContent editor={editor} className={clsx(adminStyles.tiptapContent)} />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Скасувати</Button>
            <Button onClick={handleSave} variant="contained" disabled={saving}>
              {saving ? "Збереження..." : "Зберегти"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Підтвердження видалення</DialogTitle>
          <DialogContent>
            <Typography>
              Ви впевнені, що хочете видалити статтю "{articleToDelete?.title}"?
              Цю дію неможливо скасувати.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Скасувати</Button>
            <Button onClick={handleDelete} color="error" variant="contained">
              Видалити
            </Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>
  );
}

function TiptapToolbar({ 
  editor, 
  onImageUpload, 
  hideImageButton = false, 
  hideAlignmentButtons = false 
}: { 
  editor: any, 
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void,
  hideImageButton?: boolean,
  hideAlignmentButtons?: boolean
}) {
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
      {!hideImageButton && (
        <Tooltip title="Вставити зображення">
          <IconButton component="label">
            <ImageIcon />
            <input type="file" accept="image/*" hidden onChange={onImageUpload} />
          </IconButton>
        </Tooltip>
      )}
      {!hideAlignmentButtons && (
        <>
          <Tooltip title="Вирівняти ліворуч"><IconButton onClick={() => editor.chain().focus().setTextAlign('left').run()} color={editor.isActive({ textAlign: 'left' }) ? 'primary' : 'default'}><FormatAlignLeftIcon /></IconButton></Tooltip>
          <Tooltip title="Вирівняти по центру"><IconButton onClick={() => editor.chain().focus().setTextAlign('center').run()} color={editor.isActive({ textAlign: 'center' }) ? 'primary' : 'default'}><FormatAlignCenterIcon /></IconButton></Tooltip>
          <Tooltip title="Вирівняти праворуч"><IconButton onClick={() => editor.chain().focus().setTextAlign('right').run()} color={editor.isActive({ textAlign: 'right' }) ? 'primary' : 'default'}><FormatAlignRightIcon /></IconButton></Tooltip>
        </>
      )}
    </Stack>
  );
}
