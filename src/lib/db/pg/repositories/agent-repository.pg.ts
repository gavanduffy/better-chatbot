import { Agent, AgentRepository, AgentSummary } from "app-types/agent";
import { pgDb as db } from "../db.pg";
import { AgentTable, BookmarkTable, UserTable, AgentSkillTable } from "../schema.pg";
import { and, desc, eq, ne, or, sql } from "drizzle-orm";
import { generateUUID } from "lib/utils";

export const pgAgentRepository: AgentRepository = {
  async insertAgent(agent) {
    const { skills, ...agentData } = agent;
    const [result] = await db
      .insert(AgentTable)
      .values({
        id: generateUUID(),
        name: agentData.name,
        description: agentData.description,
        icon: agentData.icon,
        userId: agentData.userId,
        instructions: agentData.instructions,
        visibility: agentData.visibility || "private",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (skills && skills.length > 0) {
      await db.insert(AgentSkillTable).values(
        skills.map((skillId) => ({
          agentId: result.id,
          skillId,
        })),
      );
    }

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      skills: skills,
    };
  },

  async selectAgentById(id, userId): Promise<Agent | null> {
    const [result] = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        instructions: AgentTable.instructions,
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        isBookmarked: sql<boolean>`${BookmarkTable.id} IS NOT NULL`,
      })
      .from(AgentTable)
      .leftJoin(
        BookmarkTable,
        and(
          eq(BookmarkTable.itemId, AgentTable.id),
          eq(BookmarkTable.userId, userId),
          eq(BookmarkTable.itemType, "agent"),
        ),
      )
      .where(
        and(
          eq(AgentTable.id, id),
          or(
            eq(AgentTable.userId, userId), // Own agent
            eq(AgentTable.visibility, "public"), // Public agent
            eq(AgentTable.visibility, "readonly"), // Readonly agent
          ),
        ),
      );

    if (!result) return null;

    const skills = await db
      .select({ skillId: AgentSkillTable.skillId })
      .from(AgentSkillTable)
      .where(eq(AgentSkillTable.agentId, id));

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      isBookmarked: result.isBookmarked ?? false,
      skills: skills.map((s) => s.skillId),
    };
  },

  async selectAgentsByUserId(userId) {
    const results = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        instructions: AgentTable.instructions,
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        isBookmarked: sql<boolean>`false`,
      })
      .from(AgentTable)
      .innerJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .where(eq(AgentTable.userId, userId))
      .orderBy(desc(AgentTable.createdAt));

    // Map database nulls to undefined and set defaults for owned agents
    return results.map((result) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
      isBookmarked: false, // Always false for owned agents
    }));
  },

  async updateAgent(id, userId, agent) {
    const { skills, ...agentData } = agent;
    const [result] = await db
      .update(AgentTable)
      .set({
        ...agentData,
        updatedAt: new Date(),
      })
      .where(
        and(
          // Only allow updates to agents owned by the user or public agents
          eq(AgentTable.id, id),
          or(
            eq(AgentTable.userId, userId),
            eq(AgentTable.visibility, "public"),
          ),
        ),
      )
      .returning();

    if (skills) {
      await db
        .delete(AgentSkillTable)
        .where(eq(AgentSkillTable.agentId, id));
      if (skills.length > 0) {
        await db.insert(AgentSkillTable).values(
          skills.map((skillId) => ({
            agentId: id,
            skillId,
          })),
        );
      }
    }

    // Fetch skills if we didn't update them? No, we just return what was passed if updated, or fetch if needed.
    // But repository method returns Promise<Agent>.
    // If skills were not updated, we should ideally fetch them or return undefined?
    // Agent type has optional skills.

    // For consistency, let's just return what we have. If skills were updated, return new skills.
    // If not, we might not need them for the return value immediately unless requested.
    // But let's verify Agent type. It requires Agent structure which matches schema + skills.

    return {
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      instructions: result.instructions ?? {},
      skills: skills, // This might be empty if skills weren't passed, which is technically correct for partial update return?
    };
  },

  async deleteAgent(id, userId) {
    await db
      .delete(AgentTable)
      .where(and(eq(AgentTable.id, id), eq(AgentTable.userId, userId)));
  },

  async selectAgents(
    currentUserId,
    filters = ["all"],
    limit = 50,
  ): Promise<AgentSummary[]> {
    let orConditions: any[] = [];

    // Build OR conditions based on filters array
    for (const filter of filters) {
      if (filter === "mine") {
        orConditions.push(eq(AgentTable.userId, currentUserId));
      } else if (filter === "shared") {
        orConditions.push(
          and(
            ne(AgentTable.userId, currentUserId),
            or(
              eq(AgentTable.visibility, "public"),
              eq(AgentTable.visibility, "readonly"),
            ),
          ),
        );
      } else if (filter === "bookmarked") {
        orConditions.push(
          and(
            ne(AgentTable.userId, currentUserId),
            or(
              eq(AgentTable.visibility, "public"),
              eq(AgentTable.visibility, "readonly"),
            ),
            sql`${BookmarkTable.id} IS NOT NULL`,
          ),
        );
      } else if (filter === "all") {
        // All available agents (mine + shared) - this overrides other filters
        orConditions = [
          or(
            // My agents
            eq(AgentTable.userId, currentUserId),
            // Shared agents
            and(
              ne(AgentTable.userId, currentUserId),
              or(
                eq(AgentTable.visibility, "public"),
                eq(AgentTable.visibility, "readonly"),
              ),
            ),
          ),
        ];
        break; // "all" overrides everything else
      }
    }

    const results = await db
      .select({
        id: AgentTable.id,
        name: AgentTable.name,
        description: AgentTable.description,
        icon: AgentTable.icon,
        userId: AgentTable.userId,
        // Exclude instructions from list queries for performance
        visibility: AgentTable.visibility,
        createdAt: AgentTable.createdAt,
        updatedAt: AgentTable.updatedAt,
        userName: UserTable.name,
        userAvatar: UserTable.image,
        isBookmarked: sql<boolean>`CASE WHEN ${BookmarkTable.id} IS NOT NULL THEN true ELSE false END`,
      })
      .from(AgentTable)
      .innerJoin(UserTable, eq(AgentTable.userId, UserTable.id))
      .leftJoin(
        BookmarkTable,
        and(
          eq(BookmarkTable.itemId, AgentTable.id),
          eq(BookmarkTable.itemType, "agent"),
          eq(BookmarkTable.userId, currentUserId),
        ),
      )
      .where(orConditions.length > 1 ? or(...orConditions) : orConditions[0])
      .orderBy(
        // My agents first, then other shared agents
        sql`CASE WHEN ${AgentTable.userId} = ${currentUserId} THEN 0 ELSE 1 END`,
        desc(AgentTable.createdAt),
      )
      .limit(limit);

    // Map database nulls to undefined
    return results.map((result) => ({
      ...result,
      description: result.description ?? undefined,
      icon: result.icon ?? undefined,
      userName: result.userName ?? undefined,
      userAvatar: result.userAvatar ?? undefined,
    }));
  },

  async checkAccess(agentId, userId, destructive = false) {
    const [agent] = await db
      .select({
        visibility: AgentTable.visibility,
        userId: AgentTable.userId,
      })
      .from(AgentTable)
      .where(eq(AgentTable.id, agentId));
    if (!agent) {
      return false;
    }
    if (userId == agent.userId) return true;
    if (agent.visibility === "public" && !destructive) return true;
    return false;
  },
};
