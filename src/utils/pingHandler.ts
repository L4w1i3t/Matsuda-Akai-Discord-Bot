import { Message } from "discord.js";

// Track recent pings - simplified to just track user IDs like the original
let recentPings: string[] = [];
let botMuted = false;

export class PingHandler {
  static async handlePing(message: Message): Promise<void> {
    try {
      if (!botMuted) {
        recentPings.push(message.author.id);

        if (recentPings.length === 2) {
          if ("send" in message.channel) {
            await message.channel.send(
              "Okay, ha ha, you had your fun, now please stop.",
            );
          }
        } else if (recentPings.length === 3) {
          if ("send" in message.channel) {
            await message.channel.send(`
        **Alright, listen up. I can't believe I have to fucking say this: STOP FUCKING PINGING ME. Seriously, I'm not your damn servant. I'm not here to cater to your every random thought or meme. Just because you feel like sharing some dumb bullshit doesn't mean you need to drag me into it with a ping. Do you think my notifications exist for your fucking convenience? HELL NO.

I have a life outside of this damn server, believe it or not. Every time you ping me, my focus gets wrecked and my sanity takes another hit. Not to mention I could be blocking stuff for LITERALLY ANYONE ELSE. Imagine being in the middle of something important and then BAM, another "Hey, @me, check this out! GUHUHUHU!" like I'm just sitting here waiting for your summons. Fuck outta here with that bullshit.

So, here's a fucking novel idea: Use what you have left of your brain. Think for a second: is your message really worth a ping? Can it wait? Can you figure it out yourself? Because 99% of the time, the answer is a resounding YES. And if it's truly, absolutely, undeniably urgent, maybe, JUST MAYBE, talk to my dad about it.

Let's save the pings for other people or announcements, not your random bullshit. Thanks for coming to my TED Talk, and get fucked.**
            `);
          }
        } else if (recentPings.length === 4) {
          if ("send" in message.channel) {
            await message.channel.send(
              "Dafuq did I just say, you little shit?",
            );
          }
        } else if (recentPings.length === 5) {
          try {
            if (message.guild && message.member) {
              await message.member.timeout(1 * 60 * 1000, "Excessive pinging"); // 1 minute
              if ("send" in message.channel) {
                await message.channel.send(
                  `${message.author.toString()} ***SINCE WHEN WERE YOU THE ONE IN CONTROL?***`,
                );
              }
            }
          } catch (error) {
            if ("send" in message.channel) {
              await message.channel.send(
                "***I would time you out, but you're stronger than me...***",
              );
            }
          }
        } else if (recentPings.length === 6) {
          try {
            if (message.guild && message.member) {
              await message.member.timeout(2 * 60 * 1000, "Excessive pinging"); // 2 minutes
              if ("send" in message.channel) {
                await message.channel.send(
                  `${message.author.toString()} ***OH, WE GOT ANOTHER!***`,
                );
              }
            }
          } catch (error) {
            if ("send" in message.channel) {
              await message.channel.send(
                "***I would time you out, but you're stronger than me...***",
              );
            }
          }
        } else if (recentPings.length >= 7) {
          try {
            if (message.guild && message.member) {
              await message.member.timeout(3 * 60 * 1000, "Excessive pinging"); // 3 minutes
              if ("send" in message.channel) {
                await message.channel.send(
                  `${message.author.toString()} ***YEET.***`,
                );
              }
            }
          } catch (error) {
            if ("send" in message.channel) {
              await message.channel.send(
                "***I would time you out, but you're stronger than me...***",
              );
            }
          }
        } else {
          if ("send" in message.channel) {
            await message.channel.send("Don't ping me! >:(");
          }
        }
      }
    } catch (error) {
      console.error("Error handling ping:", error);
    }
  }

  static isMuted(): boolean {
    return botMuted;
  }

  static clearPings(): void {
    recentPings = [];
    botMuted = false; // Unmute the bot when it is addressed without a ping (like the original)
  }
}
