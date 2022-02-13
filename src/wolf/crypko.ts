import { WOLF_DAT } from '../constants';

export class Crypko {
  protected readonly isEncrypted_: boolean = false;
  protected readonly cryptHeader_: Buffer;
  protected readonly seeds_: number[];

  constructor(protected readonly data_: Buffer, seedIndices_?: number[]) {
    if (!data_ || !seedIndices_) {
      return;
    }
    if (data_[0] !== 0) {
      this.isEncrypted_ = true;
      this.cryptHeader_ = this.data_.slice(0, WOLF_DAT.CRYPT_HEADER_SIZE);
      this.seeds_ = seedIndices_.map((i) => this.cryptHeader_[i]);
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

  encrypt(data = this.data_) {
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
