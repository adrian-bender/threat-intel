import {
  Controller,
  Get,
  Param,
  Query,
  NotFoundException,
  BadRequestException,
  Inject,
  LoggerService,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ThreatIntelService } from './threat-intel.service';
import { IndicatorDetailDto } from './dto/indicator-detail.dto';
import { PaginatedIndicatorsDto } from './dto/paginated-indicators.dto';
import { SearchIndicatorsQueryDto } from './dto/search-indicators-query.dto';
import { CampaignTimelineDto } from './dto/campaign-timeline.dto';
import { CampaignIndicatorsQueryDto } from './dto/campaign-indicators-query.dto';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@Controller('api')
export class ThreatIntelController {
  constructor(
    private readonly threatIntelService: ThreatIntelService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
  ) {}

  @Get('indicators/:id')
  async getIndicator(@Param('id') id: string): Promise<IndicatorDetailDto> {
    this.logger.debug(
      `threat-intel.controller::getIndicator Retrieving indicator: ${id}`,
    );
    return this.threatIntelService.getIndicatorById(id);
  }

  @Get('indicators/search')
  async searchIndicators(
    @Query() query: SearchIndicatorsQueryDto,
  ): Promise<PaginatedIndicatorsDto> {
    this.logger.debug(
      `threat-intel.controller::searchIndicators Searching indicators with params: ${JSON.stringify(query)}`,
    );
    return this.threatIntelService.searchIndicators(query);
  }

  @Get('campaigns/:id/indicators')
  async getCampaignIndicators(
    @Param('id') id: string,
    @Query() query: CampaignIndicatorsQueryDto,
  ): Promise<CampaignTimelineDto> {
    this.logger.debug(
      `threat-intel.controller::getCampaignIndicators Retrieving campaign ${id} indicators`,
    );
    return this.threatIntelService.getCampaignIndicators(id, query);
  }

  @Get('dashboard/summary')
  async getDashboardSummary(
    @Query() query: DashboardQueryDto,
  ): Promise<DashboardSummaryDto> {
    this.logger.debug(
      `threat-intel.controller::getDashboardSummary Retrieving dashboard summary for ${query.time_range}`,
    );
    return this.threatIntelService.getDashboardSummary(query);
  }
}
