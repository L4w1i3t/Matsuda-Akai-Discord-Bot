import { Message } from "discord.js";
import {
  checkPhrases,
  getRandomElement,
  shouldRespond,
  safeChannelSend,
  safeChannelSendWithMessage,
  delay,
} from "../../utils/helpers";
import { InventoryManager } from "../../data/userInventory";

const GACHA_PHRASES = [
  "i wanna roll",
  "let's roll",
  "lets roll",
  "i want to roll",
  "gacha",
  "roll gacha",
  "gacha roll",
  "gacha time",
  "time to roll",
  "pull",
  "gacha pull",
  "summon",
  "wanna roll",
  "want to roll",
  "can i roll",
  "let me roll",
  "rolling time",
  "pull some",
  "do a pull",
  "do some pulls",
  "i wanna pull",
  "i want to pull",
  "wanna pull",
  "want to pull",
];

// Regex pattern to match gacha macro commands - only with "matsuda" prefix
// Examples: "matsuda gacha zzz 10", "matsuda roll honkai 1"
const GACHA_MACRO_PATTERN = /matsuda\s+(?:gacha|roll|pull)\s+(zzz|zenless|honkai|star\s*rail|feh|fire\s*emblem|genshin|impact|uma|umamusume|pretty\s*derby)\s+(1|10|one|ten)(?:\s|$)/i;

const INVENTORY_PHRASES = [
  "my gacha",
  "gacha inventory",
  "my pulls",
  "show inventory",
  "my collection",
  "gacha collection",
  "inventory",
  "collection",
  "my characters",
  "gacha stats",
  "pull stats",
];

// Regex patterns for specific game inventory commands
// Examples: "matsuda my gacha zzz characters", "matsuda my gacha honkai items"
const GAME_INVENTORY_PATTERN = /matsuda\s+my\s+gacha\s+(zzz|zenless|honkai|star\s*rail|feh|fire\s*emblem|genshin|impact|uma|umamusume|pretty\s*derby)\s+(characters?|items?|materials?)(?:\s|$)/i;

interface GachaGame {
  name: string;
  displayName: string;
  rarities: {
    [key: string]: {
      rate: number;
      emoji: string;
      color: string;
    };
  };
  characters: {
    [rarity: string]: string[];
  };
  quotes: {
    [character: string]: string[];
  };
  nonCharacterItems?: {
    [rarity: string]: Array<{
      name: string;
      minQuantity: number;
      maxQuantity: number;
    }>;
  };
}

