'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CircularProgress, Typography } from '@mui/material';
import CampaignForm from '../../components/CampaignForm';

export default function EditCampaignPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const [campaignData, setCampaignData] = useState<{
    name: string;
    description: string;
    image_url?: string;
    warband_limit?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!campaignId) return;

    fetch(`/api/campaigns/${campaignId}`)
      .then(res => res.json())
      .then(data => {
        if (data.campaign) {
          setCampaignData({
            name: data.campaign.name,
            description: data.campaign.description,
            image_url: data.campaign.image,
            warband_limit: data.campaign.warband_limit
          });
        } else {
          setError('Campaign not found');
        }
      })
      .catch(() => setError('Failed to load campaign'))
      .finally(() => setLoading(false));
  }, [campaignId]);

  if (loading) {
    return (
      <div className="consistentBackgroundContainer" style={{ justifyContent: 'center' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div className="consistentBackgroundContainer" style={{ justifyContent: 'center' }}>
        <Typography variant="h6" color="error">{error}</Typography>
      </div>
    );
  }
  return (
    <div className="consistentBackgroundContainer" style={{ justifyContent: 'center' }}>
      {campaignData && (
        <CampaignForm mode="edit" campaignId={campaignId} initialData={campaignData} />
      )}
    </div>
  );
}
