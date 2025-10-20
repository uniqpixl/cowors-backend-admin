import { registerDecorator, type ValidationOptions } from 'class-validator';
import ms from 'ms';

export function IsMs(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      propertyName: propertyName as string,
      name: 'isMs',
      target: object.constructor,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any): boolean {
          if (typeof value !== 'string' || value.length === 0) {
            return false;
          }
          try {
            const result = ms(value as any);
            return typeof result === 'number' && result > 0;
          } catch {
            return false;
          }
        },
        defaultMessage() {
          return `$property must be a valid ms format`;
        },
      },
    });
  };
}
