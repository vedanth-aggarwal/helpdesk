-- CreateTable
CREATE TABLE "ticket_reply" (
    "id" SERIAL NOT NULL,
    "body" TEXT NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_reply_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ticket_reply" ADD CONSTRAINT "ticket_reply_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_reply" ADD CONSTRAINT "ticket_reply_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
