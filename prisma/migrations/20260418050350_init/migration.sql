-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "stripeCustomerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "resellMin" DOUBLE PRECISION NOT NULL,
    "resellMax" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "shippingCost" DOUBLE PRECISION NOT NULL DEFAULT 10.0,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auction" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "spotPrice" DOUBLE PRECISION NOT NULL,
    "totalSpots" INTEGER NOT NULL,
    "spinSeed" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),

    CONSTRAINT "Auction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionItem" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "spotNumber" INTEGER,

    CONSTRAINT "AuctionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuctionSpot" (
    "id" TEXT NOT NULL,
    "auctionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spotNumber" INTEGER NOT NULL,
    "paymentId" TEXT,
    "paymentMethod" TEXT,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "assignedItemId" TEXT,
    "shipped" BOOLEAN NOT NULL DEFAULT false,
    "trackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuctionSpot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- AddForeignKey
ALTER TABLE "AuctionItem" ADD CONSTRAINT "AuctionItem_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionItem" ADD CONSTRAINT "AuctionItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionSpot" ADD CONSTRAINT "AuctionSpot_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES "Auction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuctionSpot" ADD CONSTRAINT "AuctionSpot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
