import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { IdGeneratorService } from '../../utils/id-generator.service';

@Injectable()
export class ParseCoworsIdPipe implements PipeTransform<string, string> {
  constructor(private readonly idGeneratorService: IdGeneratorService) {}

  transform(value: string, metadata: ArgumentMetadata): string {
    if (!value) {
      throw new BadRequestException('ID parameter is required');
    }

    if (!this.idGeneratorService.isValidCoworsId(value)) {
      throw new BadRequestException(
        `Invalid Cowors ID format. Expected formats: CUS-XXXXXX, CPT-XXXXXX, CSP-XXXXXX, BK-XXXXXX (e.g., CUS-128GG69, BK-ABC123)`,
      );
    }

    return value;
  }
}

@Injectable()
export class ParseOptionalCoworsIdPipe
  implements PipeTransform<string | undefined, string | undefined>
{
  constructor(private readonly idGeneratorService: IdGeneratorService) {}

  transform(
    value: string | undefined,
    metadata: ArgumentMetadata,
  ): string | undefined {
    if (!value) {
      return undefined;
    }

    if (!this.idGeneratorService.isValidCoworsId(value)) {
      throw new BadRequestException(
        `Invalid Cowors ID format. Expected formats: CUS-XXXXXX, CPT-XXXXXX, CSP-XXXXXX, BK-XXXXXX (e.g., CUS-128GG69, BK-ABC123)`,
      );
    }

    return value;
  }
}
