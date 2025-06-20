import userModel from "../../User/user.model.js";
import GiftCard from "../AppleCode.models/giftCard.model.js";
import giftCardModel from "../AppleCode.models/giftCard.model.js"; // extension .js must


//uploadCodes +++++
const uploadCodes = async (req, res) => {
  try {
    const { codes, amount } = req.body;

    if (!Array.isArray(codes) || codes.length === 0 || ![2, 5].includes(amount)) {
      return res.status(400).json({ message: 'Invalid input. Provide codes[] and valid amount (2 or 5).' });
    }

    // Normalize & clean codes: trim, uppercase, remove empty, remove duplicate
    const normalizedCodes = [...new Set(
      codes
        .map(code => code.trim().toUpperCase())
        .filter(Boolean)
    )];

    if (normalizedCodes.length === 0) {
      return res.status(400).json({ message: 'No valid codes after normalization.' });
    }

    // Check for duplicate in DB
    const existingCodes = await giftCardModel.find({
      code: { $in: normalizedCodes }
    }).distinct("code");

    if (existingCodes.length > 0) {
      return res.status(409).json({
        message: "Upload rejected. Some codes already exist.",
        duplicates: existingCodes
      });
    }

    // If all codes are new, insert
    const rate = amount === 2 ? 200 : 515;
    const documents = normalizedCodes.map(code => ({
      code,
      amount,
      rate
    }));

    await giftCardModel.insertMany(documents, { ordered: true });

    res.status(201).json({
      message: `${documents.length} codes uploaded successfully.`
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error });
  }
};

//uploadCodes -----

////giftCardStatus +++++
const getGiftCardStats = async (req, res) => {
  try {
    const twoDollarCount = await giftCardModel.countDocuments({
      amount: 2,
      isClaimed: false
    });

    const fiveDollarCount = await giftCardModel.countDocuments({
      amount: 5,
      isClaimed: false
    });

    const twoDollarRate = 200; // You may optionally fetch from DB if dynamic
    const fiveDollarRate = 515;

    res.status(200).json({
      twoDollarCount,
      fiveDollarCount,
      twoDollarRate,
      fiveDollarRate,
      totalValue: {
        twoDollarTotal: twoDollarCount * twoDollarRate,
        fiveDollarTotal: fiveDollarCount * fiveDollarRate,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch stats", error });
  }
};


////giftCardStatus -----

//buy-giftCard +++++
const claimGiftCards = async (req, res) => {
  try {
    const { codes } = req.body;
    const buyerEmail = req.user.email; // from JWT

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ message: "Provide codes to claim." });
    }

    // Get the user first
    const user = await userModel.findOne({ email: buyerEmail });
    if (!user) {
      return res.status(404).json({ message: "Buyer not found." });
    }

    // Find unclaimed gift cards
    const cards = await giftCardModel.find({
      code: { $in: codes },
      isClaimed: false
    });

    if (cards.length !== codes.length) {
      return res.status(400).json({ message: "Some codes are invalid or already claimed." });
    }

    // Update gift cards as claimed
    const bulkOps = cards.map(card => ({
      updateOne: {
        filter: { _id: card._id },
        update: {
          isClaimed: true,
          claimedBy: user._id,
          claimedAt: new Date()
        }
      }
    }));
    await giftCardModel.bulkWrite(bulkOps);

    // Calculate dues
    let twoDollarAmount = 0;
    let fiveDollarAmount = 0;
    const twoDollarCodes = [];
    const fiveDollarCodes = [];

    for (const card of cards) {
      if (card.amount === 2) {
        twoDollarAmount += card.rate;
        twoDollarCodes.push({ code: card.code, claimedAt: new Date() });
      } else if (card.amount === 5) {
        fiveDollarAmount += card.rate;
        fiveDollarCodes.push({ code: card.code, claimedAt: new Date() });
      }
    }

    // Update user dues and claimed history
    await userModel.updateOne(
      { _id: user._id },
      {
        $inc: {
          "dues.twoDollarTotal": twoDollarAmount,
          "dues.fiveDollarTotal": fiveDollarAmount
        },
        $push: {
          "claimedHistory.twoDollar": { $each: twoDollarCodes },
          "claimedHistory.fiveDollar": { $each: fiveDollarCodes }
        }
      }
    );

    res.status(200).json({ message: "Codes claimed successfully." });

  } catch (error) {
    console.error("Claim error:", error);
    res.status(500).json({ message: "Failed to claim codes", error });
  }
};


//buy-giftCard -----

// spacific giftcard dues +++++
// const getDuesForBuyer = async (req, res) => {
//   try {
//     const email = req.user.email; // JWT থেকে আসছে

//     const user = await userModel.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     const dues = {
//       twoDollarTotal: user.dues?.twoDollarTotal || 0,
//       fiveDollarTotal: user.dues?.fiveDollarTotal || 0
//     };

//     res.status(200).json({ email: user.email, dues });
//   } catch (error) {
//     console.error("Get dues error:", error);
//     res.status(500).json({ message: "Failed to get dues.", error });
//   }
// };

