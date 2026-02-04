import { ThreatActorSummaryDto } from './threat-actor-summary.dto';
import { CampaignSummaryDto } from './campaign-summary.dto';
import { RelatedIndicatorDto } from './related-indicator.dto';

export class IndicatorDetailDto {
  id: string;
  type: string;
  value: string;
  confidence: number;
  first_seen: string | null;
  last_seen: string | null;
  threat_actors: ThreatActorSummaryDto[];
  campaigns: CampaignSummaryDto[];
  related_indicators: RelatedIndicatorDto[];
}
