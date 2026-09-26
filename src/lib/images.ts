// Curated Unsplash photography. Every ID here was checked by eye for mood and subject.
const u = (id: string) => `https://images.unsplash.com/${id}`;

export const IMG = {
  // Bedrooms & suites
  suiteDusk: u("photo-1629140727571-9b5c6f6267b4"),
  suiteWarm: u("photo-1618773928121-c32242e63f39"),
  tufted: u("photo-1582582621959-48d27397dc69"),
  platform: u("photo-1617325247661-675ab4b64ae2"),
  elegant: u("photo-1616594039964-ae9021a400a0"),
  classic: u("photo-1505693416388-ac5ce068fe85"),
  whiteLux: u("photo-1512918728675-ed5a9ecdebfd"),
  minimal: u("photo-1586105251261-72a756497a11"),
  resort: u("photo-1611892440504-42a792e24d32"),
  hotel: u("photo-1631049035182-249067d7618e"),
  grandSuite: u("photo-1590490360182-c33d57733427"),
  darkWood: u("photo-1566665797739-1674de7a421a"),
  brightRoom: u("photo-1595526114035-0d45ed16cfbf"),
  // Textiles & detail
  cushion: u("photo-1616627561950-9f746e330187"),
  linen: u("photo-1528458909336-e7a0adfed0a5"),
  rail: u("photo-1558769132-cb1aea458c5e"),
  pillowWhite: u("photo-1629949009765-40fc74c9ec21"),
  pillowsBed: u("photo-1579656381226-5fc0f0100c3b"),
  // Craft & nature
  artisan: u("photo-1606722590583-6951b5ea92ad"),
  sheep: u("photo-1484557985045-edf25e08da73"),
  forest: u("photo-1441974231531-c6227db76b6e"),
  mist: u("photo-1470071459604-3b5ec3a7fe05"),
  field: u("photo-1500382017468-9049fed747ef"),
  moon: u("photo-1532693322450-2cb5c511067d"),
  stars: u("photo-1475274047050-1d0c0975c63e"),
  // Sleep
  sleepSoft: u("photo-1520206183501-b80df61043c2"),
  sleepMoody: u("photo-1531353826977-0941b4779a1c"),
  sleepMono: u("photo-1515894203077-9cd36032142f"),
  // Showrooms
  salon1: u("photo-1616486338812-3dadae4b4ace"),
  salon2: u("photo-1618220179428-22790b461013"),
  salon3: u("photo-1600607687939-ce8a6c25118c"),
  // Portraits
  p1: u("photo-1438761681033-6461ffad8d80"),
  p2: u("photo-1500648767791-00dcc994a43e"),
  p3: u("photo-1544005313-94ddf0286df2"),
  p4: u("photo-1506794778202-cad84cf45f1d"),
  p5: u("photo-1494790108377-be9c29b29330"),
  p6: u("photo-1534528741775-53994a69daeb"),
} as const;
