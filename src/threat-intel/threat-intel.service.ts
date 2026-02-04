import { Injectable, NotFoundException, BadRequestException, Inject, LoggerService } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { IndicatorDetailDto } from './dto/indicator-detail.dto';
import { PaginatedIndicatorsDto } from './dto/paginated-indicators.dto';
import { SearchIndicatorsQueryDto } from './dto/search-indicators-query.dto';
import { CampaignTimelineDto, TimelinePeriodDto } from './dto/campaign-timeline.dto';
import { CampaignIndicatorsQueryDto } from './dto/campaign-indicators-query.dto';
import { DashboardSummaryDto, TopThreatActorDto } from './dto/dashboard-summary.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Injectable()
export class ThreatIntelService {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: LoggerService,
  ) {}

  async getIndicatorById(id: string): Promise<IndicatorDetailDto> {
    this.logger.debug(`threat-intel.service::getIndicatorById Fetching indicator: ${id}`);

    const indicatorQuery = `
      SELECT id, type, value, confidence, first_seen, last_seen
      FROM indicators
      WHERE id = ?
    `;
    const indicator = await this.dataSource.query(indicatorQuery, [id]);

    if (!indicator || indicator.length === 0) {
      throw new NotFoundException(`Indicator with id ${id} not found`);
    }

    const threatActorsQuery = `
      SELECT DISTINCT ta.id, ta.name, ac.confidence
      FROM threat_actors ta
      JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
      JOIN campaign_indicators ci ON ac.campaign_id = ci.campaign_id
      WHERE ci.indicator_id = ?
    `;
    const threatActors = await this.dataSource.query(threatActorsQuery, [id]);

    const campaignsQuery = `
      SELECT DISTINCT c.id, c.name, 
        CASE WHEN c.status = 'active' THEN 1 ELSE 0 END as active
      FROM campaigns c
      JOIN campaign_indicators ci ON c.id = ci.campaign_id
      WHERE ci.indicator_id = ?
    `;
    const campaigns = await this.dataSource.query(campaignsQuery, [id]);

    const relatedIndicatorsQuery = `
      SELECT i.id, i.type, i.value, ir.relationship_type as relationship
      FROM indicators i
      JOIN indicator_relationships ir ON i.id = ir.target_indicator_id
      WHERE ir.source_indicator_id = ?
      ORDER BY ir.first_observed DESC
      LIMIT 5
    `;
    const relatedIndicators = await this.dataSource.query(relatedIndicatorsQuery, [id]);

    return {
      ...indicator[0],
      threat_actors: threatActors,
      campaigns: campaigns,
      related_indicators: relatedIndicators,
    };
  }

  async searchIndicators(query: SearchIndicatorsQueryDto): Promise<PaginatedIndicatorsDto> {
    this.logger.debug(`threat-intel.service::searchIndicators Searching with params: ${JSON.stringify(query)}`);

    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100);
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: any[] = [];

    if (query.type) {
      whereConditions.push('i.type = ?');
      params.push(query.type);
    }

    if (query.value) {
      whereConditions.push('i.value LIKE ?');
      params.push(`%${query.value}%`);
    }

    if (query.first_seen_after) {
      whereConditions.push('i.first_seen >= ?');
      params.push(query.first_seen_after);
    }

    if (query.last_seen_before) {
      whereConditions.push('i.last_seen <= ?');
      params.push(query.last_seen_before);
    }

    if (query.campaign) {
      whereConditions.push('EXISTS (SELECT 1 FROM campaign_indicators ci WHERE ci.indicator_id = i.id AND ci.campaign_id = ?)');
      params.push(query.campaign);
    }

    if (query.threat_actor) {
      whereConditions.push(`EXISTS (
        SELECT 1 FROM campaign_indicators ci
        JOIN actor_campaigns ac ON ci.campaign_id = ac.campaign_id
        WHERE ci.indicator_id = i.id AND ac.threat_actor_id = ?
      )`);
      params.push(query.threat_actor);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM indicators i
      ${whereClause}
    `;
    const countResult = await this.dataSource.query(countQuery, params);
    const total = countResult[0].total;

    const dataQuery = `
      SELECT 
        i.id,
        i.type,
        i.value,
        i.confidence,
        i.first_seen,
        (SELECT COUNT(DISTINCT ci.campaign_id) FROM campaign_indicators ci WHERE ci.indicator_id = i.id) as campaign_count,
        (SELECT COUNT(DISTINCT ac.threat_actor_id) 
         FROM campaign_indicators ci2 
         JOIN actor_campaigns ac ON ci2.campaign_id = ac.campaign_id 
         WHERE ci2.indicator_id = i.id) as threat_actor_count
      FROM indicators i
      ${whereClause}
      ORDER BY i.last_seen DESC
      LIMIT ? OFFSET ?
    `;
    const data = await this.dataSource.query(dataQuery, [...params, limit, offset]);

    return {
      data,
      total,
      page,
      limit,
      total_pages: Math.ceil(total / limit),
    };
  }

  async getCampaignIndicators(campaignId: string, query: CampaignIndicatorsQueryDto): Promise<CampaignTimelineDto> {
    this.logger.debug(`threat-intel.service::getCampaignIndicators Fetching campaign ${campaignId} indicators`);

    const campaignQuery = `
      SELECT id, name, description, first_seen, last_seen, status
      FROM campaigns
      WHERE id = ?
    `;
    const campaign = await this.dataSource.query(campaignQuery, [campaignId]);

    if (!campaign || campaign.length === 0) {
      throw new NotFoundException(`Campaign with id ${campaignId} not found`);
    }

    const groupByFormat = query.group_by === 'week' 
      ? "strftime('%Y-W%W', ci.observed_at)" 
      : "date(ci.observed_at)";

    let dateFilter = '';
    let dateParams: any[] = [campaignId];

    if (query.start_date) {
      dateFilter += ' AND ci.observed_at >= ?';
      dateParams.push(query.start_date);
    }

    if (query.end_date) {
      dateFilter += ' AND ci.observed_at <= ?';
      dateParams.push(query.end_date);
    }

    const timelineQuery = `
      SELECT 
        ${groupByFormat} as period,
        i.id,
        i.type,
        i.value
      FROM campaign_indicators ci
      JOIN indicators i ON ci.indicator_id = i.id
      WHERE ci.campaign_id = ?${dateFilter}
      ORDER BY ci.observed_at
    `;
    const timelineData = await this.dataSource.query(timelineQuery, dateParams);

    const timelineMap = new Map<string, TimelinePeriodDto>();
    
    for (const row of timelineData) {
      if (!timelineMap.has(row.period)) {
        timelineMap.set(row.period, {
          period: row.period,
          indicators: [],
          counts: { ip: 0, domain: 0, url: 0, hash: 0 },
        });
      }
      
      const period = timelineMap.get(row.period)!;
      period.indicators.push({ id: row.id, type: row.type, value: row.value });
      period.counts[row.type as 'ip' | 'domain' | 'url' | 'hash']++;
    }

    const summaryQuery = `
      SELECT 
        COUNT(DISTINCT ci.indicator_id) as total_indicators,
        COUNT(DISTINCT CASE WHEN i.type = 'ip' THEN i.id END) as unique_ips,
        COUNT(DISTINCT CASE WHEN i.type = 'domain' THEN i.id END) as unique_domains,
        JULIANDAY(MAX(ci.observed_at)) - JULIANDAY(MIN(ci.observed_at)) as duration_days
      FROM campaign_indicators ci
      JOIN indicators i ON ci.indicator_id = i.id
      WHERE ci.campaign_id = ?${dateFilter}
    `;
    const summary = await this.dataSource.query(summaryQuery, dateParams);

    return {
      campaign: campaign[0],
      timeline: Array.from(timelineMap.values()),
      summary: {
        total_indicators: summary[0].total_indicators || 0,
        unique_ips: summary[0].unique_ips || 0,
        unique_domains: summary[0].unique_domains || 0,
        duration_days: Math.round(summary[0].duration_days || 0),
      },
    };
  }

  async getDashboardSummary(query: DashboardQueryDto): Promise<DashboardSummaryDto> {
    this.logger.debug(`threat-intel.service::getDashboardSummary Fetching dashboard for ${query.time_range}`);

    const timeRangeMap = {
      '24h': "datetime('now', '-1 day')",
      '7d': "datetime('now', '-7 days')",
      '30d': "datetime('now', '-30 days')",
    };

    const timeFilter = timeRangeMap[query.time_range || '7d'];

    const newIndicatorsQuery = `
      SELECT 
        type,
        COUNT(*) as count
      FROM indicators
      WHERE created_at >= ${timeFilter}
      GROUP BY type
    `;
    const newIndicatorsData = await this.dataSource.query(newIndicatorsQuery);

    const newIndicators = { ip: 0, domain: 0, url: 0, hash: 0 };
    for (const row of newIndicatorsData) {
      newIndicators[row.type as 'ip' | 'domain' | 'url' | 'hash'] = row.count;
    }

    const activeCampaignsQuery = `
      SELECT COUNT(*) as count
      FROM campaigns
      WHERE status = 'active'
    `;
    const activeCampaignsResult = await this.dataSource.query(activeCampaignsQuery);

    const topThreatActorsQuery = `
      SELECT 
        ta.id,
        ta.name,
        COUNT(DISTINCT ci.indicator_id) as indicator_count
      FROM threat_actors ta
      JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
      JOIN campaign_indicators ci ON ac.campaign_id = ci.campaign_id
      GROUP BY ta.id, ta.name
      ORDER BY indicator_count DESC
      LIMIT 5
    `;
    const topThreatActors = await this.dataSource.query(topThreatActorsQuery);

    const distributionQuery = `
      SELECT 
        type,
        COUNT(*) as count
      FROM indicators
      GROUP BY type
    `;
    const distributionData = await this.dataSource.query(distributionQuery);

    const indicatorDistribution = { ip: 0, domain: 0, url: 0, hash: 0 };
    for (const row of distributionData) {
      indicatorDistribution[row.type as 'ip' | 'domain' | 'url' | 'hash'] = row.count;
    }

    return {
      time_range: query.time_range || '7d',
      new_indicators: newIndicators,
      active_campaigns: activeCampaignsResult[0].count,
      top_threat_actors: topThreatActors,
      indicator_distribution: indicatorDistribution,
    };
  }
}
