import * as fs from "fs";
import * as path from "path";

export interface CharacterEntry {
  name: string;
  rarity: string;
  game: string;
  mergeCount: number; // 0 = base, 1+ = merged
  obtainedAt: Date;
}

export interface ConsumableEntry {
  name: string;
  rarity: string;
  game: string;
  quantity: number;
}

export interface UserInventory {
  userId: string;
  characters: CharacterEntry[];
  consumables: { [itemName: string]: ConsumableEntry };
  totalPulls: number;
  lastUpdated: Date;
}

const INVENTORY_DIR = path.join(__dirname, "..", "..", "user_inventories");

export class InventoryManager {
  static ensureInventoryDir(): void {
    if (!fs.existsSync(INVENTORY_DIR)) {
      fs.mkdirSync(INVENTORY_DIR, { recursive: true });
    }
  }

  static getInventoryPath(userId: string): string {
    return path.join(INVENTORY_DIR, `${userId}.json`);
  }

  static loadUserInventory(userId: string): UserInventory {
    this.ensureInventoryDir();
    const inventoryPath = this.getInventoryPath(userId);

    if (!fs.existsSync(inventoryPath)) {
      // Create new inventory for user
      const newInventory: UserInventory = {
        userId,
        characters: [],
        consumables: {},
        totalPulls: 0,
        lastUpdated: new Date(),
      };
      this.saveUserInventory(newInventory);
      return newInventory;
    }

    try {
      const data = fs.readFileSync(inventoryPath, "utf8");
      const inventory: UserInventory = JSON.parse(data);

      // Convert date strings back to Date objects
      inventory.lastUpdated = new Date(inventory.lastUpdated);
      inventory.characters.forEach((char) => {
        char.obtainedAt = new Date(char.obtainedAt);
      });

      return inventory;
    } catch (error) {
      console.error(`Error loading inventory for user ${userId}:`, error);
      // Return fresh inventory if corrupted
      return {
        userId,
        characters: [],
        consumables: {},
        totalPulls: 0,
        lastUpdated: new Date(),
      };
    }
  }

  static saveUserInventory(inventory: UserInventory): void {
    this.ensureInventoryDir();
    const inventoryPath = this.getInventoryPath(inventory.userId);

    try {
      inventory.lastUpdated = new Date();
      fs.writeFileSync(inventoryPath, JSON.stringify(inventory, null, 2));
    } catch (error) {
      console.error(
        `Error saving inventory for user ${inventory.userId}:`,
        error,
      );
    }
  }

  static addCharacterToInventory(
    userId: string,
    characterName: string,
    rarity: string,
    game: string,
  ): { isNew: boolean; mergeCount: number } {
    const inventory = this.loadUserInventory(userId);

    // Check if character already exists
    const existingCharacter = inventory.characters.find(
      (char) => char.name === characterName && char.game === game,
    );

    if (existingCharacter) {
      // Character exists, increment merge count
      existingCharacter.mergeCount++;
      this.saveUserInventory(inventory);
      return { isNew: false, mergeCount: existingCharacter.mergeCount };
    } else {
      // New character, add to inventory
      const newCharacter: CharacterEntry = {
        name: characterName,
        rarity,
        game,
        mergeCount: 0,
        obtainedAt: new Date(),
      };
      inventory.characters.push(newCharacter);
      this.saveUserInventory(inventory);
      return { isNew: true, mergeCount: 0 };
    }
  }

  static addConsumableToInventory(
    userId: string,
    itemName: string,
    rarity: string,
    game: string,
    quantity: number,
  ): number {
    const inventory = this.loadUserInventory(userId);
    const itemKey = `${game}:${itemName}`;

    if (inventory.consumables[itemKey]) {
      // Item exists, add to quantity
      inventory.consumables[itemKey].quantity += quantity;
    } else {
      // New item, add to inventory
      inventory.consumables[itemKey] = {
        name: itemName,
        rarity,
        game,
        quantity,
      };
    }

    this.saveUserInventory(inventory);
    return inventory.consumables[itemKey].quantity;
  }

  static incrementPullCount(userId: string, pullCount: number): number {
    const inventory = this.loadUserInventory(userId);
    inventory.totalPulls += pullCount;
    this.saveUserInventory(inventory);
    return inventory.totalPulls;
  }

  static getUserStats(userId: string): {
    totalPulls: number;
    totalCharacters: number;
    totalConsumables: number;
    rareCharacters: number;
  } {
    const inventory = this.loadUserInventory(userId);

    const rareCharacters = inventory.characters.filter((char) => {
      // Count characters from highest rarities (first in the rarity list)
      return (
        char.rarity.includes("5-Star") ||
        char.rarity.includes("S-Rank") ||
        char.rarity.includes("3-Star")
      ); // For Umamusume
    }).length;

    const totalConsumableQuantity = Object.values(inventory.consumables).reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    return {
      totalPulls: inventory.totalPulls,
      totalCharacters: inventory.characters.length,
      totalConsumables: totalConsumableQuantity,
      rareCharacters,
    };
  }

  static formatCharacterName(
    characterName: string,
    mergeCount: number,
  ): string {
    if (mergeCount === 0) {
      return characterName;
    }
    return `${characterName}+${mergeCount}`;
  }
}
