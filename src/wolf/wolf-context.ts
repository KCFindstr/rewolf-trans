import { PathResolver } from './path-resolver';

interface WolfContextType {
  readEncoding: string;
  writeEncoding: string;
  pathResolver: PathResolver;
}

// Singleton
export const WolfContext: WolfContextType = {
  readEncoding: 'SHIFT_JIS',
  writeEncoding: 'GBK',
  pathResolver: null,
};
