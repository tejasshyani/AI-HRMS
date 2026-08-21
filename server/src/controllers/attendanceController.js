const Store = require('../utils/dataStore');

// Format current time "HH:MM AM/PM"
const formatTimeNow = () => {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Format date "YYYY-MM-DD"
const formatDateStr = (date = new Date()) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Employee Clock-In
exports.clockIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const dateStr = formatDateStr();
    const currentTime = req.body.checkInTime || '10:00 AM';

    let record = await Store.findAttendanceRecord(userId, dateStr);

    if (record && record.checkInTime) {
      return res.status(400).json({
        success: false,
        message: `Already checked in at ${record.checkInTime} today.`,
        record
      });
    }

    record = await Store.upsertAttendance({
      userId,
      date: new Date(),
      dateStr,
      checkInTime: currentTime,
      status: 'Present',
      remarks: 'Self Clock-in',
      loggedBy: 'Self'
    });

    res.json({
      success: true,
      message: `Clocked in successfully at ${currentTime}`,
      record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Employee Clock-Out
exports.clockOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const dateStr = formatDateStr();
    const currentTime = req.body.checkOutTime || '06:00 PM';

    let record = await Store.findAttendanceRecord(userId, dateStr);

    if (!record) {
      record = await Store.upsertAttendance({
        userId,
        date: new Date(),
        dateStr,
        checkInTime: '10:00 AM',
        checkOutTime: currentTime,
        status: 'Present',
        remarks: 'Self Clock-out',
        loggedBy: 'Self'
      });
    } else {
      record = await Store.upsertAttendance({
        _id: record._id,
        userId,
        dateStr,
        checkInTime: record.checkInTime || '10:00 AM',
        checkOutTime: currentTime,
        status: record.status || 'Present',
        remarks: record.remarks || 'Self Clock-out',
        loggedBy: record.loggedBy || 'Self'
      });
    }

    res.json({
      success: true,
      message: `Clocked out successfully at ${currentTime}`,
      record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Log or Edit Daily Attendance (Employee self-service or Admin)
exports.logAttendance = async (req, res) => {
  try {
    const { userId: targetUserId, date, dateStr: inputDateStr, checkInTime, checkOutTime, status, remarks } = req.body;

    // If non-admin, targetUserId must be own ID
    let finalUserId = req.user._id;
    if (req.user.role === 'admin' && targetUserId) {
      finalUserId = targetUserId;
    }

    const finalDateStr = inputDateStr || (date ? formatDateStr(date) : formatDateStr());
    const finalDate = date ? new Date(date) : new Date(finalDateStr);

    const record = await Store.upsertAttendance({
      userId: finalUserId,
      date: finalDate,
      dateStr: finalDateStr,
      checkInTime: checkInTime || '09:15 AM',
      checkOutTime: checkOutTime || '06:30 PM',
      status: status || 'Present',
      remarks: remarks || '',
      loggedBy: req.user.role === 'admin' ? 'Admin' : 'Self'
    });

    res.json({
      success: true,
      message: 'Attendance record saved successfully.',
      record
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get My Attendance (for Employee portal calendar, history table & stats)
exports.getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year, startDate, endDate } = req.query;

    let records = await Store.findAttendance({ userId });

    if (month && year && month !== 'All' && year !== 'All') {
      const monthStr = String(month).padStart(2, '0');
      const prefix = `${year}-${monthStr}`;
      records = records.filter(r => r.dateStr && r.dateStr.startsWith(prefix));
    } else if (startDate && endDate) {
      records = records.filter(r => r.dateStr >= startDate && r.dateStr <= endDate);
    }

    // Sort newest date first
    records.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));

    res.json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Master Attendance (Admin overview and matrix)
exports.getMasterAttendance = async (req, res) => {
  try {
    const { employeeId, month, year, status, dateStr } = req.query;
    let records = await Store.findAttendance();

    if (employeeId && employeeId !== 'All') {
      records = records.filter(r => {
        const uId = r.userId?._id ? r.userId._id.toString() : r.userId?.toString();
        return uId === employeeId;
      });
    }

    if (month && year && month !== 'All' && year !== 'All') {
      const monthStr = String(month).padStart(2, '0');
      const prefix = `${year}-${monthStr}`;
      records = records.filter(r => r.dateStr && r.dateStr.startsWith(prefix));
    }

    if (status && status !== 'All') {
      records = records.filter(r => r.status === status);
    }

    if (dateStr) {
      records = records.filter(r => r.dateStr === dateStr);
    }

    records.sort((a, b) => (b.dateStr || '').localeCompare(a.dateStr || ''));

    res.json({
      success: true,
      count: records.length,
      records
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin Override / Edit Attendance
exports.adminOverride = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, checkInTime, checkOutTime, remarks } = req.body;

    const existingRecords = await Store.findAttendance();
    const rec = existingRecords.find(r => r._id.toString() === id.toString());

    if (!rec) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    const rawUserId = (rec.userId?._id || rec.userId)?.toString();

    const updated = await Store.upsertAttendance({
      _id: rec._id,
      userId: rawUserId,
      date: rec.date || new Date(rec.dateStr),
      dateStr: rec.dateStr,
      status: status || rec.status,
      checkInTime: checkInTime !== undefined ? checkInTime : rec.checkInTime,
      checkOutTime: checkOutTime !== undefined ? checkOutTime : rec.checkOutTime,
      remarks: remarks !== undefined ? remarks : rec.remarks,
      loggedBy: 'Admin (Override)'
    });

    res.json({
      success: true,
      message: 'Attendance record overridden by Admin.',
      record: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Today's Check-in Summary for user
exports.getTodaySummary = async (req, res) => {
  try {
    const userId = req.user._id;
    const dateStr = formatDateStr();

    const record = await Store.findAttendanceRecord(userId, dateStr);

    res.json({
      success: true,
      dateStr,
      checkedIn: !!(record && record.checkInTime),
      record: record || null
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Attendance Record (Employee for own record, or Admin)
exports.deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const existingRecords = await Store.findAttendance();
    const rec = existingRecords.find(r => r._id.toString() === id.toString());

    if (!rec) {
      return res.status(404).json({ success: false, message: 'Attendance record not found.' });
    }

    const recordUserId = (rec.userId?._id || rec.userId)?.toString();
    const reqUserId = req.user._id.toString();

    if (req.user.role !== 'admin' && recordUserId !== reqUserId) {
      return res.status(403).json({ success: false, message: 'You are not authorized to delete this attendance record.' });
    }

    const deleted = await Store.deleteAttendanceById(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Record not found.' });
    }

    res.json({
      success: true,
      message: `Attendance record for ${deleted.dateStr} deleted successfully.`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
