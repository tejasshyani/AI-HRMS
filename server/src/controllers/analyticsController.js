const Store = require('../utils/dataStore');

exports.getOperationsDashboard = async (req, res) => {
  try {
    const users = await Store.findUsers({ isActive: true });
    const holidays = await Store.findHolidays();
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = await Store.findAttendance({ dateStr: todayStr });

    const presentCount = todayRecords.filter(r => r.status === 'Present').length;
    const onLeaveCount = todayRecords.filter(r => r.status === 'Leave' || r.status === 'Absent').length;

    // Distinct departments
    const departments = [...new Set(users.map(u => u.department || 'General'))];

    // Build punctuality list from real users
    const punctualityList = users.map(u => ({
      name: u.fullName,
      role: u.designation || u.department,
      avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.fullName)}`,
      score: u.punctualityScore || 90,
      risk: (u.punctualityScore || 90) >= 80 ? 'Low Risk' : ((u.punctualityScore || 90) >= 60 ? 'Medium Risk' : 'High Risk'),
      riskColor: (u.punctualityScore || 90) >= 80 ? '#10b981' : ((u.punctualityScore || 90) >= 60 ? '#f59e0b' : '#ef4444'),
      leaves: u.leaveBalances?.casualLeaveUsed || 0
    }));

    // Absent today from real records
    const absentToday = todayRecords
      .filter(r => r.status === 'Absent' || r.status === 'Leave')
      .map(r => {
        const emp = r.userId || {};
        return {
          name: emp.fullName || 'Staff Member',
          role: emp.designation || 'Staff',
          avatar: emp.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(emp.fullName || 'User')}`
        };
      });

    // Upcoming Holidays
    const upcomingHolidays = holidays.slice(0, 4);

    const highRisk = punctualityList.filter(p => p.risk === 'High Risk').length;
    const mediumRisk = punctualityList.filter(p => p.risk === 'Medium Risk').length;
    const lowRisk = punctualityList.filter(p => p.risk === 'Low Risk').length;

    res.json({
      success: true,
      hrmsSummary: {
        totalEmployees: users.length,
        departments: departments.length || 1,
        presentToday: presentCount,
        onLeaveToday: onLeaveCount
      },
      overtime: {
        totalMonth: '00H : 00M',
        topEmployee: users.length > 0 ? {
          name: users[0].fullName,
          designation: users[0].designation,
          hours: '00H'
        } : null
      },
      leaveBalances: {
        casualLeave: { used: 0, total: 12, display: '00/12' },
        sickLeave: { used: 0, total: 6, display: '00/06' },
        earnedLeave: { used: 0, total: 15, display: '00/15' },
        compOff: { used: 0, total: 3, display: '00/03' }
      },
      punctualitySummary: {
        highRiskCount: highRisk,
        mediumRiskCount: mediumRisk,
        lowRiskCount: lowRisk,
        employees: punctualityList
      },
      absentToday,
      upcomingHolidays
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
