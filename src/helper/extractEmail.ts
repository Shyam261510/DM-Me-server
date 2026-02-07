export const extractEmail = (message: string) => {
  const match = message.match(
    /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g,
  );

  const email = match ? match[0] : null;

  return email;
};
