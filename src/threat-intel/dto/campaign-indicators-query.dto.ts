import { IsOptional, IsIn, IsString } from 'class-validator';

export class CampaignIndicatorsQueryDto {
  @IsOptional()
  @IsIn(['day', 'week'])
  group_by?: string = 'day';

  @IsOptional()
  @IsString()
  start_date?: string;

  @IsOptional()
  @IsString()
  end_date?: string;
}
