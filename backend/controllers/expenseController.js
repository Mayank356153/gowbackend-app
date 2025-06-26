const Expense = require("../models/expenseModel");
const PaymentType = require("../models/paymentTypeModel");
// CREATE Expense
exports.createExpense = async (req, res) => {
  try {
    const {
      date,
      referenceNo,
      category,
      expenseFor,
      paymentType,
      account,
      amount,
      note,
      status,
    } = req.body;

    if (!date || !paymentType || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const validPaymentType = await PaymentType.findById(paymentType);
    if (!validPaymentType) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Payment Type ID" });
    }

    if (req.user && req.user.id) {
      req.body.createdBy = req.user.id;
      req.body.createdByModel =
        req.user.role.toLowerCase() === "admin" ? "Admin" : "User";
    }

    const newExpense = new Expense({
      date,
      referenceNo,
      category,
      expenseFor,
      paymentType,
      account,
      amount,
      note,
      status: status || "Active",
      createdBy: req.body.createdBy,
      createdByModel: req.body.createdByModel,
    });

    await newExpense.save();
    return res.status(201).json({
      success: true,
      message: "Expense created successfully",
      data: newExpense,
    });
  } catch (error) {
    console.error("Error creating expense:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET All Expenses
exports.getAllExpenses = async (req, res) => {
  try {
    const expenses = await Expense.find()
      .populate("category", "categoryName") // Use categoryName from ExpenseCategory
      .populate("paymentType", "paymentTypeName status")
      .populate("account", "accountName")
      .populate("createdBy", "name FirstName LastName email");

    const processedExpenses = expenses.map((expense) => {
      let creatorName = "";
      if (expense.createdBy) {
        if (expense.createdBy.name) {
          creatorName = expense.createdBy.name;
        } else if (expense.createdBy.FirstName && expense.createdBy.LastName) {
          creatorName = `${expense.createdBy.FirstName} ${expense.createdBy.LastName}`;
        }
      }
      return {
        ...expense.toObject(),
        creatorName,
      };
    });

    return res.status(200).json({
      success: true,
      data: processedExpenses,
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET Single Expense
exports.getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("category", "categoryName")
      .populate("paymentType", "paymentTypeName status")
      .populate("account", "accountName")
      .populate("createdBy", "name FirstName LastName email");

    if (!expense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }

    let creatorName = "";
    if (expense.createdBy) {
      if (expense.createdBy.name) {
        creatorName = expense.createdBy.name;
      } else if (expense.createdBy.FirstName && expense.createdBy.LastName) {
        creatorName = `${expense.createdBy.FirstName} ${expense.createdBy.LastName}`;
      }
    }
    const processedExpense = { ...expense.toObject(), creatorName };

    return res.status(200).json({ success: true, data: processedExpense });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// UPDATE Expense
exports.updateExpense = async (req, res) => {
  try {
    if (req.body.paymentType) {
      const validPaymentType = await PaymentType.findById(req.body.paymentType);
      if (!validPaymentType) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid Payment Type ID" });
      }
    }

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
      .populate("category", "categoryName")
      .populate("paymentType", "paymentTypeName status")
      .populate("account", "accountName");

    if (!updatedExpense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Expense updated successfully",
      data: updatedExpense,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE Expense
exports.deleteExpense = async (req, res) => {
  try {
    const deletedExpense = await Expense.findByIdAndDelete(req.params.id);
    if (!deletedExpense) {
      return res
        .status(404)
        .json({ success: false, message: "Expense not found" });
    }
    return res
      .status(200)
      .json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