const GACHA_GAMES: { [key: string]: GachaGame } = {
  zzz: {
    name: "zzz",
    displayName: "Zenless Zone Zero",
    rarities: {
      "S-Rank": { rate: 0.6, emoji: "⭐⭐⭐⭐⭐", color: "🟡" },
      "A-Rank": { rate: 9.4, emoji: "⭐⭐⭐⭐", color: "🟣" },
      "B-Rank": { rate: 90.0, emoji: "⭐⭐⭐", color: "🔵" },
    },
    characters: {
      "S-Rank": [
        "Anby: Soldier 0",
        "Astra Yao",
        "Burnice",
        "Caesar",
        "Ellen",
        "Evelyn",
        "Grace",
        "Harumasa",
        "Hugo",
        "Jane Doe",
        "Ju Fufu",
        "Koleda",
        "Lighter",
        "Lycaon",
        "Miyabi",
        "Nekomata",
        "Qingyi",
        "Rina",
        "Soldier 11",
        "Trigger",
        "Vivian",
        "Yanagi",
        "Yixuan",
        "Yuzuha",
        "Zhu Yuan",
      ],
      "A-Rank": [
        "Anby",
        "Anton",
        "Ben",
        "Billy",
        "Corin",
        "Lucy",
        "Nicole",
        "Pan Yinhu",
        "Piper",
        "Pulchra",
        "Seth",
        "Soukaku",
      ],
      "B-Rank": [],
    },
    quotes: {
      Anby: ["Standing by.", "Ready for combat."],
      Nicole: [
        "Need something? My services are expensive",
        "Nothing to fear, the Cunning Hares are here!",
      ],
      Billy: [
        "I have two guns, so...double the accuracy!",
        "Starlight, it's time to shine!",
      ],
      Burnice: ["Want a glass of Nitro-Fuel?", "Let's fire it up!"],
      Nekomata: [
        "Did you call me? Nya~",
        "I'll help you win, but lunch is on you!",
      ],
      Anton: ["C'mon, let's get to work!", "It's our turn, bro!"],
      Ben: ["Time for some hard labor?", "How can I help?"],
      Corin: ["Huh...? D-Don't look at me...!", "Eh... Huh?! I'm sorry!"],
      Lucy: ["Good day, Proxy!", "Hmph... Uh, to what do I owe the pleasure?"],
      "Pan Yinhu": [
        "Do you want me to fight...or to cook?",
        "Man is iron, rice is steel. I make a mean chitlins meal!",
      ],
      Piper: ["Mh... Let's take a break...", "Ugh... So sleepy..."],
      Pulchra: [
        "Looking for intel, or hiring me for a job?",
        "My loyalty lies with the winner.",
      ],
      Seth: ["If you need help, call me anytime!", "A mission? Take me along!"],
      Soukaku: ["Is it work time?! Is food included?!", "Soukaku...ready!"],
    },
    nonCharacterItems: {
      "S-Rank": [
        { name: "Premium W-Engine", minQuantity: 1, maxQuantity: 1 },
        { name: "S-Rank Drive Disc", minQuantity: 1, maxQuantity: 2 },
      ],
      "A-Rank": [
        { name: "Advanced W-Engine", minQuantity: 1, maxQuantity: 2 },
        { name: "A-Rank Drive Disc", minQuantity: 1, maxQuantity: 3 },
        { name: "Promotion Materials", minQuantity: 5, maxQuantity: 15 },
      ],
      "B-Rank": [
        { name: "Basic W-Engine", minQuantity: 1, maxQuantity: 3 },
        { name: "B-Rank Drive Disc", minQuantity: 2, maxQuantity: 5 },
        { name: "Dennies", minQuantity: 1000, maxQuantity: 5000 },
        { name: "Enhancement Materials", minQuantity: 3, maxQuantity: 10 },
      ],
    },
  },
  honkai: {
    name: "honkai",
    displayName: "Honkai Star Rail",
    rarities: {
      "5-Star": { rate: 0.6, emoji: "⭐⭐⭐⭐⭐", color: "🟡" },
      "4-Star": { rate: 9.4, emoji: "⭐⭐⭐⭐", color: "🟣" },
      "3-Star": { rate: 90.0, emoji: "⭐⭐⭐", color: "🔵" },
    },
    characters: {
      "5-Star": [],
      "4-Star": [],
      "3-Star": [],
    },
    quotes: {},
    nonCharacterItems: {
      "5-Star": [
        { name: "5-Star Light Cone", minQuantity: 1, maxQuantity: 1 },
        { name: "Premium Relic", minQuantity: 1, maxQuantity: 2 },
        { name: "Stellar Jade", minQuantity: 500, maxQuantity: 1000 },
      ],
      "4-Star": [
        { name: "4-Star Light Cone", minQuantity: 1, maxQuantity: 2 },
        { name: "Advanced Relic", minQuantity: 1, maxQuantity: 3 },
        { name: "Trace Materials", minQuantity: 10, maxQuantity: 25 },
        { name: "Credits", minQuantity: 5000, maxQuantity: 15000 },
      ],
      "3-Star": [
        { name: "3-Star Light Cone", minQuantity: 1, maxQuantity: 3 },
        { name: "Basic Relic", minQuantity: 2, maxQuantity: 5 },
        { name: "Character EXP", minQuantity: 1000, maxQuantity: 5000 },
        { name: "Credits", minQuantity: 1000, maxQuantity: 3000 },
      ],
    },
  },
  feh: {
    name: "feh",
    displayName: "Fire Emblem Heroes",
    rarities: {
      "5-Star": { rate: 3.0, emoji: "⭐⭐⭐⭐⭐", color: "🟡" },
      "4-Star": { rate: 22.0, emoji: "⭐⭐⭐⭐", color: "🟣" },
      "3-Star": { rate: 75.0, emoji: "⭐⭐⭐", color: "🔵" },
    },
    characters: {
      "5-Star": [
        "Marth",
        "Kris",
        "Alm",
        "Celica",
        "Sigurd",
        "Seliph",
        "Leif (Thracia)",
        "Roy",
        "Eliwood",
        "Lyn",
        "Hector",
        "Eirika",
        "Ephraim",
        "Ike",
        "Micaiah",
        "Elincia",
        "Chrom",
        "M!Robin",
        "F!Robin",
        "Lucina",
        "M!Corrin",
        "F!Corrin",
        "M!Byleth",
        "F!Byleth",
        "Edelgard",
        "Dimitri",
        "Claude",
        "Yuri",
        "M!Shez",
        "F!Shez",
        "M!Alear",
        "F!Alear",
        "Anna"
      ],
      "4-Star": [
        // Shadow Dragon/Mystery/New Mystery characters
        "Caeda",
        "Cain",
        "Abel",
        "Gordin",
        "Draug",
        "Frey",
        "Jagen",
        "Tiki",
        "Nyna",
        "Ogma",
        "Navarre",
        "Sirius",
        "Merric",
        "Linde",
        "Astram",
        "Jeorge",
        "Hardin",
        "Wolf",
        "Sedgar",
        "Xane",
        "Nagi",
        "Katarina",
        "Catria",
        "Palla",
        "Est",
        "Luke",
        "Roderick",
        "Cecil",
        "Phina",
        "Minerva",
        "Michalis",
        "Elice",
        "Lena",
        "Maria",

        // Gaiden/SoV characters
        "Tobin",
        "Gray",
        "Kliff",
        "Clive",
        "Mathilda",
        "Delthea",
        "Zeke",
        "Mycen",
        "Mae",
        "Boey",
        "Saber",
        "Sonya",
        "Deen",
        "Conrad",
        "Emma",
        "Randal",
        "Yuzu",
        "Shade",

        // Genealogy of the Holy War characters
        "Arden",
        "Quan",
        "Ethlyn",
        "Finn",
        "Aideen",
        "Ayra",
        "Chulainn",
        "Dierdre",
        "Lachesis",
        "Lewyn",
        "Erinys",
        "Tailtiu",
        "Brigid",
        "Larcei",
        "Scathach",
        "Oifey",
        "Shannan",
        "Julia",
        "Leif (Genealogy)",
        "Nanna (Genealogy)",
        "Ares",
        "Tine",
        "Ced",
        "Altena",

        // Thracia 776 characters
        "Osian",
        "Tanya",
        "Dagdar",
        "Eyvel",
        "Safy",
        "Lifis",
        "Mareeta",
        "Asbel",
        "Nanna (Thracia)",
        "Shiva",
        "Olwen",
        "Salem",
        "Perne",
        "Shannam",
        "Linoan",
        "Sara",
        "Miranda",
        "Xavier",
        "Delmud",
        "Saias",
        "Galzus",

        // Binding Blade characters
        "Merlinus",
        "Lance",
        "Allen",
        "Dieck",
        "Shanna",
        "Thea",
        "Juno",
        "Chad",
        "Rutger",
        "Larum",
        "Elffin",
        "Echidna",
        "Bartre",
        "Lilina",
        "Fir",
        "Klein",
        "Geese",
        "Cath",
        "Cecilia",
        "Igrene",
        "Fae",
        "Melady",
        "Douglas",

        // Blazing Blade characters
        "Ninian",
        "Nils",
        "Kent",
        "Sain",
        "Dorcas",
        "Rath",
        "Wallace",
        "Lowen",
        "Marcus",
        "Oswin",
        "Guy",
        "Priscilla",
        "Raven",
        "Florina",
        "Farina",
        "Fiora",
        "Legault",
        "Hawkeye",
        "Pent",
        "Louise",
        "Karel",
        "Harken",
        "Nino",
        "Jaffar",
        "Athos",

        // Sacred Stones characters
        "Seth",
        "Gilliam",
        "Ross",
        "Joshua",
        "Orson",
        "Tana",
        "Amelia",
        "Innes",
        "Lute",
        "Gerik",
        "L\'Arachel",
        "Ewan",
        "Cormag",
        "Duessel",
        "Myrrh",

        // Path of Radiance characters
        "Titania",
        "Mist",
        "Soren",
        "Ilyana",
        "Nephenee",
        "Shinon",
        "Gatrie",
        "Zihark",
        "Jill",
        "Volke",
        "Stefan",
        "Tanith",
        "Reyson",
        "Calill",
        "Largo",
        "Tauroneo",
        "Haar",
        "Ranulf",
        "Tibarn",
        "Naesala",
        "Giffca",
        "Bastian",
        "Lucia",
        "Geoffrey",
        "Nasir",
        "Ena",

        // Radiant Dawn characters
        "Nolan",
        "Sothe",
        "Volug",
        "Vika",
        "Nailah",
        "Rafiel",
        "Sigrun",
        "Skrimir",
        "Sanaki",
        "Pelleas",
        "Oliver",
        "Renning",
        "Gareth",
        "Lehran",
        "Kurthnaga",

        // Awakening characters
        "Lissa",
        "Frederick",
        "Virion",
        "Sumia",
        "Flavia",
        "Basilio",
        "Say\'ri",
        "Cordelia",
        "Olivia",
        "Owain",
        "Inigo",
        "Severa",
        "Cynthia",
        "Gerome",
        "M!Morgan",
        "F!Morgan",
        "Noire",
        "Priam",

        // Fates characters
        "Ryoma",
        "Takumi",
        "Hinoka",
        "Sakura",
        "Xander",
        "Camilla",
        "Leo",
        "Elise",
        "Azura",
        "Odin",
        "Laslow",
        "Selena",
        "Felicia",
        "Flora",
        "Jakob",
        "Silas",
        "Kaze",
        "Rinkah",
        "Scarlet",
        "Izana",
        "Shura",
        "Yukimura",
        "Fuga",
        "M!Kana",
        "F!Kana",
        "Shigure",
        "Caeldori",
        "Rhajat",
        "Asugi",
        "Soleil",
        "Ophelia",

        // Three Houses/Three Hopes characters
        "Hubert",
        "Ferdinand",
        "Linhardt",
        "Petra",
        "Dedue",
        "Mercedes",
        "Felix",
        "Annette",
        "Hilda",
        "Lorenz",
        "Lysithea",
        "Marianne",
        "Hapi",
        "Constance",
        "Balthus",
        "Seteth",
        "Flayn",
        "Rhea",
        "Jeritza",

        // Engage characters
        "Alfred",
        "Céline",
        "Diamant",
        "Alcryst",
        "Ivy",
        "Hortensia",
        "Timerra",
        "Fogado",
        "Mauvier",
        "Veyle",
        "Yunaka",
        "Seadall",
        "Jean",
        "Vander",
        "Nel",
        "Rafal",
        "Madeline",
        "Gregory",
        "Zelestia"
      ],
      "3-Star": [
        "Sword Knight",
        "Lance Knight",
        "Axe Knight",
        "Bow Knight",
        "Tome Knight",
        "Staff Knight",
        "Dragon Knight",
        "Beast Knight",
        "Armor Knight",
        "Cavalry Knight",
        "Sword Mage",
        "Lance Mage",
        "Axe Mage",
        "Bow Mage",
        "Tome Mage",
        "Staff Mage",
        "Dragon Mage",
        "Beast Mage",
        "Armor Mage",
        "Cavalry Mage"
      ],
    },
    quotes: {},
  },
  genshin: {
    name: "genshin",
    displayName: "Genshin Impact",
    rarities: {
      "5-Star": { rate: 0.6, emoji: "⭐⭐⭐⭐⭐", color: "🟡" },
      "4-Star": { rate: 9.4, emoji: "⭐⭐⭐⭐", color: "🟣" },
      "3-Star": { rate: 90.0, emoji: "⭐⭐⭐", color: "🔵" },
    },
    characters: {
      "5-Star": [],
      "4-Star": [],
      "3-Star": [],
    },
    quotes: {},
    nonCharacterItems: {
      "5-Star": [
        { name: "5-Star Weapon", minQuantity: 1, maxQuantity: 1 },
        { name: "Primogems", minQuantity: 500, maxQuantity: 1000 },
        { name: "Intertwined Fate", minQuantity: 1, maxQuantity: 3 },
      ],
      "4-Star": [
        { name: "4-Star Weapon", minQuantity: 1, maxQuantity: 2 },
        { name: "Primogems", minQuantity: 100, maxQuantity: 300 },
        { name: "Hero's Wit", minQuantity: 5, maxQuantity: 15 },
        { name: "Mystic Enhancement Ore", minQuantity: 10, maxQuantity: 25 },
      ],
      "3-Star": [
        { name: "3-Star Weapon", minQuantity: 1, maxQuantity: 3 },
        { name: "Mora", minQuantity: 1000, maxQuantity: 5000 },
        { name: "Enhancement Ore", minQuantity: 5, maxQuantity: 20 },
        { name: "Adventurer's Experience", minQuantity: 3, maxQuantity: 10 },
      ],
    },
  },
  umamusume: {
    name: "umamusume",
    displayName: "Umamusume: Pretty Derby",
    rarities: {
      "3-Star": { rate: 3.0, emoji: "⭐⭐⭐", color: "🟡" },
      "2-Star": { rate: 18.0, emoji: "⭐⭐", color: "🟣" },
      "1-Star": { rate: 79.0, emoji: "⭐", color: "🔵" },
    },
    characters: {
      "3-Star": [],
      "2-Star": [],
      "1-Star": [],
    },
    quotes: {},
  },
};

