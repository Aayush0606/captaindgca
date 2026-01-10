import { Question } from "@/types/questions";

export const sampleQuestions: Question[] = [
  // Instruments
  {
    id: "inst-001",
    question: "What is the purpose of the pitot tube in an aircraft?",
    options: [
      "To measure static pressure",
      "To measure dynamic pressure for airspeed indication",
      "To measure engine RPM",
      "To measure fuel flow"
    ],
    correctAnswer: 1,
    explanation: "The pitot tube measures ram air pressure (dynamic pressure) which, when compared with static pressure, provides the airspeed indication.",
    category: "instruments",
    difficulty: "easy",
    source: "ATPL"
  },
  {
    id: "inst-002",
    question: "What happens to the altimeter reading when flying from high pressure to low pressure area without resetting?",
    options: [
      "Altimeter will read higher than actual altitude",
      "Altimeter will read lower than actual altitude",
      "Altimeter reading remains unchanged",
      "Altimeter will fluctuate"
    ],
    correctAnswer: 0,
    explanation: "Flying from high to low pressure without resetting causes the altimeter to read higher than actual altitude. Remember: High to Low, Look Out Below!",
    category: "instruments",
    difficulty: "medium",
    source: "Oxford"
  },
  {
    id: "inst-003",
    question: "Which instrument would be affected first if the static port becomes blocked?",
    options: [
      "Airspeed Indicator only",
      "Altimeter only",
      "Vertical Speed Indicator only",
      "All three: ASI, Altimeter, and VSI"
    ],
    correctAnswer: 3,
    explanation: "All three instruments (ASI, Altimeter, and VSI) use static pressure and would be affected if the static port is blocked.",
    category: "instruments",
    difficulty: "medium",
    source: "ATPL"
  },
  // Radio Navigation
  {
    id: "nav-001",
    question: "What is the maximum range of a VOR at FL350?",
    options: [
      "100 NM",
      "130 NM",
      "200 NM",
      "250 NM"
    ],
    correctAnswer: 2,
    explanation: "VOR range at FL350 is approximately 200 NM. The formula is: Range (NM) = 1.23 × √(height in feet).",
    category: "radio-navigation",
    difficulty: "medium",
    source: "ATPL"
  },
  {
    id: "nav-002",
    question: "The cone of confusion above a VOR station is caused by:",
    options: [
      "Magnetic interference",
      "The vertical radiation pattern of the VOR",
      "Aircraft antenna limitations",
      "Atmospheric conditions"
    ],
    correctAnswer: 1,
    explanation: "The cone of confusion is caused by the vertical radiation pattern of the VOR antenna, where the signal becomes unreliable directly overhead.",
    category: "radio-navigation",
    difficulty: "hard",
    source: "Oxford"
  },
  // Meteorology
  {
    id: "met-001",
    question: "What type of cloud is associated with severe turbulence and thunderstorms?",
    options: [
      "Stratus",
      "Cirrus",
      "Cumulonimbus",
      "Altocumulus"
    ],
    correctAnswer: 2,
    explanation: "Cumulonimbus (Cb) clouds are associated with thunderstorms, severe turbulence, icing, lightning, and heavy precipitation.",
    category: "meteorology",
    difficulty: "easy",
    source: "ATPL"
  },
  {
    id: "met-002",
    question: "The international standard atmosphere assumes a sea level temperature of:",
    options: [
      "15°C",
      "20°C",
      "25°C",
      "10°C"
    ],
    correctAnswer: 0,
    explanation: "ISA conditions assume 15°C (59°F) at sea level with a pressure of 1013.25 hPa and a lapse rate of 1.98°C per 1000ft.",
    category: "meteorology",
    difficulty: "easy",
    source: "ATPL"
  },
  // Performance
  {
    id: "perf-001",
    question: "What effect does a higher altitude airport have on takeoff distance required?",
    options: [
      "Decreases takeoff distance",
      "Increases takeoff distance",
      "No effect on takeoff distance",
      "Effect depends on temperature only"
    ],
    correctAnswer: 1,
    explanation: "Higher altitude means lower air density, which reduces engine performance and aerodynamic lift, requiring a longer takeoff distance.",
    category: "performance",
    difficulty: "medium",
    source: "ATPL"
  },
  {
    id: "perf-002",
    question: "V1 is defined as:",
    options: [
      "Rotation speed",
      "Decision speed - the maximum speed at which takeoff can be safely aborted",
      "Best climb speed",
      "Minimum control speed"
    ],
    correctAnswer: 1,
    explanation: "V1 is the decision speed. Before V1, the takeoff can be safely rejected. After V1, the takeoff should be continued.",
    category: "performance",
    difficulty: "easy",
    source: "ATPL"
  },
  // Technical
  {
    id: "tech-001",
    question: "What is the purpose of the FADEC system?",
    options: [
      "To control the flight surfaces",
      "To manage fuel quantity",
      "Full Authority Digital Engine Control",
      "To monitor cabin pressure"
    ],
    correctAnswer: 2,
    explanation: "FADEC (Full Authority Digital Engine Control) is a computer system that controls all aspects of aircraft engine performance.",
    category: "technical",
    difficulty: "medium",
    source: "Indigo"
  },
  {
    id: "tech-002",
    question: "In a turbofan engine, the bypass ratio refers to:",
    options: [
      "The ratio of fuel to air",
      "The ratio of cold air bypassing the core to hot air through the core",
      "The ratio of thrust to weight",
      "The ratio of inlet to outlet pressure"
    ],
    correctAnswer: 1,
    explanation: "Bypass ratio is the ratio of the mass of air that passes through the fan duct to the mass of air that passes through the engine core.",
    category: "technical",
    difficulty: "hard",
    source: "Oxford"
  },
  // Regulations
  {
    id: "reg-001",
    question: "According to DGCA CAR, the minimum rest period for a pilot before flight duty is:",
    options: [
      "8 hours",
      "10 hours",
      "12 hours",
      "Varies based on previous duty"
    ],
    correctAnswer: 3,
    explanation: "The minimum rest period varies based on the length of the previous duty period and whether the pilot is acclimatized.",
    category: "regulations",
    difficulty: "medium",
    source: "Previous Papers"
  },
  {
    id: "reg-002",
    question: "An ATPL holder can act as PIC on aircraft with a maximum takeoff weight of:",
    options: [
      "Above 5700 kg only",
      "Any weight with appropriate type rating",
      "Up to 5700 kg only",
      "Above 12500 kg only"
    ],
    correctAnswer: 1,
    explanation: "An ATPL allows the holder to act as PIC on any aircraft type for which they hold a valid type rating, regardless of weight.",
    category: "regulations",
    difficulty: "medium",
    source: "ATPL"
  },
  // Airbus A320 Specific
  {
    id: "a320-001",
    question: "What is the maximum operating altitude of the Airbus A320?",
    options: [
      "FL390",
      "FL410",
      "FL430",
      "FL370"
    ],
    correctAnswer: 1,
    explanation: "The Airbus A320 has a maximum operating altitude of FL410 (41,000 feet).",
    category: "airbus-320",
    aircraft: "Airbus A320",
    difficulty: "easy",
    source: "Indigo"
  },
  {
    id: "a320-002",
    question: "In the A320, what does ECAM stand for?",
    options: [
      "Electronic Centralized Aircraft Monitoring",
      "Engine Condition and Alert Module",
      "Emergency Crew Alert Message",
      "Electronic Control And Management"
    ],
    correctAnswer: 0,
    explanation: "ECAM (Electronic Centralized Aircraft Monitoring) displays system synoptics and provides crew alerting on the A320.",
    category: "airbus-320",
    aircraft: "Airbus A320",
    difficulty: "easy",
    source: "Indigo"
  },
  {
    id: "a320-003",
    question: "What is the purpose of the A320's FAC (Flight Augmentation Computer)?",
    options: [
      "To control the engines",
      "To provide yaw damping and flight envelope protection",
      "To manage the fuel system",
      "To control cabin pressure"
    ],
    correctAnswer: 1,
    explanation: "The FAC provides yaw damping, rudder travel limiting, and flight envelope functions including speed and angle of attack protection.",
    category: "airbus-320",
    aircraft: "Airbus A320",
    difficulty: "hard",
    source: "Oxford"
  },
  // Navigation
  {
    id: "gnav-001",
    question: "The great circle distance between two points is:",
    options: [
      "The longest distance between two points on Earth",
      "The shortest distance between two points on Earth's surface",
      "A constant heading track",
      "Always follows a line of latitude"
    ],
    correctAnswer: 1,
    explanation: "A great circle is the shortest distance between two points on the surface of a sphere (Earth).",
    category: "navigation",
    difficulty: "easy",
    source: "ATPL"
  },
  {
    id: "gnav-002",
    question: "Variation is defined as:",
    options: [
      "The angle between true north and magnetic north",
      "The angle between magnetic north and compass north",
      "The error caused by aircraft magnetic fields",
      "The change in heading due to wind"
    ],
    correctAnswer: 0,
    explanation: "Variation is the angular difference between true north and magnetic north at any given location.",
    category: "navigation",
    difficulty: "easy",
    source: "Oxford"
  },
  // Mass & Balance
  {
    id: "mb-001",
    question: "If an aircraft's CG is forward of the forward limit, the aircraft will:",
    options: [
      "Be difficult to rotate on takeoff and require higher approach speeds",
      "Be unstable in pitch",
      "Have improved fuel efficiency",
      "Require less elevator deflection"
    ],
    correctAnswer: 0,
    explanation: "A forward CG makes the aircraft nose-heavy, requiring more elevator force to rotate and higher approach speeds for landing.",
    category: "mass-balance",
    difficulty: "medium",
    source: "ATPL"
  },
  // Air Law
  {
    id: "law-001",
    question: "The Chicago Convention established which organization?",
    options: [
      "IATA",
      "ICAO",
      "FAA",
      "EASA"
    ],
    correctAnswer: 1,
    explanation: "The Chicago Convention of 1944 established ICAO (International Civil Aviation Organization) to govern international aviation.",
    category: "air-law",
    difficulty: "easy",
    source: "ATPL"
  },
  {
    id: "law-002",
    question: "According to ICAO Annex 2, which aircraft has the right of way?",
    options: [
      "Aircraft on the left",
      "Aircraft at higher altitude",
      "Aircraft on the right",
      "Faster aircraft"
    ],
    correctAnswer: 2,
    explanation: "When two aircraft are converging at approximately the same altitude, the aircraft on the right has the right of way.",
    category: "air-law",
    difficulty: "easy",
    source: "ATPL"
  },
];

export const getQuestionsByCategory = (categoryId: string): Question[] => {
  return sampleQuestions.filter(q => q.category === categoryId);
};

export const getQuestionsBySource = (source: string): Question[] => {
  return sampleQuestions.filter(q => q.source === source);
};

export const getQuestionById = (id: string): Question | undefined => {
  return sampleQuestions.find(q => q.id === id);
};

export const getRandomQuestions = (categoryId: string, count: number): Question[] => {
  const categoryQuestions = getQuestionsByCategory(categoryId);
  const shuffled = [...categoryQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};
