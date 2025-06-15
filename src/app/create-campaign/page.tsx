import CampaignForm from '../components/CampaignForm';

export default function CreateCampaignPage() {
  return (
    <div className="consistentBackgroundContainer" style={{ justifyContent: 'center' }}>
      <CampaignForm mode="create" />
    </div>
  );
}
