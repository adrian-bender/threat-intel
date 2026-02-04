export class TopThreatActorDto {
  id: string;
  name: string;
  indicator_count: number;
}

export class DashboardSummaryDto {
  time_range: string;
  new_indicators: {
    ip: number;
    domain: number;
    url: number;
    hash: number;
  };
  active_campaigns: number;
  top_threat_actors: TopThreatActorDto[];
  indicator_distribution: {
    ip: number;
    domain: number;
    url: number;
    hash: number;
  };
}
