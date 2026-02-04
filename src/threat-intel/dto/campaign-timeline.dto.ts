import { CampaignMetadataDto } from './campaign-metadata.dto';

export class TimelinePeriodDto {
  period: string;
  indicators: Array<{ id: string; type: string; value: string }>;
  counts: { ip: number; domain: number; url: number; hash: number };
}

export class CampaignTimelineSummaryDto {
  total_indicators: number;
  unique_ips: number;
  unique_domains: number;
  duration_days: number;
}

export class CampaignTimelineDto {
  campaign: CampaignMetadataDto;
  timeline: TimelinePeriodDto[];
  summary: CampaignTimelineSummaryDto;
}
