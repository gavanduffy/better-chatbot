import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { skillRepository } from "lib/db/repository";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  const { id } = await params;
  await skillRepository.deleteSkill(id, session.user.id);
  return new NextResponse(null, { status: 204 });
}
