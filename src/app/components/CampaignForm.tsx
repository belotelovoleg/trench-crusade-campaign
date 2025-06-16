'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Button, 
  TextField, 
  Typography, 
  Box, 
  Paper, 
  CircularProgress,
  Alert,
  FormControl,
  FormLabel,
  Dialog,
  DialogContent,
  DialogActions,
  Slider
} from '@mui/material';
import Cropper from 'react-easy-crop';
import getCampaignCroppedImg from '../create-campaign/utils/campaignCropImage';
import styles from '../page.module.css';

interface CampaignFormProps {
  mode: 'create' | 'edit';
  campaignId?: string;  initialData?: {
    name: string;
    description: string;
    image_url?: string;
    warband_limit?: number;
  };
}

export default function CampaignForm({ mode, campaignId, initialData }: CampaignFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    warband_limit: initialData?.warband_limit || 2
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialData?.image_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = mode === 'create' 
        ? '/api/campaigns' 
        : `/api/campaigns/${campaignId}`;
      
      const method = mode === 'create' ? 'POST' : 'PATCH';

      // Use FormData if we have an image, otherwise use JSON
      if (imageFile) {        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('warband_limit', formData.warband_limit.toString());
        formDataToSend.append('image', imageFile);

        const response = await fetch(endpoint, {
          method,
          body: formDataToSend,
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${mode} campaign`);        }

        const result = await response.json();
        router.push('/'); // Redirect to homepage instead of campaign page
      } else {
        // No new image - send JSON
        const response = await fetch(endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },          body: JSON.stringify({
            name: formData.name,
            description: formData.description,
            warband_limit: formData.warband_limit,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to ${mode} campaign`);        }

        const result = await response.json();
        router.push('/'); // Redirect to homepage instead of campaign page
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : `An error occurred while ${mode === 'create' ? 'creating' : 'updating'} the campaign`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setError('Файл занадто великий. Максимальний розмір: 10MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Будь ласка, оберіть файл зображення');
        return;
      }

      // Create URL for cropper
      const imageUrl = URL.createObjectURL(file);
      setRawImage(imageUrl);
      setShowCropper(true);
      setError('');
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    
    try {
      setLoading(true);
      const croppedImageBlob = await getCampaignCroppedImg(rawImage, croppedAreaPixels);
      
      // Create a new File from the blob
      const croppedFile = new File([croppedImageBlob], 'cropped-image.jpg', {
        type: 'image/jpeg',
      });
      
      setImageFile(croppedFile);
      setPreviewUrl(URL.createObjectURL(croppedImageBlob));
      setShowCropper(false);
      setRawImage(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    } catch (e) {
      setError('Помилка при обрізанні зображення');
    } finally {
      setLoading(false);
    }
  };

  const handleCropCancel = () => {
    if (rawImage) {
      URL.revokeObjectURL(rawImage);
    }
    setShowCropper(false);
    setRawImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl(mode === 'edit' ? initialData?.image_url || null : null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };  return (
    <Box sx={{ 
      maxWidth: { xs: '95%', sm: '450px' }, 
      margin: '0 auto', 
      padding: { xs: 1, sm: 2 },
      width: 'fit-content',
      minWidth: { xs: '300px', sm: '400px' }
    }}>
      <Paper sx={{ 
        padding: { xs: 3, sm: 4 }, 
        borderRadius: '18px',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(18px)',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
        width: 'fit-content',
        minWidth: '100%'
      }}>
        <Typography variant="h4" component="h1" sx={{
          fontWeight: 700,
          textAlign: 'center',
          mb: 3,
          color: '#000 !important',
          textShadow: '0 1px 8px #fff8, 0 0 1px #fff8'
        }}>
          {mode === 'create' ? 'Створити нову кампанію' : 'Редагувати кампанію'}
        </Typography>{error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2, 
              width: '100%',
              '& .MuiAlert-message': {
                fontSize: { xs: '0.95rem', sm: '0.875rem' }
              }
            }}
            onClose={() => setError('')}
          >
            {error}
          </Alert>
        )}        <Box component="form" onSubmit={handleSubmit} sx={{ 
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto'
        }}><TextField
            fullWidth
            label="Назва кампанії"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            margin="normal"
            required
            disabled={loading}
            placeholder="Введіть назву вашої кампанії..."
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                }
              }
            }}
          />          <TextField
            fullWidth
            label="Опис кампанії"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            margin="normal"
            multiline
            rows={4}
            disabled={loading}
            placeholder="Опишіть вашу кампанію, її історію та правила..."
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                }
              }
            }}
          />

          <TextField
            fullWidth
            label="Ліміт варбанд на гравця"
            type="number"
            value={formData.warband_limit}
            onChange={(e) => {
              const value = parseInt(e.target.value) || 1;
              const clampedValue = Math.max(1, Math.min(10, value));
              setFormData(prev => ({ ...prev, warband_limit: clampedValue }));
            }}
            margin="normal"
            disabled={loading}
            inputProps={{ min: 1, max: 10 }}
            helperText="Кількість варбанд, яку може мати один гравець у кампанії (1-10)"
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'rgba(255,255,255,0.8)',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)',
                }
              }
            }}
          /><FormControl fullWidth margin="normal">
            <FormLabel component="legend" sx={{ 
              color: '#000 !important',
              fontWeight: 600,
              mb: 1,
              fontSize: '1rem'
            }}>
              Зображення кампанії
            </FormLabel>
            <Box sx={{ mt: 1 }}>
              {previewUrl && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  {/* 16:9 aspect ratio container for preview */}
                  <Box sx={{ 
                    position: 'relative',
                    width: '100%',
                    paddingTop: '56.25%', // 16:9 aspect ratio
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '2px solid #e0e0e0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    mb: 1
                  }}>
                    <img 
                      src={previewUrl} 
                      alt="Campaign preview" 
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }} 
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button 
                      size="small" 
                      
                      color="error"
                      onClick={handleRemoveImage}
                      disabled={loading}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      {mode === 'edit' && !imageFile ? 'Видалити' : 'Скасувати'}
                    </Button>
                    <Button 
                      size="small" 
                      
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      sx={{ minWidth: 'auto', px: 2 }}
                    >
                      Замінити
                    </Button>
                  </Box>
                </Box>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                style={{ display: 'none' }}
                disabled={loading}
              />
              
              {!previewUrl && (
                <Button
                  
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  fullWidth
                  sx={{ 
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 2,
                    '&:hover': {
                      borderStyle: 'dashed',
                      borderWidth: 2
                    }
                  }}
                >
                  📷 Обрати зображення кампанії
                </Button>
              )}
              
              <Typography variant="caption" sx={{ 
                display: 'block', 
                mt: 1, 
                color: 'text.secondary',
                textAlign: 'center'
              }}>
                Рекомендований розмір: 16:9. Максимум 10MB
              </Typography>
            </Box>
          </FormControl>          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1.5, sm: 2 }, 
            mt: 3,
            width: '100%'
          }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading || !formData.name.trim()}
              fullWidth
              sx={{ 
                py: { xs: 1.5, sm: 1.2 },
                fontSize: { xs: '1.1rem', sm: '1rem' },
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)',
                '&:hover': {
                  boxShadow: '0 6px 16px rgba(25, 118, 210, 0.4)',
                  transform: 'translateY(-1px)'
                },
                '&:disabled': {
                  boxShadow: 'none'
                }
              }}
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  <span>{mode === 'create' ? 'Створення...' : 'Збереження...'}</span>
                </Box>
              ) : (
                mode === 'create' ? '✨ Створити кампанію' : '💾 Зберегти зміни'
              )}
            </Button>
            
            <Button
              
              onClick={() => router.back()}
              disabled={loading}
              fullWidth
              sx={{ 
                py: { xs: 1.5, sm: 1.2 },
                fontSize: { xs: '1.1rem', sm: '1rem' },
                fontWeight: 500,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  transform: 'translateY(-1px)'                }
              }}
            >
              Скасувати
            </Button>
          </Box>
        </Box>

        {/* Image Cropper Dialog */}
      <Dialog 
        open={showCropper} 
        maxWidth="md" 
        fullWidth
        onClose={handleCropCancel}
        PaperProps={{
          sx: { 
            m: { xs: 1, sm: 2 },
            maxHeight: { xs: '95vh', sm: 'calc(100vh - 64px)' }
          }
        }}
      >
        <Box sx={{ 
          p: 2, 
          borderBottom: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Обрізати зображення
          </Typography>
          <Button 
            onClick={handleCropCancel}
            size="small"
            sx={{ minWidth: 'auto', p: 0.5 }}
          >
            ✕
          </Button>
        </Box>
        
        <DialogContent sx={{ 
          height: { xs: 300, sm: 400 }, 
          position: 'relative', 
          p: 0,
          overflow: 'hidden'
        }}>
          {rawImage && (
            <Cropper
              image={rawImage}
              crop={crop}
              zoom={zoom}
              aspect={16 / 9}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </DialogContent>
        
        <DialogActions sx={{ 
          flexDirection: 'column', 
          p: { xs: 2, sm: 3 },
          gap: 2
        }}>
          <Box sx={{ width: '100%' }}>
            <Typography gutterBottom sx={{ 
              fontWeight: 500,
              color: 'text.primary',
              mb: 1
            }}>
              Масштаб: {zoom.toFixed(1)}x
            </Typography>
            <Slider
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              onChange={(_, value) => setZoom(value as number)}
              sx={{
                '& .MuiSlider-thumb': {
                  width: 20,
                  height: 20,
                },
                '& .MuiSlider-track': {
                  height: 4,
                },
                '& .MuiSlider-rail': {
                  height: 4,
                }
              }}
            />
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 1, sm: 2 }, 
            width: '100%',
            flexDirection: { xs: 'column', sm: 'row' }
          }}>
            <Button
              onClick={handleCropCancel}
              disabled={loading}
              
              fullWidth
              sx={{ 
                py: { xs: 1.5, sm: 1 },
                fontSize: { xs: '1rem', sm: '0.875rem' }
              }}
            >
              Скасувати
            </Button>
            <Button
              onClick={handleCropSave}
              disabled={loading}
              variant="contained"
              fullWidth
              sx={{ 
                py: { xs: 1.5, sm: 1 },
                fontSize: { xs: '1rem', sm: '0.875rem' }
              }}
            >              {loading ? <CircularProgress size={20} /> : '✓ Застосувати'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
      </Paper>
    </Box>
  );
}