export class GachaHandler {
  static checkPhrases(messageContent: string): {
    gacha: boolean;
    inventory: boolean;
    macro?: { game: string; pullCount: number };
    gameInventory?: { game: string; type: string };
  } {
    // Check for specific game inventory command first
    const gameInventoryMatch = messageContent.match(GAME_INVENTORY_PATTERN);
    if (gameInventoryMatch) {
      const gameString = gameInventoryMatch[1].toLowerCase().replace(/\s+/g, '');
      const type = gameInventoryMatch[2].toLowerCase().replace(/s$/, ''); // Remove plural 's'
      
      return {
        gacha: false,
        inventory: false,
        gameInventory: { game: gameString, type }
      };
    }

    // Check for macro command
    const macroMatch = messageContent.match(GACHA_MACRO_PATTERN);
    if (macroMatch) {
      const gameString = macroMatch[1].toLowerCase().replace(/\s+/g, '');
      const pullString = macroMatch[2].toLowerCase();
      const pullCount = pullString === '10' || pullString === 'ten' ? 10 : 1;
      
      return {
        gacha: true,
        inventory: false,
        macro: { game: gameString, pullCount }
      };
    }

    return {
      gacha: checkPhrases(messageContent, GACHA_PHRASES),
      inventory: checkPhrases(messageContent, INVENTORY_PHRASES),
    };
  }

  private static parseGameFromMacro(gameString: string): GachaGame | null {
    const normalized = gameString.toLowerCase().replace(/\s+/g, '');
    
    if (normalized.includes('zzz') || normalized.includes('zenless')) {
      return GACHA_GAMES.zzz;
    } else if (normalized.includes('honkai') || normalized.includes('starrail')) {
      return GACHA_GAMES.honkai;
    } else if (normalized.includes('feh') || normalized.includes('fireemblem')) {
      return GACHA_GAMES.feh;
    } else if (normalized.includes('genshin') || normalized.includes('impact')) {
      return GACHA_GAMES.genshin;
    } else if (normalized.includes('uma') || normalized.includes('umamusume') || normalized.includes('prettyderby')) {
      return GACHA_GAMES.umamusume;
    }
    
    return null;
  }

