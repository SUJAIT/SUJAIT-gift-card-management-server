import express from "express";
import { giftCardController } from "../AppleCode.controllers/giftCard.controller.js";
import { verifyToken } from "../../middleware/verifyJWT.js";

const giftCard = express.Router();



giftCard.post('/upload', giftCardController.uploadCodes);
giftCard.get("/stats", giftCardController.getGiftCardStats);
giftCard.post("/claim",  verifyToken,giftCardController.claimGiftCards);
giftCard.get("/dues-specific/:email", verifyToken, giftCardController.getDuesForBuyer);
giftCard.get("/dues-specific", verifyToken, giftCardController.getDuesForBuyer);
giftCard.get("/available/:amount", verifyToken, giftCardController.getAvailableGiftCards);
giftCard.get("/full-dues", verifyToken, giftCardController.getFullDues);
giftCard.post("/reduce-dues", verifyToken, giftCardController.reduceDues);
giftCard.get("/buyer-emails", verifyToken, giftCardController.getAllBuyerEmails);
giftCard.get("/claimed-history", verifyToken, giftCardController.getClaimedHistory);
giftCard.get("/redeemed-summary", verifyToken, giftCardController.getRedeemedSummary);

export default giftCard

