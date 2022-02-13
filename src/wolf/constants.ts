export const WOLF_JP_HEADER = Buffer.from([
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x57, 0x4f, 0x4c,
  0x46, 0x4d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x65, 0x05,
  0x00, 0x00, 0x00, 0x82, 0xc8, 0x82, 0xb5, 0x00,
]);
export const WOLF_EN_HEADER = Buffer.from([
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x57, 0x4f, 0x4c,
  0x46, 0x4d, 0x00, 0x00, 0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x65, 0x03,
  0x00, 0x00, 0x00, 0x4e, 0x6f, 0x00,
]);

export const WOLF_MAP = {
  EVENT_INDICATOR: 0x6f,
  EVENT_FINISH_INDICATOR: 0x66,
  EVENT_START: Buffer.from([0x39, 0x30, 0x00, 0x00]),
  EVENT_END: Buffer.from([0x00, 0x00, 0x00, 0x00]),
  COMMAND_END: Buffer.from([0x03, 0x00, 0x00, 0x00]),
  PAGE_INDICATOR: 0x79,
  PAGE_FINISH_INDICATOR: 0x70,
  PAGE_END: 0x7a,
  ROUTE_COMMAND_TERMINATOR: Buffer.from([0x01, 0x00]),
  MOVE_COMMAND_TERMINATOR: 0x01,
  COMMAND_TERMINATOR: 0x00,
};

export const WOLF_DAT = {
  SEED_INDICES: [0, 3, 6],
  HEADER: Buffer.from([
    0x00, 0x57, 0x00, 0x00, 0x4f, 0x4c, 0x00, 0x46, 0x4d, 0x00, 0xc1,
  ]),
  END: 0xc1,
  TYPE_SEPARATOR: Buffer.from([0xfe, 0xff, 0xff, 0xff]),
  STRING_START: 0x07d0,
  INT_START: 0x03e8,
  CRYPT_HEADER_SIZE: 10,
  DECRYPT_INTERVALS: [1, 2, 5],
};

export const WOLF_CE = {
  HEADER: Buffer.from([
    0x00, 0x57, 0x00, 0x00, 0x4f, 0x4c, 0x00, 0x46, 0x43, 0x00, 0x8f,
  ]),
  EVENT_MAGIC_NUMBER: Buffer.from([0x0a, 0x00, 0x00, 0x00]),
  INDICATOR1: 0x8e,
  INDICATOR2: 0x8f,
  INDICATOR3: 0x91,
  INDICATOR4: 0x92,
};

export const CTX = {
  STR: {
    MPS: 'MPS',
    DB: 'DB',
    CE: 'COMMONEVENT',
    DAT: 'GAMEDAT',
  },
  NUM: {
    MPS: 0,
    DB: 1,
    CE: 2,
    DAT: 3,
  },
};
