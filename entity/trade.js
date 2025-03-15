export class Trade {
    constructor(player) {
      this.player = player;
      this.currency = player.currency || 0; // Player's currency
    }
  
    buyItem(item, vendor) {
      if (this.currency >= item.price) {
        this.currency -= item.price;
        this.player.inventory.add(item);
        console.log(`Bought ${item.name} for ${item.price}`);
      } else {
        console.log('Not enough currency.');
      }
    }
  
    sellItem(item, vendor) {
      if (this.player.inventory.remove(item)) {
        this.currency += item.sellPrice;
        console.log(`Sold ${item.name} for ${item.sellPrice}`);
      }
    }
  }