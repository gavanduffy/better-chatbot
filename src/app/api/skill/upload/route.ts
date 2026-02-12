import { NextResponse } from "next/server";
import { getSession } from "auth/server";
import { skillRepository } from "lib/db/repository";
import { generateUUID } from "lib/utils";
import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return new NextResponse("No file uploaded", { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const uploadId = generateUUID();
    const zipPath = path.join(tempDir, `${uploadId}.zip`);
    const extractPath = path.join(tempDir, `${uploadId}_extract`);

    fs.writeFileSync(zipPath, buffer);

    try {
      // Unzip
      await execAsync(`unzip -o "${zipPath}" -d "${extractPath}"`);

      // Traverse
      const items = fs.readdirSync(extractPath);
      const skillsAdded = [];

      for (const item of items) {
        const itemPath = path.join(extractPath, item);
        if (fs.statSync(itemPath).isDirectory()) {
          // Check for SKILL.md
          const skillFile = fs.readdirSync(itemPath).find(f => f.toLowerCase() === "skill.md");
          if (skillFile) {
            const content = fs.readFileSync(path.join(itemPath, skillFile), "utf-8");
            const skillName = item; // Use folder name as skill name

            const existingSkills = await skillRepository.getSkills(session.user.id);
            const existing = existingSkills.find(s => s.name === skillName);

            if (existing) {
              await skillRepository.updateSkill(existing.id, session.user.id, {
                content,
                description: "Imported from zip",
              });
              skillsAdded.push({ name: skillName, action: "updated" });
            } else {
              await skillRepository.createSkill({
                name: skillName,
                content,
                description: "Imported from zip",
                userId: session.user.id,
              });
              skillsAdded.push({ name: skillName, action: "created" });
            }
          }
        }
      }

      return NextResponse.json({ success: true, skills: skillsAdded });
    } finally {
      // Cleanup
      if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
      if (fs.existsSync(extractPath)) fs.rmSync(extractPath, { recursive: true, force: true });
    }

  } catch (error: any) {
    console.error("Upload error:", error);
    return new NextResponse(error.message || "Internal Server Error", { status: 500 });
  }
}
