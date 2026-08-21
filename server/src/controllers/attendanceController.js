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
      checkInTime: checkInTime || '10:00 AM',
      checkOutTime: checkOutTime || '06:00 PM',
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

// Bulk / Date Range Attendance Logging (Admin & Employee self-service)
exports.bulkLogAttendance = async (req, res) => {
  try {
    const {
      userId: targetUserId,
      startDate,
      endDate,
      status = 'Present',
      checkInTime = '10:00 AM',
      checkOutTime = '06:00 PM',
      remarks = '',
      excludeSundays = true
    } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Start date and End date are required.' });
    }

    let finalUserId = req.user._id;
    if (req.user.role === 'admin' && targetUserId) {
      finalUserId = targetUserId;
    }

    const startParts = startDate.split('-').map(Number);
    const endParts = endDate.split('-').map(Number);

    const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
    const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

    if (start > end) {
      return res.status(400).json({ success: false, message: 'Start date must be before or equal to End date.' });
    }

    const createdRecords = [];
    let cur = new Date(start);

    while (cur <= end) {
      const dayOfWeek = cur.getDay(); // 0 is Sunday
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      // If excludeSundays is true and it's Sunday, skip
      if (excludeSundays && dayOfWeek === 0) {
        cur.setDate(cur.getDate() + 1);
        continue;
      }

      let cIn = checkInTime;
      let cOut = checkOutTime;
      if (status === 'Absent' || status === 'Leave') {
        cIn = '—';
        cOut = '—';
      } else if (status === 'Half-Day') {
        cIn = '02:00 PM';
        cOut = '06:00 PM';
      }

      const rec = await Store.upsertAttendance({
        userId: finalUserId,
        date: new Date(cur),
        dateStr,
        checkInTime: cIn,
        checkOutTime: cOut,
        status,
        remarks: remarks || (req.user.role === 'admin' ? 'Batch Attendance' : 'Self Date Range Log'),
        loggedBy: req.user.role === 'admin' ? 'Admin' : 'Self'
      });

      createdRecords.push(rec);
      cur.setDate(cur.getDate() + 1);
    }

    res.json({
      success: true,
      message: `Successfully logged attendance for ${createdRecords.length} day(s) (${startDate} to ${endDate}).`,
      count: createdRecords.length,
      records: createdRecords
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

// Bulk Delete Attendance Records (Admin or Employee for own records)
exports.bulkDeleteAttendance = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'No attendance record IDs provided.' });
    }

    const existingRecords = await Store.findAttendance();
    let deletedCount = 0;

    for (const id of ids) {
      const rec = existingRecords.find(r => r._id.toString() === id.toString());
      if (rec) {
        const recordUserId = (rec.userId?._id || rec.userId)?.toString();
        const reqUserId = req.user._id.toString();
        if (req.user.role === 'admin' || recordUserId === reqUserId) {
          await Store.deleteAttendanceById(id);
          deletedCount++;
        }
      }
    }

    res.json({
      success: true,
      message: `Successfully deleted ${deletedCount} attendance record(s).`,
      count: deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