  static async handle(message: Message): Promise<void> {
    if (!shouldRespond(message)) return;

    const phrases = this.checkPhrases(message.content);

    // Handle specific game inventory requests first
    if (phrases.gameInventory) {
      await this.displayGameInventory(message, phrases.gameInventory.game, phrases.gameInventory.type);
      return;
    }

    // Handle general inventory summary
    if (phrases.inventory) {
      await this.displayInventorySummary(message);
      return;
    }

    // Handle macro command if detected
    if (phrases.macro) {
      await this.handleMacroCommand(message, phrases.macro.game, phrases.macro.pullCount);
      return;
    }

    // Only proceed with interactive gacha if macro wasn't triggered
    if (!phrases.gacha) return;

    await this.handleInteractiveGacha(message);
  }

  private static async handleMacroCommand(message: Message, gameString: string, pullCount: number): Promise<void> {
    try {
      if (!("awaitMessages" in message.channel)) {
        await safeChannelSend(
          message.channel,
          `🚫 **CHANNEL RESTRICTION**\n\n` +
            `Sorry, can't do gacha pulls in this type of channel!\n\n` +
            `*Try using this command in a regular text channel!*`,
        );
        return;
      }

      const selectedGame = this.parseGameFromMacro(gameString);
      
      if (!selectedGame) {
        await safeChannelSend(
          message.channel,
          `❌ **UNKNOWN GAME**\n\n` +
            `I didn't recognize "${gameString}"!\n\n` +
            `**Available games:**\n` +
            `• **ZZZ** or **Zenless** - Zenless Zone Zero\n` +
            `• **Honkai** or **Star Rail** - Honkai Star Rail\n` +
            `• **FEH** or **Fire Emblem** - Fire Emblem Heroes\n` +
            `• **Genshin** or **Impact** - Genshin Impact\n` +
            `• **Uma** or **Umamusume** - Umamusume: Pretty Derby\n\n` +
            `*Example: "matsuda gacha zzz 10"*`,
        );
        return;
      }

      await safeChannelSend(
        message.channel,
        `🎰 **QUICK GACHA!**\n\n` +
          `🎮 **Game:** ${selectedGame.displayName}\n` +
          `🎲 **Pulls:** ${pullCount}\n\n` +
          `*Rolling immediately...*`,
      );

      await delay(1000);

      // Perform the pulls
      const results = this.performPulls(selectedGame, pullCount);

      // Save pulls to user inventory and get merge information
      const enrichedResults = results.map((result) => {
        if (result.isCharacter) {
          const { isNew, mergeCount } =
            InventoryManager.addCharacterToInventory(
              message.author.id,
              result.item,
              result.rarity,
              selectedGame.name,
            );
          return { ...result, isNew, mergeCount };
        } else {
          const totalQuantity = InventoryManager.addConsumableToInventory(
            message.author.id,
            result.item,
            result.rarity,
            selectedGame.name,
            result.quantity || 1,
          );
          return { ...result, totalQuantity };
        }
      });

      // Update pull count
      const totalPulls = InventoryManager.incrementPullCount(
        message.author.id,
        pullCount,
      );

      // Display results
      await this.displayResults(
        message,
        selectedGame,
        enrichedResults,
        pullCount,
        totalPulls,
      );
    } catch (error) {
      console.error("Error in macro gacha command:", error);
      await safeChannelSend(
        message.channel,
        `❌ **SYSTEM ERROR**\n\n` +
          `Something went wrong with the gacha system!\n\n` +
          `*The desire sensor is acting up...*\n` +
          `Please try again in a moment!`,
      );
    }
  }

  private static async handleInteractiveGacha(message: Message): Promise<void> {
    try {
      if (!("awaitMessages" in message.channel)) {
        await safeChannelSend(
          message.channel,
          `🚫 **CHANNEL RESTRICTION**\n\n` +
            `Sorry, can't do gacha pulls in this type of channel!\n\n` +
            `*Try using this command in a regular text channel!*`,
        );
        return;
      }

      // Ask which game they want to roll for
      const gameOptions = Object.values(GACHA_GAMES)
        .map((game) => `🎮 ${game.displayName}`)
        .join("\n");

      await safeChannelSend(
        message.channel,
        `🎰 **GACHA TIME!**\n\n` +
          `Which game do you wanna roll for?\n\n` +
          `**Available Games:**\n` +
          `${gameOptions}\n\n` +
          `*Just type the abbreviation: "ZZZ", "Honkai", "FEH", "Genshin", or "Uma"*\n\n` +
          `💡 **Pro Tip:** Next time try the quick command!\n` +
          `*Examples: "matsuda gacha zzz 10" or "matsuda roll feh 1"*`,
      );

      // Wait for game choice
      const gameFilter = (msg: Message) => {
        const content = msg.content.toLowerCase().trim();
        return (
          msg.author.id === message.author.id &&
          msg.channel.id === message.channel.id &&
          (content.includes("zzz") ||
            content.includes("zenless") ||
            content.includes("honkai") ||
            content.includes("star rail") ||
            content.includes("feh") ||
            content.includes("fire emblem") ||
            content.includes("genshin") ||
            content.includes("impact") ||
            content.includes("uma") ||
            content.includes("umamusume") ||
            content.includes("pretty derby"))
        );
      };

      try {
        const gameCollection = await message.channel.awaitMessages({
          filter: gameFilter,
          max: 1,
          time: 30000,
          errors: ["time"],
        });

        const gameMessage = gameCollection.first();
        if (!gameMessage) return;

        // Determine which game was chosen
        const gameChoice = gameMessage.content.toLowerCase().trim();
        let selectedGame: GachaGame | null = null;

        if (gameChoice.includes("zzz") || gameChoice.includes("zenless")) {
          selectedGame = GACHA_GAMES.zzz;
        } else if (
          gameChoice.includes("honkai") ||
          gameChoice.includes("star rail")
        ) {
          selectedGame = GACHA_GAMES.honkai;
        } else if (
          gameChoice.includes("feh") ||
          gameChoice.includes("fire emblem")
        ) {
          selectedGame = GACHA_GAMES.feh;
        } else if (
          gameChoice.includes("genshin") ||
          gameChoice.includes("impact")
        ) {
          selectedGame = GACHA_GAMES.genshin;
        } else if (
          gameChoice.includes("uma") ||
          gameChoice.includes("umamusume") ||
          gameChoice.includes("pretty derby")
        ) {
          selectedGame = GACHA_GAMES.umamusume;
        }

        if (!selectedGame) {
          await safeChannelSend(
            message.channel,
            `❌ **OOPS!**\n\n` +
              `I didn't recognize that game...\n\n` +
              `*Please try again with one of the listed options!*\n` +
              `Use abbreviations like: **ZZZ**, **Honkai**, **FEH**, **Genshin**, or **Uma**`,
          );
          return;
        }

        // Ask how many pulls
        await safeChannelSend(
          message.channel,
          `✨ **${selectedGame.displayName}** selected!\n\n` +
            `How many pulls do you want?\n\n` +
            `**Options:**\n` +
            `1️⃣ **Single Pull** - Type "1"\n` +
            `🔟 **Ten Pull** - Type "10"\n\n`,
        );

        const pullFilter = (msg: Message) => {
          const content = msg.content.toLowerCase().trim();
          return (
            msg.author.id === message.author.id &&
            msg.channel.id === message.channel.id &&
            (content === "1" ||
              content === "10" ||
              content === "one" ||
              content === "ten")
          );
        };

        const pullCollection = await message.channel.awaitMessages({
          filter: pullFilter,
          max: 1,
          time: 30000,
          errors: ["time"],
        });

        const pullMessage = pullCollection.first();
        if (!pullMessage) return;

        const pullChoice = pullMessage.content.toLowerCase().trim();
        const pullCount = pullChoice === "10" || pullChoice === "ten" ? 10 : 1;

        await safeChannelSend(
          message.channel,
          `🎲 **ROLLING ${pullCount} PULL${pullCount > 1 ? "S" : ""}**\n\n` +
            `**Game:** ${selectedGame.displayName}\n` +
            `**Pulls:** ${pullCount}\n\n`,
        );

        await delay(1500);

        // Perform the pulls
        const results = this.performPulls(selectedGame, pullCount);

        // Save pulls to user inventory and get merge information
        const enrichedResults = results.map((result) => {
          if (result.isCharacter) {
            const { isNew, mergeCount } =
              InventoryManager.addCharacterToInventory(
                message.author.id,
                result.item,
                result.rarity,
                selectedGame.name,
              );
            return { ...result, isNew, mergeCount };
          } else {
            const totalQuantity = InventoryManager.addConsumableToInventory(
              message.author.id,
              result.item,
              result.rarity,
              selectedGame.name,
              result.quantity || 1,
            );
            return { ...result, totalQuantity };
          }
        });

        // Update pull count
        const totalPulls = InventoryManager.incrementPullCount(
          message.author.id,
          pullCount,
        );

        // Display results
        await this.displayResults(
          message,
          selectedGame,
          enrichedResults,
          pullCount,
          totalPulls,
        );
      } catch (timeoutError) {
        await safeChannelSend(
          message.channel,
          `⏰ **TIME'S UP!**\n\n` +
            `Took too long to respond!\n\n` +
            `*Maybe next time you'll be quicker on the draw...*\n` +
            `Feel free to try rolling again anytime!`,
        );
      }
    } catch (error) {
      console.error("Error in gacha game:", error);
      await safeChannelSend(
        message.channel,
        `❌ **SYSTEM ERROR**\n\n` +
          `Something went wrong with the gacha system!\n\n` +
          `*The desire sensor is acting up...*\n` +
          `Please try again in a moment!`,
      );
    }
  }

