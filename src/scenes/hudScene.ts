import { levels } from '../config/levels';
import eventCenter, { ClockEvents, GameplayBusinessEvents, GameplayEvents, GameplayRandomEvents, UIEvents } from '../events/eventCenter';
import { progressMonth } from '../logic/progression';
import { getGameWidth, getGameHeight, getColorInt} from '../helpers';
import { BaseScene } from './baseScene';
import { colorPalette } from '../../assets/colorPalette';
import { gameConfig } from '../config/game';
import { dialogModal } from '../ui/dialogModal';

const sceneConfig: Phaser.Types.Scenes.SettingsConfig = {
  active: false,
  key: 'HUDScene',
};

export class HUDScene extends BaseScene {
  constructor() {
    super(sceneConfig);
  }

  private dateText: Phaser.GameObjects.Text;
  private cashText: Phaser.GameObjects.Text;
  private costText: Phaser.GameObjects.Text;
  private profitText: Phaser.GameObjects.Text;
  private companyNameText: Phaser.GameObjects.Text;

  private customerText: Phaser.GameObjects.Text;

  public init(): void {
    console.log("HUDScene init");
    this.GameState.updateGameState();
    if (this.GameState.Game.getIsPaused() && !this.GameState.Game.getIsNewGame()) {
      console.log("Unpausing!")
      this.GameState.Game.unPauseClock();
    }
  }

  public create(): void {
    // Menu Bar
    this.add.rectangle(0, getGameHeight(this) - 40, getGameWidth(this), 40, getColorInt(colorPalette.periwinkle)).setOrigin(0, 0);
    this.dateText = this.add.text(getGameWidth(this) - 216, getGameHeight(this) - 28, this.GameState.Game.getDateString());
    this.companyNameText = this.add.text(30, getGameHeight(this) - 28, this.GameState.Game.getName());

    // Create a text object to display the money
    this.profitText = this.add.text(50, 120, 'Profit ' + this.GameState.Game.getProfit());
    this.cashText = this.add.text(50, 140, 'Cash ' + this.GameState.Game.getCash());
    this.costText = this.add.text(50, 160, 'Cost ' + this.GameState.Game.getCosts());

    // Create a text object to display the customer count
    this.customerText = this.add.text(50, 180, 'Customers ' + this.GameState.Game.getCustomers());

    // Evey 5 seconds update the time
    this.time.addEvent({
      delay: gameConfig.dayLength,
      callback: this.updateDate,
      callbackScope: this,
      loop: true,
    });
  
    eventCenter.on(ClockEvents.CLOCK_PAUSE, () => this.GameState.Game.pauseClock(), this);
    
    eventCenter.on(ClockEvents.CLOCK_RESUME, () => this.GameState.Game.unPauseClock(), this);
    
    eventCenter.on(GameplayEvents.GAMEPLAY_COMPLETE_LEVEL_INTRO, ({ levelNumber }) => { this.GameState.Game.completeLevelIntro(levelNumber); }, this);

    eventCenter.on(GameplayEvents.GAMEPLAY_GAME_UPDATED, () => {
      this.GameState.updateGameState();
    })

    eventCenter.on(ClockEvents.CLOCK_MONTH_END, () => {
      progressMonth(this.GameState.Game, levels[this.GameState.Game.getCurrentLevel()]);

      this.cashText.setText('Cash ' + this.GameState.Game.getCash());
      this.customerText.setText('Customers ' + this.GameState.Game.getCustomers());
      this.costText.setText('Cost ' + this.GameState.Game.getCosts());
      this.profitText.setText('Profit ' + this.GameState.Game.getProfit());
    })

    eventCenter.on(GameplayRandomEvents.RANDOM_EVENT, (randomEvent: EventItem) => {
      console.log("An event occurred!");
      dialogModal(this, [randomEvent.name, randomEvent.description], () => {
        this.GameState.Game.handleEventConsequence(randomEvent.consequence)
        eventCenter.emit(ClockEvents.CLOCK_RESUME);
        this.cashText.setText('Cash ' + this.GameState.Game.getCash());
        this.customerText.setText('Customers ' + this.GameState.Game.getCustomers());
        this.profitText.setText('Profit ' + this.GameState.Game.getProfit());
      });
    })
  }

  private updateDate(): void {
    this.GameState.Game.updateDate();

    this.dateText.setText(this.GameState.Game.getDateString());
  }
}
