"use client";
export const dynamic = "force-dynamic";
import { useRef, useEffect, useState } from "react";
import { Button, TextField, Typography, Avatar, Box, Alert, CircularProgress, Paper } from "@mui/material";
import styles from './profile.module.css';
import Cropper from 'react-easy-crop';
import Slider from '@mui/material/Slider';
import getCroppedImg from './utils/cropImage';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null); // preview url
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [notes, setNotes] = useState(user?.notes || "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const profileBgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/me").then(async (res) => {
      if (!res.ok) return setError("Не вдалося завантажити профіль");
      const data = await res.json();
      setUser(data.user);
      setEmail(data.user?.email || "");
      setAvatar(data.user?.avatar || null);
      setNotes(data.user?.notes || "");
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (profileBgRef.current) {
      if (showCropper) {
        (profileBgRef.current as any).inert = true;
      } else {
        (profileBgRef.current as any).inert = false;
      }
    }
  }, [showCropper]);

  const handleTabChange = (_: any, newValue: number) => setTab(newValue);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawImage(ev.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
  };

  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };
  const handleCropSave = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    const croppedBlob = await getCroppedImg(rawImage, croppedAreaPixels, 200);
    setAvatarFile(new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' }));
    // Створюємо превʼю обрізаного зображення
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(croppedBlob);
    setShowCropper(false);
  };
  
  const handleSaveAll = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      let hasUpdates = false;
      const updatePromises: Promise<boolean>[] = [];
      
      // Always check all potential changes regardless of current tab
      
      // 1. Handle avatar upload if there's a new avatar
      if (avatarFile) {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
        const avatarPromise = fetch("/api/profile", {
          method: "PATCH",
          body: formData,
        }).then(async (avatarRes) => {
          const avatarData = await avatarRes.json();
          if (!avatarRes.ok) {
            throw new Error(avatarData.error || "Помилка збереження аватара");
          }
          
          setAvatar(`/api/avatar/${avatarData.avatar_url.replace(/^.*[\\/]/, '')}?t=${Date.now()}`);
          setAvatarFile(null);
          setPreviewUrl(null);
          return true;
        });
        
        updatePromises.push(avatarPromise);
        hasUpdates = true;
      }
      
      // 2. Handle profile data updates (email and password)
      const hasProfileChanges = email !== user?.email || (newPassword && password);
      if (hasProfileChanges) {
        const body: any = { email };
        if (newPassword && password) {
          body.password = password;
          body.newPassword = newPassword;
        }
        
        const profilePromise = fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then(async (profileRes) => {
          if (!profileRes.ok) {
            const err = await profileRes.json();
            throw new Error(err.error || "Помилка збереження профілю");
          }
          
          setPassword("");
          setNewPassword("");
          return true;
        });
        
        updatePromises.push(profilePromise);
        hasUpdates = true;
      }
      
      // 3. Handle notes changes - check regardless of current tab
      const hasNotesChanges = notes !== user?.notes;
      if (hasNotesChanges) {
        const notesPromise = fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes }),
        }).then(async (notesRes) => {
          if (!notesRes.ok) {
            const err = await notesRes.json();
            throw new Error(err.error || "Помилка збереження опису");
          }
          
          // Update user object to reflect the new notes
          setUser(prev => ({...prev, notes}));
          return true;
        });
        
        updatePromises.push(notesPromise);
        hasUpdates = true;
      }
      
      // Wait for all promises to resolve
      if (updatePromises.length > 0) {
        await Promise.all(updatePromises);
        setSuccess("Зміни збережено успішно");
      } else {
        setSuccess("Немає змін для збереження");
      }
    } catch (e: any) {
      setError(e.message || "Помилка збереження");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Box sx={{display:'flex',justifyContent:'center',alignItems:'center',minHeight:'60vh'}}><CircularProgress /></Box>;

  return (
    <Box className={styles.profileBg} ref={profileBgRef} component="div">
      <Box className={styles.profilePaper}>
        <Typography variant="h5" align="center" gutterBottom>Профіль</Typography>
        {error && <Alert severity="error" sx={{mb:2}}>{error}</Alert>}
        {success && <Alert severity="success" sx={{mb:2}}>{success}</Alert>}
        <Tabs value={tab} onChange={handleTabChange} centered sx={{mb:2}}>
          <Tab label="Основні дані" />
          <Tab label="Інформація для гравців" />
        </Tabs>
        {tab === 0 && (
          <Box className={styles.profileForm}>
            <Avatar 
              src={avatar ? 
                (avatar.startsWith('/api/avatar/') ? avatar : `/api/avatar/${avatar.replace(/^.*[\\/]/, '')}`) : 
                '/api/avatar/default'} 
              className={styles.profileAvatar}
            />
            <Button variant="outlined" component="label" disabled={saving}>
              Завантажити аватар
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </Button>
            <Dialog open={showCropper} onClose={() => setShowCropper(false)} maxWidth="xs" fullWidth>
              <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {rawImage && (
                  <Box sx={{ position: 'relative', width: 300, height: 300, mb: 1 }}>
                    <Cropper
                      image={rawImage}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      showGrid={false}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                  </Box>
                )}
                <Slider
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(_, z) => setZoom(z as number)}
                  sx={{ width: 260, mt: 2 }}
                />
                {/* Превʼю обрізаного зображення */}
                {previewUrl && (
                  <Box sx={{ mt: 2, mb: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>Превʼю обрізаного зображення:</Typography>
                    <Avatar src={previewUrl} sx={{ width: 80, height: 80 }} />
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button variant="contained" color="primary" onClick={handleCropSave}>
                  Обрізати зображення
                </Button>
                <Button variant="text" onClick={() => setShowCropper(false)}>
                  Скасувати
                </Button>
              </DialogActions>
            </Dialog>            {/* Показати превʼю нового аватара, якщо він був обрізаний */}
            {avatarFile && !showCropper && previewUrl && (
              <Box sx={{ mt: 1, mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mb: 1 }}>Новий аватар (буде збережено після натискання "Зберегти зміни"):</Typography>
                <Avatar src={previewUrl} className={styles.profileAvatar} sx={{ border: '2px solid #388e3c' }} />
              </Box>
            )}
            <TextField
              label="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              fullWidth
              sx={{mt:2}}
            />
            <TextField
              label="Старий пароль"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              fullWidth
              sx={{mt:2}}
            />
            <TextField
              label="Новий пароль"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              fullWidth
              sx={{mt:2}}
            />            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{mt:3}}
              onClick={handleSaveAll}
              disabled={saving}
            >
              Зберегти зміни
            </Button>
          </Box>
        )}
        {tab === 1 && (
          <Box className={styles.profileForm}>
            <TextField
              label="Інформація для гравців"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              multiline
              minRows={4}
              maxRows={10}
              fullWidth
              helperText="Вкажіть, коли і де ви можете зіграти гру цієї кампанії. Це поле бачать інші гравці."
              variant="outlined"
              sx={{mb:2}}
            />            <Button variant="contained" color="primary" onClick={handleSaveAll} disabled={saving} fullWidth>
              Зберегти зміни
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
