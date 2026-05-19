import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";

export async function deleteAccount(req, res) {
    try {
        const userId = req.user.id;

        // Delete related transactions
        await Transaction.deleteMany({ userId });

        // Delete related budgets
        await Budget.deleteMany({ userId });

        // Delete user account
        await User.findByIdAndDelete(userId);

        return res.status(200).json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error) {
        console.error("Delete account error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete account",
        });
    }
}