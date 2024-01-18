const db = require('../database/db');

const getUserReports = async (req, res) => {
  const status = req.query.status;
  const user_id = req.query.user_id;
  const report_id = req.query.report_id;

  try {
    let getUserReports = db('user_reports').select('*');
    //   .where('status_id', status);

    if (status) {
      getUserReports = getUserReports.where('report_status', status);
    }

    if (user_id) {
      getUserReports = getUserReports.where('user_id', user_id);
    }

    if (report_id) {
      getUserReports = getUserReports.where('report_id', report_id);
    }

    const result = await getUserReports;

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
};

module.exports = {
  getUserReports,
};
