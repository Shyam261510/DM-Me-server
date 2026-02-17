export const deleteFile = async (filePath: string) => {
  const file = Bun.file(filePath);
  if (await file.exists()) {
    await file.delete();
    return { success: true };
  } else {
    return { success: false };
  }
};
