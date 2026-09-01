const Store = require('../utils/dataStore');

// Calculate Tier Preview
exports.calculatePreview = (req, res) => {
  try {
    const { loanAmount } = req.query;
    const slab = Store.calculateIncentiveSlab(loanAmount);
    res.json({
      success: true,
      ...slab
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Submit / Log a Loan Disbursement (Employee self-service or Admin)
exports.submitIncentive = async (req, res) => {
  try {
    const {
      userId: targetUserId,
      loanAmount,
      customerName,
      loanAccountNo,
      loanType,
      dateStr,
      remarks
    } = req.body;

    if (!loanAmount || Number(loanAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid positive loan amount.' });
    }

    // Determine target employee
    let finalUserId = req.user._id;
    if (req.user.role === 'admin' && targetUserId) {
      finalUserId = targetUserId;
    }

    // Determine month and year from dateStr or current date
    const dStr = dateStr || new Date().toISOString().split('T')[0];
    const dateObj = new Date(dStr);
    const month = dateObj.getMonth() + 1;
    const year = dateObj.getFullYear();

    const record = await Store.saveIncentive({
      userId: finalUserId,
      month,
      year,
      loanAmount: Number(loanAmount),
      customerName: customerName || '',
      loanAccountNo: loanAccountNo || '',
      loanType: loanType || 'Personal Loan',
      disbursedDate: dateObj,
      dateStr: dStr,
      remarks: remarks || '',
      status: 'Approved',
      loggedBy: req.user.role === 'admin' ? 'Admin' : 'Self'
    });

    res.status(201).json({
      success: true,
      message: `Loan disbursement of ₹${Number(loanAmount).toLocaleString()} logged successfully. Incentive earned: ₹${record.incentiveAmount.toLocaleString()} (${record.slabPercentage}% slab).`,
      record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get My Incentives (for Logged-in Employee)
exports.getMyIncentives = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    const filter = { userId };
    if (month && month !== 'All') filter.month = Number(month);
    if (year && year !== 'All') filter.year = Number(year);

    const rawRecords = await Store.findIncentives(filter);
    const totalLoanAmount = rawRecords.reduce((sum, r) => sum + (Number(r.loanAmount) || 0), 0);

    // Compute active tier based on total monthly loan volume
    const monthlySlab = Store.calculateIncentiveSlab(totalLoanAmount);
    const totalIncentive = monthlySlab.incentiveAmount;

    // Dynamically apply monthly tier rate to each individual loan record for display
    const records = rawRecords.map(r => {
      const loanAmt = Number(r.loanAmount) || 0;
      const loanIncentive = Math.round((loanAmt * monthlySlab.slabPercentage) / 100);
      const rObj = typeof r.toObject === 'function' ? r.toObject() : { ...r };
      return {
        ...rObj,
        slabPercentage: monthlySlab.slabPercentage,
        incentiveAmount: loanIncentive
      };
    });

    res.json({
      success: true,
      month,
      year,
      totalLoanAmount,
      totalIncentive,
      count: records.length,
      monthlySlab,
      records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Incentives (Admin Audit)
exports.getAllIncentives = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const filter = {};

    if (employeeId && employeeId !== 'All') {
      filter.userId = employeeId;
    }
    if (month && month !== 'All') {
      filter.month = Number(month);
    }
    if (year && year !== 'All') {
      filter.year = Number(year);
    }

    const rawRecords = await Store.findIncentives(filter);
    
    // Group by employee and month/year to compute monthly total loan volume and slab
    const userMonthTotals = {};
    rawRecords.forEach(r => {
      const uId = (r.userId?._id || r.userId)?.toString();
      const m = r.month || (r.dateStr ? Number(r.dateStr.split('-')[1]) : 1);
      const y = r.year || (r.dateStr ? Number(r.dateStr.split('-')[0]) : 2026);
      const key = `${uId}_${m}_${y}`;
      userMonthTotals[key] = (userMonthTotals[key] || 0) + (Number(r.loanAmount) || 0);
    });

    let grandTotalLoan = 0;
    let grandTotalIncentive = 0;

    const records = rawRecords.map(r => {
      const uId = (r.userId?._id || r.userId)?.toString();
      const m = r.month || (r.dateStr ? Number(r.dateStr.split('-')[1]) : 1);
      const y = r.year || (r.dateStr ? Number(r.dateStr.split('-')[0]) : 2026);
      const key = `${uId}_${m}_${y}`;
      const monthlyTotal = userMonthTotals[key] || 0;
      const slab = Store.calculateIncentiveSlab(monthlyTotal);
      
      const loanAmt = Number(r.loanAmount) || 0;
      const loanIncentive = Math.round((loanAmt * slab.slabPercentage) / 100);
      
      grandTotalLoan += loanAmt;
      grandTotalIncentive += loanIncentive;

      const rObj = typeof r.toObject === 'function' ? r.toObject() : { ...r };
      return {
        ...rObj,
        slabPercentage: slab.slabPercentage,
        incentiveAmount: loanIncentive
      };
    });

    res.json({
      success: true,
      totalLoanAmount: grandTotalLoan,
      totalIncentive: grandTotalIncentive,
      count: records.length,
      records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Incentive Record (Admin)
exports.updateIncentive = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      userId,
      loanAmount,
      customerName,
      loanType,
      dateStr,
      remarks
    } = req.body;

    if (!loanAmount || Number(loanAmount) <= 0) {
      return res.status(400).json({ success: false, message: 'Please enter a valid positive loan amount.' });
    }

    const updated = await Store.updateIncentiveById(id, {
      userId,
      loanAmount: Number(loanAmount),
      customerName: customerName || '',
      loanType: loanType || 'Auto Loan',
      dateStr,
      remarks: remarks || ''
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Incentive record not found.' });
    }

    res.json({
      success: true,
      message: 'Loan disbursement record updated successfully!',
      record: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Incentive Record
exports.deleteIncentive = async (req, res) => {
  try {
    const { id } = req.params;
    const records = await Store.findIncentives();
    const rec = records.find(r => r._id.toString() === id.toString());

    if (!rec) {
      return res.status(404).json({ success: false, message: 'Incentive record not found.' });
    }

    const recUserId = (rec.userId?._id || rec.userId)?.toString();
    const isOwner = req.user && req.user._id && req.user._id.toString() === recUserId;
    const isAdmin = req.user && req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this record.' });
    }

    await Store.deleteIncentiveById(id);

    res.json({
      success: true,
      message: 'Incentive record deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