export const getDuesForBuyer = async (req, res) => {
  try {
    const email = req.params.email || req.user?.email;

    if (!email) {
      return res.status(400).json({ message: "Email not provided" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ dues: user.dues || {} });
  } catch (err) {
    console.error("Get dues error:", err);
    res.status(500).json({ message: "Failed to get dues", error: err });
  }
};


// specific giftcard dues -----

//getAvvailableCodes +++++
const getAvailableGiftCards = async (req, res) => {
  try {
    const amount = parseInt(req.params.amount);

    if (![2, 5].includes(amount)) {
      return res.status(400).json({ message: "Amount must be 2 or 5" });
    }

    const cards = await giftCardModel.find(
      { amount, isClaimed: false },
      { code: 1, _id: 0 }
    );

    const codes = cards.map(card => card.code);

    res.status(200).json({ amount, codes });
  } catch (error) {
    res.status(500).json({ message: "Failed to get available codes", error });
  }
};

//getAvvailableCodes -----

//full-dues ++++++
const getFullDues = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      previous: {
        two: user.dues.twoDollarPrevious,
        five: user.dues.fiveDollarPrevious,
      },
      total: {
        two: user.dues.twoDollarTotal,
        five: user.dues.fiveDollarTotal,
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to get dues", error: err });
  }
};

//full-dues -----

//reduce-dues ++++++
const reduceDues = async (req, res) => {
  try {
    const { email, twoDollarReduce, fiveDollarReduce } = req.body;

    if (!email) return res.status(400).json({ message: "Email is required." });

    const user = await userModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "Buyer not found" });

    const twoTotal = user.dues?.twoDollarTotal || 0;
    const fiveTotal = user.dues?.fiveDollarTotal || 0;
    const twoPrev = user.dues?.twoDollarPrevious || 0;
    const fivePrev = user.dues?.fiveDollarPrevious || 0;

    const updateData = { $set: {}, $inc: {} };

    // Handle $2 reduction if provided
    if (typeof twoDollarReduce === "number") {
      const newTwoTotal = Math.max(0, twoTotal - twoDollarReduce);
      const extraTwo = twoDollarReduce > twoTotal ? twoDollarReduce - twoTotal : 0;

      updateData.$set["dues.twoDollarTotal"] = newTwoTotal;
      if (extraTwo > 0) {
        updateData.$inc["dues.twoDollarPrevious"] = extraTwo;
      }
    }

    // Handle $5 reduction if provided
    if (typeof fiveDollarReduce === "number") {
      const newFiveTotal = Math.max(0, fiveTotal - fiveDollarReduce);
      const extraFive = fiveDollarReduce > fiveTotal ? fiveDollarReduce - fiveTotal : 0;

      updateData.$set["dues.fiveDollarTotal"] = newFiveTotal;
      if (extraFive > 0) {
        updateData.$inc["dues.fiveDollarPrevious"] = extraFive;
      }
    }

    await userModel.updateOne({ email }, updateData);

    res.status(200).json({
      message: "Dues reduced successfully",
    });
  } catch (error) {
    console.error("Reduce dues error:", error);
    res.status(500).json({ message: "Failed to reduce dues", error });
  }
};



//reduce-dues -----

// Get All Buyer Email +++++
const getAllBuyerEmails = async (req, res) => {
  try {
    const buyers = await userModel.find({ role: "buyer" }, "email");
    res.status(200).json({ buyers });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch buyers", error });
  }
};
// Get All Buyer Email -----


//giftcardhistry +++++
export const getClaimedHistory = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await userModel.findOne({ email: userEmail });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { type, page = 1, limit = 10, search = "" } = req.query;

    const query = {
      claimedBy: user._id,
      isClaimed: true,
    };

    if (type === "2") query.amount = 2;
    else if (type === "5") query.amount = 5;

    if (search) {
      query.code = { $regex: search, $options: "i" };
    }

    const total = await giftCardModel.countDocuments(query);

    const data = await giftCardModel
      .find(query)
      .sort({ claimedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const codes = data.map((item) => item.code);

    res.status(200).json({
      total,
      codes,
    });
  } catch (err) {
    console.error("Claimed History Error:", err);
    res.status(500).json({ message: "Failed to fetch claimed history" });
  }
};


//giftcardhistry -----

// redeemedSummary +++++
export const getRedeemedSummary = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await userModel.findOne({ email: userEmail });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const redeemedCards = await giftCardModel.find({
      claimedBy: user._id,
      isClaimed: true,
    });

    const twoDollarCount = redeemedCards.filter((c) => c.amount === 2).length;
    const fiveDollarCount = redeemedCards.filter((c) => c.amount === 5).length;

    const totalAmount =
      twoDollarCount * 200 + fiveDollarCount * 515;

    res.status(200).json({
      twoDollar: {
        count: twoDollarCount,
        amount: twoDollarCount * 200,
      },
      fiveDollar: {
        count: fiveDollarCount,
        amount: fiveDollarCount * 515,
      },
      totalAmount,
    });
  } catch (err) {
    console.error("Summary Error:", err);
    res.status(500).json({ message: "Failed to load redeemed summary" });
  }
};

//redeemedSummary -----


export const giftCardController = {
  uploadCodes,
  getGiftCardStats,
  claimGiftCards,
  getDuesForBuyer,
  getAvailableGiftCards,
  getFullDues,
  reduceDues,
  getAllBuyerEmails,
  getClaimedHistory,
  getRedeemedSummary
};
