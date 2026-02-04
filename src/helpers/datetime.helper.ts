export const DATE_FORMAT_YEAR_MONTH_DAY = 'yyyyMMdd';
export const DATE_FORMAT_YEAR_MONTH_DAY_HOUR_MINUTE = 'yyyyMMddHHmm';
export const DATE_FORMAT_YEAR_MONTH_DAY_HOUR_MINUTE_SECOND = 'yyyyMMddHHmmss';

export const getCurrentDateInUTC = (): Date => {
  const date = new Date();
  const currentUTCDate = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
  return new Date(currentUTCDate);
};
