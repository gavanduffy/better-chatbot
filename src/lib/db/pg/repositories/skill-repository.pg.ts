import {
  SkillTable,
  AgentSkillTable,
  SkillEntity,
  AgentSkillEntity,
} from "../schema.pg";
import { and, eq, sql } from "drizzle-orm";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { pgDb as db } from "../db.pg";
import { generateUUID } from "lib/utils";

export class SkillRepository {
  async createSkill(skill: Omit<SkillEntity, "id" | "createdAt" | "updatedAt">) {
    const [newSkill] = await db
      .insert(SkillTable)
      .values({
          ...skill,
          id: generateUUID(),
      })
      .returning();
    return newSkill;
  }

  async updateSkill(id: string, userId: string, skill: Partial<Omit<SkillEntity, "id" | "createdAt" | "updatedAt">>) {
    const [updatedSkill] = await db
      .update(SkillTable)
      .set({ ...skill, updatedAt: new Date() })
      .where(and(eq(SkillTable.id, id), eq(SkillTable.userId, userId)))
      .returning();
    return updatedSkill;
  }

  async deleteSkill(id: string, userId: string) {
    const [deletedSkill] = await db
      .delete(SkillTable)
      .where(and(eq(SkillTable.id, id), eq(SkillTable.userId, userId)))
      .returning();
    return deletedSkill;
  }

  async getSkill(id: string) {
    const [skill] = await db
      .select()
      .from(SkillTable)
      .where(eq(SkillTable.id, id));
    return skill;
  }

  async getSkills(userId: string) {
    return db
      .select()
      .from(SkillTable)
      .where(eq(SkillTable.userId, userId));
  }

  async getAgentSkills(agentId: string) {
    // Join AgentSkillTable with SkillTable
    return db
      .select({
          id: SkillTable.id,
          name: SkillTable.name,
          description: SkillTable.description,
          content: SkillTable.content,
          userId: SkillTable.userId,
          createdAt: SkillTable.createdAt,
          updatedAt: SkillTable.updatedAt,
      })
      .from(AgentSkillTable)
      .innerJoin(SkillTable, eq(AgentSkillTable.skillId, SkillTable.id))
      .where(eq(AgentSkillTable.agentId, agentId));
  }
}

export const pgSkillRepository = new SkillRepository();
