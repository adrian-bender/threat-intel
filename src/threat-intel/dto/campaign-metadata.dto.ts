export class CampaignMetadataDto {
  id: string;
  name: string;
  description: string | null;
  first_seen: string | null;
  last_seen: string | null;
  status: string;
}
