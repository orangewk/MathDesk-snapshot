export interface BgmTrack {
  id: string;
  title: string;
  artist: string;
  file: string;
}

export const bgmTracks: BgmTrack[] = [
  { id: 'saa-doko-a', title: 'Where Shall We Go', artist: 'Tsuta', file: '/bgm/saa-doko-e-ikou-inst-a.mp3' },
  { id: 'saa-doko-b', title: 'Wherever We Wander', artist: 'Tsuta', file: '/bgm/saa-doko-e-ikou-inst-b.mp3' },
  { id: 'tunnel-a', title: 'Beyond the Tunnel', artist: 'Tsuta', file: '/bgm/tunnel-no-mukou-ni-a.mp3' },
  { id: 'tunnel-b', title: 'Light at the End', artist: 'Tsuta', file: '/bgm/tunnel-no-mukou-ni-b.mp3' },
  { id: 'touge-a', title: 'From the Pass to the Sea', artist: 'Tsuta', file: '/bgm/touge-kara-umi-e-inst-a.mp3' },
  { id: 'touge-b', title: 'Mountain Road, Ocean Breeze', artist: 'Tsuta', file: '/bgm/touge-kara-umi-e-inst-b.mp3' },
  { id: 'orange-a', title: 'Orange Horizon', artist: 'Tsuta', file: '/bgm/orange-no-suiheisen-inst-a.mp3' },
  { id: 'orange-b', title: 'Tangerine Skyline', artist: 'Tsuta', file: '/bgm/orange-no-suiheisen-inst-b.mp3' },
];
