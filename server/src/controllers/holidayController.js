const Store = require('../utils/dataStore');

// Get all holidays
exports.getAllHolidays = async (req, res) => {
  try {
    const { year } = req.query;
    let holidays = await Store.findHolidays();

    if (year) {
      holidays = holidays.filter(h => {
        const dStr = h.dateStr || (h.date ? new Date(h.date).toISOString().split('T')[0] : '');
        return dStr.startsWith(`${year}-`);
      });
    }

    res.json({
      success: true,
      count: holidays.length,
      holidays
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get upcoming holidays for widgets & cards
exports.getUpcomingHolidays = async (req, res) => {
  try {
    const holidays = await Store.findHolidays();
    const todayStr = new Date().toISOString().split('T')[0];

    // Get upcoming or all 2026 holidays
    const upcoming = holidays
      .filter(h => {
        const dStr = h.dateStr || (h.date ? new Date(h.date).toISOString().split('T')[0] : '');
        return dStr >= todayStr || dStr.startsWith('2026-');
      })
      .slice(0, 6);

    res.json({
      success: true,
      holidays: upcoming
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create new holiday (Admin)
exports.createHoliday = async (req, res) => {
  try {
    const { title, date, dateStr, isRecurring = true, category = 'National Holiday', description = '' } = req.body;

    if (!title || (!date && !dateStr)) {
      return res.status(400).json({
        success: false,
        message: 'Holiday title and date are required.'
      });
    }

    const finalDateStr = dateStr || (date ? new Date(date).toISOString().split('T')[0] : '');
    const finalDate = date ? new Date(date) : new Date(finalDateStr);

    const newHoliday = await Store.createHoliday({
      title: title.trim(),
      date: finalDate,
      dateStr: finalDateStr,
      isRecurring: isRecurring !== false,
      category,
      description,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Holiday created successfully.',
      holiday: newHoliday
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update holiday (Admin)
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, dateStr, isRecurring, category, description } = req.body;

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (dateStr || date) {
      updateData.dateStr = dateStr || new Date(date).toISOString().split('T')[0];
      updateData.date = date ? new Date(date) : new Date(updateData.dateStr);
    }
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring;
    if (category) updateData.category = category;
    if (description !== undefined) updateData.description = description;

    const updated = await Store.updateHolidayById(id, updateData);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Holiday not found.' });
    }

    res.json({
      success: true,
      message: 'Holiday updated successfully.',
      holiday: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete holiday (Admin)
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Store.deleteHolidayById(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Holiday not found.' });
    }

    res.json({
      success: true,
      message: 'Holiday deleted successfully.'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
