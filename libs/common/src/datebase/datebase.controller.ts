import { Controller } from '@nestjs/common';
import { DatebaseService } from './pokerdatebase.service';

@Controller('datebase')
export class DatebaseController {
  constructor(private readonly datebaseService: DatebaseService) {}
}
