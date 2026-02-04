export class IndicatorSearchItemDto {
  id: string;
  type: string;
  value: string;
  confidence: number;
  first_seen: string | null;
  campaign_count: number;
  threat_actor_count: number;
}
