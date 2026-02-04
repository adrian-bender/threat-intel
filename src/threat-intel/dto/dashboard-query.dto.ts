import { IsOptional, IsIn } from 'class-validator';

export class DashboardQueryDto {
  @IsOptional()
  @IsIn(['24h', '7d', '30d'])
  time_range?: string = '7d';
}