  private static performPulls(
    game: GachaGame,
    count: number,
  ): Array<{
    rarity: string;
    item: string;
    quantity?: number;
    isCharacter: boolean;
  }> {
    const results: Array<{
      rarity: string;
      item: string;
      quantity?: number;
      isCharacter: boolean;
    }> = [];

    for (let i = 0; i < count; i++) {
      const roll = Math.random() * 100;
      let cumulativeRate = 0;

      for (const [rarity, data] of Object.entries(game.rarities)) {
        cumulativeRate += data.rate;
        if (roll <= cumulativeRate) {
          // Decide if we get a character or non-character item
          const hasCharacters = game.characters[rarity].length > 0;
          const hasNonCharacters =
            (game.nonCharacterItems?.[rarity]?.length ?? 0) > 0;

          let isCharacter = false;
          let item = "";
          let quantity: number | undefined = undefined;

          if (hasCharacters && hasNonCharacters) {
            // Both exist, 60% chance for character, 40% for non-character
            isCharacter = Math.random() < 0.6;
          } else if (hasCharacters) {
            isCharacter = true;
          }

          if (isCharacter && hasCharacters) {
            item = getRandomElement(game.characters[rarity]);
          } else if (hasNonCharacters && game.nonCharacterItems) {
            const nonCharItem = getRandomElement(
              game.nonCharacterItems[rarity],
            );
            item = nonCharItem.name;
            quantity =
              Math.floor(
                Math.random() *
                  (nonCharItem.maxQuantity - nonCharItem.minQuantity + 1),
              ) + nonCharItem.minQuantity;
          } else {
            // Fallback if no items exist for this rarity
            item = "Mystery Item";
            isCharacter = false;
          }

          results.push({ rarity, item, quantity, isCharacter });
          break;
        }
      }
    }

    return results;
  }

