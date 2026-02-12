import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { skillRepository } from "lib/db/repository";

export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const skills = await skillRepository.getSkills(session.user.id);
  return NextResponse.json(skills);
}
