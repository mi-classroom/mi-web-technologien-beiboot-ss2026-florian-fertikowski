/**
 * Exercise list, rebuilt from a single Envato stock-video set (10
 * clips, one performer, one background — see the reflection doc
 * for why a consistent set was chosen over the earlier YouTube-
 * sourced descriptions).
 *
 * Video clips are hosted on Cloudflare R2 behind a custom domain.
 * The base URL is overridable via NEXT_PUBLIC_VIDEO_BASE_URL, but
 * defaults to the project's actual bucket domain — so cloning the
 * repo and running it locally works immediately, no .env setup
 * required. Override only if you're hosting your own copy of the
 * clips elsewhere. Not a secret: this is a public asset URL that
 * ends up in the client bundle either way, env var or not — the
 * point of the indirection is a single place to change it, not
 * hiding it.
 */

export const VIDEO_BASE_URL =
  process.env.NEXT_PUBLIC_VIDEO_BASE_URL ??
  "https://exercises.beiboot-ss-2026.florianfertikowski.com";

export interface Exercise {
  id: string;
  name: string;
  description: string;
  durationSeconds: number;
  /**
   * Optional URL to a short (10-15s), silent, looping demo clip
   * (h264 mp4, ~720p, no audio). Falls back to the icon on the
   * session screen when not set.
   */
  videoSrc?: string;
}

export const exercises: Exercise[] = [
  {
    id: "standing-windmill",
    name: "Stehende Windmühle",
    description:
      "Stell die Füße weit auseinander. Strecke einen Arm gerade nach oben, während die andere Hand vor dir den Boden berührt, dann wechsle die Seite in einem gleichmäßigen Rhythmus. Lockert Schultern, Hüften und die Rückseite der Oberschenkel.",
    durationSeconds: 30,
    videoSrc: `${VIDEO_BASE_URL}/standing-windmill.mp4`,
  },
  {
    id: "cross-body-shoulder-stretch",
    name: "Schulterdehnung über Kreuz",
    description:
      "Setz oder stell dich aufrecht hin. Führe einen Arm gerade vor die Brust, dann drücke mit der anderen Hand sanft auf den Ellbogen und zieh ihn näher heran. Dehnt die Rückseite der Schulter.",
    durationSeconds: 20,
    videoSrc: `${VIDEO_BASE_URL}/cross-body-shoulder-stretch.mp4`,
  },
  {
    id: "alternating-lunge-stretch",
    name: "Wechselnder Ausfallschritt",
    description:
      "Mach mit einem Bein einen Ausfallschritt nach vorne, das hintere Bein bleibt im etwa rechten Winkel gestreckt. Wippe ein paar Mal sanft auf und ab, dann wechsle das Bein. Öffnet die Hüfte und dehnt die Beine.",
    durationSeconds: 30,
    videoSrc: `${VIDEO_BASE_URL}/alternating-lunge-stretch.mp4`,
  },
  {
    id: "childs-pose",
    name: "Kindshaltung",
    description:
      "Knie dich hin, die Hüfte zurück in Richtung Fersen, und strecke Arme und Oberkörper nach vorne über den Boden. Entspannt den oberen Rücken und die Schultern.",
    durationSeconds: 30,
    videoSrc: `${VIDEO_BASE_URL}/childs-pose.mp4`,
  },
  {
    id: "forearm-circles",
    name: "Unterarmkreisen",
    description:
      "Strecke die Arme seitlich auf Schulterhöhe aus. Halte die Oberarme ruhig und kreise die Unterarme in kleinen Kreisen. Lockert Ellbogen und Schultern.",
    durationSeconds: 20,
    videoSrc: `${VIDEO_BASE_URL}/forearm-circles.mp4`,
  },
  {
    id: "lying-trunk-rotation",
    name: "Liegende Rumpfrotation",
    description:
      "Leg dich auf den Rücken, die Knie angewinkelt. Drehe die Knie langsam zur einen Seite, während die Schultern am Boden bleiben, dann zur anderen Seite. Mobilisiert die Wirbelsäule und den unteren Rücken.",
    durationSeconds: 30,
    videoSrc: `${VIDEO_BASE_URL}/lying-trunk-rotation.mp4`,
  },
  {
    id: "overhead-triceps-stretch",
    name: "Trizepsdehnung über Kopf",
    description:
      "Strecke einen Arm über den Kopf, dann winkle den Ellbogen an, sodass die Finger Richtung Mitte des oberen Rückens reichen. Zieh mit der anderen Hand den Ellbogen sanft weiter nach hinten. Dehnt die Rückseite des Oberarms und die Schulter.",
    durationSeconds: 20,
    videoSrc: `${VIDEO_BASE_URL}/overhead-triceps-stretch.mp4`,
  },
  {
    id: "shoulder-stand",
    name: "Schulterstand",
    description:
      "Leg dich auf den Rücken und heb die Beine gerade nach oben, stütze den unteren Rücken mit den Händen, während sich die Hüfte vom Boden hebt. Bringt sanften Zug auf Nacken und Schultern. Überspring diese Übung bei empfindlichem Nacken.",
    durationSeconds: 25,
    videoSrc: `${VIDEO_BASE_URL}/shoulder-stand.mp4`,
  },
  {
    id: "glute-bridge",
    name: "Gesäßbrücke",
    description:
      "Leg dich auf den Rücken, Knie angewinkelt, Füße flach am Boden. Heb die Hüfte Richtung Decke, spann oben die Gesäßmuskeln an, dann senk sie wieder ab. Stärkt die Gesäßmuskulatur und den unteren Rücken.",
    durationSeconds: 30,
    videoSrc: `${VIDEO_BASE_URL}/glute-bridge.mp4`,
  },
  {
    id: "side-bend",
    name: "Seitbeuge",
    description:
      "Steh aufrecht und strecke einen Arm gerade über den Kopf, dann neige den Oberkörper zur selben Seite. Die andere Hand bleibt an der Hüfte. Dehnt die Seite des Körpers und die Schulter.",
    durationSeconds: 20,
    videoSrc: `${VIDEO_BASE_URL}/side-bend.mp4`,
  },
];

export function getExercise(id: string): Exercise | undefined {
  return exercises.find((e) => e.id === id);
}

/**
 * URL for a static JPG thumbnail (a single extracted video frame)
 * for the given exercise. Lives under a /thumbnails/ path on the
 * same bucket/domain as the videos — same VIDEO_BASE_URL, no
 * separate hosting config needed. See the reflection notes for the
 * ffmpeg command used to generate these.
 */
export function getThumbnailUrl(exerciseId: string): string {
  return `${VIDEO_BASE_URL}/thumbnails/${exerciseId}.jpg`;
}
