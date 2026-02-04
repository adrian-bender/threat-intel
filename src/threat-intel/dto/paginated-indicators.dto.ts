import { IndicatorSearchItemDto } from './indicator-search-item.dto';

export class PaginatedIndicatorsDto {
  data: IndicatorSearchItemDto[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
