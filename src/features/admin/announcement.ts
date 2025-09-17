import { Message, PermissionFlagsBits } from "discord.js";
import { checkPhrases } from "../../utils/helpers";

const ANNOUNCEMENT_PHRASES = [
  "make an announcement",
  "make an announcement:",
  "create an announcement",
  "post an announcement",
  "send an announcement",
  "new announcement",
  "announcement time",
  "announce something",
  "announcement please",
  "do an announcement",
  "broadcast announcement",
  "server announcement",
  "public announcement",
  "general announcement",
  "important announcement",
];

export class AnnouncementHandler {
  static checkPhrases(messageContent: string): { announcement: boolean } {
    return {
      announcement: checkPhrases(messageContent, ANNOUNCEMENT_PHRASES),
    };
  }

  static async handle(message: Message): Promise<void> {
    try {
      // Check if user has administrator permissions
      if (!message.guild || !message.member) {
        if ("send" in message.channel) {
          await message.channel.send(
            "This command can only be used in a server!",
          );
        }
        return;
      }

      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
        if ("send" in message.channel) {
          await message.channel.send(
            "You need administrator permissions to make announcements!",
          );
        }
        return;
      }

      // Extract announcement content using regex
      // Use the 's' flag to make '.' match newlines (equivalent to Python's re.DOTALL)
      const match = message.content.match(/make an announcement:?\s*(.*)/is);

      if (match) {
        const announcement = match[1].trim();

        if (!announcement) {
          if ("send" in message.channel) {
            await message.channel.send(
              "Please provide an announcement message! Format: 'Matsuda, make an announcement: Your message here'",
            );
          }
          return;
        }

        // Find announcements channel
        const announcementsChannel = message.guild.channels.cache.find(
          (channel) =>
            channel.name === "announcements" && channel.isTextBased(),
        );

        if (announcementsChannel && announcementsChannel.isTextBased()) {
          try {
            await announcementsChannel.send(
              `📢 @everyone\n**ANNOUNCEMENT:**\n\n${announcement}`,
            );

            if ("send" in message.channel) {
              await message.channel.send("Done!");
            }
          } catch (error) {
            if ("send" in message.channel) {
              await message.channel.send(
                "I couldn't post to the announcements channel. Make sure I have permission to send messages there!",
              );
            }
          }
        } else {
          if ("send" in message.channel) {
            await message.channel.send(
              "I couldn't find an #announcements channel. Please create one first!",
            );
          }
        }
      } else {
        if ("send" in message.channel) {
          await message.channel.send(
            "Please provide an announcement message! Format: 'Matsuda, make an announcement: Your message here'",
          );
        }
      }
    } catch (error) {
      console.error("Error handling announcement:", error);
      if ("send" in message.channel) {
        await message.channel.send(
          "Something went wrong while making the announcement. Please try again!",
        );
      }
    }
  }
}
