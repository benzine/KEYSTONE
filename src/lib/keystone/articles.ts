/** Journal article data — ported from the original page's ARTICLES array. */

export interface Article {
  cat: string;
  title: string;
  author: string;
  date: string;
  time: string;
  img: string;
  paras: string[];
  pull: string;
  rel: number[];
}

export const ARTICLES: Article[] = [
  {
    cat: "ESSAY",
    title: "The Case for Slower Houses",
    author: "MARCUS HALE",
    date: "NOV 2026",
    time: "12 MIN",
    img: "keystone-light",
    paras: [
      "The industry has optimized itself for speed. Faster permits, faster framing, faster finishes, faster disappointment. We have built houses in eleven months that their owners spent eleven years learning to forgive. Unexamined speed is the enemy. A house rushed through its decisions inherits them all, visible in the window that misses the evening sun and the hallway that leads nowhere in particular.",
      "Slowness, in our studio, is a discipline rather than a mood. It means the schematic sits on the wall for a week before anyone touches it. It means a window is argued about for three weeks and then built exactly right. Every change order we have ever absorbed traces back to a decision made faster than the question deserved.",
      "Patience pays out in ways you can count, in fewer change orders and materials chosen for their thirtieth year rather than their first photograph. Then it keeps paying, in a house that feels considered at every hand.",
    ],
    pull: "\u201CPatience is the presence of judgment.\u201D",
    rel: [1, 3],
  },
  {
    cat: "MATERIAL RESEARCH",
    title: "Travertine: A Stone That Remembers",
    author: "NINA PETROVA",
    date: "SEP 2026",
    time: "7 MIN",
    img: "keystone-travertine",
    paras: [
      "Travertine is limestone that grew in running water, and it never quite forgets the river. Its open pores record the spring that made it; honed rather than polished, the stone keeps those pores open and with them an honest relationship with weather. We specify Tivoli travertine for the same reason Rome did. It improves with rain and with decades of dinner parties.",
      "A polished stone denies time. A honed travertine takes its first scratch in the first month, its first wine ring in the first year, and by the tenth year has a surface that no factory could fake. Clients sometimes ask whether it will look worn. It will look lived-in.",
    ],
    pull: "\u201CEvery material keeps a diary. Honed travertine simply leaves its diary open.\u201D",
    rel: [0, 4],
  },
  {
    cat: "SUSTAINABILITY",
    title: "Passive Design Before Panels",
    author: "DANIEL REYES",
    date: "AUG 2026",
    time: "9 MIN",
    img: "keystone-cascadia",
    paras: [
      "There is a fashion in solving energy with equipment, panels on the roof and an app for everything. All of it works. Almost none of it works as cheaply, or as long, as orientation and mass. A south window computed against the winter sun is a furnace with no moving parts and a fifty-year warranty.",
      "Thermal mass is the quiet half of the equation. Twenty-four inches of earth wall, or a concrete floor slab left honest and sealed, charges all afternoon and pays the heat back all night. In our logging of Solstice Yard the modeled prediction and the thermometers agreed within a degree and a half. Through the first January the house held sixty-eight degrees at midnight with the fire unlit.",
    ],
    pull: "\u201CGeometry is the only HVAC with no maintenance schedule.\u201D",
    rel: [0, 2],
  },
  {
    cat: "CRAFT",
    title: "What 200 Walkthroughs Taught Us About Light",
    author: "ELENA V\u00C1SQUEZ",
    date: "JUN 2026",
    time: "8 MIN",
    img: "keystone-meridian",
    paras: [
      "We started standing in unfinished rooms at six in the morning and again at six in the evening, notebooks in hand, dust everywhere. Two hundred walkthroughs later, the lesson is embarrassingly simple. A window is a framing device. It decides what the room believes is important.",
      "Proportion does the framing, and proportion is learnable. A tall narrow window makes the garden a portrait; a wide low one makes the horizon a promise. The window seat at Meridian House exists because a bare floor at four in the afternoon told us someone would want to sit exactly there, and someone always does.",
    ],
    pull: "\u201CLight is a material. Everything else is just furniture for it.\u201D",
    rel: [0, 3],
  },
  {
    cat: "DESIGN",
    title: "The Body Sets the Grid",
    author: "THEO BRANDT",
    date: "MAR 2026",
    time: "10 MIN",
    img: "keystone-plate",
    paras: [
      "Every proportion we use traces back to a body moving through a room. The grid on our drawings is the distance of a comfortable reach and the width of two people passing. When a plan feels right, it is usually because it is agreeing with a skeleton.",
      "And we still draw the first lines by hand, because the hand is slower than the software and speed is where the errors of feeling enter. A pencil enforces commitment. It also enforces honesty about which lines you actually believe.",
    ],
    pull: "\u201CA module is a promise about people. Break it only for a better promise.\u201D",
    rel: [0, 2],
  },
];
