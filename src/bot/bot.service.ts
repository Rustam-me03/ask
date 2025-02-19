import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Bot } from "./schemas/bot.schema";
import { InjectBot } from "nestjs-telegraf";
import { BOT_NAME } from "src/app.constants";
import { Context, Markup, Telegraf } from "telegraf";
import { Model } from "mongoose";

@Injectable()
export class BotService {
  constructor(
    @InjectModel(Bot.name) private readonly botModel: Model<Bot>,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) { }

  async onStart(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      let user = await this.botModel.findOne({ user_id: String(user_id) });

      // Если пользователя нет в базе данных, создаем нового
      if (!user) {
        await this.botModel.create({
          user_id,
          user_name: ctx.from?.username,
          first_name: ctx.from?.first_name,
          last_name: ctx.from?.last_name,
          status: true,
          last_state: "choose_language",
          balance: 0,
        });

        await ctx.reply(
          "🌐 Tilni tanlang:\n🇺🇿 Tilni tanlang:\n🇷🇺 Выберите язык:\n🇬🇧 Choose a language:",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🇺🇿 O'zbekcha", callback_data: "lang_uz" },
                  { text: "🇷🇺 Русский", callback_data: "lang_ru" },
                  { text: "🇬🇧 English", callback_data: "lang_en" },
                ],
              ],
            },
          }
        );
      } else if (user && !user.status) {
        user.status = true;
        await user.save();
        await ctx.reply("🎉 Qaytganingiz bilan tabriklayman!");
      } else if (user.last_state === "choose_language") {
        await ctx.reply(
          "🌐 Tilni tanlang:\n🇺🇿 Tilni tanlang:\n🇷🇺 Выберите язык:\n🇬🇧 Choose a language:",
          {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "🇺🇿 O'zbekcha", callback_data: "lang_uz" },
                  { text: "🇷🇺 Русский", callback_data: "lang_ru" },
                  { text: "🇬🇧 English", callback_data: "lang_en" },
                ],
              ],
            },
          }
        );
      }
    } catch (error) {
      console.log("onStart error: ", error);
    }
  }

  async onActionLanguage(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const selectedLang = ctx.callbackQuery!["data"].split("_")[1];
      const user = await this.botModel.findOne({ user_id: String(user_id) });

      if (user && user.last_state === "choose_language") {
        user.user_lang = selectedLang;
        user.last_state = "real_name";
        await user.save();

        let greetingMessage = "";
        if (selectedLang === "uz") {
          greetingMessage = "😊 Ismingizni kiriting:";
        } else if (selectedLang === "ru") {
          greetingMessage = "😊 Введите своё имя:";
        } else if (selectedLang === "en") {
          greetingMessage = "😊 Please enter your real name:";
        }

        await ctx.editMessageText("✅ Til tanlandi / Язык выбран / Language selected");
        await ctx.reply(greetingMessage, {
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log("onActionLanguage error: ", error);
    }
  }

  async onText(ctx: Context) {
    try {
      if ("text" in ctx.message!) {
        const user_id = ctx.from?.id;
        const user = await this.botModel.findOne({ user_id: String(user_id) });

        if (!user || !user.status) {
          await ctx.reply(
            "❌ Siz ro'yxatdan o'tmagansiz yoki faol emassiz. Iltimos, /start ni bosing.",
            {
              ...Markup.keyboard([["/start"]]).resize(),
            }
          );
        } else if (user && user.last_state == "real_name") {
          user.real_name = ctx.message.text;
          user.last_state = "gender";
          await user.save();

          await ctx.reply(`👫 Jinsingizni tasdiqlang:`, {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: "👨 Erkak", callback_data: `male_${user.user_id}` },
                  { text: "👩 Ayol", callback_data: `female_${user.user_id}` },
                ],
              ],
            },
          });
        }
      }
    } catch (error) {
      console.log("onText error: ", error);
    }
  }

  async onActionGender(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findOne({ user_id: String(user_id) });

      if (user && user.last_state === "gender") {
        const selectedGender = ctx.callbackQuery!["data"].split("_")[0];
        user.gender = selectedGender;
        user.last_state = "birth_year";
        await user.save();

        let genderMessage = "";
        if (user.user_lang === "uz") {
          genderMessage = "🗓 Tug'ilgan yilingizni kiriting:";
        } else if (user.user_lang === "ru") {
          genderMessage = "🗓 Введите год вашего рождения:";
        } else if (user.user_lang === "en") {
          genderMessage = "🗓 Please enter your birth year:";
        }

        await ctx.editMessageText("✅ Jins tanlandi / Пол выбран / Gender selected");
        await ctx.reply(genderMessage, {
          ...Markup.removeKeyboard(),
        });
      }
    } catch (error) {
      console.log("onActionGender error: ", error);
    }
  }
}
