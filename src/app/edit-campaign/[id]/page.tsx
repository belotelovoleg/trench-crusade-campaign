'use client';

import { useParams } from 'next/navigation';
import CampaignForm from '../../components/CampaignForm';

export default function EditCampaignPage() {
  const params = useParams();
  const campaignId = params.id as string;

  return (
    <div className="consistentBackgroundContainer" style={{ justifyContent: 'center' }}>
      <CampaignForm mode="edit" campaignId={campaignId} />
    </div>
  );
}
