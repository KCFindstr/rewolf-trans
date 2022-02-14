import { RewtGame } from '../archive/rewt-game';
import { MahjongGame } from '../mahjong/mahjong-game';
import { WolfGame } from '../wolf/wolf-game';

export type RewtGameConstructor = new (dataDir: string) => RewtGame;

export class RewtRegistry {
  private readonly gameRegistry_: Record<string, RewtGameConstructor> = {};

  public registerGame(name: string, clazz: RewtGameConstructor) {
    name = name.toLowerCase();
    this.gameRegistry_[name] = clazz;
  }

  public hasGame(name: string): boolean {
    name = name.toLowerCase();
    return !!this.gameRegistry_[name];
  }

  public getGame(name: string): RewtGameConstructor {
    name = name.toLowerCase();
    const ret = this.gameRegistry_[name];
    if (!ret) {
      throw new Error(`No game registered with name ${name}.`);
    }
    return ret;
  }
}

export const GlobalRegistry = new RewtRegistry();

GlobalRegistry.registerGame('wolf', WolfGame);
GlobalRegistry.registerGame('mahjong', MahjongGame);
