import { verifyToken } from "@/app/lib/jwt";

export function getAuthUser(req: Request) {
  const authHeader = req.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Unauthorized");
  }

  const token = authHeader.split(" ")[1];
  return verifyToken(token);
}
