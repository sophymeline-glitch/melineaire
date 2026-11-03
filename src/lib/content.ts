export const palettes = [
  { name: "Melineaire in Bloom", colors: ["#B99AFF", "#8050F5", "#FF78C8", "#F54FA7", "#62C8FF", "#398BFF"] },
  { name: "Quiet Morning", colors: ["#f6efe2", "#c9d8ec", "#9db4d9", "#e8c9d6", "#b8a6d4", "#5a6fa8"] },
  { name: "After the Rain", colors: ["#d7e6e3", "#9ec3c0", "#6f97a8", "#4b6584", "#c7cfa4", "#e9e2c8"] },
  { name: "Midnight Bloom", colors: ["#1f2547", "#3d3a75", "#6b5aa6", "#b07fc4", "#e6a5c4", "#f4d9e4"] },
  { name: "Hidden Garden", colors: ["#3f5d45", "#7a9a6a", "#b9c98f", "#f0d9a0", "#e7a37c", "#c56d6d"] },
  { name: "Sakura Dream", colors: ["#fbe4ea", "#f4bccb", "#e88ea8", "#c76a8c", "#a7b5e0", "#fff8f0"] },
  { name: "Golden Stillness", colors: ["#fff4d6", "#f3d58b", "#d9a94d", "#a8743a", "#6e4f3a", "#efe3cf"] },
];

export type Reflection = { slug: string; title: string; body: string; questions: string[] };

// Placeholder content — to be replaced by the Melineaire administrator's original writing.
export const reflections: Reflection[] = [
  {
    slug: "placeholder-noticing",
    title: "[Placeholder] On noticing",
    body: "This is placeholder text. The original Melineaire reflection will appear here once it is supplied.",
    questions: ["What did you notice today that you almost missed?", "Where did you see goodness this week?"],
  },
  {
    slug: "placeholder-stillness",
    title: "[Placeholder] Making room for stillness",
    body: "This is placeholder text. The original Melineaire reflection will appear here once it is supplied.",
    questions: ["What would a quiet moment look like for you today?"],
  },
  {
    slug: "placeholder-small-steps",
    title: "[Placeholder] Action before certainty",
    body: "This is placeholder text. The original Melineaire reflection will appear here once it is supplied.",
    questions: ["What is one small step you could take without knowing the whole path?"],
  },
];

export const feelings = ["peaceful", "grateful", "joyful", "hopeful", "curious", "tired", "sad", "overwhelmed", "uncertain"];
