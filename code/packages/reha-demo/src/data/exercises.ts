/**
 * Static list of shoulder/neck rehab exercises used in the demo.
 * Sourced from a public physiotherapy video: "Schultern und Nacken
 * dehnen - 10 ultimative Übungen für eine entspannte Muskulatur!"
 */

export interface Exercise {
  id: string;
  name: string;
  description: string;
  /** Suggested duration in seconds. Used for the timer on the active screen. */
  durationSeconds: number;
}

export const exercises: Exercise[] = [
  {
    id: "side-stretch",
    name: "Side Stretch",
    description:
      "Reach one arm overhead and bend sideways at the waist. Keep the other hand on your hip. Feel the stretch along the flank and shoulder.",
    durationSeconds: 30,
  },
  {
    id: "twisted-side-stretch",
    name: "Twisted Side Stretch",
    description:
      "Like the side stretch, but rotate your torso slightly toward the raised arm. Deepens the stretch across the upper back.",
    durationSeconds: 30,
  },
  {
    id: "forward-stretch",
    name: "Forward Stretch",
    description:
      "Clasp your hands in front of you, palms facing outward. Push your arms forward, rounding your upper back gently.",
    durationSeconds: 30,
  },
  {
    id: "eagle-arms",
    name: "Eagle Arms",
    description:
      "Cross one arm under the other in front of your chest, elbows bent. Hook the forearms and lift the elbows. Deep stretch between the shoulder blades.",
    durationSeconds: 45,
  },
  {
    id: "chest-opener",
    name: "Chest Opener",
    description:
      "Clasp your hands behind your back. Straighten your arms and gently lift them, opening the chest and drawing the shoulder blades together.",
    durationSeconds: 30,
  },
  {
    id: "chest-stretch",
    name: "Chest Stretch",
    description:
      "Place one arm against a wall at shoulder height. Rotate your body away from the wall until you feel the stretch across the chest.",
    durationSeconds: 30,
  },
  {
    id: "crossed-shoulder",
    name: "Crossed Shoulder",
    description:
      "Bring one arm across your chest, using the other arm to gently pull it closer. Stretches the back of the shoulder.",
    durationSeconds: 30,
  },
  {
    id: "internal-rotation",
    name: "Internal Rotation",
    description:
      "Bring one hand behind your back and reach up between the shoulder blades. Use the other hand from above to help if comfortable.",
    durationSeconds: 30,
  },
  {
    id: "chin-tucks",
    name: "Chin Tucks",
    description:
      "Sit upright. Draw your chin straight back toward your neck, keeping your gaze level. Hold, release, repeat. Strengthens deep neck flexors.",
    durationSeconds: 30,
  },
  {
    id: "lying-shoulder-extension",
    name: "Lying Shoulder Extension",
    description:
      "Lie on your back, arms above your head. Slowly lower your arms toward the floor behind you as far as comfortable.",
    durationSeconds: 30,
  },
];
