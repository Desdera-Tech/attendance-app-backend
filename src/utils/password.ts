import bcrypt from "bcrypt";

export const passwordHash = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};
