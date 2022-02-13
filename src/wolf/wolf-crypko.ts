import { ICrypko } from '../interfaces';
import { WOLF_DAT } from './constants';

export class WolfCrypko implements ICrypko {
  protected isEncrypted_ = false;
  protected cryptHeader_: Buffer;
  protected seeds_: number[];
  protected data_: Buffer;

  constructor(protected readonly seedIndices_?: number[]) {}

  setData(data: Buffer): void {
    this.data_ = data;
    if (!this.data_ || !this.seedIndices_) {
      return;
    }
    if (this.data_[0] !== 0) {
      this.isEncrypted_ = true;
      this.cryptHeader_ = this.data_.slice(0, WOLF_DAT.CRYPT_HEADER_SIZE);
      this.seeds_ = this.seedIndices_.map((i) => this.cryptHeader_[i]);
      this.data_ = this.data_.slice(WOLF_DAT.CRYPT_HEADER_SIZE);
    }
  }

  get isEncrypted() {
    return this.isEncrypted_;
  }

  decrypt() {
    if (!this.isEncrypted) {
      return this.data_;
    }
    crypt(this.data_, this.seeds_);
    return this.data_;
  }

  encrypt(data: Buffer) {
    if (!this.isEncrypted) {
      return data;
    }
    const result = Buffer.concat([this.cryptHeader_, data]);
    crypt(result.slice(this.cryptHeader_.length), this.seeds_);
    return result;
  }
}

export function crypt(data: Buffer, seeds: number[]) {
  for (const i in seeds) {
    let seed = seeds[i];
    for (let j = 0; j < data.length; j += WOLF_DAT.DECRYPT_INTERVALS[i]) {
      seed = (seed * 0x343fd + 0x269ec3) & 0xffffffff;
      data[j] ^= (seed >> 28) & 0x7;
    }
  }
}
