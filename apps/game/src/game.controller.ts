import { Controller, Get } from '@nestjs/common';
import { GameService } from './game.service';

@Controller()
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Get()
  getHello(): Promise<any> {
    return this.gameService.getHello();
  }
}
