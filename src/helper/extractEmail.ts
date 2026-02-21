export function extractEmail(text: string) {
  const words = text.split(/\s+/); // split by spaces/newlines

  for (let word of words) {
    // remove common punctuation around the word
    word = word.replace(/[<>(),]/g, "");

    if (word.includes("@") && word.includes(".")) {
      return word;
    }
  }

  return null;
}
