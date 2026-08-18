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
  icon: string;
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
    name: "Standing Windmill",
    description:
      "Stand with your feet wide apart. Reach one arm straight up while the other hand taps the floor in front of you, then switch sides in a steady rhythm. Loosens the shoulders, hips, and hamstrings.",
    durationSeconds: 30,
    icon: "🌀",
    videoSrc: `${VIDEO_BASE_URL}/standing-windmill.mp4`,
  },
  {
    id: "cross-body-shoulder-stretch",
    name: "Cross-Body Shoulder Stretch",
    description:
      "Sit or stand tall. Bring one arm straight across your chest, then use your other hand to gently press at the elbow, pulling it closer. Stretches the back of the shoulder.",
    durationSeconds: 20,
    icon: "🤝",
    videoSrc: `${VIDEO_BASE_URL}/cross-body-shoulder-stretch.mp4`,
  },
  {
    id: "alternating-lunge-stretch",
    name: "Alternating Lunge Stretch",
    description:
      "Step one leg forward into a lunge, back leg extended behind you at roughly a right angle. Pulse gently up and down a few times, then switch legs. Opens the hips and stretches the legs.",
    durationSeconds: 30,
    icon: "🦵",
    videoSrc: `${VIDEO_BASE_URL}/alternating-lunge-stretch.mp4`,
  },
  {
    id: "childs-pose",
    name: "Child's Pose",
    description:
      "Kneel with your hips back toward your heels, and stretch your arms and upper body forward along the floor. Relaxes the upper back and shoulders.",
    durationSeconds: 30,
    icon: "🧎",
    videoSrc: `${VIDEO_BASE_URL}/childs-pose.mp4`,
  },
  {
    id: "forearm-circles",
    name: "Forearm Circles",
    description:
      "Extend your arms out to your sides at shoulder height. Keeping your upper arms still, rotate your forearms in small circles. Loosens the elbows and shoulders.",
    durationSeconds: 20,
    icon: "🔃",
    videoSrc: `${VIDEO_BASE_URL}/forearm-circles.mp4`,
  },
  {
    id: "lying-trunk-rotation",
    name: "Lying Trunk Rotation",
    description:
      "Lie on your back with your knees bent. Slowly rotate your knees to one side, keeping your shoulders on the floor, then rotate to the other side. Mobilizes the spine and lower back.",
    durationSeconds: 30,
    icon: "🔀",
    videoSrc: `${VIDEO_BASE_URL}/lying-trunk-rotation.mp4`,
  },
  {
    id: "overhead-triceps-stretch",
    name: "Overhead Triceps Stretch",
    description:
      "Reach one arm overhead, then bend the elbow so your fingers reach toward the middle of your upper back. Use your other hand to gently pull the elbow further back. Stretches the back of the upper arm and shoulder.",
    durationSeconds: 20,
    icon: "💪",
    videoSrc: `${VIDEO_BASE_URL}/overhead-triceps-stretch.mp4`,
  },
  {
    id: "shoulder-stand",
    name: "Shoulder Stand",
    description:
      "Lie on your back and lift your legs straight up, supporting your lower back with your hands as your hips rise off the floor. Brings gentle traction to the neck and shoulders. Skip this one if you have neck sensitivity.",
    durationSeconds: 25,
    icon: "🙃",
    videoSrc: `${VIDEO_BASE_URL}/shoulder-stand.mp4`,
  },
  {
    id: "glute-bridge",
    name: "Glute Bridge",
    description:
      "Lie on your back with your knees bent and feet flat on the floor. Lift your hips toward the ceiling, squeezing your glutes at the top, then lower back down. Strengthens the glutes and lower back.",
    durationSeconds: 30,
    icon: "🌉",
    videoSrc: `${VIDEO_BASE_URL}/glute-bridge.mp4`,
  },
  {
    id: "side-bend",
    name: "Side Bend",
    description:
      "Stand tall and reach one arm straight overhead, then lean your torso to the same side. Keep your other hand resting on your hip. Stretches along the side of your body and shoulder.",
    durationSeconds: 20,
    icon: "🙆",
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
