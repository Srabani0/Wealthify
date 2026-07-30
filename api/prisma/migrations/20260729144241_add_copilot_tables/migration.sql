-- CreateTable
CREATE TABLE "copilot_sessions" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New Conversation',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copilot_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copilot_messages" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT,
    "toolCalls" JSONB,
    "toolResults" JSONB,
    "modelName" TEXT,
    "tokensUsed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "copilot_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "copilot_context_states" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "activeFilters" JSONB NOT NULL,
    "lastQueryEntityId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "copilot_context_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "copilot_sessions_businessId_userId_idx" ON "copilot_sessions"("businessId", "userId");

-- CreateIndex
CREATE INDEX "copilot_messages_sessionId_idx" ON "copilot_messages"("sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "copilot_context_states_sessionId_key" ON "copilot_context_states"("sessionId");

-- AddForeignKey
ALTER TABLE "copilot_sessions" ADD CONSTRAINT "copilot_sessions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_sessions" ADD CONSTRAINT "copilot_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_messages" ADD CONSTRAINT "copilot_messages_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "copilot_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "copilot_context_states" ADD CONSTRAINT "copilot_context_states_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "copilot_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
