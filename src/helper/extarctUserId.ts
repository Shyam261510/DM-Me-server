export const extractUserId = (message: string) => {
  const match = message.match(/\b[a-f0-9]{24}\b/i);

  const userId = match ? match[0] : null;

  return userId;
};
