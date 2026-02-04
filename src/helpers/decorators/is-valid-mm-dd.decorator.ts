import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsValidMMDDConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!/^\d{4}$/.test(value)) {
      return false;
    }
    const month = parseInt(value.substring(0, 2), 10);
    const day = parseInt(value.substring(2, 4), 10);
    if (month < 1 || month > 12) {
      return false;
    }
    const daysInMonth = {
      1: 31,
      2: 29,
      3: 31,
      4: 30,
      5: 31,
      6: 30,
      7: 31,
      8: 31,
      9: 30,
      10: 31,
      11: 30,
      12: 31,
    };
    const maxDay = daysInMonth[month];
    if (day < 1 || day > maxDay) {
      return false;
    }
    return true;
  }

  defaultMessage(): string {
    return 'Date need to be in MMDD format. Ex: 1215';
  }
}

export function IsValidMMDD(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidMMDDConstraint,
    });
  };
}
