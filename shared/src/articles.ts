import { IMG } from "./images";

export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string; cite?: string }
  | { type: "list"; items: string[] }
  | { type: "tip"; title: string; text: string };

export type Article = {
  slug: string;
  title: string;
  dek: string;
  category: "Sleep hygiene" | "Choosing well" | "Body & rest" | "Together" | "The science";
  author: string;
  date: string;
  readMins: number;
  image: string;
  imageAlt: string;
  related?: string[]; // product slugs
  body: Block[];
};

export const ARTICLES: Article[] = [
  {
    slug: "the-evening-ritual",
    title: "The evening ritual: an hour that decides the night",
    dek: "Deep sleep rarely begins at the pillow. It begins with the light you choose, the warmth you keep and the thoughts you set down an hour before.",
    category: "Sleep hygiene",
    author: "Dr. Kavya Menon, Sleep Physician",
    date: "2026-09-12",
    readMins: 6,
    image: IMG.sleepMoody,
    imageAlt: "Someone asleep in soft, low light",
    related: ["signature", "cirrus"],
    body: [
      { type: "p", text: "We tend to think of sleep as something that happens to us the moment we close our eyes. In truth, the body starts preparing for rest long before: core temperature begins to fall, melatonin rises as light fades, and the mind slowly loosens its grip on the day. An evening ritual simply gives that process room to happen." },
      { type: "h2", text: "Dim the lights, and mean it" },
      { type: "p", text: "Bright overhead light, especially the cool, blue-rich light of screens, tells the brain it is still daytime. In the last hour before bed, switch to low, warm lamps placed below eye level. If you must use a phone, turn the brightness right down and hold it further away than feels natural." },
      { type: "tip", title: "Try this tonight", text: "Set a quiet alarm for sixty minutes before your ideal bedtime. When it sounds, turn off the big lights. Nothing else has to change on the first night." },
      { type: "h2", text: "Cool the room, warm the body" },
      { type: "p", text: "Most people sleep best in a room between 18 and 22°C. A warm bath or shower an hour before bed helps, too: as you step out, blood rushes to the skin and your core temperature drops, which is exactly the signal your body uses to begin sleep." },
      { type: "quote", text: "The warm bath works not because it warms you, but because of how quickly it lets you cool.", cite: "Dr. Kavya Menon" },
      { type: "h2", text: "Put the day somewhere" },
      { type: "p", text: "A racing mind is the most common reason we lie awake. Keep a notebook by the bed and write down tomorrow's three most important tasks, plus anything still worrying you. It sounds too simple to work, yet studies of pre-sleep journalling show people fall asleep noticeably faster." },
      { type: "list", items: ["Low, warm light from an hour before bed", "A room between 18 and 22°C", "A warm shower, then a cool room", "Three lines in a notebook", "The same bedtime, even on Saturdays"] },
      { type: "p", text: "None of this demands perfection. Pick one element, repeat it for a week, and let it become the cue your body waits for." },
    ],
  },
  {
    slug: "how-to-choose-firmness",
    title: "Plush, medium or firm? How to choose, honestly",
    dek: "Firmness is the most personal thing about a mattress, and the most misunderstood. Here is how your position, frame and temperature change the answer.",
    category: "Choosing well",
    author: "Arjun Rao, Head of Sleep Guidance",
    date: "2026-08-28",
    readMins: 7,
    image: IMG.tufted,
    imageAlt: "A tufted headboard above crisp white bedding",
    related: ["cirrus", "signature", "atelier"],
    body: [
      { type: "p", text: "Ask ten people what 'medium' feels like and you'll hear ten answers. Firmness is felt through your own body weight, your sleeping position and even how warm the room is. So rather than chasing a number, it helps to understand what each part of your body needs." },
      { type: "h2", text: "Start with how you sleep" },
      { type: "list", items: ["Side sleepers need the shoulder and hip to sink so the spine stays straight: usually plush to medium.", "Back sleepers need the lower back supported without the hips dropping: medium to medium-firm.", "Stomach sleepers need the hips held level to protect the lower back: medium-firm to firm.", "Combination sleepers do best on something responsive that is easy to turn on: medium."] },
      { type: "h2", text: "Then consider your frame" },
      { type: "p", text: "A lighter body presses less deeply, so a mattress will feel firmer to them; a broader frame sinks further and often feels more comfortable with extra support beneath. As a rule of thumb, move one step softer if you're petite and one step firmer if you're broad." },
      { type: "tip", title: "The ten-minute test", text: "Lie in your real sleeping position for at least ten minutes. The first minute tells you about the top layer; the tenth tells you about support." },
      { type: "h2", text: "Why your first week is misleading" },
      { type: "p", text: "Muscles that have spent years compensating for a sagging mattress need time to relax into proper alignment. Many of our guests feel the difference only after two or three weeks, which is precisely why our trial lasts one hundred nights." },
      { type: "quote", text: "The right mattress should disappear the moment you lie down. If you're thinking about it at 3am, it isn't right yet.", cite: "Arjun Rao" },
    ],
  },
  {
    slug: "sleeping-with-back-pain",
    title: "Waking without the ache: sleep and the lower back",
    dek: "Morning stiffness is often a support problem, not an age problem. A physiotherapist explains alignment, and what to change first.",
    category: "Body & rest",
    author: "Nisha Varghese, Physiotherapist",
    date: "2026-08-10",
    readMins: 8,
    image: IMG.sleepMono,
    imageAlt: "A person resting deeply in white bedding",
    related: ["signature", "sovereign"],
    body: [
      { type: "p", text: "If you wake with a stiff lower back that eases within half an hour of moving, your night is the first place to look. During sleep, the muscles that normally protect the spine switch off, so the mattress becomes the only thing holding you in line for seven or eight hours." },
      { type: "h2", text: "What good alignment looks like" },
      { type: "p", text: "On your side, a line drawn from the middle of your head through your breastbone to your pelvis should be straight and roughly parallel with the bed. On your back, the gentle curve of the lower back should be filled, not collapsed into and not arched over." },
      { type: "h2", text: "Too soft, or too firm?" },
      { type: "list", items: ["Too soft: the hips sink below the shoulders and the lower back bends into a hammock.", "Too firm: pressure builds at the hip and shoulder, you toss and turn, and muscles never fully relax.", "Just right: even pressure along the body, and the spine held in its natural shape."] },
      { type: "tip", title: "A pillow between the knees", text: "Side sleepers with back pain often find instant relief from a slim pillow between the knees, which stops the upper leg pulling the pelvis out of line." },
      { type: "p", text: "Zoned support, firmer beneath the hips and softer at the shoulders, is designed precisely for this. If pain persists for more than a few weeks, or wakes you at night, please see a doctor: a new mattress is support, not treatment." },
    ],
  },
  {
    slug: "sleeping-well-together",
    title: "Two sleepers, one bed: sleeping well together",
    dek: "Different bedtimes, different temperatures, one restless leg. How couples can share a bed and still wake restored.",
    category: "Together",
    author: "Meera Nair, Co-founder",
    date: "2026-07-22",
    readMins: 5,
    image: IMG.elegant,
    imageAlt: "An elegant bedroom with two sets of pillows",
    related: ["signature", "cirrus"],
    body: [
      { type: "p", text: "Research consistently finds that couples prefer sleeping together, and consistently finds that they sleep a little worse because of it. The good news is that most of the disturbance comes from three things you can change: movement, temperature and timing." },
      { type: "h2", text: "Isolate the movement" },
      { type: "p", text: "Individually wrapped coils move independently, so one person turning over doesn't send a ripple across the bed. If one of you rises early, this matters more than anything else." },
      { type: "h2", text: "Two duvets, one bed" },
      { type: "p", text: "The Scandinavian habit of two single duvets solves the midnight tug-of-war and lets a warm sleeper and a cold sleeper each choose their own weight. It looks beautiful folded at the foot of the bed, too." },
      { type: "tip", title: "Meet in the middle", text: "If your bedtimes differ, agree on a shared wind-down: the early sleeper reads in bed with a warm lamp while the late sleeper finishes elsewhere, then joins quietly." },
      { type: "p", text: "Snoring deserves a mention: if it is loud and nightly, especially with pauses in breathing, it's worth a conversation with a doctor about sleep apnoea." },
    ],
  },
  {
    slug: "why-we-sleep-hot",
    title: "Why we sleep hot, and how to stay cool until dawn",
    dek: "Waking at 3am, too warm, duvet on the floor? It's a common story in Indian summers. Here's what's happening and what helps.",
    category: "The science",
    author: "Dr. Kavya Menon, Sleep Physician",
    date: "2026-06-30",
    readMins: 6,
    image: IMG.brightRoom,
    imageAlt: "A bright, airy bedroom with white bedding",
    related: ["lumen", "atelier"],
    body: [
      { type: "p", text: "Your core temperature naturally falls through the night, reaching its lowest point a couple of hours before you wake. Anything that traps heat around you (dense foams, synthetic bedding, a warm room) fights that fall, and the body responds by waking you to throw off the covers." },
      { type: "h2", text: "Materials matter" },
      { type: "list", items: ["Natural latex has an open cell structure that lets air move freely.", "Wool is surprisingly cooling: it wicks moisture away from the skin.", "Phase-change gels absorb heat as you first lie down.", "Linen and Tencel™ sheets feel cool and dry against the skin."] },
      { type: "tip", title: "Cool your feet", text: "Leaving the feet uncovered helps the body shed heat quickly. It's one of the simplest ways to fall asleep faster on a warm night." },
      { type: "p", text: "Set the air conditioner a little warmer and let the bed do more of the work: guests often tell us they can run it at 26°C instead of 22°C once their mattress breathes properly." },
    ],
  },
  {
    slug: "the-science-of-sleep-cycles",
    title: "Ninety minutes at a time: the science of sleep cycles",
    dek: "Why eight hours sometimes leaves you groggy and six can leave you fresh, and how to use cycles to wake gently.",
    category: "The science",
    author: "Dr. Kavya Menon, Sleep Physician",
    date: "2026-06-04",
    readMins: 5,
    image: IMG.moon,
    imageAlt: "The full moon against a dark sky",
    related: ["signature"],
    body: [
      { type: "p", text: "Sleep isn't one long, even state. Through the night we move in cycles of roughly ninety minutes, from light sleep into deep, slow-wave sleep, and back up into dreaming REM sleep. Early cycles hold more deep sleep; later ones more dreaming." },
      { type: "h2", text: "Why waking time matters" },
      { type: "p", text: "Wake at the end of a cycle, when sleep is light, and you surface easily. Wake from deep sleep and you feel heavy and slow, a state researchers call sleep inertia, which can last half an hour." },
      { type: "tip", title: "Count backwards", text: "Decide when you need to wake, count back in 90-minute steps, and add fifteen minutes to fall asleep. Our sleep calculator does the arithmetic for you." },
      { type: "p", text: "Cycles vary between people and from night to night, so treat the ninety-minute rule as a guide rather than a stopwatch. Consistency, going to bed and waking at the same times, matters most of all." },
    ],
  },
];

export const getArticle = (list: Article[], slug: string) => list.find((a) => a.slug === slug);