  private static async displayResults(
    message: Message,
    game: GachaGame,
    results: Array<{
      rarity: string;
      item: string;
      quantity?: number;
      isCharacter: boolean;
      isNew?: boolean;
      mergeCount?: number;
      totalQuantity?: number;
    }>,
    pullCount: number,
    totalPulls: number,
  ): Promise<void> {
    if (pullCount === 1) {
      const result = results[0];
      const rarityData = game.rarities[result.rarity];

      // Create base display text with enhanced formatting
      let displayText = `**PULL RESULT**\n\n`;
      displayText += `═══════════════════════\n`;
      displayText += `${rarityData.emoji} **${result.rarity}**\n`;
      displayText += `═══════════════════════\n\n`;

      if (result.isCharacter) {
        const displayName = InventoryManager.formatCharacterName(
          result.item,
          result.mergeCount || 0,
        );
        const isNewText = result.isNew ? " ✨ **NEW!**" : "";
        const mergeText = (result.mergeCount || 0) > 0 ? ` (Merged!)` : "";

        displayText += `👤 **${displayName}**${isNewText}${mergeText}\n\n`;

        // Add character quote if available
        const quotes = game.quotes[result.item];
        if (quotes && quotes.length > 0) {
          const quote = getRandomElement(quotes);
          displayText += `💬 *"${quote}"*\n\n`;
        }

        // Add special fanfare for high rarity characters
        const rarityOrder = Object.keys(game.rarities);
        const rarityIndex = rarityOrder.indexOf(result.rarity);

        if (rarityIndex === 0) {
          // Highest rarity
          if (result.isNew) {
            displayText += `🌟 **LEGENDARY PULL!**\n`;
            displayText += `*You've struck gold!*\n\n`;
          } else {
            displayText += `🌟 **LEGENDARY MERGE!**\n`;
            displayText += `*Your ${result.item} grows stronger!*\n\n`;
          }
        } else if (rarityIndex === 1) {
          // Second highest rarity
          displayText += `⭐ **Great pull!**\n`;
          displayText += `*Nice one!*\n\n`;
        } else {
          displayText += `*A solid addition!*\n\n`;
        }
      } else {
        // Non-character item with quantity
        const quantityText = result.quantity ? ` x${result.quantity}` : "";
        const totalText = result.totalQuantity
          ? ` (Total: ${result.totalQuantity})`
          : "";
        displayText += `📦 **${result.item}${quantityText}**${totalText}\n\n`;
        displayText += `*Useful resources!*\n\n`;
      }

      displayText += `${rarityData.color} **${game.displayName}**\n\n`;
      displayText += `📊 *Total Pulls: ${totalPulls}*`;

      await safeChannelSend(message.channel, displayText);
    } else {
      // Group results by rarity for better display
      const groupedResults: {
        [rarity: string]: Array<{
          item: string;
          quantity?: number;
          isCharacter: boolean;
          isNew?: boolean;
          mergeCount?: number;
          totalQuantity?: number;
        }>;
      } = {};

      results.forEach((result) => {
        if (!groupedResults[result.rarity]) {
          groupedResults[result.rarity] = [];
        }
        groupedResults[result.rarity].push({
          item: result.item,
          quantity: result.quantity,
          isCharacter: result.isCharacter,
          isNew: result.isNew,
          mergeCount: result.mergeCount,
          totalQuantity: result.totalQuantity,
        });
      });

      let displayText = `🎊 **10-PULL RESULTS**\n`;
      displayText += `**${game.displayName}**\n\n`;
      displayText += `════════════════════════════════\n\n`;

      // Display in rarity order (highest to lowest)
      const rarityOrder = Object.keys(game.rarities);

      for (const rarity of rarityOrder) {
        if (groupedResults[rarity]) {
          const rarityData = game.rarities[rarity];
          displayText += `${rarityData.color} **${rarity}** ${rarityData.emoji} (${groupedResults[rarity].length})\n`;
          displayText += `─────────────────────────\n`;

          groupedResults[rarity].forEach((item) => {
            if (item.isCharacter) {
              const displayName = InventoryManager.formatCharacterName(
                item.item,
                item.mergeCount || 0,
              );
              const isNewText = item.isNew ? " ✨" : "";
              const mergeText = (item.mergeCount || 0) > 0 ? " 🔄" : "";

              displayText += `👤 ${displayName}${isNewText}${mergeText}`;

              // Add a quote for characters if available
              const quotes = game.quotes[item.item];
              if (quotes && quotes.length > 0) {
                const quote = getRandomElement(quotes);
                displayText += `\n   💬 *"${quote}"*`;
              }

              displayText += "\n";
            } else {
              const quantityText = item.quantity ? ` x${item.quantity}` : "";
              const totalText = item.totalQuantity
                ? ` (${item.totalQuantity} total)`
                : "";
              displayText += `📦 ${item.item}${quantityText}${totalText}\n`;
            }
          });
          displayText += "\n";
        }
      }

      displayText += `════════════════════════════════\n\n`;

      // Check for special achievements
      const highestRarity = rarityOrder[0];
      const highestRarityItems = groupedResults[highestRarity] || [];
      const highestRarityCharacters = highestRarityItems.filter(
        (item) => item.isCharacter,
      );

      if (highestRarityCharacters.length > 0) {
        if (highestRarityCharacters.length > 1) {
          displayText += `🌟 **INCREDIBLE LUCK!**\n`;
          displayText += `Multiple legendary characters!\n`;
          displayText += `*The RNG gods smile upon you!*\n\n`;
        } else {
          displayText += `🎊 **AMAZING PULL!**\n`;
          displayText += `You got a legendary character!\n\n`;

          // Add a special quote for the legendary character
          const legChar = highestRarityCharacters[0];
          const quotes = game.quotes[legChar.item];
          if (quotes && quotes.length > 0) {
            const quote = getRandomElement(quotes);
            displayText += `💫 *"${quote}"* - ${legChar.item}\n`;
          }
          displayText += `*What a fantastic result!*\n\n`;
        }
      } else {
        displayText += `**Better luck next time!**\n`;
        displayText += `*The desire sensor is real...*\n`;
        displayText += `*But don't give up!*\n\n`;
      }

      displayText += `📊 *Total Pulls: ${totalPulls}*`;

      await safeChannelSend(message.channel, displayText);
    }
  }

