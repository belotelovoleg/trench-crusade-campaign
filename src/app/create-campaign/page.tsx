'use client';
import { useState, useRef } from 'react';
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
import getCampaignCroppedImg from './utils/campaignCropImage';
import styles from '../page.module.css';

export default function CreateCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
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
    setError('');    try {
      // Use FormData if we have an image, otherwise use JSON
      if (imageFile) {
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('image', imageFile);

        const response = await fetch('/api/campaigns', {
          method: 'POST',
          body: formDataToSend,
        });

        if (response.ok) {
          const data = await response.json();
          router.push('/'); // Redirect to home page instead of the campaign page
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to create campaign');
        }
      } else {
        // No image, use JSON
        const response = await fetch('/api/campaigns', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (response.ok) {
          const data = await response.json();
          router.push('/'); // Redirect to home page instead of the campaign page
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to create campaign');
        }
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      setError('An error occurred while creating the campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      setRawImage(ev.target?.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };
  
  const onCropComplete = (_: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };
    const handleCropSave = async () => {
    if (!rawImage || !croppedAreaPixels) return;
    
    try {
      // Use the campaign cropping function with 16:9 aspect ratio
      const croppedBlob = await getCampaignCroppedImg(rawImage, croppedAreaPixels, 600);
      setImageFile(new File([croppedBlob], 'campaign-image.jpg', { type: 'image/jpeg' }));
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(croppedBlob);
      
      setShowCropper(false);
    } catch (error) {
      console.error('Error cropping image:', error);
      setError('Failed to crop image');
    }
  };

  return (
    <div className={styles.mainPageRoot}>
      <Box sx={{ 
        maxWidth: 600, 
        margin: '0 auto', 
        padding: 2,
        minHeight: 'calc(100vh - var(--navbar-height))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Paper sx={{ 
          padding: 4, 
          borderRadius: '18px',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(18px)',
          boxShadow: '0 8px 32px rgba(31, 38, 135, 0.2)',
          width: '100%'
        }}>
          <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 700 }}>
            Створити нову кампанію
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Назва кампанії"
              value={formData.name}
              onChange={handleInputChange('name')}
              margin="normal"
              required
              variant="outlined"
            />
              <TextField
              fullWidth
              label="Опис кампанії"
              value={formData.description}
              onChange={handleInputChange('description')}
              margin="normal"
              multiline
              rows={4}
              variant="outlined"
            />
              <FormControl fullWidth margin="normal">
              <FormLabel htmlFor="campaign-image">Зображення кампанії (опціонально)</FormLabel>
              <input
                ref={fileInputRef}
                accept="image/*"
                id="campaign-image"
                type="file"
                style={{ display: 'none' }}
                onChange={handleImageChange}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Button
                  variant="outlined"
                  component="span"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Обрати зображення
                </Button>
                {imageFile && (
                  <Typography variant="body2">
                    {imageFile.name} ({Math.round(imageFile.size / 1024)} KB)
                  </Typography>
                )}
              </Box>
              
              {/* Image Cropper Dialog */}
              <Dialog open={showCropper} onClose={() => setShowCropper(false)} maxWidth="sm" fullWidth>
                <DialogContent sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  {rawImage && (
                    <Box sx={{ position: 'relative', width: '100%', height: 400, mb: 1 }}>
                      <Cropper
                        image={rawImage}
                        crop={crop}
                        zoom={zoom}
                        aspect={16/9}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                      />
                    </Box>
                  )}
                  <Box sx={{ width: '100%', mt: 2 }}>
                    <Typography variant="body2" gutterBottom>Масштаб</Typography>
                    <Slider
                      min={1}
                      max={3}
                      step={0.01}
                      value={zoom}
                      onChange={(_, z) => setZoom(z as number)}
                    />
                  </Box>
                </DialogContent>
                <DialogActions>
                  <Button variant="text" onClick={() => setShowCropper(false)}>
                    Скасувати
                  </Button>
                  <Button variant="contained" color="primary" onClick={handleCropSave}>
                    Обрізати зображення
                  </Button>
                </DialogActions>
              </Dialog>
              
              {/* Preview of cropped image */}
              {previewUrl && (
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="body2" gutterBottom>Попередній перегляд</Typography>                  <div 
                    style={{ 
                      width: '100%',
                      paddingTop: '56.25%', /* 16:9 Aspect Ratio (9/16 = 0.5625 = 56.25%) */
                      position: 'relative',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                  >
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      style={{ 
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }} 
                    />
                  </div>
                </Box>
              )}
            </FormControl>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                type="button"
                variant="outlined"
                onClick={() => router.push('/')}
                fullWidth
                disabled={loading}
              >
                Скасувати
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading || !formData.name.trim()}
              >
                {loading ? <CircularProgress size={24} /> : 'Створити кампанію'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>
    </div>
  );
}
