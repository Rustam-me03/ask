import { Context } from 'telegraf';
import { BotService } from './bot.service';
import { Action, Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) { }

  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botService.onStart(ctx);
  }

  @Action(/lang_(uz|ru|en)/)
  async onActionLanguage(@Ctx() ctx: Context) {
    await this.botService.onActionLanguage(ctx);
  }

  @Action(/^(male|female)_\d+$/)
  async onActionGender(@Ctx() ctx: Context) {
    await this.botService.onActionGender(ctx);
  }

  @On('text')
  async onText(@Ctx() ctx: Context) {
    await this.botService.onText(ctx);
  }
}