  private static async displayInventorySummary(message: Message): Promise<void> {
    try {
      const inventory = InventoryManager.loadUserInventory(message.author.id);
      const stats = InventoryManager.getUserStats(message.author.id);

      if (stats.totalPulls === 0) {
        await safeChannelSend(
          message.channel,
          `📦 **YOUR GACHA COLLECTION** 📦\n\n` +
            `*Looks pretty empty in here...*\n\n` +
            `*Try doing some gacha pulls first!*\n` +
            `Just say "gacha" to get started!`,
        );
        return;
      }

      // Create summary message
      let summaryMessage = `**YOUR GACHA COLLECTION SUMMARY**\n\n`;
      summaryMessage += `📊 **OVERALL STATS**\n`;
      summaryMessage += `─────────────────────\n`;
      summaryMessage += `🎲 Total Pulls: ${stats.totalPulls}\n`;
      summaryMessage += `👤 Total Characters: ${stats.totalCharacters}\n`;
      summaryMessage += `📦 Total Consumables: ${stats.totalConsumables}\n`;
      summaryMessage += `⭐ Rare Characters: ${stats.rareCharacters}\n\n`;

      // Group data by game
      const charactersByGame: { [game: string]: typeof inventory.characters } = {};
      inventory.characters.forEach((char: any) => {
        if (!charactersByGame[char.game]) {
          charactersByGame[char.game] = [];
        }
        charactersByGame[char.game].push(char);
      });

      const consumablesByGame: { [game: string]: any[] } = {};
      Object.values(inventory.consumables).forEach((item: any) => {
        if (!consumablesByGame[item.game]) {
          consumablesByGame[item.game] = [];
        }
        consumablesByGame[item.game].push(item);
      });

      // Get all games
      const allGames = new Set([
        ...Object.keys(charactersByGame),
        ...Object.keys(consumablesByGame),
      ]);

      if (allGames.size === 0) {
        summaryMessage += `*No items collected yet!*`;
        await safeChannelSend(message.channel, summaryMessage);
        return;
      }

      // Add game summaries
      summaryMessage += `🎮 **GAMES OVERVIEW** (${allGames.size})\n`;
      summaryMessage += `════════════════════════════════\n`;

      const maxLength = 1800; // Leave buffer for Discord's 2000 char limit
      const gameEntries: string[] = [];
      
      Array.from(allGames).forEach((gameKey) => {
        const gameData = GACHA_GAMES[gameKey];
        if (!gameData) return;

        const characters = charactersByGame[gameKey] || [];
        const charStats = this.getCharacterStats(gameKey, characters);
        const consumables = consumablesByGame[gameKey] || [];

        let gameEntry = `🎯 **${gameData.displayName}**\n`;
        
        if (characters.length > 0) {
          const percentage = charStats.total > 0 
            ? ((charStats.unique / charStats.total) * 100).toFixed(1)
            : '0.0';
          gameEntry += `   👤 ${charStats.unique}/${charStats.total} characters (${percentage}%)\n`;
        } else {
          gameEntry += `   👤 No characters yet\n`;
        }

        if (consumables.length > 0) {
          const totalQuantity = consumables.reduce((sum, item) => sum + item.quantity, 0);
          gameEntry += `   📦 ${consumables.length} item types (${totalQuantity} total items)\n`;
        } else {
          gameEntry += `   📦 No items yet\n`;
        }

        gameEntry += `\n`;
        gameEntries.push(gameEntry);
      });

      // Check if we need to split the message
      let currentMessage = summaryMessage;
      const messages: string[] = [];

      gameEntries.forEach((gameEntry) => {
        if (currentMessage.length + gameEntry.length > maxLength) {
          // Save current message and start a new one
          messages.push(currentMessage);
          currentMessage = gameEntry;
        } else {
          currentMessage += gameEntry;
        }
      });

      // Add remaining content
      if (currentMessage !== summaryMessage) {
        messages.push(currentMessage);
      }

      // Add footer information
      const footerMessage = `\n💡 **Want to see specific details?**\n` +
        `🔸 For characters: "matsuda my gacha [game] characters"\n` +
        `🔸 For items: "matsuda my gacha [game] items"\n` +
        `🔸 Available games: ${Array.from(allGames).map(game => GACHA_GAMES[game]?.displayName).filter(Boolean).join(', ')}\n`;

      // If footer would make the last message too long, send it separately
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.length + footerMessage.length > maxLength) {
        messages.push(footerMessage);
      } else if (messages.length > 0) {
        messages[messages.length - 1] += footerMessage;
      } else {
        // Single message case
        currentMessage += footerMessage;
        messages.push(currentMessage);
      }

      // Send all messages
      for (let i = 0; i < messages.length; i++) {
        let messageToSend = messages[i];
        
        // Add page indicator if there are multiple messages
        if (messages.length > 1 && i < messages.length - 1) {
          messageToSend += `\n📄 *Page ${i + 1} of ${messages.length}*`;
        }
        
        await safeChannelSend(message.channel, messageToSend);
        
        // Small delay between messages to avoid rate limits
        if (i < messages.length - 1) {
          await delay(500);
        }
      }

    } catch (error) {
      console.error("Error displaying inventory summary:", error);
      await safeChannelSend(
        message.channel,
        `❌ **ERROR**\n\nCouldn't load your inventory!\n\n*Please try again in a moment.*`,
      );
    }
  }

  private static async displayGameInventory(message: Message, gameString: string, type: string): Promise<void> {
    try {
      const game = this.parseGameFromMacro(gameString);
      if (!game) {
        await safeChannelSend(
          message.channel,
          `❌ **UNKNOWN GAME**\n\n` +
            `I didn't recognize "${gameString}"!\n\n` +
            `**Available games:**\n` +
            `🔸 ZZZ/Zenless\n` +
            `🔸 Honkai/Star Rail\n` +
            `🔸 FEH/Fire Emblem\n` +
            `🔸 Genshin/Impact\n` +
            `🔸 Uma/Umamusume/Pretty Derby`,
        );
        return;
      }

      const inventory = InventoryManager.loadUserInventory(message.author.id);

      if (type === 'character') {
        await this.displayGameCharacters(message, game, inventory);
      } else if (type === 'item' || type === 'material') {
        await this.displayGameItems(message, game, inventory);
      } else {
        await safeChannelSend(
          message.channel,
          `❌ **INVALID TYPE**\n\n` +
            `Please specify either "characters" or "items"!\n\n` +
            `Example: "matsuda my gacha zzz characters"`
        );
      }
    } catch (error) {
      console.error("Error displaying game inventory:", error);
      await safeChannelSend(
        message.channel,
        `❌ **ERROR**\n\nSomething went wrong while checking your ${gameString} collection!`,
      );
    }
  }

  private static async displayGameCharacters(message: Message, game: GachaGame, inventory: any): Promise<void> {
    // Filter characters for this game
    const gameCharacters = inventory.characters.filter((char: any) => char.game === game.name);

    if (gameCharacters.length === 0) {
      await safeChannelSend(
        message.channel,
        `📦 **${game.displayName.toUpperCase()} CHARACTERS** 📦\n\n` +
          `*No characters from ${game.displayName} yet!*\n\n` +
          `Try doing some gacha pulls first!\n` +
          `Say "matsuda gacha ${game.name} 10" to do 10 pulls!`,
      );
      return;
    }

    // Get character stats
    const charStats = this.getCharacterStats(game.name, gameCharacters);

    // Create header message
    let headerMessage = `👤 **${game.displayName.toUpperCase()} CHARACTERS** 👤\n\n`;
    
    // Collection progress
    const percentage = charStats.total > 0 
      ? ((charStats.unique / charStats.total) * 100).toFixed(1)
      : '0.0';
    headerMessage += `📊 **COLLECTION PROGRESS**\n`;
    headerMessage += `${charStats.unique}/${charStats.total} characters (${percentage}%)\n`;

    // Progress bar
    const progressBarLength = 20;
    const filledLength = Math.round((charStats.unique / charStats.total) * progressBarLength);
    const progressBar = "█".repeat(filledLength) + "░".repeat(progressBarLength - filledLength);
    headerMessage += `${progressBar}\n\n`;

    // Sort characters by rarity (highest first) then by name
    const rarityOrder = Object.keys(game.rarities);
    gameCharacters.sort((a: any, b: any) => {
      const aIndex = rarityOrder.indexOf(a.rarity);
      const bIndex = rarityOrder.indexOf(b.rarity);
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.name.localeCompare(b.name);
    });

    // Group by rarity for display
    const charactersByRarity: { [rarity: string]: any[] } = {};
    gameCharacters.forEach((char: any) => {
      if (!charactersByRarity[char.rarity]) {
        charactersByRarity[char.rarity] = [];
      }
      charactersByRarity[char.rarity].push(char);
    });

    // Send header first
    await safeChannelSend(message.channel, headerMessage);

    // Build character messages with length checking
    const messages: string[] = [];
    let currentMessage = "";
    const maxLength = 1800; // Leave some buffer for Discord's 2000 char limit

    // Display characters by rarity
    Object.keys(game.rarities).forEach(rarity => {
      const characters = charactersByRarity[rarity];
      if (!characters || characters.length === 0) return;

      const rarityInfo = game.rarities[rarity];
      const rarityHeader = `${rarityInfo.emoji} **${rarity}** (${characters.length})\n═══════════════════════════════\n`;
      
      // Check if we need to start a new message for this rarity
      if (currentMessage.length + rarityHeader.length > maxLength) {
        if (currentMessage.trim()) {
          messages.push(currentMessage.trim());
        }
        currentMessage = rarityHeader;
      } else {
        currentMessage += rarityHeader;
      }

      characters.forEach((char: any) => {
        const displayName = InventoryManager.formatCharacterName(char.name, char.mergeCount);
        const obtainedDate = new Date(char.obtainedAt).toLocaleDateString();
        let characterEntry = `${rarityInfo.color} ${displayName}\n`;
        characterEntry += `   📅 Obtained: ${obtainedDate}\n`;
        if (char.mergeCount > 0) {
          characterEntry += `   ⭐ Merge Level: +${char.mergeCount}\n`;
        }
        characterEntry += `\n`;

        // Check if adding this character would exceed the limit
        if (currentMessage.length + characterEntry.length > maxLength) {
          // Save current message and start a new one
          if (currentMessage.trim()) {
            messages.push(currentMessage.trim());
          }
          currentMessage = characterEntry;
        } else {
          currentMessage += characterEntry;
        }
      });
    });

    // Add any remaining content
    if (currentMessage.trim()) {
      messages.push(currentMessage.trim());
    }

    // Send all character messages
    for (let i = 0; i < messages.length; i++) {
      let messageToSend = messages[i];
      
      // Add page indicator if there are multiple messages
      if (messages.length > 1) {
        messageToSend += `\n\n📄 *Page ${i + 1} of ${messages.length}*`;
      }
      
      await safeChannelSend(message.channel, messageToSend);
      
      // Small delay between messages to avoid rate limits
      if (i < messages.length - 1) {
        await delay(500);
      }
    }

    // Send footer message
    const footerMessage = `\n💡 **Tip:** Use "matsuda gacha ${game.name} 10" to get more characters!`;
    await safeChannelSend(message.channel, footerMessage);
  }

  private static async displayGameItems(message: Message, game: GachaGame, inventory: any): Promise<void> {
    // Filter consumables for this game
    const gameItems = Object.values(inventory.consumables).filter((item: any) => item.game === game.name);

    if (gameItems.length === 0) {
      await safeChannelSend(
        message.channel,
        `📦 **${game.displayName.toUpperCase()} ITEMS** 📦\n\n` +
          `*No items from ${game.displayName} yet!*\n\n` +
          `Try doing some gacha pulls first!\n` +
          `Say "matsuda gacha ${game.name} 10" to do 10 pulls!`,
      );
      return;
    }

    // Create header message
    let headerMessage = `📦 **${game.displayName.toUpperCase()} ITEMS** 📦\n\n`;

    // Calculate total items
    const totalQuantity = gameItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    headerMessage += `📊 **ITEM SUMMARY**\n`;
    headerMessage += `🔹 ${gameItems.length} different item types\n`;
    headerMessage += `🔹 ${totalQuantity} total items\n\n`;

    // Sort items by rarity (highest first) then by name
    const rarityOrder = Object.keys(game.rarities);
    gameItems.sort((a: any, b: any) => {
      const aIndex = rarityOrder.indexOf(a.rarity);
      const bIndex = rarityOrder.indexOf(b.rarity);
      if (aIndex !== bIndex) return aIndex - bIndex;
      return a.name.localeCompare(b.name);
    });

    // Group by rarity for display
    const itemsByRarity: { [rarity: string]: any[] } = {};
    gameItems.forEach((item: any) => {
      if (!itemsByRarity[item.rarity]) {
        itemsByRarity[item.rarity] = [];
      }
      itemsByRarity[item.rarity].push(item);
    });

    // Send header first
    await safeChannelSend(message.channel, headerMessage);

    // Build item messages with length checking
    const messages: string[] = [];
    let currentMessage = "";
    const maxLength = 1800; // Leave some buffer for Discord's 2000 char limit

    // Display items by rarity
    Object.keys(game.rarities).forEach(rarity => {
      const items = itemsByRarity[rarity];
      if (!items || items.length === 0) return;

      const rarityInfo = game.rarities[rarity];
      const rarityHeader = `${rarityInfo.emoji} **${rarity}** (${items.length} types)\n═══════════════════════════════\n`;
      
      // Check if we need to start a new message for this rarity
      if (currentMessage.length + rarityHeader.length > maxLength) {
        if (currentMessage.trim()) {
          messages.push(currentMessage.trim());
        }
        currentMessage = rarityHeader;
      } else {
        currentMessage += rarityHeader;
      }

      items.forEach((item: any) => {
        const itemEntry = `${rarityInfo.color} ${item.name}\n   📦 Quantity: ${item.quantity}\n\n`;

        // Check if adding this item would exceed the limit
        if (currentMessage.length + itemEntry.length > maxLength) {
          // Save current message and start a new one
          if (currentMessage.trim()) {
            messages.push(currentMessage.trim());
          }
          currentMessage = itemEntry;
        } else {
          currentMessage += itemEntry;
        }
      });
    });

    // Add any remaining content
    if (currentMessage.trim()) {
      messages.push(currentMessage.trim());
    }

    // Send all item messages
    for (let i = 0; i < messages.length; i++) {
      let messageToSend = messages[i];
      
      // Add page indicator if there are multiple messages
      if (messages.length > 1) {
        messageToSend += `\n\n📄 *Page ${i + 1} of ${messages.length}*`;
      }
      
      await safeChannelSend(message.channel, messageToSend);
      
      // Small delay between messages to avoid rate limits
      if (i < messages.length - 1) {
        await delay(500);
      }
    }

    // Send footer message
    const footerMessage = `\n💡 **Tip:** Use "matsuda gacha ${game.name} 10" to get more items!`;
    await safeChannelSend(message.channel, footerMessage);
  }

  private static getCharacterStats(
    gameKey: string,
    ownedCharacters: any[],
  ): { unique: number; total: number } {
    const gameData = GACHA_GAMES[gameKey];
    if (!gameData) return { unique: 0, total: 0 };

    // Count total available characters across all rarities
    let totalAvailable = 0;
    Object.values(gameData.characters).forEach((charactersInRarity) => {
      totalAvailable += charactersInRarity.length;
    });

    // Count unique characters owned (by name, not merges)
    const uniqueOwnedNames = new Set(ownedCharacters.map((char) => char.name));
    const uniqueOwned = uniqueOwnedNames.size;

    return { unique: uniqueOwned, total: totalAvailable };
  }
}
